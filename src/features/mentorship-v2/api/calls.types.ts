/**
 * ─── MENTORSHIP V2 (PHASE 4) CALL LIFECYCLE TYPES ────────────────────────────
 *
 * Mirrors AdminCallSnapshot, BookingSessionDiagnosticsResponse and friends.
 * `invariantWarnings` is a runtime assertion, not a statistic — same discipline as Phase 2's
 * `unexpectedStatusKeys` and Phase 3's `unresolvedStateMachineIds` — and must always be
 * empty. The view renders it in red.
 */

export interface BookingJoinEventRow {
  joinEventId: string
  bookingId: string
  userId: string
  role: string | null
  joinClickedAt: string
  ipAddress: string | null
  userAgent: string | null
  withinWindow: boolean
}

export interface BookingNotificationLogRow {
  notificationLogId: string
  bookingId: string
  kind: string | null
  recipientUserId: string
  sentAt: string
  failureReason: string | null
}

export interface BookingReviewRow {
  reviewId: string
  bookingId: string
  serviceId: string
  serviceTitle: string | null
  mentorUserId: string
  buyerUserId: string
  buyerName: string | null
  rating: number
  comment: string | null
  isPublic: boolean
  isHidden: boolean
  hiddenReason: string | null
  submittedAt: string
}

/** Mirrors BookingFeedbackResponse (Phase 5). Never public — exists only between the two parties. */
export interface BookingFeedbackRow {
  feedbackId: string
  bookingId: string
  serviceId: string
  serviceTitle: string | null
  mentorUserId: string
  mentorName: string | null
  buyerUserId: string
  buyerName: string | null

  scoreCommunication: number
  scoreConfidence: number
  scoreTechnicalAccuracy: number
  scoreProblemSolving: number
  scoreClarityOfThought: number
  scoreBodyLanguage: number
  scoreTimeManagement: number
  scoreQuestionUnderstanding: number

  strengths: string[]
  improvements: string[]

  overallRating: number
  summary: string

  submittedAfterBreach: boolean
  submittedAt: string
  updatedAt: string
}

export interface BookingSessionDiagnostics {
  bookingId: string
  orderId: string
  status: string
  statusLabel: string

  serviceId: string
  serviceTitle: string | null
  mentorUserId: string
  mentorName: string | null
  buyerUserId: string
  buyerName: string | null

  startsAt: string | null
  endsAt: string | null
  durationMinutes: number | null
  mentorTimezone: string | null
  buyerTimezone: string | null

  meetingProvider: string | null
  meetingLinkSource: string | null
  hasMeetingLink: boolean
  meetingLinkReadyAt: string | null
  meetingLinkError: string | null
  googleEventId: string | null
  googleCalendarId: string | null

  mentorJoinedAt: string | null
  buyerJoinedAt: string | null
  sessionStartedAt: string | null
  sessionEndedAt: string | null

  attendanceWindowOpenedAt: string | null
  attendanceDeadlineAt: string | null
  buyerConfirmedAttendedAt: string | null
  mentorConfirmedAttendedAt: string | null
  autoCompleteAt: string | null
  autoCompleted: boolean

  rescheduleCount: number | null
  /** The mentor's own tally - a separate budget of the same `maxReschedules` cap (V242). */
  mentorRescheduleCount: number | null
  maxReschedules: number | null
  rescheduleMinNoticeMinutes: number | null

  reviewSubmittedAt: string | null

  // ── Phase 5: mock-interview structured feedback ─────────────────────────
  feedbackRequired: boolean | null
  feedbackWindowStartedAt: string | null
  feedbackDeadlineAt: string | null
  feedbackBreached: boolean | null
  feedback: BookingFeedbackRow | null

  withinJoinWindow: boolean
  minutesUntilStart: number | null

  joinEvents: BookingJoinEventRow[]
  notifications: BookingNotificationLogRow[]
  review: BookingReviewRow | null
}

export interface AdminCallSnapshot {
  generatedAt: string

  bookingsByStatus: Record<string, number>
  upcomingNext24h: number
  missingMeetingLink: number
  awaitingAttendanceConfirmation: number
  inProgress: number
  overdueForAutoComplete: number
  totalJoinEvents: number
  totalReviews: number

  meetingLinkSources: Record<string, number>
  notificationCounts: Record<string, number>

  joinWindowMinutes: number
  attendanceWindowHours: number
  reviewWindowDays: number
  lifecycleSweepCron: string
  retryMeetingLink: boolean

  // ── Phase 5: mock-interview structured feedback ─────────────────────────
  awaitingFeedback: number
  overdueForFeedback: number
  totalFeedbackReports: number
  feedbackReportsFiledAfterBreach: number
  feedbackReminderFirstPercentage: number
  feedbackReminderSecondPercentage: number

  /** Must always be empty. Rendered in red when it is not. */
  invariantWarnings: string[]

  upcoming: BookingSessionDiagnostics[]
  recentReviews: BookingReviewRow[]
  recentNotifications: BookingNotificationLogRow[]
}

export interface LifecycleSweepReport {
  ranAt: string
  linkRetriesAttempted: number
  linksResolved: number
  linkNudgesSent: number
  remindersSent: number
  attendanceWindowsOpened: number
  autoCompleted: number
  feedbackRemindersSent: number
  feedbackBreaches: number
  failures: number
  notes: string | null
}

/** Mirrors SubmitBookingFeedbackRequest — the payload for the admin force-submit override. */
export interface ForceSubmitFeedbackRequest {
  scoreCommunication: number
  scoreConfidence: number
  scoreTechnicalAccuracy: number
  scoreProblemSolving: number
  scoreClarityOfThought: number
  scoreBodyLanguage: number
  scoreTimeManagement: number
  scoreQuestionUnderstanding: number
  strengths: string[]
  improvements: string[]
  overallRating: number
  summary: string
}
