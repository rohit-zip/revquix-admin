/**
 * rv_session — lightweight session marker cookie
 *
 * NOT a security token. Contains no sensitive data.
 * Its only purpose is to let Next.js Edge Middleware make route-guard
 * decisions without needing to read the backend's `refreshToken` cookie,
 * which has `Path=/api/v1/auth` and is therefore invisible to middleware
 * running at `/`, `/settings`, etc.
 *
 * In production, set with Domain=.revquix.com so both www.revquix.com
 * (portfolio) and dashboard.revquix.com can read it.
 *
 * Security model:
 *   Forging this cookie shows only the authenticated page shell.
 *   Every real API call still requires a valid JWT Bearer token —
 *   faking rv_session grants zero data access.
 *
 * Lifecycle:
 *   SET   → after any successful login (password or OAuth2)
 *   SET   → when AuthInitializer restores session via refresh token
 *   CLEAR → on logout
 *   CLEAR → when AuthInitializer's refresh attempt fails
 *   CLEAR → when the Axios interceptor detects an unrecoverable 401
 */

const COOKIE_NAME = "rv_session"
/** 7 days in seconds — mirrors the refresh token TTL on the backend */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function setSessionCookie(): void {
  if (typeof document === "undefined") return
  const isProduction = process.env.NODE_ENV === "production"
  const domain = isProduction ? "; Domain=.revquix.com" : ""
  const secure = isProduction ? "; Secure" : ""
  document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${domain}${secure}`
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return
  const isProduction = process.env.NODE_ENV === "production"
  const domain = isProduction ? "; Domain=.revquix.com" : ""
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${domain}`
}
