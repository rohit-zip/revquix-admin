/**
 * ─── SESSION HOOKS ────────────────────────────────────────────────────────────
 *
 * React Query hooks for session management and login history.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getCurrentSessionId,
  getMyActiveSessions,
  getMySessionHistory,
  revokeAllOtherSessions,
  revokeMySession,
} from "./session.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const sessionKeys = {
  currentId: () => ["session", "current-id"] as const,
  activeSessions: (currentSessionId?: string) =>
    ["session", "active", currentSessionId] as const,
  history: (page: number, size: number, currentSessionId?: string) =>
    ["session", "history", page, size, currentSessionId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetches the current session ID from the HttpOnly RT cookie. */
export function useCurrentSessionId() {
  return useQuery({
    queryKey: sessionKeys.currentId(),
    queryFn: getCurrentSessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes — session ID doesn't change often
    retry: false,
  })
}

/** Fetches all active sessions, marking the current one with isCurrent. */
export function useMyActiveSessions(currentSessionId?: string) {
  return useQuery({
    queryKey: sessionKeys.activeSessions(currentSessionId),
    queryFn: () => getMyActiveSessions(currentSessionId),
    enabled: true,
  })
}

/** Fetches paginated session history (login history). */
export function useMySessionHistory(
  page: number,
  size: number,
  currentSessionId?: string,
) {
  return useQuery({
    queryKey: sessionKeys.history(page, size, currentSessionId),
    queryFn: () => getMySessionHistory(page, size, currentSessionId),
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Revokes a specific session. */
export function useRevokeSession(currentSessionId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => revokeMySession(sessionId, currentSessionId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Session revoked successfully")
      qc.invalidateQueries({ queryKey: ["session", "active"] })
      qc.invalidateQueries({ queryKey: ["session", "history"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/** Signs out from all other devices. */
export function useRevokeAllOtherSessions(currentSessionId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => revokeAllOtherSessions(currentSessionId),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Signed out from all other devices")
      qc.invalidateQueries({ queryKey: ["session", "active"] })
      qc.invalidateQueries({ queryKey: ["session", "history"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

