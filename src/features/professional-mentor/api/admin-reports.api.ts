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

  // Session type split
  totalSessions: number
  totalMockSessions: number
  totalHourlySessions: number
  completedSessions: number
  cancelledSessions: number
  noShowSessions: number

  // Cancellation breakdown
  totalMentorCancellations: number
  totalUserCancellations: number

  // Disputes
  totalDisputesRaised: number

  // Feedback turnaround
  avgFeedbackTurnaroundHours: number | null

  // Join rate
  sessionsWithMentorJoinEvent: number
  mentorJoinRatePercent: number

  // Combined ratings
  averageRating: number
  totalRatingsReceived: number
  ratingDistribution: Record<number, number>

  // Per-type ratings
  mockAverageRating: number
  mockTotalRatings: number
  mockRatingDistribution: Record<number, number>
  hourlyAverageRating: number
  hourlyTotalRatings: number
  hourlyRatingDistribution: Record<number, number>

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

