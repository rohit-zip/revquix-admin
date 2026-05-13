/**
 * ─── ADMIN BLOGS VIEW ─────────────────────────────────────────────────────────
 *
 * Admin panel list view for all blog posts.
 * Supports tab-based filtering by status and text search.
 */

"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  Archive,
  Eye,
  ExternalLink,
  Flag,
  RefreshCw,
  Search,
  Star,
  StarOff,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useAdminBlogsList, useUpdateBlogStatus, useHardDeleteBlog } from "./api/admin-blog.hooks"
import type { AdminBlogSummary, BlogStatus } from "./api/admin-blog.types"
import { BLOG_STATUS } from "./api/admin-blog.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Constants ────────────────────────────────────────────────────────────────

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || "https://www.revquix.com"

const STATUS_TABS: { label: string; value: BlogStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Published", value: BLOG_STATUS.PUBLISHED },
  { label: "Draft", value: BLOG_STATUS.DRAFT },
  { label: "Scheduled", value: BLOG_STATUS.SCHEDULED },
  { label: "Archived", value: BLOG_STATUS.ARCHIVED },
  { label: "Under Review", value: BLOG_STATUS.UNDER_REVIEW },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PUBLISHED:    { variant: "default",     label: "Published" },
    DRAFT:        { variant: "outline",     label: "Draft" },
    SCHEDULED:    { variant: "secondary",   label: "Scheduled" },
    ARCHIVED:     { variant: "outline",     label: "Archived" },
    UNDER_REVIEW: { variant: "destructive", label: "Under Review" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminBlogsView() {
  const router    = useRouter()
  const [page, setPage]         = useState(0)
  const [activeTab, setActiveTab] = useState<BlogStatus | "ALL">("ALL")
  const [search, setSearch]     = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle]   = useState("")

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 400)
  }, [])

  const statusFilter = activeTab === "ALL" ? undefined : activeTab

  const { data, isLoading, refetch, isRefetching } = useAdminBlogsList(
    page,
    20,
    statusFilter,
    debouncedSearch || undefined,
  )

  const updateStatus  = useUpdateBlogStatus()
  const deletePost    = useHardDeleteBlog()

  const blogs       = data?.content ?? []
  const totalPages  = data?.totalPages ?? 0

  const handleTabChange = (value: string) => {
    setActiveTab(value as BlogStatus | "ALL")
    setPage(0)
  }

  const handleFeatureToggle = (blog: AdminBlogSummary) => {
    updateStatus.mutate({
      blogId: blog.blogId,
      action: blog.isFeatured ? "UNFEATURE" : "FEATURE",
    })
  }

  const handleArchive = (blog: AdminBlogSummary) => {
    updateStatus.mutate({ blogId: blog.blogId, action: "ARCHIVE" })
  }

  const confirmDelete = () => {
    if (deleteBlogId) {
      deletePost.mutate(deleteBlogId, {
        onSuccess: () => setDeleteBlogId(null),
        onError: () => setDeleteBlogId(null),
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all blog content — feature, archive, review, or permanently delete posts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(PATH_CONSTANTS.ADMIN_BLOG_REPORTS)}
          >
            <Flag className="h-4 w-4 mr-2" />
            Reports Queue
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title or author…"
          className="pl-9"
        />
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {data?.totalElements ?? 0} post{data?.totalElements !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quality</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : blogs.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        No blog posts found
                      </TableCell>
                    </TableRow>
                    )
                  : blogs.map((blog: AdminBlogSummary) => (
                    <TableRow key={blog.blogId}>
                      {/* Post title + cover */}
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {blog.coverImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={blog.coverImageUrl}
                              alt={blog.coverImageAlt ?? blog.title}
                              className="h-10 w-16 object-cover rounded shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="font-medium text-sm text-left line-clamp-2 hover:underline cursor-pointer"
                              onClick={() =>
                                router.push(`${PATH_CONSTANTS.ADMIN_BLOG_DETAIL}/${blog.blogId}`)
                              }
                            >
                              {blog.title}
                            </button>
                            {blog.isFeatured && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Author */}
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{blog.authorName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">@{blog.authorUsername ?? ""}</p>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(blog.status)}</TableCell>

                      {/* Quality Score */}
                      <TableCell className="text-right text-sm">
                        {blog.qualityScore != null
                          ? Number(blog.qualityScore).toFixed(1)
                          : "—"}
                      </TableCell>

                      {/* View Count */}
                      <TableCell className="text-right text-sm">
                        {blog.viewCount?.toLocaleString() ?? "0"}
                      </TableCell>

                      {/* Published Date */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {blog.status === "PUBLISHED"
                          ? formatDate(blog.publishedAt)
                          : blog.status === "SCHEDULED"
                            ? `Scheduled ${formatDate(blog.scheduledAt)}`
                            : formatDate(blog.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* View detail */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="View detail"
                            onClick={() =>
                              router.push(`${PATH_CONSTANTS.ADMIN_BLOG_DETAIL}/${blog.blogId}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* View on site */}
                          {blog.status === "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View on site"
                              asChild
                            >
                              <a
                                href={`${WEB_BASE}/blogs/${blog.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {/* Feature / Unfeature */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={blog.isFeatured ? "Unfeature post" : "Feature post"}
                            onClick={() => handleFeatureToggle(blog)}
                            disabled={updateStatus.isPending}
                          >
                            {blog.isFeatured
                              ? <StarOff className="h-4 w-4 text-amber-500" />
                              : <Star className="h-4 w-4" />}
                          </Button>

                          {/* Archive */}
                          {blog.status !== "ARCHIVED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Archive post"
                              onClick={() => handleArchive(blog)}
                              disabled={updateStatus.isPending}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Hard Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Permanently delete"
                            onClick={() => {
                              setDeleteBlogId(blog.blogId)
                              setDeleteTitle(blog.title)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteBlogId}
        onOpenChange={(open) => { if (!open) setDeleteBlogId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently delete post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete</strong> &quot;{deleteTitle}&quot; and all its
              associated data (comments, reactions, reports). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
