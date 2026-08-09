/**
 * ─── MENTORSHIP V2 (PHASE 9) SEARCH ADMIN TYPES ────────────────────────────────
 *
 * Mirrors `AdminSearchSnapshot`, `SearchDocumentRow` and `SearchSynonymResponse` one-for-one.
 *
 * The two array fields at the top of the snapshot are the point of the whole page. They are **runtime
 * assertions**, not statistics: `invariantViolations` must always render empty, and each entry names one
 * specific claim about the system that is currently false. `warnings` is the softer tier — things that
 * will become wrong, or that are degraded in a way which self-heals.
 */

export interface AdminSearchFlaggedService {
  serviceId: string
  title?: string | null
  mentorUsername?: string | null
  status?: string | null
  flags: string[]
  refreshedAt?: string | null
}

export interface AdminSearchQueryStat {
  query?: string | null
  occurrences: number
  averageResults?: number | null
  clicks: number
  lastSearchedAt?: string | null
}

export interface AdminSearchVariantStat {
  variant?: string | null
  searches: number
  clicks: number
  bookings: number
  averageClickPosition?: number | null
  clickThroughRate?: number | null
  bookingRate?: number | null
}

export interface AdminSearchLandingCoverage {
  serviceType?: string | null
  skillSlug?: string | null
  path?: string | null
  serviceCount: number
  indexable: boolean
}

export interface AdminSearchSnapshot {
  /** Must always be empty. Rendered in red when it is not. */
  invariantViolations: string[]
  warnings: string[]

  totalServices: number
  projectionRows: number
  listableRows: number
  contentFlaggedRows: number
  bookableWithin7dRows: number
  ratedRows: number

  /** Live public services with no projection row — invisible in the marketplace. */
  missingProjectionRows: number
  /** Projection rows whose service is gone. Should be zero; the FK cascades. */
  orphanedRows: number

  oldestRefreshAt?: string | null
  newestRefreshAt?: string | null
  oldestAvailabilityCheckAt?: string | null

  flaggedServices: AdminSearchFlaggedService[]
  contentFlagCounts: Record<string, number>

  activeSynonyms: number
  curatedSynonyms: number
  minedSynonyms: number

  searchesLogged: number
  zeroResultSearches: number
  searchesWithClick: number
  searchesWithBooking: number

  zeroResultQueries: AdminSearchQueryStat[]
  topQueries: AdminSearchQueryStat[]
  variantPerformance: AdminSearchVariantStat[]

  landingPagesIndexable: number
  landingPagesBelowFloor: number
  landingIndexFloor: number
  topLandingPages: AdminSearchLandingCoverage[]

  /** The ranking weights and thresholds as the running process sees them. */
  liveConfig: Record<string, unknown>
}

/**
 * One projection row, verbatim.
 *
 * This is the complete answer to "why is this service not appearing in the marketplace": `listable`, the
 * content flags, the availability snapshot and `refreshReason` between them cover every possible cause.
 */
export interface SearchDocumentRow {
  serviceId: string
  mentorUserId: string
  serviceType: string
  status: string
  visibility: string
  slug: string

  title: string
  shortDescription?: string | null
  descriptionText?: string | null
  coverImageUrl?: string | null

  mentorName?: string | null
  mentorUsername: string
  mentorHeadline?: string | null
  mentorCompany?: string | null
  mentorAvatarUrl?: string | null
  mentorYearsExperience?: number | null

  skillNames: string[]
  skillSlugs: string[]

  baseCurrency: string
  basePriceMinor: number
  usdPriceMinor: number
  slashPriceMinor?: number | null

  durationMinutes?: number | null

  avgRating?: number | null
  reviewCount?: number | null
  orderCount?: number | null
  completedCount?: number | null
  viewCount?: number | null
  conversionRate?: number | null

  mentorCompletionRate?: number | null
  mentorReliabilityScore?: number | null
  mentorOpenDisputes?: number | null
  mentorNoShowCount?: number | null
  mentorAvgResponseHours?: number | null

  hasAvailability24h: boolean
  hasAvailability7d: boolean
  nextAvailableAt?: string | null
  availabilityCheckedAt?: string | null

  contentCheckPassed: boolean
  contentCheckFlags: string[]

  listable: boolean
  publishedAt?: string | null
  refreshedAt?: string | null
  refreshReason?: string | null

  relevanceScore?: number | null
}

export interface SearchSynonymRow {
  synonymId: number
  term: string
  expansion: string
  active: boolean
  /** `CURATED` (a human wrote it) or `MINED` (Phase 10's offline job proposed it). */
  source: string
  /** Approximate — rolled up rather than incremented per request. */
  hitCount: number
  updatedAt?: string | null
}

export interface SaveSearchSynonymRequest {
  term: string
  expansion: string
  isActive?: boolean
}

export interface ProjectionSweepReport {
  availabilityRefreshed: number
  missingBackfilled: number
  orphansRemoved: number
}

export interface ProjectionRebuildReport {
  servicesScanned: number
  rowsWritten: number
  failures: number
  orphansRemoved: number
}

/**
 * mentorship.mentor_search_document — what a mentor card on `/mentors` actually reads — is an aggregate
 * OVER service_search_document, rebuilt on its own hourly cadence. `ProjectionSweepReport` above does
 * NOT refresh it; this is the separate sweep that does.
 */
export interface MentorProjectionSweepReport {
  missingFound: number
  upserted: number
  deleted: number
  listable: number
  listableWithoutSkills: number
}

// ── The live query tester's response (a subset of the public search response) ──

export interface AdminMarketplaceResultCard {
  serviceId: string
  serviceType: string
  serviceTypeLabel: string
  title: string
  path: string
  mentorUsername: string
  mentorName?: string | null
  skills: string[]
  baseCurrency: string
  basePriceMinor: number
  usdPriceMinor?: number | null
  avgRating?: number | null
  reviewCount?: number | null
  orderCount?: number | null
  availableWithin24h: boolean
  availableWithin7d: boolean
  newListing: boolean
  /** The whole reason this endpoint exists: it explains why one result outranks another. */
  relevanceScore?: number | null
}

export interface AdminQueryTestResponse {
  results: AdminMarketplaceResultCard[]
  totalResults: number
  query?: string | null
  rankingVariant?: string | null
  fuzzyMatched: boolean
  appliedSynonyms: string[]
  emptyStateMessage?: string | null
  elapsedMs: number
}
