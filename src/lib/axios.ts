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

// ─── Queue Pattern State (Prevent multiple simultaneous refreshes) ──────────────
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

/**
 * Notify all waiting requests when token refresh completes
 */
function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => {
    try {
      callback(newToken)
    } catch (error) {
      console.error("Error in refresh subscriber:", error)
    }
  })
  refreshSubscribers = []
}

/**
 * Subscribe to token refresh completion
 * Returns function to execute when refresh completes
 */
function subscribeToTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

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

// ─── Helper: Refresh access token ──────────────────────────────────────────────
async function refreshAccessToken(): Promise<string> {
  try {
    const { refreshToken } = await import("@/features/auth/api/auth.api")
    const response = await refreshToken()
    return response.accessToken
  } catch (error) {
    throw error
  }
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
// 2. Refreshing token via queue pattern (single refresh for multiple requests)
// 3. Retrying failed request with new token
// 4. Redirecting to login on refresh failure
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      retried?: boolean
    }

    // ─── Parse error to get code and status ────────────────────────────────
    const parsedError = parseAxiosError(error)

    // ─── Check if error is token expired ───────────────────────────────────
    if (!isTokenExpiredError(parsedError)) {
      // Not a token expired error, return as-is
      return Promise.reject(parsedError)
    }

    // ─── Check if already retried (prevent infinite loops) ────────────────
    if (originalRequest?.retried) {
      // Already retried once, don't retry again
      await redirectToLogin()
      return Promise.reject(parsedError)
    }

    // ─── Mark as retried ──────────────────────────────────────────────────
    originalRequest!.retried = true

    // ─── Handle token refresh with queue pattern ──────────────────────────
    if (isRefreshing) {
      // Refresh already in progress, queue this request
      return new Promise((resolve) => {
        subscribeToTokenRefresh((newToken: string) => {
          // Retry request with new token
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          resolve(apiClient(originalRequest))
        })
      })
    }

    // ─── Start refresh ─────────────────────────────────────────────────────
    isRefreshing = true

    try {
      // Call refresh endpoint
      const newToken = await refreshAccessToken()

      // Update Redux with new token
      const { store } = await import("@/core/store")
      const { setCredentials } = await import("@/core/slices/auth.slice")
      const response = await refreshToken()
      store.dispatch(setCredentials(response))

      // Notify all subscribers
      onRefreshed(newToken)

      // Retry original request with new token
      if (originalRequest?.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }
      return apiClient(originalRequest)
    } catch (_refreshError) {
      // Refresh failed, clear auth and redirect
      isRefreshing = false
      refreshSubscribers = []

      await redirectToLogin()

      // Return the original error
      return Promise.reject(parsedError)
    } finally {
      // Always clear flag
      isRefreshing = false
    }
  },
)

// ─── Import refreshToken for use in interceptor ────────────────────────────────
async function refreshToken() {
  const { refreshToken: refreshTokenFn } = await import(
    "@/features/auth/api/auth.api"
  )
  return refreshTokenFn()
}

