// ─── NEWS / EDITORIAL — TYPES ────────────────────────────────────────────────
// Mirrors the backend editorial contract (P2 controllers + P5 admin reads).

// ── Enums ─────────────────────────────────────────────────────────────────

export type BlogKind = "COMMUNITY" | "EDITORIAL"
export type BlogStatus = "DRAFT" | "PUBLISHED" | "UNLISTED" | "ARCHIVED"
export type BlogVisibility = "PUBLIC" | "AUTHENTICATED"
export type BylineType = "AUTHOR" | "ORG"
export type StructuredDataType = "Article" | "NewsArticle" | "BlogPosting"
export type EndStripVariant =
  | "GRADIENT"
  | "SOLID_MINIMAL"
  | "IMAGE_BG"
  | "BORDERED_CARD"
export type EndStripThemeMode = "ADAPTIVE" | "LIGHT_ONLY" | "DARK_ONLY"

export interface EndStripCta {
  label: string
  href: string
  style: string
}

// ── Shared blog projections ─────────────────────────────────────────────────

export interface BlogAuthorSummary {
  userId: string
  username: string | null
  name: string | null
  avatarUrl: string | null
}

export interface BlogTopicSummary {
  skillId: string
  name: string
  slug: string | null
  iconUrl: string | null
}

export interface BlogPostSummaryResponse {
  blogId: string
  author: BlogAuthorSummary | null
  title: string
  slug: string
  excerpt: string | null
  coverPhotoKey: string | null
  coverPhotoUrl: string | null
  status: BlogStatus
  visibility: BlogVisibility
  viewCount: number
  likeCount: number
  commentCount: number
  readingTimeMinutes: number
  featured: boolean
  kind: BlogKind
  editorialCategory: string | null
  priority: number
  topics: BlogTopicSummary[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BlogTocEntry {
  level: number
  id: string
  text: string
}

export interface BlogPostResponse {
  blogId: string
  author: BlogAuthorSummary | null
  title: string
  slug: string
  bodyHtml: string
  excerpt: string | null
  seoTitle: string | null
  seoDescription: string | null
  canonicalUrl: string | null
  coverPhotoKey: string | null
  coverPhotoUrl: string | null
  status: BlogStatus
  visibility: BlogVisibility
  viewCount: number
  likeCount: number
  commentCount: number
  wordCount: number
  readingTimeMinutes: number
  featured: boolean
  topics: BlogTopicSummary[]
  toc: BlogTocEntry[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  // ── Editorial ──
  kind: BlogKind
  editorialCategory: string | null
  priority: number
  bylineType: BylineType | null
  bylineLabel: string | null
  ogImageKey: string | null
  ogImageUrl: string | null
  structuredDataType: StructuredDataType | null
  noindex: boolean
  focusKeyword: string | null
  publishAt: string | null
  commentsEnabled: boolean
  endStripTemplateId: string | null
  endStripTitle: string | null
  endStripDescription: string | null
  endStripCtas: EndStripCta[]
  keepReadingIds: string[]
}

// ── Editorial curation entities ─────────────────────────────────────────────

export interface EditorialCategory {
  categoryId: string
  name: string
  description: string | null
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EditorialCategoryRequest {
  name: string
  description?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
}

export interface EndStripTemplate {
  stripId: string
  name: string
  variant: EndStripVariant
  themeMode: EndStripThemeMode
  accentToken: string | null
  backgroundImageUrl: string | null
  defaultTitle: string | null
  defaultDescription: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EndStripTemplateRequest {
  name: string
  variant?: EndStripVariant | null
  themeMode?: EndStripThemeMode | null
  accentToken?: string | null
  backgroundImageUrl?: string | null
  defaultTitle?: string | null
  defaultDescription?: string | null
  isActive?: boolean | null
}

export interface EditorialLandingCuration {
  id: string
  featuredBlogId: string | null
  topArticleBlogIds: string[]
  updatedBy: string | null
  updatedAt?: string
}

export interface LandingCurationRequest {
  featuredBlogId?: string | null
  topArticleBlogIds?: string[]
}

// ── Blog mutation requests ──────────────────────────────────────────────────

export interface UpdateBlogRequest {
  title?: string
  slug?: string
  excerpt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  editorialCategory?: string | null
  priority?: number
  featured?: boolean
  bylineType?: BylineType
  bylineLabel?: string | null
  ogImageKey?: string | null
  structuredDataType?: StructuredDataType
  noindex?: boolean
  focusKeyword?: string | null
  commentsEnabled?: boolean
  endStripTemplateId?: string | null
  endStripTitle?: string | null
  endStripDescription?: string | null
  endStripCtas?: EndStripCta[]
  keepReadingIds?: string[]
}

export interface ScheduleBlogRequest {
  publishAt: string
}

// ── Analytics (E10) ─────────────────────────────────────────────────────────

export interface EditorialCategoryCount {
  category: string
  count: number
}

export interface EditorialAnalyticsResponse {
  totalPosts: number
  publishedCount: number
  draftCount: number
  scheduledCount: number
  archivedCount: number
  featuredCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  byCategory: EditorialCategoryCount[]
  topByViews: BlogPostSummaryResponse[]
}

// ── Pagination ──────────────────────────────────────────────────────────────

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface EditorialPostsParams {
  page: number
  size: number
  status?: BlogStatus
  category?: string
  q?: string
}

// ── UI option maps ──────────────────────────────────────────────────────────

export const STATUS_OPTIONS: { label: string; value: BlogStatus }[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Unlisted", value: "UNLISTED" },
  { label: "Archived", value: "ARCHIVED" },
]

export const END_STRIP_VARIANT_OPTIONS: { label: string; value: EndStripVariant }[] = [
  { label: "Gradient", value: "GRADIENT" },
  { label: "Solid minimal", value: "SOLID_MINIMAL" },
  { label: "Image background", value: "IMAGE_BG" },
  { label: "Bordered card", value: "BORDERED_CARD" },
]

export const END_STRIP_THEME_OPTIONS: { label: string; value: EndStripThemeMode }[] = [
  { label: "Adaptive (light/dark)", value: "ADAPTIVE" },
  { label: "Light only", value: "LIGHT_ONLY" },
  { label: "Dark only", value: "DARK_ONLY" },
]

export const STRUCTURED_DATA_OPTIONS: { label: string; value: StructuredDataType }[] = [
  { label: "BlogPosting", value: "BlogPosting" },
  { label: "Article", value: "Article" },
  { label: "NewsArticle", value: "NewsArticle" },
]

export const BYLINE_OPTIONS: { label: string; value: BylineType }[] = [
  { label: "Revquix Editorial (ORG)", value: "ORG" },
  { label: "Named author", value: "AUTHOR" },
]

export const STATUS_BADGE_VARIANT: Record<
  BlogStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  UNLISTED: "outline",
  ARCHIVED: "destructive",
}
