/**
 * ─── INTEREST GRAPH TYPES ─────────────────────────────────────────────────────
 *
 * Mirrors the backend DTOs in com.revquix.backend.interest.admin.dto.
 *
 * ⚠ Every boolean below matches an explicit @JsonProperty on the Java side. Jackson
 * serialises an `isX` accessor as `"x"`, and this codebase has already shipped a
 * user-visible defect from exactly that mismatch ("0 of -1 searches left" reached
 * every admin). If a boolean here is renamed, the Java annotation has to move with it.
 */

export type InterestFacetType =
  | "SKILL"
  | "SKILL_GAP"
  | "ROLE"
  | "SENIORITY"
  | "DOMAIN"
  | "COMPANY_TARGET"
  | "LOCATION"
  | "WORK_MODE"
  | "SERVICE_CATEGORY"
  | "TOOL"
  | "TOPIC"
  | "GOAL"

export type InterestConfidence =
  | "DECLARED"
  | "DERIVED_STRONG"
  | "DERIVED_WEAK"
  | "INFERRED"

export type ResolutionKind = "EXACT" | "ALIAS" | "VECTOR" | "UNRESOLVED"

export type IntentStage =
  | "EXPLORING"
  | "PREPARING"
  | "APPLYING"
  | "INTERVIEWING"
  | "LANDED"
  | "DORMANT"

export type UnmappedTermStatus = "OPEN" | "MAPPED" | "REJECTED"

export interface InterestFacet {
  facetType: InterestFacetType
  facetKey: string
  displayLabel: string
  /** The snapshot the row sorts by. Meaningless without strengthComputedAt beside it. */
  strength: number | null
  /**
   * When `strength` was last recomputed.
   *
   * ⚠ Must be rendered wherever `strength` is. It is a materialised value refreshed
   * nightly, not a live one — presenting it as live is the failure the announcement
   * daily-stat table already paid for, and here a stale strength is indistinguishable
   * from a genuinely fading interest.
   */
  strengthComputedAt: string | null
  rawWeight: number | null
  weightAt: string | null
  confidence: InterestConfidence
  signalCount: number | null
  sourceKinds: string[] | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  pinned: boolean
  suppressed: boolean
  /** Whether the product is actually acting on this facet right now. */
  surfaced: boolean
}

export interface InterestEvidence {
  id: number
  occurredAt: string
  source: string
  rawTerm: string
  resolution: ResolutionKind
  /** Cosine, present only for a VECTOR match. The number to look at when a mapping is wrong. */
  resolutionScore: number | null
  weight: number | null
  evidenceKind: string | null
  /** May dangle — reports expire at 12 months, signals live 24. Deliberate, not broken. */
  evidenceRef: string | null
  evidenceLabel: string | null
}

export interface InterestProfile {
  userId: string
  hasProfile: boolean

  intentStage: IntentStage | null
  intentStageAt: string | null
  seniority: string | null
  primaryRoleId: string | null
  primaryRoleName: string | null
  secondaryRoleId: string | null
  secondaryRoleName: string | null
  primaryDomainId: string | null
  primaryDomainName: string | null
  locationCountry: string | null
  locationCity: string | null
  workMode: string | null

  readinessScore: number | null
  readinessAt: string | null
  lastMatchScore: number | null
  lastMatchAt: string | null

  facetCount: number | null
  signalCount: number | null
  completeness: number | null

  lastSignalAt: string | null
  recomputedAt: string | null

  summaryText: string | null
  summaryAt: string | null

  /** The user's own switch. False means nothing new is being collected or targeted. */
  personalisationEnabled: boolean

  facetsByType: Partial<Record<InterestFacetType, InterestFacet[]>>

  /** Sent by the server so the UI draws the line rather than hard-coding a yaml value. */
  surfacingFloor: number
  minSignalsForWeak: number
}

export interface UnmappedTerm {
  facetType: InterestFacetType
  normalisedTerm: string
  hitCount: number
  /** The queue ranks on THIS, not hitCount — forty people once beats one person forty times. */
  distinctUsers: number
  bestCandidate: string | null
  bestScore: number | null
  status: UnmappedTermStatus
  sampleEvidenceRef: string | null
  firstSeenAt: string
  lastSeenAt: string
}

export interface AutoMatch {
  facetType: InterestFacetType
  rawTerm: string
  facetKey: string
  displayLabel: string | null
  occurrences: number
  distinctUsers: number
  avgScore: number | null
  minScore: number | null
  lastSeenAt: string | null
}

export interface RecomputeResult {
  runsIngested: number
  facetCount: number
}

/** Shape of GET /admin/interests/overview — deliberately loose, it is a dashboard payload. */
export interface InterestOverview {
  usersWithProfile: number
  usersWithFiveFacets: number
  personalisationOptOuts: number
  totalFacets: number
  totalSignals: number
  openUnmappedTerms: number
  resolutionMix: { resolution: ResolutionKind; count: number; pct: number }[]
  facetLeaderboard: {
    facet_type: InterestFacetType
    display_label: string
    users: number
    avg_strength: number
  }[]
  intentFunnel: { stage: string; users: number }[]
  rolesWithSupplyComputed: number
  rolesTotal: number
}
