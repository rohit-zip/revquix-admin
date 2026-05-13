/**
 * ─── ADMIN BLOG DETAIL VIEW ───────────────────────────────────────────────────
 *
 * Admin panel detail view for a single blog post.
 * Shows full metadata, engagement stats, SEO info, and action controls.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Eye,
  Flag,
  RotateCcw,
  Star,
  StarOff,
  Trash2,
  UserCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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

import { useAdminBlogDetail, useUpdateBlogStatus, useHardDeleteBlog } from "./api/admin-blog.hooks"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Constants ────────────────────────────────────────────────────────────────

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || "https://www.revquix.com"

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

function getVisibilityBadge(visibility: string) {
  if (visibility === "PUBLIC") return <Badge variant="secondary">Public</Badge>
  if (visibility === "UNLISTED") return <Badge variant="outline">Unlisted</Badge>
  return <Badge variant="outline">{visibility}</Badge>
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 rounded-lg border bg-card">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminBlogDetailViewProps {
  blogId: string
}

export function AdminBlogDetailView({ blogId }: AdminBlogDetailViewProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: blog, isLoading } = useAdminBlogDetail(blogId)
  const updateStatus = useUpdateBlogStatus()
  const deletePost   = useHardDeleteBlog()

  const handleAction = (action: "FEATURE" | "UNFEATURE" | "ARCHIVE" | "UNPUBLISH" | "UNDER_REVIEW" | "RESTORE") => {
    updateStatus.mutate({ blogId, action })
  }

  const confirmDelete = () => {
    deletePost.mutate(blogId, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        router.push(PATH_CONSTANTS.ADMIN_BLOGS)
      },
      onError: () => setShowDeleteDialog(false),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Blog post not found.
      </div>
    )
  }

  const isFeatured = blog.isFeatured

  return (
    <div className="space-y-6">
      {/* Back + actions bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_BLOGS)}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to posts
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* View on site */}
          {blog.status === "PUBLISHED" && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`${WEB_BASE}/blogs/${blog.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on site
              </a>
            </Button>
          )}

          {/* Feature / Unfeature */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(isFeatured ? "UNFEATURE" : "FEATURE")}
            disabled={updateStatus.isPending}
          >
            {isFeatured
              ? <><StarOff className="h-4 w-4 mr-2" />Unfeature</>
              : <><Star className="h-4 w-4 mr-2" />Feature</>}
          </Button>

          {/* Under Review */}
          {blog.status !== "UNDER_REVIEW" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("UNDER_REVIEW")}
              disabled={updateStatus.isPending}
            >
              <Flag className="h-4 w-4 mr-2" />
              Mark for Review
            </Button>
          )}

          {/* Restore */}
          {(blog.status === "ARCHIVED" || blog.status === "UNDER_REVIEW") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("RESTORE")}
              disabled={updateStatus.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          )}

          {/* Archive */}
          {blog.status !== "ARCHIVED" && blog.status !== "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("ARCHIVE")}
              disabled={updateStatus.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}

          {/* Unpublish */}
          {blog.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("UNPUBLISH")}
              disabled={updateStatus.isPending}
            >
              <Eye className="h-4 w-4 mr-2 opacity-50" />
              Unpublish
            </Button>
          )}

          {/* Hard Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Cover image */}
      {blog.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blog.coverImageUrl}
          alt={blog.coverImageAlt ?? blog.title}
          className="w-full max-h-56 object-cover rounded-lg"
        />
      )}

      {/* Title + status */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {getStatusBadge(blog.status)}
          {getVisibilityBadge(blog.visibility)}
          {blog.isFeatured && (
            <Badge variant="secondary">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {blog.isPinned && <Badge variant="secondary">Pinned</Badge>}
        </div>
        <h1 className="text-2xl font-bold leading-snug">{blog.title}</h1>
        {blog.excerpt && (
          <p className="text-muted-foreground mt-2">{blog.excerpt}</p>
        )}
      </div>

      {/* Author + topics */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="font-medium">{blog.authorName}</span>
            <span className="text-muted-foreground"> @{blog.authorUsername}</span>
          </span>
        </div>
        {blog.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.topics.map((t) => (
              <Badge key={t.skillId} variant={t.isPrimary ? "default" : "outline"} className="text-xs">
                {t.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Views"      value={blog.viewCount?.toLocaleString() ?? 0} />
        <StatCard label="Reactions"  value={blog.reactionCount ?? 0} />
        <StatCard label="Comments"   value={blog.commentCount ?? 0} />
        <StatCard label="Saves"      value={blog.saveCount ?? 0} />
      </div>

      {/* Metadata */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Post Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blog ID</span>
              <span className="font-mono text-xs">{blog.blogId}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{blog.slug}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reading Time</span>
              <span>{blog.readingTimeMin} min</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Word Count</span>
              <span>{blog.wordCount?.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality Score</span>
              <span>{blog.qualityScore != null ? Number(blog.qualityScore).toFixed(2) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published</span>
              <span>{formatDate(blog.publishedAt)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(blog.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Meta Title</p>
              <p>{blog.metaTitle || <span className="text-muted-foreground italic">Not set</span>}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-xs mb-1">Meta Description</p>
              <p>{blog.metaDescription || <span className="text-muted-foreground italic">Not set</span>}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-xs mb-1">Canonical URL</p>
              <p className="break-all text-xs">
                {blog.canonicalUrl || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Series */}
      {blog.seriesId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Series</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <span className="text-muted-foreground">Series:</span>{" "}
              {blog.seriesTitle} (Part {blog.seriesOrder})
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content Preview (HTML) */}
      {blog.contentHtml && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none border rounded-lg p-4 max-h-[480px] overflow-y-auto bg-muted/30"
              dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently delete post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete</strong> &quot;{blog.title}&quot; and all its
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
