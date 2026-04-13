/**
 * ─── MEETING API ──────────────────────────────────────────────────────────────
 * Google Meet integration — direct meeting URLs, no JWT.
 */

import { apiClient } from "@/lib/axios"

export interface MeetingTokenResponse {
  meetingUrl: string | null
  /** How the meeting link was generated: GOOGLE_MEET or MANUAL_GOOGLE_MEET */
  meetingProvider: "GOOGLE_MEET" | "MANUAL_GOOGLE_MEET"
  /** True when the mentor hasn't set the meeting link yet (manual mode). */
  meetingUrlPending: boolean
  scheduledAt: string   // ISO-8601 UTC instant
  isModerator: boolean
  durationMinutes: number
  /** UTC instant when the join window opens for participants (scheduledAt - 30 min) */
  allowedJoinAt: string
}

/**
 * Records a join-event click (for attendance tracking) and returns the meeting URL.
 * This is the primary endpoint for "Join Meeting".
 */
export async function recordJoinAndGetUrl(sessionId: string): Promise<MeetingTokenResponse> {
  const response = await apiClient.post<MeetingTokenResponse>(`/meetings/${sessionId}/join-event`)
  return response.data
}

/**
 * Returns the direct Google Meet URL for joining.
 * Records the join event for attendance tracking.
 */
export async function getMeetingJoinUrl(sessionId: string): Promise<string> {
  const data = await recordJoinAndGetUrl(sessionId)
  if (!data.meetingUrl) {
    throw new Error("Meeting URL is not available yet. Please wait for the mentor to set it.")
  }
  return data.meetingUrl
}

/**
 * Sets the Google Meet URL for a manual-mode session (mentor only).
 */
export async function setMeetingUrl(sessionId: string, meetingUrl: string) {
  const response = await apiClient.put(`/meetings/${sessionId}/meeting-url`, { meetingUrl })
  return response.data
}

/**
 * Completes a meeting session (mentor). Requires a screenshot as proof.
 */
export async function completeMeeting(sessionId: string, screenshot?: File, note?: string) {
  const formData = new FormData()
  if (screenshot) formData.append("screenshot", screenshot)
  if (note) formData.append("note", note)
  const response = await apiClient.put(`/meetings/${sessionId}/complete`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

/**
 * Admin: Force-complete a meeting session.
 */
export async function forceCompleteMeeting(sessionId: string, adminNote?: string) {
  const response = await apiClient.put(`/meetings/${sessionId}/admin/force-complete`, { adminNote })
  return response.data
}

/**
 * Admin: Get meeting completion screenshot URL.
 */
export async function getMeetingScreenshot(sessionId: string): Promise<string> {
  const response = await apiClient.get<{ screenshotUrl: string }>(`/meetings/${sessionId}/screenshot`)
  return response.data.screenshotUrl
}
