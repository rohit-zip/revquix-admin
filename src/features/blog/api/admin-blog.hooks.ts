/**
 * ─── ADMIN BLOG HOOKS ─────────────────────────────────────────────────────────
 *
 * React Query hooks for admin blog management.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getAdminBlogs,
  getAdminBlogDetail,
  updateAdminBlogStatus,
  hardDeleteBlog,
  getAdminBlogReports,
  actionAdminBlogReport,
} from "./admin-blog.api"
import type { BlogStatus, BlogStatusAction } from "./admin-blog.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminBlogKeys = {
  all: ["admin-blogs"] as const,
  list: (page: number, size: number, status?: BlogStatus, search?: string) =>
    ["admin-blogs", "list", page, size, status, search] as const,
  detail: (blogId: string) => ["admin-blogs", "detail", blogId] as const,
  reports: (page: number, size: number, status?: string) =>
    ["admin-blog-reports", page, size, status] as const,
}

// ─── Blog Queries ─────────────────────────────────────────────────────────────

export function useAdminBlogsList(
  page: number,
  size: number,
  status?: BlogStatus,
  search?: string,
) {
  return useQuery({
    queryKey: adminBlogKeys.list(page, size, status, search),
    queryFn: () => getAdminBlogs(page, size, status, search),
  })
}

export function useAdminBlogDetail(blogId: string) {
  return useQuery({
    queryKey: adminBlogKeys.detail(blogId),
    queryFn: () => getAdminBlogDetail(blogId),
    enabled: !!blogId,
  })
}

// ─── Blog Mutations ───────────────────────────────────────────────────────────

export function useUpdateBlogStatus() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateAdminBlogStatus>>,
    ApiError | NetworkError,
    { blogId: string; action: BlogStatusAction }
  >({
    mutationFn: ({ blogId, action }) => updateAdminBlogStatus(blogId, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminBlogKeys.all })
      queryClient.setQueryData(adminBlogKeys.detail(data.blogId), data)
      showSuccessToast("Blog status updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useHardDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: hardDeleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBlogKeys.all })
      showSuccessToast("Blog permanently deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

// ─── Report Queries & Mutations ───────────────────────────────────────────────

export function useAdminBlogReports(page: number, size: number, status?: string) {
  return useQuery({
    queryKey: adminBlogKeys.reports(page, size, status),
    queryFn: () => getAdminBlogReports(page, size, status),
  })
}

export function useActionBlogReport() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof actionAdminBlogReport>>,
    ApiError | NetworkError,
    { reportId: number; status: "DISMISSED" | "ACTIONED" }
  >({
    mutationFn: ({ reportId, status }) => actionAdminBlogReport(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBlogKeys.reports(0, 20) })
      showSuccessToast("Report actioned successfully")
    },
    onError: (err) => showErrorToast(err),
  })
}
