"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Save, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEditorialLanding, useEditorialPosts, useUpdateLanding } from "./api/news.hooks"
import type { BlogPostSummaryResponse } from "./api/news.types"

const NONE = "__none__"
const ADD = "__add__"

export function NewsLandingView() {
  const { data: landing, isLoading: landingLoading } = useEditorialLanding()
  const { data: postsPage, isLoading: postsLoading } = useEditorialPosts({
    page: 0,
    size: 100,
    status: "PUBLISHED",
  })
  const update = useUpdateLanding()

  const posts = useMemo(() => postsPage?.content ?? [], [postsPage])
  const byId = useMemo(() => {
    const map = new Map<string, BlogPostSummaryResponse>()
    posts.forEach((p) => map.set(p.blogId, p))
    return map
  }, [posts])

  const [featured, setFeatured] = useState<string>("")
  const [topRail, setTopRail] = useState<string[]>([])

  useEffect(() => {
    if (landing === undefined) return
    setFeatured(landing?.featuredBlogId ?? "")
    setTopRail(landing?.topArticleBlogIds ?? [])
  }, [landing])

  const available = posts.filter((p) => !topRail.includes(p.blogId) && p.blogId !== featured)

  const move = (i: number, dir: -1 | 1) => {
    setTopRail((rail) => {
      const next = [...rail]
      const j = i + dir
      if (j < 0 || j >= next.length) return next
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const title = (id: string) => byId.get(id)?.title ?? id

  if (landingLoading || postsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Star className="h-5 w-5" /> Landing curation
          </h1>
          <p className="text-sm text-muted-foreground">
            Set the editorial landing hero and ordered top-articles rail. Leave the hero unset to
            auto-fill by priority/recency.
          </p>
        </div>
        <Button
          className="gap-1.5"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              featuredBlogId: featured || null,
              topArticleBlogIds: topRail,
            })
          }
        >
          <Save className="h-4 w-4" /> Save curation
        </Button>
      </div>

      {/* ── Hero ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Featured hero</CardTitle>
          <CardDescription>The lead article on the editorial landing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Hero article</Label>
          <Select
            value={featured || NONE}
            onValueChange={(v) => setFeatured(v === NONE ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[28rem]">
              <SelectValue placeholder="Auto (highest priority)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Auto (highest priority / most recent)</SelectItem>
              {posts.map((p) => (
                <SelectItem key={p.blogId} value={p.blogId}>
                  {p.title || p.blogId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── Top rail ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Top articles rail</CardTitle>
          <CardDescription>Ordered list shown beside the hero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topRail.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pinned articles — the rail auto-fills.</p>
          ) : (
            <ol className="space-y-2">
              {topRail.map((id, i) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-md ring-1 ring-foreground/10 px-3 py-2"
                >
                  <span className="w-5 text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{title(id)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={i === topRail.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove"
                    onClick={() => setTopRail((rail) => rail.filter((x) => x !== id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ol>
          )}

          <Select
            value={ADD}
            onValueChange={(v) => {
              if (v !== ADD) setTopRail((rail) => [...rail, v])
            }}
          >
            <SelectTrigger className="w-full sm:w-[28rem]">
              <SelectValue placeholder="Add an article to the rail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADD} disabled>
                Add an article…
              </SelectItem>
              {available.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  No more published articles
                </SelectItem>
              ) : (
                available.map((p) => (
                  <SelectItem key={p.blogId} value={p.blogId}>
                    {p.title || p.blogId}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
