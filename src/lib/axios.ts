import axios, { type AxiosError, type AxiosRequestConfig } from "axios"
import { type ApiError, type NetworkError, parseAxiosError } from "./api-error"

// ─── Axios instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001/api/v1",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  },
  withCredentials: true,
})

// ─── Constants ─────────────────────────────────────────────────────────────────
const TOKEN_EXPIRED_CODE = "RQ-AE-11"
const UNAUTHORIZED_STATUS = 401

// ─── Promise Singleton Lock (prevents multiple simultaneous refresh calls) ─────
//
// Instead of a boolean flag + subscriber array, we store the in-flight refresh
// Promise itself.  Any number of concurrent 401 responses all attach a .then()
// to this same Promise — so exactly ONE POST /auth/refresh is ever issued per
// expiry cycle.  The Promise is nulled out in its own .finally(), which is
// atomic: no new caller can "see" the old promise and still issue a second call.
//
let refreshPromise: Promise<string> | null = null

// ─── Helper: Check if error is token expired ──────────────────────────────────
function isTokenExpiredError(error: ApiError | NetworkError | null): boolean {
  if (!error) return false
  return (
    "code" in error &&
    error.code === TOKEN_EXPIRED_CODE &&
    "httpStatus" in error &&
    (error as ApiError).httpStatus === UNAUTHORIZED_STATUS
  )
}

// ─── Helper: Execute one refresh cycle ────────────────────────────────────────
// Makes a SINGLE call to POST /auth/refresh, updates Redux with the full
// response, and returns the new access token string.
// This function is intentionally *not* exported — it is only ever called through
// the refreshPromise singleton below.
async function executeTokenRefresh(): Promise<string> {
  const { refreshToken } = await import("@/features/auth/api/auth.api")
  const response = await refreshToken()

  // Update Redux with the full refresh response (access token + user info)
  const { store } = await import("@/core/store")
  const { setCredentials } = await import("@/core/slices/auth.slice")
  store.dispatch(setCredentials(response))

  return response.accessToken
}

// ─── Helper: Redirect to login ─────────────────────────────────────────────────
async function redirectToLogin() {
  try {
    const { store } = await import("@/core/store")
    const { clearCredentials } = await import("@/core/slices/auth.slice")
    const { clearSessionCookie } = await import("@/lib/session-cookie")

    // Clear Redux auth state
    store.dispatch(clearCredentials())

    // Clear the session marker so middleware no longer treats the user as logged in
    clearSessionCookie()

    // Hard navigation resets all in-memory React state cleanly
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login"
    }
  } catch (error) {
    console.error("Error during redirect to login:", error)
  }
}

// ─── Request interceptor ──────────────────────────────────────────────────────
// Lazily imports the store to avoid a circular-dependency at module load time.
// The store is only accessed at request-time (inside the function), which is
// always after the module graph has fully resolved.
// Paths that must never carry an Authorization header.
// NOTE: config.url is relative to baseURL (e.g. /api/v1), so the prefix to
// match is /auth/ — NOT /api/v1/auth/.  All endpoints in auth.api.ts
// (/auth/login, /auth/register, /auth/refresh, /auth/logout, …) start with /auth/.
const PUBLIC_PATH_PREFIX = "/auth/"

apiClient.interceptors.request.use(
  async (config) => {
    // Skip auth header for public auth endpoints
    const url = config.url ?? ""
    if (url.startsWith(PUBLIC_PATH_PREFIX)) {
      return config
    }

    const { store } = await import("@/core/store")
    const token = store.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor with token refresh ───────────────────────────────────
// Handles token expiry (RQ-AE-11 + 401) by:
// 1. Detecting token expired error
// 2. Refreshing token via Promise singleton (exactly one POST /auth/refresh per cycle)
// 3. Retrying the failed request — and all other queued 401 requests — with the new token
// 4. Redirecting to login on refresh failure
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      retried?: boolean
    }

    // ─── Parse error to get code and status ────────────────────────────────
    const parsedError = parseAxiosError(error)

    // ─── Not a token-expired error — pass through immediately ──────────────
    if (!isTokenExpiredError(parsedError)) {
      return Promise.reject(parsedError)
    }

    // ─── Already retried once — refresh itself failed, force logout ────────
    // This guard prevents infinite retry loops: if the retried request also
    // returns RQ-AE-11, the refresh token is gone and we must sign out.
    if (originalRequest?.retried) {
      await redirectToLogin()
      return Promise.reject(parsedError)
    }

    // ─── Mark this request so it is never retried a second time ───────────
    originalRequest!.retried = true

    // ─── Ensure exactly one refresh call is in-flight at a time ───────────
    // If refreshPromise is already set, a refresh is in progress — attach to
    // it instead of issuing a second POST /auth/refresh.
    // If not set, create it now and clear it (atomically) when it settles.
    if (!refreshPromise) {
      refreshPromise = executeTokenRefresh().finally(() => {
        refreshPromise = null
      })
    }

    try {
      // Wait for the (possibly shared) refresh to complete
      const newToken = await refreshPromise

      // Retry the original request with the new token
      if (originalRequest?.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }
      return apiClient(originalRequest)
    } catch {
      // Refresh failed — sign the user out
      await redirectToLogin()
      return Promise.reject(parsedError)
    }
  },
)

