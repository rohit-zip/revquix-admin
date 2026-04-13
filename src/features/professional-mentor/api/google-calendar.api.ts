/**
 * ─── GOOGLE CALENDAR API ──────────────────────────────────────────────────────
 * Frontend API for mentor Google Calendar OAuth connection.
 */

import { apiClient } from "@/lib/axios"

export interface GoogleCalendarStatus {
  connected: boolean
  googleEmail?: string
  connectedAt?: string
  requiresReauth?: boolean
  lastUsedAt?: string
}

/**
 * Initiates the Google Calendar OAuth flow.
 * Returns the authorization URL to redirect the user to.
 */
export async function getAuthorizationUrl(): Promise<string> {
  const response = await apiClient.post<{ authorizationUrl: string }>(
    "/mentor/google-calendar/authorize"
  )
  return response.data.authorizationUrl
}

/**
 * Gets the current Google Calendar connection status.
 */
export async function getCalendarStatus(): Promise<GoogleCalendarStatus> {
  const response = await apiClient.get<GoogleCalendarStatus>(
    "/mentor/google-calendar/status"
  )
  return response.data
}

/**
 * Disconnects Google Calendar (revokes token at Google and deletes from DB).
 */
export async function disconnectCalendar(): Promise<void> {
  await apiClient.delete("/mentor/google-calendar/disconnect")
}

