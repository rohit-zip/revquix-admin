/**
 * ─── MENTORSHIP V2 (PHASE 10) SEMANTIC SEARCH ADMIN TYPES ─────────────────────
 *
 * Mirrors `AdminSemanticSnapshot`, `SemanticQueryComparison` and the action reports one-for-one.
 *
 * Phase 10 differs from every prior phase in one way that shapes this whole payload: **its exit criterion
 * cannot be satisfied by code**. "V2 beats V1 on booking conversion, or V1 is kept and V2 is shelved" is a
 * product outcome only live traffic decides. So the snapshot answers two separate questions and the UI keeps
 * them apart — `invariantViolations` (is it built correctly, mechanical, right answers exist) versus
 * `variantPerformance` (is it better, empty until traffic has been served).
 */

export interface SemanticCapabilityProbe {
  available: boolean
  pgvectorVersion?: string | null
  columnDimensions?: number | null
  columnPresent: boolean
  hnswIndexPresent: boolean
  reason?: string | null
}

export interface EmbeddingRunRow {
  runId: number
  triggerSource?: string | null
  model?: string | null
  candidates?: number | null
  embedded?: number | null
  skippedUnchanged?: number | null
  failed?: number | null
  durationMs?: number | null
  firstError?: string | null
  startedAt?: string | null
  finishedAt?: string | null
}

export interface SemanticVariantComparison {
  variant?: string | null
  searches: number
  clicks: number
  bookings: number
  clickThroughRate?: number | null
  bookingRate?: number | null
  averageClickPosition?: number | null
}

export interface IntentClusterRow {
  clusterId: number
  representativeQuery?: string | null
  queryCount: number
  zeroResultCount: number
  cohesion?: number | null
  memberQueries: string[]
}

export interface SkillSuggestionRow {
  suggestionId: number
  serviceId?: string | null
  serviceTitle?: string | null
  skillId?: string | null
  skillName?: string | null
  confidence?: number | null
  status?: string | null
  suggestedAt?: string | null
}

export interface AdminSemanticSnapshot {
  /** Must always render empty. */
  invariantViolations: string[]
  warnings: string[]

  capabilityAvailable: boolean
  databaseReady: boolean
  unavailableReason?: string | null
  pgvectorVersion?: string | null
  columnDimensions?: number | null
  hnswIndexPresent: boolean

  modelReachable: boolean
  /** What configuration says. */
  configuredModel?: string | null
  /** What the container is actually serving. A divergence silently corrupts the index. */
  servedModel?: string | null
  modelMaxInputLength?: number | null
  modelVersion?: string | null

  listableRows: number
  embeddedRows: number
  unembeddedRows: number
  /** Rows past the retry cap. Non-zero means something is stuck. */
  parkedRows: number
  /** More than one entry is an invariant violation, not a statistic. */
  modelsInIndex: string[]
  oldestEmbeddedAt?: string | null
  newestEmbeddedAt?: string | null
  recentRuns: EmbeddingRunRow[]

  indexName?: string | null
  indexSizeBytes: number
  indexSizePretty?: string | null
  indexSizeMb: number
  indexBytesPerRow: number
  indexBudgetMb: number
  indexBudgetUsedFraction: number
  projectedMbAt10x: number

  experimentKey?: string | null
  experimentEnabled: boolean
  experimentRolloutPercent: number
  /** Why visitors are in the control arm despite the experiment. Four possible causes. */
  experimentSuppressedReason?: string | null
  variantPerformance: SemanticVariantComparison[]

  minedSynonymsTotal: number
  minedSynonymsInactive: number
  pendingSkillSuggestions: number
  acceptedSkillSuggestions: number
  rejectedSkillSuggestions: number
  intentClusters: number
  failingIntents: IntentClusterRow[]
  topSkillSuggestions: SkillSuggestionRow[]

  liveConfig: Record<string, unknown>
}

export interface SemanticResultLine {
  position: number
  serviceId: string
  title?: string | null
  mentorUsername?: string | null
  serviceTypeLabel?: string | null
  skills: string[]
  avgRating?: number | null
  reviewCount?: number | null
  orderCount?: number | null
  /** Rank in the keyword list, or null if absent from it. */
  keywordRank?: number | null
  /** Rank in the vector list, or null if absent from it. */
  vectorRank?: number | null
  vectorSimilarity?: number | null
  fusedScore?: number | null
  businessScore?: number | null
  combinedScore?: number | null
}

export interface SemanticQueryComparison {
  query?: string | null
  semanticApplied: boolean
  degradedReason?: string | null
  keywordCandidates: number
  vectorCandidates: number
  /**
   * Neighbours keyword search missed entirely.
   *
   * Fusion only re-orders rows the keyword page already contained, so these reach a user only through the
   * "closest by meaning" rail on an empty result set. This number therefore measures how much recall is being
   * left on the table, and it bounds what the A/B test can possibly show.
   */
  vectorOnlyMatches: number
  fusionDepth: number
  keywordResults: SemanticResultLine[]
  hybridResults: SemanticResultLine[]
  /** Raw vector neighbours, unfused and without the business re-rank. */
  vectorNeighbours: SemanticResultLine[]
  elapsedMs: number
}

export interface EmbeddingSweepReport {
  skippedEntirely: boolean
  skippedReason?: string | null
  candidates: number
  embedded: number
  skippedUnchanged: number
  failed: number
  clearedForModelChange: number
  firstError?: string | null
}

export interface SynonymMiningReport {
  skipped: boolean
  skippedReason?: string | null
  queriesExamined: number
  rulesProposed: number
  alreadyKnown: number
  belowThreshold: number
  sampleRules: string[]
}

export interface SkillTaggingReport {
  skipped: boolean
  skippedReason?: string | null
  servicesExamined: number
  suggestionsProposed: number
  alreadySeen: number
}

export interface IntentClusteringReport {
  skipped: boolean
  skippedReason?: string | null
  queriesClustered: number
  clustersFound: number
  totalZeroResultQueries: number
}

export interface OfflineJobsReport {
  synonymMining: SynonymMiningReport
  skillTagging: SkillTaggingReport
  intentClustering: IntentClusteringReport
}


/** Coverage for one embedding corpus. Keys mirror CorpusEmbeddingDao.coverage()'s SQL aliases. */
export interface CorpusCoverage {
  listable_rows: number
  embedded_rows: number
  unembedded_rows: number
  /**
   * Embedded, but of text that has since changed.
   *
   * ⚠ `embedded_rows` counts rows holding a vector and says nothing about whether that vector still
   * describes the current text. A re-index preserves vectors deliberately, so a corpus can be 100%
   * embedded and entirely stale at once - which read as full coverage until this was added.
   */
  stale_rows: number
  /** What the next sweep would actually pick up. Excludes parked rows. */
  pending_rows: number
  parked_rows: number
  newest_embedded_at: string | null
}
