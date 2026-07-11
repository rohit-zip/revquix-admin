"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Newspaper,
  Search,
  Send,
  Settings2,
  Star,
  Trash2,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useAuthorization } from "@/hooks/useAuthorization"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useArchiveBlog,
  useDeleteBlog,
  useEditorialCategories,
  useEditorialPosts,
  usePublishBlog,
  useUnarchiveBlog,
  useUnpublishBlog,
  useUpdateBlog,
} from "./api/news.hooks"
import { STATUS_OPTIONS, type BlogPostSummaryResponse, type BlogStatus } from "./api/news.types"
import { formatDate, KindBadge, StatusBadge } from "./news-badges"

const PAGE_SIZE = 20
const ALL = "__all__"

export function NewsOverviewView() {
  const { hasAnyAuthority } = useAuthorization()
  const canManage = hasAnyAuthority([PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL])

  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [category, setCategory] = useState<string>(ALL)
  const [deleteTarget, setDeleteTarget] = useState<BlogPostSummaryResponse | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data: categories } = useEditorialCategories()
  const { data, isLoading, isError } = useEditorialPosts({
    page,
    size: PAGE_SIZE,
    status: status === ALL ? undefined : (status as BlogStatus),
    category: category === ALL ? undefined : category,
    q: search || undefined,
  })

  const publish = usePublishBlog()
  const unpublish = useUnpublishBlog()
  const archive = useArchiveBlog()
  const unarchive = useUnarchiveBlog()
  const del = useDeleteBlog()
  const update = useUpdateBlog()

  const posts = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const toggleFeatured = (post: BlogPostSummaryResponse) =>
    update.mutate({ blogId: post.blogId, request: { featured: !post.featured } })

  const categoryLabel = useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.categoryId, c.name]))
    return (slug: string | null) => (slug ? map.get(slug) ?? slug : "—")
  }, [categories])

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Newspaper className="h-5 w-5" /> Editorial
          </h1>
          <p className="text-sm text-muted-foreground">
            Curate Revquix-owned articles: featuring, priority, SEO, end-strips, scheduling.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <a href={PATH_CONSTANTS.WEB_EDITORIAL_NEW} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> New article
          </a>
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.categoryId} value={c.categoryId}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState label="Failed to load editorial posts. Try again." />
      ) : posts.length === 0 ? (
        <EmptyState
          label={
            search || status !== ALL || category !== ALL
              ? "No editorial posts match your filters."
              : "No editorial posts yet."
          }
        />
      ) : (
        <div className="rounded-lg ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Priority</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.blogId}>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      {post.featured && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
                      )}
                      <Link
                        href={`${PATH_CONSTANTS.ADMIN_NEWS_CURATION}/${post.blogId}/curation`}
                        className="truncate font-medium hover:underline"
                        title={post.title}
                      >
                        {post.title || "Untitled"}
                      </Link>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {post.author?.name ?? "Revquix Editorial"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={post.kind} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell className="text-sm">{categoryLabel(post.editorialCategory)}</TableCell>
                  <TableCell className="text-right tabular-nums">{post.priority}</TableCell>
                  <TableCell className="text-right tabular-nums">{post.viewCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(post.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      post={post}
                      canManage={canManage}
                      onPublish={() => publish.mutate(post.blogId)}
                      onUnpublish={() => unpublish.mutate(post.blogId)}
                      onArchive={() => archive.mutate(post.blogId)}
                      onUnarchive={() => unarchive.mutate(post.blogId)}
                      onToggleFeatured={() => toggleFeatured(post)}
                      onDelete={() => setDeleteTarget(post)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} · {data?.totalElements ?? 0} posts
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be soft-deleted and removed from all
              surfaces. This cannot be undone from the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) del.mutate(deleteTarget.blogId)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RowActions({
  post,
  canManage,
  onPublish,
  onUnpublish,
  onArchive,
  onUnarchive,
  onToggleFeatured,
  onDelete,
}: {
  post: BlogPostSummaryResponse
  canManage: boolean
  onPublish: () => void
  onUnpublish: () => void
  onArchive: () => void
  onUnarchive: () => void
  onToggleFeatured: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Manage</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={PATH_CONSTANTS.WEB_EDITORIAL_EDIT(post.blogId)} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Edit content
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${PATH_CONSTANTS.ADMIN_NEWS_CURATION}/${post.blogId}/curation`}>
            <Settings2 className="h-4 w-4" /> Curation &amp; SEO
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={PATH_CONSTANTS.WEB_EDITORIAL_PREVIEW(post.blogId)} target="_blank" rel="noreferrer">
            <FileText className="h-4 w-4" /> Preview
          </a>
        </DropdownMenuItem>

        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleFeatured}>
              <Star className="h-4 w-4" />
              {post.featured ? "Unfeature" : "Feature"}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        {post.status === "PUBLISHED" ? (
          <DropdownMenuItem onClick={onUnpublish}>
            <Undo2 className="h-4 w-4" /> Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onPublish}>
            <Send className="h-4 w-4" /> Publish
          </DropdownMenuItem>
        )}
        {post.status === "ARCHIVED" ? (
          <DropdownMenuItem onClick={onUnarchive}>
            <ArchiveRestore className="h-4 w-4" /> Unarchive
          </DropdownMenuItem>
        ) : (
          post.status === "PUBLISHED" && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
          )
        )}

        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <Newspaper className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
