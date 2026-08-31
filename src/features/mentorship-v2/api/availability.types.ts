/**
 * ─── MENTORSHIP V2 (PHASE 1) AVAILABILITY TYPES ─────────────────────────────
 *
 * Mirrors AdminMentorshipV2AvailabilityController's DTOs.
 *
 * Every instant is an ISO-8601 UTC string — the API never emits local-time
 * strings. Local wall-clock values appear only inside blocked-date windows and
 * weekly rules, where they are genuinely wall-clock rules rather than instants.
 */

export type IsoInstant = string
export type IsoDate = string

export interface AdminAvailabilityMentorSummary {
  mentorUserId: string
  username?: string | null
  name?: string | null
  timezone: string
  active: boolean
  enabledRuleCount: number
  blockCount: number
  blockingIntervalCount: number
  bookableStartsNext7Days: number
  bookableHoursNext14Days: number
  needsAttention: boolean
  attentionReason?: string | null
}

export interface AvailabilityHealthResponse {
  mentorUserId: string
  timezone?: string | null
  configured: boolean
  active: boolean
  enabledRuleCount: number
  upcomingBlockCount: number
  horizonDays: number
  bookableStartsNext14Days: number
  bookableStartsNext7Days: number
  bookableHoursNext14Days: number
  needsAttention: boolean
  attentionReason?: string | null
  computedAt?: IsoInstant | null
}

export interface TraceSpan {
  start: IsoInstant
  end: IsoInstant
  minutes: number
}

/**
 * The step-by-step record of one engine run. This is the whole point of the
 * inspector: availability is computed, not stored, so "why isn't 3 PM offered?"
 * can only be answered by showing what survived each step.
 */
export interface AvailabilityTraceResponse {
  windowStart?: IsoInstant | null
  windowEnd?: IsoInstant | null
  windowExplanation?: string | null
  enabledRuleCount: number
  expandedRuleIntervalCount: number
  afterRuleExpansion: TraceSpan[]
  blockCount: number
  afterBlockSubtraction: TraceSpan[]
  busyIntervalCount: number
  afterBusySubtraction: TraceSpan[]
  candidateStartsBeforeCaps: number
  candidateStartsAfterCaps: number
  capsApplied: string[]
}

export interface DayStarts {
  date: IsoDate
  count: number
  starts: IsoInstant[]
}

export interface BookableStartsResponse {
  mentorUserId: string
  serviceId?: string | null
  durationMinutes: number
  mentorTimezone: string
  viewerTimezone?: string | null
  slotGranularityMinutes: number
  noticePeriodMinutes: number
  bookingPeriodDays: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  windowStart?: IsoInstant | null
  windowEnd?: IsoInstant | null
  starts: IsoInstant[]
  totalStarts: number
  startsByDate: DayStarts[]
  cacheHit: boolean
  unavailableReason?: string | null
  trace?: AvailabilityTraceResponse | null
}

export interface MentorBookedIntervalResponse {
  intervalId: string
  mentorUserId: string
  bookingId?: string | null
  /** BOOKING | MANUAL — never GOOGLE_BUSY (strategy doc §2.2). */
  source: string
  startsAt: IsoInstant
  endsAt: IsoInstant
  /** HELD | ACTIVE | RELEASED. */
  status: string
  note?: string | null
  createdAt?: IsoInstant | null
}

export interface ManualBookedIntervalRequest {
  startsAt: IsoInstant
  endsAt: IsoInstant
  status: "HELD" | "ACTIVE"
  note?: string | null
}

export interface AvailabilityAuditResponse {
  auditId: string
  mentorUserId: string
  actorUserId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  createdAt?: IsoInstant | null
}
