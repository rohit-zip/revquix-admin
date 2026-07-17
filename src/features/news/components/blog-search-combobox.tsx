/**
 * ─── BLOG SEARCH COMBOBOX ──────────────────────────────────────────────────
 *
 * Search-as-you-type picker for selecting an existing blog post by title or
 * slug, instead of requiring editors to already know / copy-paste the raw
 * blog id (e.g. BLG0000001). Backed by GET /editorial/posts?q= (see
 * useEditorialPosts) — the same search reused by the editorial overview list.
 *
 * Mirrors the UserSearchCombobox pattern used elsewhere in the admin app
 * (see features/offer-service/components/user-search-combobox.tsx).
 */

"use client"

import { useEffect, useState } from "react"
import { Check, FileText, Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useEditorialPosts } from "../api/news.hooks"
import type { BlogPostSummaryResponse } from "../api/news.types"
import { StatusBadge } from "../news-badges"

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300
const RESULT_LIMIT = 8

interface BlogSearchComboboxProps {
  /** Currently selected blog id (if any) — used to resolve and render the "selected" chip. */
  value: string
  onSelect: (blog: BlogPostSummaryResponse | null) => void
  placeholder?: string
  disabled?: boolean
  /** Blog ids to hide from results (e.g. already-selected keep-reading slots). */
  excludeIds?: string[]
}

export function BlogSearchCombobox({
  value,
  onSelect,
  placeholder = "Search by title or slug…",
  disabled,
  excludeIds = [],
}: BlogSearchComboboxProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return
    }
    const t = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const searchActive = query.trim().length >= MIN_QUERY_LENGTH
  const { data, isFetching } = useEditorialPosts({
    page: 0,
    size: RESULT_LIMIT,
    q: searchActive && debouncedQuery ? debouncedQuery : undefined,
  })

  // Resolve the currently-selected id against the id-search fallback so the
  // "selected" chip can render a title even when the value was typed/pasted
  // directly (e.g. migrated from the old raw-id input) rather than picked
  // from search results.
  const { data: resolvedPage } = useEditorialPosts({
    page: 0,
    size: 1,
    q: value ? value : undefined,
  })
  const resolved = value
    ? resolvedPage?.content.find((p) => p.blogId === value)
    : undefined

  const results = searchActive
    ? (data?.content ?? []).filter((p) => !excludeIds.includes(p.blogId))
    : []

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {resolved?.title ?? value}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {resolved ? `/${resolved.slug}` : value}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear selected article"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            className="pl-8"
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => query.trim().length >= MIN_QUERY_LENGTH && setOpen(true)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-h-72 overflow-y-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isFetching && (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching…
          </div>
        )}
        {!isFetching && !searchActive && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Type at least {MIN_QUERY_LENGTH} characters to search by title or slug…
          </p>
        )}
        {!isFetching && searchActive && results.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No matching articles found.
          </p>
        )}
        {!isFetching &&
          results.map((post) => (
            <button
              key={post.blogId}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(post)
                setOpen(false)
                setQuery("")
              }}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{post.title || post.blogId}</p>
                <p className="truncate text-xs text-muted-foreground">/{post.slug}</p>
              </div>
              <StatusBadge status={post.status} />
              <Check className="h-3.5 w-3.5 shrink-0 opacity-0" />
            </button>
          ))}
      </PopoverContent>
    </Popover>
  )
}
