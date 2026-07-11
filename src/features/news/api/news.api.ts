import { apiClient } from "@/lib/axios"
import type {
  BlogPostResponse,
  BlogPostSummaryResponse,
  EditorialAnalyticsResponse,
  EditorialCategory,
  EditorialCategoryRequest,
  EditorialLandingCuration,
  EditorialPostsParams,
  EndStripTemplate,
  EndStripTemplateRequest,
  LandingCurationRequest,
  ScheduleBlogRequest,
  SpringPage,
  UpdateBlogRequest,
} from "./news.types"

const EDITORIAL = "/editorial"
const BLOG = "/blog"

// ── Admin editorial listing + analytics (P5 backend reads) ──────────────────

export const listEditorialPosts = (
  params: EditorialPostsParams,
): Promise<SpringPage<BlogPostSummaryResponse>> =>
  apiClient
    .get<SpringPage<BlogPostSummaryResponse>>(`${EDITORIAL}/posts`, {
      params: {
        page: params.page,
        size: params.size,
        ...(params.status ? { status: params.status } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.q ? { q: params.q } : {}),
      },
    })
    .then((r) => r.data)

export const getEditorialAnalytics = (
  topLimit = 10,
): Promise<EditorialAnalyticsResponse> =>
  apiClient
    .get<EditorialAnalyticsResponse>(`${EDITORIAL}/analytics`, { params: { topLimit } })
    .then((r) => r.data)

// ── Per-post read + curation (via the blog lifecycle endpoints) ─────────────

export const getBlog = (blogId: string): Promise<BlogPostResponse> =>
  apiClient.get<BlogPostResponse>(`${BLOG}/${blogId}`).then((r) => r.data)

export const updateBlog = (
  blogId: string,
  request: UpdateBlogRequest,
): Promise<BlogPostResponse> =>
  apiClient.put<BlogPostResponse>(`${BLOG}/${blogId}`, request).then((r) => r.data)

export const publishBlog = (blogId: string): Promise<BlogPostResponse> =>
  apiClient.post<BlogPostResponse>(`${BLOG}/${blogId}/publish`).then((r) => r.data)

export const unpublishBlog = (blogId: string): Promise<BlogPostResponse> =>
  apiClient.post<BlogPostResponse>(`${BLOG}/${blogId}/unpublish`).then((r) => r.data)

export const archiveBlog = (blogId: string): Promise<BlogPostResponse> =>
  apiClient.post<BlogPostResponse>(`${BLOG}/${blogId}/archive`).then((r) => r.data)

export const unarchiveBlog = (blogId: string): Promise<BlogPostResponse> =>
  apiClient.post<BlogPostResponse>(`${BLOG}/${blogId}/unarchive`).then((r) => r.data)

export const scheduleBlog = (
  blogId: string,
  request: ScheduleBlogRequest,
): Promise<BlogPostResponse> =>
  apiClient.post<BlogPostResponse>(`${BLOG}/${blogId}/schedule`, request).then((r) => r.data)

export const deleteBlog = (blogId: string): Promise<void> =>
  apiClient.delete(`${BLOG}/${blogId}`).then(() => undefined)

// ── Categories CRUD ─────────────────────────────────────────────────────────

export const listCategories = (): Promise<EditorialCategory[]> =>
  apiClient.get<EditorialCategory[]>(`${EDITORIAL}/categories`).then((r) => r.data)

export const createCategory = (
  request: EditorialCategoryRequest,
): Promise<EditorialCategory> =>
  apiClient.post<EditorialCategory>(`${EDITORIAL}/categories`, request).then((r) => r.data)

export const updateCategory = (
  categoryId: string,
  request: EditorialCategoryRequest,
): Promise<EditorialCategory> =>
  apiClient
    .put<EditorialCategory>(`${EDITORIAL}/categories/${categoryId}`, request)
    .then((r) => r.data)

export const deleteCategory = (categoryId: string): Promise<void> =>
  apiClient.delete(`${EDITORIAL}/categories/${categoryId}`).then(() => undefined)

// ── End-strip templates CRUD ────────────────────────────────────────────────

export const listEndStrips = (): Promise<EndStripTemplate[]> =>
  apiClient.get<EndStripTemplate[]>(`${EDITORIAL}/end-strips`).then((r) => r.data)

export const createEndStrip = (
  request: EndStripTemplateRequest,
): Promise<EndStripTemplate> =>
  apiClient.post<EndStripTemplate>(`${EDITORIAL}/end-strips`, request).then((r) => r.data)

export const updateEndStrip = (
  stripId: string,
  request: EndStripTemplateRequest,
): Promise<EndStripTemplate> =>
  apiClient.put<EndStripTemplate>(`${EDITORIAL}/end-strips/${stripId}`, request).then((r) => r.data)

export const deleteEndStrip = (stripId: string): Promise<void> =>
  apiClient.delete(`${EDITORIAL}/end-strips/${stripId}`).then(() => undefined)

// ── Landing curation ────────────────────────────────────────────────────────

export const getLanding = (): Promise<EditorialLandingCuration | null> =>
  apiClient.get<EditorialLandingCuration | null>(`${EDITORIAL}/landing`).then((r) => r.data)

export const updateLanding = (
  request: LandingCurationRequest,
): Promise<EditorialLandingCuration> =>
  apiClient.put<EditorialLandingCuration>(`${EDITORIAL}/landing`, request).then((r) => r.data)
