/**
 * ─── SESSION API ──────────────────────────────────────────────────────────────
 *
 * API functions for user session management and login history.
 * Mirrors the backend UserSessionController endpoints.
 */

import { apiClient } from "@/lib/axios"
import type {
  CurrentSessionIdResponse,
  RevokeAllResult,
  SessionHistoryPage,
  UserSessionResponse,
} from "./session.types"

// ─── Current session identification ──────────────────────────────────────────

/**
 * GET /auth/current-session-id
 * Reads the HttpOnly RT cookie (sent automatically by the browser since this
 * endpoint is under /api/v1/auth/) and returns the current session's jti.
 */
export const getCurrentSessionId = (): Promise<CurrentSessionIdResponse> =>
  apiClient.get<CurrentSessionIdResponse>("/auth/current-session-id").then((r) => r.data)

// ─── User-scoped session endpoints ────────────────────────────────────────────

/**
 * GET /user/sessions?currentSessionId={id}
 * Returns all active sessions for the authenticated user.
 */
export const getMyActiveSessions = (
  currentSessionId?: string,
): Promise<UserSessionResponse[]> =>
  apiClient
    .get<UserSessionResponse[]>("/user/sessions", {
      params: currentSessionId ? { currentSessionId } : undefined,
    })
    .then((r) => r.data)

/**
 * GET /user/sessions/history?currentSessionId={id}&page={n}&size={n}
 * Returns paginated full session history (login history) for the authenticated user.
 */
export const getMySessionHistory = (
  page = 0,
  size = 20,
  currentSessionId?: string,
): Promise<SessionHistoryPage> =>
  apiClient
    .get<SessionHistoryPage>("/user/sessions/history", {
      params: { page, size, ...(currentSessionId ? { currentSessionId } : {}) },
    })
    .then((r) => r.data)

/**
 * DELETE /user/sessions/{sessionId}
 * Revokes a specific session belonging to the authenticated user.
 */
export const revokeMySession = (sessionId: string, currentSessionId?: string): Promise<void> =>
  apiClient
    .delete(`/user/sessions/${sessionId}`, {
      params: currentSessionId ? { currentSessionId } : undefined,
    })
    .then(() => undefined)

/**
 * DELETE /user/sessions?currentSessionId={id}
 * Revokes all sessions except the current one (sign out all other devices).
 * If currentSessionId is not provided, revokes all sessions.
 */
export const revokeAllOtherSessions = (
  currentSessionId?: string,
): Promise<RevokeAllResult> =>
  apiClient
    .delete<RevokeAllResult>("/user/sessions", {
      params: currentSessionId ? { currentSessionId } : undefined,
    })
    .then((r) => r.data)

