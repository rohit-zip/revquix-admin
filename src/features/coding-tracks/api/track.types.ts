/**
 * ─── TRACK CURATION: WIRE TYPES (admin console) ──────────────────────────────
 *
 * Mirrors `AdminTrackController` — docs/CODING_PROBLEMS_MASTER_PLAN.md §10.
 *
 * ⚠ THIS IS THE CURATOR'S VIEW, NOT THE VISITOR'S. It carries ids, lifecycle timestamps and the
 * LIVE status of every problem a track points at; the public one carries none of that and carries
 * progress instead. Two responses from the same rows, deliberately — §21.5's rule for problems,
 * applied here before it could become a bug.
 */

export type TrackStatus = "DRAFT" | "PUBLISHED" | "UNLISTED" | "RETIRED"

export interface TrackItem {
  slug: string
  title: string
  number?: number
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  /** ⚠ The problem's live status. A path assembled last month can contain retired problems. */
  problemStatus: string
  optional: boolean
  note?: string
  position: number
}

export interface TrackSection {
  sectionId: string
  title: string
  summaryHtml: string
  position: number
  items: TrackItem[]
}

export interface TrackView {
  trackId: string
  slug: string
  title: string
  summaryHtml: string
  coverTheme?: string
  difficultyBand?: string
  status: TrackStatus
  position: number
  /** Counted the way the public page counts: required, published, not optional. */
  required: number
  /** Every row, including optional and withdrawn ones. */
  total: number
  publishedAt?: string
  updatedAt?: string
  sections: TrackSection[]
}

export interface SaveTrackRequest {
  title: string
  summaryHtml?: string
  coverTheme?: string
  difficultyBand?: string
  position?: number
}

/** ⚠ Whole-list and positional: the order of the array IS the order on the page. */
export interface SaveSectionsRequest {
  sections: { sectionId?: string; title: string; summaryHtml?: string }[]
}

/** Items are addressed by problem SLUG — what a curator can see and copy from /problems. */
export interface SaveItemsRequest {
  items: { slug: string; optional: boolean; note?: string }[]
}
