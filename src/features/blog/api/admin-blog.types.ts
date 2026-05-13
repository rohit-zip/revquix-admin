/**
 * ─── ADMIN BLOG TYPES ─────────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * AdminBlogController (/api/v1/admin/blogs) and
 * BlogReportController (/api/v1/admin/blog-reports).
 */

// ─── Blog Status ──────────────────────────────────────────────────────────────

export const BLOG_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  SCHEDULED: "SCHEDULED",
  ARCHIVED: "ARCHIVED",
  UNDER_REVIEW: "UNDER_REVIEW",
} as const

export type BlogStatus = (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS]

export const BLOG_STATUS_OPTIONS: { label: string; value: BlogStatus }[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
]

// ─── Blog Status Actions ──────────────────────────────────────────────────────

export const BLOG_STATUS_ACTION = {
  FEATURE: "FEATURE",
  UNFEATURE: "UNFEATURE",
  ARCHIVE: "ARCHIVE",
  UNPUBLISH: "UNPUBLISH",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESTORE: "RESTORE",
} as const

export type BlogStatusAction = (typeof BLOG_STATUS_ACTION)[keyof typeof BLOG_STATUS_ACTION]

// ─── Report Status ────────────────────────────────────────────────────────────

export const REPORT_STATUS = {
  PENDING: "PENDING",
  DISMISSED: "DISMISSED",
  ACTIONED: "ACTIONED",
} as const

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS]

// ─── Topic ────────────────────────────────────────────────────────────────────

export interface AdminBlogTopic {
  skillId: string
  name: string
  slug: string
  isPrimary: boolean
}

// ─── Blog Summary (list view) ─────────────────────────────────────────────────

export interface AdminBlogSummary {
  blogId: string
  slug: string
  title: string
  excerpt?: string
  coverImageUrl?: string
  coverImageAlt?: string

  // Author
  authorUserId: string
  authorName: string
  authorUsername: string
  authorAvatarUrl?: string
  authorHeadline?: string

  // Metadata
  status: string
  visibility: string
  readingTimeMin: number
  wordCount: number

  // Engagement
  viewCount: number
  reactionCount: number
  commentCount: number
  saveCount: number
  qualityScore?: number

  // Topics
  topics: AdminBlogTopic[]

  // Flags
  isFeatured: boolean
  isPinned: boolean

  // Series
  seriesId?: string
  seriesTitle?: string
  seriesOrder?: number

  // Timestamps
  publishedAt?: string
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Blog Detail (full view for admin) ───────────────────────────────────────

export interface AdminBlogDetail extends AdminBlogSummary {
  /** Raw Tiptap JSON — admin-only */
  contentJson?: string
  /** Sanitised HTML for rendering */
  contentHtml?: string

  // SEO
  canonicalUrl?: string
  metaTitle?: string
  metaDescription?: string

  // Mentor CTA
  showMentorCta: boolean
  mentorCtaHourly: boolean
  mentorCtaMock: boolean
  mentorCtaOffer: boolean
  allowIframeEmbed: boolean
}

// ─── Paginated Responses ──────────────────────────────────────────────────────

export interface AdminBlogPage {
  content: AdminBlogSummary[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ─── Blog Report ─────────────────────────────────────────────────────────────

export interface AdminBlogReport {
  reportId: number
  blogId: string
  blogTitle: string
  reporterUserId?: string
  reporterName?: string
  reason: string
  description?: string
  status: string
  actionedByUserId?: string
  actionedAt?: string
  createdAt: string
}

export interface AdminBlogReportPage {
  content: AdminBlogReport[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
