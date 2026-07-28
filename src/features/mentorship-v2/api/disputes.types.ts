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
