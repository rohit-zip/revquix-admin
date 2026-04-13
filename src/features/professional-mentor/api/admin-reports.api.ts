/**
 * ─── ADMIN REPORTS API ────────────────────────────────────────────────────────
 *
 * API calls for AdminReportController.
 */

import { apiClient } from "@/lib/axios"

export interface MentorReportResponse {
  mentorUserId: string
  mentorName: string | null
  mentorEmail: string | null

  // Session stats
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  noShowSessions: number

  // Join rate
  sessionsWithMentorJoinEvent: number
  mentorJoinRatePercent: number

  // Ratings
  averageRating: number
  totalRatingsReceived: number
  ratingDistribution: Record<number, number>

  // Meeting link mode
  googleCalendarConnected: boolean
  oauthMeetingSessions: number
  manualMeetingSessions: number
  oauthAdoptionPercent: number
}

/**
 * Get detailed performance report for a specific mentor (admin only).
 */
export async function getMentorReport(mentorUserId: string): Promise<MentorReportResponse> {
  const response = await apiClient.get<MentorReportResponse>(`/admin/reports/mentors/${mentorUserId}`)
  return response.data
}

