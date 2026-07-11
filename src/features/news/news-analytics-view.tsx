"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  BarChart3,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Star,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useEditorialAnalytics, useEditorialCategories } from "./api/news.hooks"
import { StatusBadge } from "./news-badges"

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string
  value: number
  Icon: typeof Eye
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NewsAnalyticsView() {
  const { data, isLoading, isError } = useEditorialAnalytics(10)
  const { data: categories } = useEditorialCategories()

  const categoryLabel = useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.categoryId, c.name]))
    return (slug: string) => map.get(slug) ?? slug
  }, [categories])

  const maxCategory = useMemo(
    () => Math.max(1, ...(data?.byCategory ?? []).map((c) => c.count)),
    [data],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Could not load editorial analytics.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <BarChart3 className="h-5 w-5" /> Editorial analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggregates across all editorial (Revquix-owned) articles.
        </p>
      </div>

      {/* ── Lifecycle counts ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total posts" value={data.totalPosts} Icon={FileText} />
        <StatCard label="Published" value={data.publishedCount} Icon={FileText} />
        <StatCard label="Drafts" value={data.draftCount} Icon={FileText} />
        <StatCard label="Scheduled" value={data.scheduledCount} Icon={FileText} />
        <StatCard label="Archived" value={data.archivedCount} Icon={FileText} />
        <StatCard label="Featured" value={data.featuredCount} Icon={Star} />
      </div>

      {/* ── Engagement totals (published) ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total views" value={data.totalViews} Icon={Eye} />
        <StatCard label="Total likes" value={data.totalLikes} Icon={Heart} />
        <StatCard label="Total comments" value={data.totalComments} Icon={MessageSquare} />
      </div>

      {/* ── By category ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Published by category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categorised published articles yet.</p>
          ) : (
            data.byCategory.map((c) => (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{categoryLabel(c.category)}</span>
                  <span className="tabular-nums text-muted-foreground">{c.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Top posts by views ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Top articles by views</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topByViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published editorial articles yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topByViews.map((p) => (
                  <TableRow key={p.blogId}>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`${PATH_CONSTANTS.ADMIN_NEWS_CURATION}/${p.blogId}/curation`}
                        className="truncate font-medium hover:underline"
                        title={p.title}
                      >
                        {p.title || "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.viewCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.likeCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.commentCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
