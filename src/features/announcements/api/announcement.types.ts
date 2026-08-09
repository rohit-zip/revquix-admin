/**
 * Mirrors `com.revquix.backend.marketing.dto.*`.
 *
 * Hand-maintained rather than generated, matching every other feature in this console: the two
 * repositories have no shared build, and an OpenAPI codegen step for one CRUD surface is more
 * machinery than the drift it prevents.
 */

export type AnnouncementSurface = "BAR" | "MODAL"
export type AnnouncementCategory = "MARKETING" | "RELEASE" | "SYSTEM"
export type AnnouncementScope = "PLATFORM" | "MENTOR"

export type AnnouncementStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "LIVE"
  | "PAUSED"
  | "EXPIRED"
  | "ARCHIVED"

export type AnnouncementAudience =
  | "EVERYONE"
  | "GUESTS_ONLY"
  | "AUTHENTICATED_ONLY"
  | "NEW_USERS"
  | "MENTORS_ONLY"
  | "NEVER_BOOKED"

export type AnnouncementAppearance =
  | "ACCENT"
  | "ACCENT_SOFT"
  | "NEUTRAL"
  | "SUCCESS"
  | "WARNING"
  | "CRITICAL"

export type AnnouncementIcon =
  | "SPARKLES"
  | "ZAP"
  | "MEGAPHONE"
  | "GIFT"
  | "ALERT_TRIANGLE"
  | "WRENCH"

export type AnnouncementCtaStyle = "PILL" | "LINK"
export type AnnouncementLayout = "STACKED" | "SPLIT"
export type AnnouncementMediaPosition = "TOP" | "LEFT" | "RIGHT"

export type AnnouncementReshowPolicy =
  | "NEVER"
  | "AFTER_HOURS"
  | "EVERY_SESSION"
  | "UNTIL_CLICKED"

export interface AnnouncementCta {
  key: string
  label: string
  href: string
  style: AnnouncementCtaStyle
  /** Server-derived from the href. Read-only here; the request type has no such field. */
  external: boolean
}

export interface AdminAnnouncement {
  announcementId: string
  surface: AnnouncementSurface
  category: AnnouncementCategory
  scope: AnnouncementScope
  ownerUserId: string | null
  internalName: string
  status: AnnouncementStatus
  priority: number
  startsAt: string
  endsAt: string | null

  audience: AnnouncementAudience
  audienceParams: Record<string, unknown> | null
  includePaths: string[]
  excludePaths: string[]
  countries: string[]

  message: string | null
  shortMessage: string | null
  appearance: AnnouncementAppearance
  icon: AnnouncementIcon | null

  heading: string | null
  bodyHtml: string | null
  layout: AnnouncementLayout | null
  mediaAssetId: string | null
  mediaPosition: AnnouncementMediaPosition | null
  eyebrow: string | null

  ctas: AnnouncementCta[]

  dismissible: boolean
  reshowPolicy: AnnouncementReshowPolicy
  reshowAfterHours: number | null
  frequencyCap: number | null
  allowChaining: boolean
  /**
   * RELEASE only: also list this entry on the public /changelog.
   *
   * Defaults true server-side — a release note silently missing from the changelog is a worse
   * failure than a minor one being listed, because nobody is prompted to check for an absence.
   */
  publishToChangelog: boolean

  /** MENTOR scope only. SUPPRESSED means an admin took the banner down. */
  moderationStatus: "APPROVED" | "SUPPRESSED"
  /** Why it was taken down. Shown to the mentor verbatim, so write it as though they will read it. */
  moderationNote: string | null
  moderatedBy: string | null
  moderatedAt: string | null

  impressionCount: number
  uniqueSubjects: number
  clickCount: number
  dismissCount: number
  /** Null when there are no impressions yet — an em dash, not "0%". */
  clickThroughRate: number | null
  dismissRate: number | null

  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string
  publishedBy: string | null
  publishedAt: string | null
  version: number
}

export interface AnnouncementCtaRequest {
  key: string
  label: string
  href: string
  style: AnnouncementCtaStyle
}

export interface AnnouncementUpsertRequest {
  surface: AnnouncementSurface
  category: AnnouncementCategory
  internalName: string
  priority: number
  startsAt: string
  endsAt: string | null

  audience: AnnouncementAudience
  audienceParams?: Record<string, unknown> | null
  includePaths: string[]
  excludePaths: string[]
  countries: string[]

  message: string | null
  shortMessage: string | null
  appearance: AnnouncementAppearance
  icon: AnnouncementIcon | null

  heading?: string | null
  bodyHtml?: string | null
  layout?: AnnouncementLayout | null
  mediaAssetId?: string | null
  mediaPosition?: AnnouncementMediaPosition | null
  eyebrow?: string | null

  ctas: AnnouncementCtaRequest[]

  dismissible: boolean
  reshowPolicy: AnnouncementReshowPolicy
  reshowAfterHours: number | null
  frequencyCap: number | null
  allowChaining?: boolean
  /** RELEASE only. Omitted means true, matching the column default. */
  publishToChangelog?: boolean

  /** The version the editor loaded. Omitted on create. */
  version?: number
}

export interface AnnouncementOverlapEntry {
  announcementId: string
  internalName: string
  priority: number
  startsAt: string
  endsAt: string | null
}

export interface AnnouncementOverlap {
  hasOverlap: boolean
  winnerId: string | null
  winnerName: string | null
  overlapping: AnnouncementOverlapEntry[]
}

export type AnnouncementScopeFilter = "PLATFORM" | "MENTOR"

export interface AnnouncementListParams {
  status?: AnnouncementStatus
  surface?: AnnouncementSurface
  /**
   * PLATFORM for staff-authored announcements, MENTOR for mentor banners.
   *
   * Without this the list mixes both into one undifferentiated feed, and the moderation question —
   * "what have mentors published lately" — becomes unanswerable at exactly the moment somebody
   * needs to answer it.
   */
  scope?: AnnouncementScopeFilter
  page?: number
  size?: number
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — analytics, interactions, preview (ANNOUNCEMENTS_MASTER_PLAN.md §10)
// ─────────────────────────────────────────────────────────────────────────────

export interface AnnouncementStatsPoint {
  /** UTC calendar date, `YYYY-MM-DD`. Rendered in IST by the console, which says so. */
  date: string
  /**
   * ⚠ NULLABLE, and the chart must draw a break rather than a zero.
   *
   * A day's impressions is the difference between two cumulative snapshots, so the first day of
   * the series — and any day after a night the rollup did not run — has nothing to subtract from.
   * Rendering null as 0 would show a launch day as a flat line on the day the announcement almost
   * certainly performed best.
   */
  impressions: number | null
  /** Exact, counted from the ledger: people who saw it for the FIRST time that day. */
  newSubjects: number
  clicks: number
  dismissals: number
}

export interface AnnouncementStatsTotals {
  impressions: number
  newSubjects: number
  clicks: number
  dismissals: number
  /** True when a day was unmeasurable, making `impressions` a lower bound. Say so in the UI. */
  impressionsPartial: boolean
}

export interface AnnouncementStats {
  announcementId: string
  from: string
  to: string
  /** Only days that have a rollup row. Missing days are gaps, not zeroes. */
  points: AnnouncementStatsPoint[]
  totals: AnnouncementStatsTotals
}

export interface AnnouncementInteractionRow {
  /** `user:USR-…` in full, or a truncated `anon:…4f2a`. Never a raw device UUID. */
  subjectLabel: string
  userId: string | null
  anonymous: boolean
  firstSeenAt: string
  lastSeenAt: string
  seenCount: number
  dismissedAt: string | null
  clickedAt: string | null
  clickedCta: string | null
  lastSurfacePath: string | null
}

export interface AnnouncementPreview {
  previewUrl: string
  expiresAt: string
}
