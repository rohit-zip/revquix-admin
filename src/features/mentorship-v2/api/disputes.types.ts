/**
 * ─── MENTORSHIP V2 (PHASE 7) DISPUTE ADMIN TYPES ─────────────────────────────
 *
 * Mirrors `AdminDisputeSnapshot`, `DisputeResponse` and their nested DTOs one-for-one.
 *
 * The admin payload differs from a party's in exactly two ways, both server-decided: internal
 * staff notes are included in `messages`, and `audit` is populated. Everything else — every
 * affordance, every label, every explanation string — is the same shape the buyer and mentor get.
 */

export type DisputeStatus =
  | "OPEN"
  | "AWAITING_USER"
  | "AWAITING_MENTOR"
  | "UNDER_REVIEW"
  | "ESCALATED"
  | "REOPENED"
  | "RESOLVED"
  | "REJECTED"
  | "WITHDRAWN"

export type DisputePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

export type DisputeActorRole = "USER" | "MENTOR" | "SYSTEM" | "ADMIN"

export interface DisputeMessageRow {
  messageId: string
  authorUserId: string | null
  authorName: string | null
  authorRole: DisputeActorRole
  authoredByViewer: boolean
  body: string
  /** Staff-only. Present only in this (admin) payload — a party's response omits these rows. */
  internal: boolean
  createdAt: string | null
}

export interface DisputeEvidenceRow {
  evidenceId: string
  kind: "SCREENSHOT" | "RECORDING" | "DOCUMENT" | "SYSTEM_LOG"
  kindLabel: string
  uploadedBy: string | null
  uploadedByName: string | null
  uploadedByRole: DisputeActorRole
  fileUrl: string | null
  mimeType: string | null
  sizeBytes: number | null
  caption: string | null
  /** The auto-attached join ledger, for `SYSTEM_LOG` rows. This is what settles attendance cases. */
  systemPayload: Record<string, unknown> | null
  systemSummary: string | null
  createdAt: string | null
}

/**
 * One participant Google recorded in a Revquix-hosted room.
 *
 * **Read the two halves separately, and render them that way.** `kind`, `displayName`, `joinedAt`
 * and `leftAt` are what *Google said*; `resolvedRole` and `matchMethod` are what *we concluded*, and
 * the second exists solely to say how much the first is worth.
 *
 * A row whose `matchMethod` is `UNMATCHED` must never be rendered as "Mentor: present" — an
 * anonymous joiner types their own display name into the Meet lobby, so trusting it would let a
 * no-show claim (which is a refund) be defeated by typing. `identified` is the one boolean to key
 * off; it is true only for `GOOGLE_SUB`.
 */
export interface MeetParticipantRow {
  meetParticipantId: string
  /**
   * `conferenceRecords/{id}`. **Two distinct values on one booking means the session was
   * re-entered** — somebody dropped and rejoined, or a false start preceded the real call.
   */
  conferenceRecord: string | null
  kind: "SIGNED_IN" | "ANONYMOUS" | "PHONE" | null
  /** What was on screen. Untrusted for an anonymous joiner — they typed it themselves. */
  displayName: string | null
  joinedAt: string | null
  /** Null when the participant was still in the room when the records were read. */
  leftAt: string | null
  minutesPresent: number | null
  resolvedRole: "MENTOR" | "BUYER" | "UNKNOWN" | null
  matchMethod: "GOOGLE_SUB" | "NAME_HINT" | "UNMATCHED" | null
  /** Safe to act on. True only for `GOOGLE_SUB` — an id Google verified and the joiner could not pick. */
  identified: boolean
}

export interface JoinEventRow {
  joinEventId: string
  role: "MENTOR" | "BUYER" | null
  joinClickedAt: string | null
  ipAddress: string | null
  userAgent: string | null
  /** False for a click outside the joinable window. Those prove intent, never attendance. */
  withinWindow: boolean
  /** False means there was nothing to join — the click proves they tried and nothing more. */
  linkPresent: boolean | null
}

/**
 * The live attendance record for the session a dispute is about. Admin-only, and present only on
 * the single-dispute inspect — never on the queue.
 *
 * **Read `mentorAttended` / `buyerAttended` together with `evidenceUsable`.** Both are false on a
 * booking that cannot produce evidence at all, which does not mean nobody came — it means nothing
 * here can say. `verdict` states which of those two it is in one sentence, so this screen cannot be
 * read as more certain than the data behind it.
 */
export interface DisputeAttendance {
  bookingId: string
  bookingStatus: string | null
  bookingStatusLabel: string | null

  startsAt: string | null
  endsAt: string | null
  durationMinutes: number | null
  /** `startsAt − joinWindowMinutes` … `endsAt + joinGraceMinutes`, recomputed from the CURRENT schedule. */
  joinWindowOpensAt: string | null
  joinWindowClosesAt: string | null

  meetingProvider: string | null
  meetingProviderLabel: string | null
  meetingLinkSource: string | null
  hasMeetingLink: boolean
  meetingLinkReadyAt: string | null
  meetingLinkError: string | null

  /**
   * The single most important field here. False means the room was the mentor's own calendar event
   * or a link they pasted — Google will say nothing about who was in it, and the join ledger is
   * clicks on our button rather than attendance.
   */
  revquixHostedRoom: boolean
  /** `spaces/{id}`. The join URL is deliberately absent — a URL on this screen is a URL in a screenshot. */
  meetSpaceName: string | null
  meetTornDownAt: string | null
  /** `NO_RECORD` is **evidence, not a failure**: nobody entered. Never render it as an error state. */
  meetAttendanceStatus: "PENDING" | "SYNCED" | "NO_RECORD" | "ERROR" | null
  meetAttendanceSyncedAt: string | null

  evidenceUsable: boolean
  /**
   * `MEET_SOLO` is the only value that can take a party AWAY from the Join ledger: Google looked into
   * the room and found exactly one person, whatever the buttons say. Every other Meet reading only
   * ever adds.
   */
  evidenceSource:
    | "NONE"
    | "CLICK_LEDGER"
    | "MEET_IDENTIFIED"
    | "MEET_PRESENCE"
    | "MEET_NO_RECORD"
    | "MEET_SOLO"
    | null
  mentorAttended: boolean
  buyerAttended: boolean
  /** Google proved nobody entered a room only reachable through the tracked Join hop. */
  absenceProven: boolean
  /** `SessionSettlement`. `DISPUTE_*` means the platform opened this case itself. */
  settlementDecision: string | null
  verdict: string | null
  /** Why some participants cannot be named. Null when there is nothing to explain. */
  caveat: string | null

  mentorJoinedAt: string | null
  buyerJoinedAt: string | null
  sessionStartedAt: string | null
  sessionEndedAt: string | null
  attendanceWindowOpenedAt: string | null
  attendanceDeadlineAt: string | null
  mentorConfirmedAttendedAt: string | null
  buyerConfirmedAttendedAt: string | null
  autoCompleted: boolean

  meetParticipants: MeetParticipantRow[] | null
  /** Distinct **signed-in identities**, not row count — one person who rejoins is several rows. */
  meetDistinctSignedInCount: number
  /** Signed-in identities that were neither party. Raises a flag for a human; decides nothing. */
  meetUnexpectedParticipantCount: number

  joinEvents: JoinEventRow[] | null
}

export interface DisputeAuditRow {
  auditId: string
  action: string
  actorType: DisputeActorRole
  actorId: string | null
  actorName: string | null
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  note: string | null
  createdAt: string | null
}

export interface DisputeRow {
  disputeId: string

  orderId: string
  orderNumber: string | null
  bookingId: string | null
  entitlementId: string | null

  serviceId: string | null
  serviceTitle: string | null
  serviceType: string | null

  buyerUserId: string
  buyerName: string | null
  mentorUserId: string
  mentorName: string | null
  mentorUsername: string | null

  disputeType: string
  disputeTypeLabel: string

  status: DisputeStatus
  statusLabel: string
  statusExplanation: string | null

  priority: DisputePriority
  reasonCode: string | null
  description: string | null

  raisedByUserId: string | null
  raisedByRole: DisputeActorRole
  raisedByViewer: boolean

  amountInQuestionMinor: number
  currency: string
  currencySymbol: string

  slaDueAt: string | null
  resolutionDueAt: string | null
  firstResponseAt: string | null
  /** Signed: negative once overdue, so the console can render "overdue by" without recomputing. */
  hoursUntilFirstResponseDue: number | null
  hoursUntilResolutionDue: number | null
  firstResponseBreached: boolean
  resolutionBreached: boolean
  escalatedAt: string | null

  resolvedAt: string | null
  resolution: string | null
  resolutionLabel: string | null
  resolutionNote: string | null
  resolutionAmountMinor: number | null
  autoResolved: boolean
  autoResolutionRule: string | null

  payoutHold: boolean
  payoutHoldReleasedAt: string | null

  appealWindowEndsAt: string | null
  hoursUntilAppealWindowCloses: number | null
  reopenedCount: number

  lastMessageAt: string | null
  createdAt: string | null
  updatedAt: string | null

  viewerRole: DisputeActorRole | null
  awaitingViewer: boolean

  canReply: boolean
  cannotReplyReason: string | null
  canWithdraw: boolean
  cannotWithdrawReason: string | null
  canAppeal: boolean
  cannotAppealReason: string | null
  canUploadEvidence: boolean
  cannotUploadEvidenceReason: string | null

  assignedAdminId: string | null
  assignedAdminName: string | null

  messages: DisputeMessageRow[] | null
  evidence: DisputeEvidenceRow[] | null
  audit: DisputeAuditRow[] | null

  /**
   * The live attendance record for the disputed session. Admin-only, and only on the single-dispute
   * inspect — the queue deliberately does not carry it.
   *
   * Null for a dispute with no booking behind it: a package-level or payment-only complaint has no
   * session anyone could have attended.
   *
   * Read live, unlike the frozen `SYSTEM_LOG` row in `evidence`. Google's participant records are
   * ingested once the room's conference has ended, which on a session a buyer disputes immediately
   * is minutes after the complaint was filed. Both are shown; when they disagree, that disagreement
   * is the finding.
   */
  attendance: DisputeAttendance | null
}

export interface AdminDisputeSnapshot {
  generatedAt: string

  totalDisputes: number
  liveDisputes: number
  countsByStatus: Record<string, number>

  autoResolvedCount: number
  /** Against master-plan §9's own >50% target, which the panel renders beside it. */
  autoResolutionRatePercentage: number
  autoResolutionEnabled: boolean

  firstResponseBreaches: number
  resolutionBreaches: number
  unassignedLive: number
  holdingPayoutPastAppealWindow: number

  firstResponseHours: number
  resolutionHours: number
  appealWindowHours: number
  disputeWindowDays: number
  mentorNoShowGraceMinutes: number

  ratedMentors: number
  unratedMentors: number
  mentorsByReliabilityBand: Record<string, number>

  /** Live assertions. **Must always be empty** — a non-empty entry is a real bug. */
  invariantViolations: string[]
  warnings: string[]

  recentDisputes: DisputeRow[]
}

/** Each option declares its own requirements so the resolve form adapts instead of guessing. */
export interface ResolutionOption {
  value: string
  label: string
  requiresAmount: boolean
  requiresEntitlement: boolean
  movesMoneyToBuyer: boolean
  penalisesMentor: boolean
}

export interface DisputeSlaSweepReport {
  autoResolved: number
  firstResponseBreaches: number
  resolutionBreaches: number
  payoutHoldsReleased: number
  reliabilityRecomputed: number
}

export interface ResolveDisputeRequest {
  resolution: string
  note: string
  amountMinor?: number
  reject?: boolean
  extendValidityDays?: number
}

export interface AdminDisputeMessageRequest {
  body: string
  internal?: boolean
}

/** Spring `Page<T>` — only the fields the console reads. */
export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
