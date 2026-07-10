"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  archiveBlog,
  createCategory,
  createEndStrip,
  deleteBlog,
  deleteCategory,
  deleteEndStrip,
  getBlog,
  getEditorialAnalytics,
  getLanding,
  listCategories,
  listEditorialPosts,
  listEndStrips,
  publishBlog,
  scheduleBlog,
  unarchiveBlog,
  unpublishBlog,
  updateBlog,
  updateCategory,
  updateEndStrip,
  updateLanding,
} from "./news.api"
import type {
  EditorialCategoryRequest,
  EditorialPostsParams,
  EndStripTemplateRequest,
  LandingCurationRequest,
  ScheduleBlogRequest,
  UpdateBlogRequest,
} from "./news.types"

export const newsQueryKeys = {
  all: ["news"] as const,
  posts: (params: EditorialPostsParams) =>
    ["news", "posts", params.page, params.size, params.status, params.category, params.q] as const,
  post: (blogId: string) => ["news", "post", blogId] as const,
  analytics: (topLimit: number) => ["news", "analytics", topLimit] as const,
  categories: ["news", "categories"] as const,
  endStrips: ["news", "end-strips"] as const,
  landing: ["news", "landing"] as const,
}

// ── Listing + analytics ─────────────────────────────────────────────────────

export function useEditorialPosts(params: EditorialPostsParams) {
  return useQuery({
    queryKey: newsQueryKeys.posts(params),
    queryFn: () => listEditorialPosts(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

export function useEditorialAnalytics(topLimit = 10) {
  return useQuery({
    queryKey: newsQueryKeys.analytics(topLimit),
    queryFn: () => getEditorialAnalytics(topLimit),
    staleTime: 60_000,
  })
}

// ── Per-post read + lifecycle ───────────────────────────────────────────────

export function useEditorialPost(blogId: string) {
  return useQuery({
    queryKey: newsQueryKeys.post(blogId),
    queryFn: () => getBlog(blogId),
    enabled: !!blogId,
  })
}

export function useUpdateBlog() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateBlog>>,
    ApiError | NetworkError,
    { blogId: string; request: UpdateBlogRequest }
  >({
    mutationFn: ({ blogId, request }) => updateBlog(blogId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(newsQueryKeys.post(data.blogId), data)
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.all })
      showSuccessToast("Curation saved")
    },
    onError: (err) => showErrorToast(err),
  })
}

function useLifecycleMutation(
  fn: (blogId: string) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError | NetworkError, string>({
    mutationFn: (blogId) => fn(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.all })
      showSuccessToast(successMessage)
    },
    onError: (err) => showErrorToast(err),
  })
}

export const usePublishBlog = () => useLifecycleMutation(publishBlog, "Post published")
export const useUnpublishBlog = () => useLifecycleMutation(unpublishBlog, "Post unpublished")
export const useArchiveBlog = () => useLifecycleMutation(archiveBlog, "Post archived")
export const useUnarchiveBlog = () => useLifecycleMutation(unarchiveBlog, "Post moved to draft")

export function useScheduleBlog() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof scheduleBlog>>,
    ApiError | NetworkError,
    { blogId: string; request: ScheduleBlogRequest }
  >({
    mutationFn: ({ blogId, request }) => scheduleBlog(blogId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(newsQueryKeys.post(data.blogId), data)
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.all })
      showSuccessToast("Publish scheduled")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (blogId) => deleteBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.all })
      showSuccessToast("Post deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

// ── Categories ──────────────────────────────────────────────────────────────

export function useEditorialCategories() {
  return useQuery({
    queryKey: newsQueryKeys.categories,
    queryFn: () => listCategories(),
    staleTime: 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof createCategory>>,
    ApiError | NetworkError,
    EditorialCategoryRequest
  >({
    mutationFn: (request) => createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.categories })
      showSuccessToast("Category created")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateCategory>>,
    ApiError | NetworkError,
    { categoryId: string; request: EditorialCategoryRequest }
  >({
    mutationFn: ({ categoryId, request }) => updateCategory(categoryId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.categories })
      showSuccessToast("Category updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (categoryId) => deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.categories })
      showSuccessToast("Category deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

// ── End-strips ──────────────────────────────────────────────────────────────

export function useEndStripTemplates() {
  return useQuery({
    queryKey: newsQueryKeys.endStrips,
    queryFn: () => listEndStrips(),
    staleTime: 60_000,
  })
}

export function useCreateEndStrip() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof createEndStrip>>,
    ApiError | NetworkError,
    EndStripTemplateRequest
  >({
    mutationFn: (request) => createEndStrip(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.endStrips })
      showSuccessToast("End-strip template created")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateEndStrip() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateEndStrip>>,
    ApiError | NetworkError,
    { stripId: string; request: EndStripTemplateRequest }
  >({
    mutationFn: ({ stripId, request }) => updateEndStrip(stripId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.endStrips })
      showSuccessToast("End-strip template updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteEndStrip() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (stripId) => deleteEndStrip(stripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKeys.endStrips })
      showSuccessToast("End-strip template deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

// ── Landing curation ────────────────────────────────────────────────────────

export function useEditorialLanding() {
  return useQuery({
    queryKey: newsQueryKeys.landing,
    queryFn: () => getLanding(),
    staleTime: 30_000,
  })
}

export function useUpdateLanding() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateLanding>>,
    ApiError | NetworkError,
    LandingCurationRequest
  >({
    mutationFn: (request) => updateLanding(request),
    onSuccess: (data) => {
      queryClient.setQueryData(newsQueryKeys.landing, data)
      showSuccessToast("Landing curation saved")
    },
    onError: (err) => showErrorToast(err),
  })
}
