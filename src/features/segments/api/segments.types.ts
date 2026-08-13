/**
 * ─── INTEREST SEGMENT TYPES ───────────────────────────────────────────────────
 *
 * Mirrors `SegmentDefinition` and `SegmentResponse` on the backend.
 * See `USER_INTEREST_GRAPH_MASTER_PLAN.md` §12.1 and `ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md` §16.
 */

/** Mirrors the backend `InterestFacetType`. Closed set — the API rejects anything else. */
export const FACET_TYPES = [
  "SKILL",
  "SKILL_GAP",
  "ROLE",
  "SENIORITY",
  "DOMAIN",
  "COMPANY_TARGET",
  "LOCATION",
  "WORK_MODE",
  "SERVICE_CATEGORY",
  "TOOL",
  "TOPIC",
  "GOAL",
] as const

export type FacetType = (typeof FACET_TYPES)[number]

export const INTENT_STAGES = [
  "EXPLORING",
  "PREPARING",
  "APPLYING",
  "INTERVIEWING",
  "LANDED",
  "DORMANT",
] as const

export type IntentStage = (typeof INTENT_STAGES)[number]

export const SENIORITIES = ["FRESHER", "EARLY", "MID", "SENIOR", "LEADERSHIP"] as const

export type Seniority = (typeof SENIORITIES)[number]

export interface FacetClause {
  facetType: FacetType
  /** A registry id — skill_id, role_id, or an enum constant name. Never prose. */
  facetKey: string
  /** Minimum effective weight. Omitted means the platform surfacing floor (12). */
  minWeight?: number | null
}

export interface ProfileClause {
  intentStage?: IntentStage[]
  seniority?: Seniority[]
  lastSignalWithinDays?: number | null
  minCompleteness?: number | null
}

export interface SegmentDefinition {
  all: FacetClause[]
  none: FacetClause[]
  profile: ProfileClause
  /**
   * Exclude users whose primary role has no measured mentor supply.
   *
   * ⚠ Currently matches NOBODY, and that is correct rather than broken. Every role has
   * `supply_computed_at = NULL` because the role→service mapping cannot be computed honestly yet,
   * and the backend gate deliberately requires a real measurement rather than reading
   * `mentor_supply > 0` — which would be indistinguishable from "measured and genuinely zero".
   * The builder says so on screen.
   */
  requireSupply: boolean
}

export interface Segment {
  segmentId: string
  name: string
  description: string | null
  definition: SegmentDefinition
  /**
   * Last evaluated match count.
   *
   * ⚠ Nullable, and the two states are opposite conclusions: `0` means nobody matches, `null` means
   * nobody has evaluated it yet. Never coalesce to zero in the UI.
   */
  lastCount: number | null
  /** When `lastCount` was computed. Always render it beside the number — it is a snapshot. */
  lastCountAt: string | null
  archived: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface SegmentRun {
  segmentRunId: string
  matchedCount: number
  durationMs: number | null
  triggerSource: "PREVIEW" | "CAMPAIGN"
  triggeredBy: string | null
  createdAt: string
}

export interface SegmentPage {
  content: Segment[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** An empty definition the builder starts from. The API refuses to save it until it constrains something. */
export const EMPTY_DEFINITION: SegmentDefinition = {
  all: [],
  none: [],
  profile: {},
  requireSupply: false,
}
