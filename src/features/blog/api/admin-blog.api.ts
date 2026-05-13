/**
 * ─── ADMIN BLOG API ───────────────────────────────────────────────────────────
 *
 * Admin API calls for:
 *   AdminBlogController  (/admin/blogs)
 *   BlogReportController (/admin/blog-reports)
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminBlogDetail,
  AdminBlogPage,
  AdminBlogReportPage,
  AdminBlogReport,
  BlogStatus,
  BlogStatusAction,
} from "./admin-blog.types"

const BLOGS_BASE   = "/admin/blogs"
const REPORTS_BASE = "/admin/blog-reports"

// ─── Blog endpoints ───────────────────────────────────────────────────────────

/**
 * GET /admin/blogs
 * Paginated list of all blogs with optional filters.
 */
export const getAdminBlogs = (
  page: number,
  size: number,
  status?: BlogStatus,
  search?: string,
): Promise<AdminBlogPage> =>
  apiClient
    .get<AdminBlogPage>(BLOGS_BASE, {
      params: {
        page,
        size,
        sort: "createdAt,desc",
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
    })
    .then((r) => r.data)

/**
 * GET /admin/blogs/{blogId}
 * Full blog detail including contentJson (admin-only).
 */
export const getAdminBlogDetail = (blogId: string): Promise<AdminBlogDetail> =>
  apiClient
    .get<AdminBlogDetail>(`${BLOGS_BASE}/${blogId}`)
    .then((r) => r.data)

/**
 * PATCH /admin/blogs/{blogId}/status
 * Applies a status action: FEATURE, UNFEATURE, ARCHIVE, UNPUBLISH, UNDER_REVIEW, RESTORE.
 */
export const updateAdminBlogStatus = (
  blogId: string,
  action: BlogStatusAction,
): Promise<AdminBlogDetail> =>
  apiClient
    .patch<AdminBlogDetail>(`${BLOGS_BASE}/${blogId}/status`, { action })
    .then((r) => r.data)

/**
 * DELETE /admin/blogs/{blogId}
 * Permanently removes the blog post and all child records.
 */
export const hardDeleteBlog = (blogId: string): Promise<void> =>
  apiClient.delete(`${BLOGS_BASE}/${blogId}`).then(() => undefined)

// ─── Blog Report endpoints ────────────────────────────────────────────────────

/**
 * GET /admin/blog-reports/all?status=PENDING
 * Returns all reports with optional status filter.
 */
export const getAdminBlogReports = (
  page: number,
  size: number,
  status?: string,
): Promise<AdminBlogReportPage> =>
  apiClient
    .get<AdminBlogReportPage>(`${REPORTS_BASE}/all`, {
      params: { page, size, ...(status ? { status } : {}) },
    })
    .then((r) => r.data)

/**
 * PUT /admin/blog-reports/{reportId}?status=DISMISSED
 * Actions a report (DISMISSED or ACTIONED).
 */
export const actionAdminBlogReport = (
  reportId: number,
  status: "DISMISSED" | "ACTIONED",
): Promise<AdminBlogReport> =>
  apiClient
    .put<AdminBlogReport>(`${REPORTS_BASE}/${reportId}`, null, {
      params: { status },
    })
    .then((r) => r.data)
