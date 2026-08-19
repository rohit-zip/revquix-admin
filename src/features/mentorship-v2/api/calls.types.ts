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

  // ── Revquix-hosted room (M4/M5) ───────────────────────────────────────────
  /**
   * `spaces/{id}` of the Revquix-owned Meet room, when this booking used one.
   *
   * The join URL is deliberately NOT sent. It is a bearer capability - anyone holding it walks in,
   * signed in or not, because accessType is forced to OPEN - and a URL on an admin screen is a URL
   * in a screenshot.
   */
  meetSpaceName: string | null
  meetTornDownAt: string | null
  /**
   * PENDING | SYNCED | NO_RECORD | ERROR, or null when this booking used no Revquix room.
   *
   * NO_RECORD is EVIDENCE, not an error: the tracked join hop is the only door to a Revquix-hosted
   * room, so Google having no conference means nobody entered. Do not render it as a failure.
   */
  meetAttendanceStatus: string | null
  meetParticipants: BookingMeetParticipantRow[]
  /** Distinct signed-in identities, NOT a row count - one person rejoining produces several rows. */
  meetDistinctSignedInCount: number
  /**
   * Signed-in identities that were NEITHER party - a third account in a room only two people were
   * given the link to.
   *
   * A flag for a human, never a verdict. An unexpected participant is very often the mentor on a
   * second Google account or a colleague they brought, so nothing acts on this automatically.
   */
  meetUnexpectedParticipantCount: number
  /** Why some participants could not be named, phrased for an operator. Null when all were. */
  meetAttendanceCaveat: string | null

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

/**
 * One participant Google recorded in a Revquix-hosted room.
 *
 * Two halves, and they must be rendered as two halves. `kind`, `displayName`, `joinedAt` and
 * `leftAt` are what GOOGLE SAID. `resolvedRole` and `matchMethod` are what WE CONCLUDED, and
 * `identified` says whether that conclusion is safe to act on.
 *
 * `displayName` is typed by the person joining when `kind` is ANONYMOUS. Never render it as proof
 * of who somebody was - this is the screen a refund gets decided from.
 */
export interface BookingMeetParticipantRow {
  meetParticipantId: string
  /** Two distinct values on one booking means the session was re-entered. */
  conferenceRecord: string
  kind: "SIGNED_IN" | "ANONYMOUS" | "PHONE" | string
  displayName: string | null
  joinedAt: string
  /** Null when the participant was still in the room when the records were read. */
  leftAt: string | null
  minutesPresent: number | null
  resolvedRole: "MENTOR" | "BUYER" | "UNKNOWN" | string
  matchMethod: "GOOGLE_SUB" | "NAME_HINT" | "UNMATCHED" | string
  /** True only for GOOGLE_SUB. The one field a tick may be rendered from. */
  identified: boolean
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

// ─── Booking messaging (read-only) ───────────────────────────────────────────
//
// Mirrors AdminMessageThreadResponse / MessageResponse / MessageAttachmentResponse /
// MessageWindowResponse. The console reads this thread; there is deliberately no write
// path — admins do not join a two-party conversation, that is what a dispute is for.

export interface AdminMessageAttachment {
  attachmentId: string
  filename: string
  mimeType: string
  sizeBytes: number
  sizeLabel: string
  /**
   * A presigned URL with a 15-minute life. Never a permanent link, and never an object key:
   * a chat attachment is frequently a resume, and it lives in the private bucket.
   */
  downloadUrl: string | null
  previewable: boolean
  createdAt: string
}

export interface AdminMessage {
  messageId: string
  /** The session this was sent from, or null for a message between sessions. */
  bookingId: string | null
  authorUserId: string | null
  authorName: string | null
  authorAvatarUrl: string | null
  authorRole: "USER" | "MENTOR" | "SYSTEM" | "ADMIN"
  /** Always false in an admin payload — an admin is not a party, so nothing here is "theirs". */
  authoredByViewer: boolean
  body: string | null
  attachments: AdminMessageAttachment[]
  seenByCounterpart: boolean
  /**
   * The operational payload of this whole view. Messaging warns and delivers rather than
   * hiding, so a message that tripped a contact-detail pattern is here, delivered, with the
   * flag recorded — which is what makes "they asked me to move off-platform" answerable.
   */
  contentFlags: string[]
  /** The sender saw the interstitial and chose to send anyway. */
  warningAcknowledged: boolean
  deleted: boolean
  canDelete: boolean
  createdAt: string
}

export interface AdminMessageWindow {
  open: boolean
  closesAt: string | null
  remainingHours: number | null
  /** Rendered verbatim — it answers "why can't they reply?" without reconstructing the rule. */
  reason: string | null
  readable: boolean
}

export interface AdminMessageThread {
  /** False when this pair has never opened a thread — a real answer, not an empty list. */
  exists: boolean
  threadId: string | null
  bookingId: string
  buyerUserId: string
  buyerName: string | null
  mentorUserId: string
  mentorName: string | null
  createdAt: string | null
  lastMessageAt: string | null
  messageCount: number
  flaggedMessageCount: number
  attachmentCount: number
  deletedMessageCount: number
  buyerLastReadAt: string | null
  mentorLastReadAt: string | null
  window: AdminMessageWindow | null
  /**
   * The whole conversation, not only this booking's messages.
   *
   * The thread is keyed on the buyer/mentor pair, so the message that explains a dispute about
   * session 3 was very often sent between sessions 2 and 3 with no booking stamp at all. Each
   * message carries its own bookingId so the UI can still show which is which.
   */
  messages: AdminMessage[]
  hasMore: boolean
}
