"use client"

/**
 * ContentPickerDialog — choose and order the articles a campaign attaches (Phase 6, requirement 8).
 *
 * See `docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md` §8.1.
 *
 * ── Two panes, because picking and ordering are different tasks ───────────────
 * The left pane searches everything publishable; the right pane is the campaign's selection, in the
 * order it will render. A single list with checkboxes cannot express order, and order is not
 * cosmetic here: one attached article renders as a full-width hero card and two or more render as
 * stacked rows, so the first item is the one that gets the space.
 *
 * ── The dialog holds a draft of the selection, not the selection ──────────────
 * Changes are applied on Done and discarded on Cancel. Editing the parent's state live would mean a
 * cancelled dialog had already changed the campaign — and this is a screen where the difference
 * between "what I chose" and "what will be sent" has to stay visible.
 *
 * ── Only PUBLISHED + PUBLIC posts can appear ─────────────────────────────────
 * That is enforced by the endpoint, not here. This component deliberately has no status filter to
 * offer: emailing a link to a draft or an authenticated-only post is a content leak that lands in
 * thousands of inboxes at once, and a client-side rule cannot prevent it.
 */

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Check, ExternalLink, Loader2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLeadMailContentPosts } from "../api/lead-mail.hooks"
import {
  LEAD_MAIL_BLOG_KIND,
  type LeadMailBlogKind,
  type LeadMailContentCandidate,
} from "../api/lead-mail.types"
import { useDebouncedValue } from "../use-debounced-value"
import { TablePagination } from "./table-pagination"

/** Mirrors `LeadMailCampaignContentService.MAX_ATTACHMENTS` — the server rejects more with RQ-VE-447. */
export const MAX_ATTACHED_ARTICLES = 6

const PAGE_SIZE = 8

interface ContentPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Currently attached articles, in render order. */
  selected: LeadMailContentCandidate[]
  onConfirm: (selected: LeadMailContentCandidate[]) => void
}

export function ContentPickerDialog({ open, onOpenChange, selected, onConfirm }: ContentPickerDialogProps) {
  const [kind, setKind] = useState<LeadMailBlogKind>(LEAD_MAIL_BLOG_KIND.EDITORIAL)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState<LeadMailContentCandidate[]>(selected)

  const debouncedQuery = useDebouncedValue(query, 300)

  // Re-seeded from the parent every time the dialog opens, so re-opening after a Cancel shows the
  // selection that is actually attached rather than the abandoned edit.
  useEffect(() => {
    if (open) {
      setDraft(selected)
      setPage(0)
      setQuery("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A new search that leaves the page index alone would ask for page 3 of a one-page result and
  // render an empty list the operator has no way to interpret.
  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, kind])

  const { data, isLoading, isFetching } = useLeadMailContentPosts(
    page,
    PAGE_SIZE,
    kind,
    debouncedQuery || undefined,
    { enabled: open },
  )

  const selectedIds = useMemo(() => new Set(draft.map((item) => item.blogId)), [draft])
  const atCapacity = draft.length >= MAX_ATTACHED_ARTICLES

  const add = (post: LeadMailContentCandidate) => {
    if (selectedIds.has(post.blogId) || atCapacity) return
    setDraft((current) => [...current, post])
  }

  const remove = (blogId: string) => {
    setDraft((current) => current.filter((item) => item.blogId !== blogId))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draft.length) return
    setDraft((current) => {
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const posts = data?.content ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach articles</DialogTitle>
          <DialogDescription>
            Only published, public articles can be emailed. The order below is the order they appear
            in — with one article the card runs full width, with two or more they stack.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[1fr_320px]">
          {/* ── Browse ──────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <Tabs value={kind} onValueChange={(value) => setKind(value as LeadMailBlogKind)}>
              <TabsList>
                <TabsTrigger value={LEAD_MAIL_BLOG_KIND.EDITORIAL}>Editorial</TabsTrigger>
                <TabsTrigger value={LEAD_MAIL_BLOG_KIND.COMMUNITY}>Community blogs</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by title…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No published, public {kind === LEAD_MAIL_BLOG_KIND.EDITORIAL ? "editorials" : "community blogs"}
                {debouncedQuery ? ` match “${debouncedQuery}”` : ""}.
              </p>
            ) : (
              <ul className="space-y-2">
                {posts.map((post) => {
                  const isSelected = selectedIds.has(post.blogId)
                  return (
                    <li
                      key={post.blogId}
                      className="flex items-start gap-3 rounded-md border p-2.5 text-sm"
                    >
                      <CoverThumb post={post} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{post.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {post.authorName ?? "Unknown author"}
                          {post.readingTimeMinutes ? ` · ${post.readingTimeMinutes} min read` : ""}
                        </p>
                        <a
                          href={post.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View live <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "secondary" : "outline"}
                        disabled={isSelected || atCapacity}
                        onClick={() => add(post)}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}

            {data && data.totalPages > 1 && (
              <TablePagination
                page={page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                pageSize={PAGE_SIZE}
                isLoading={isFetching}
                itemLabel="articles"
                onPageChange={setPage}
              />
            )}
          </div>

          {/* ── Selection, in render order ──────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">In this email</p>
              <p className="text-xs text-muted-foreground">
                {draft.length} of {MAX_ATTACHED_ARTICLES}
              </p>
            </div>

            {draft.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Nothing attached yet. Articles you add appear here in the order they will render.
              </p>
            ) : (
              <ol className="space-y-2">
                {draft.map((item, index) => (
                  <li key={item.blogId} className="rounded-md border p-2.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                        {index + 1}
                      </span>
                      <p className="min-w-0 flex-1 text-xs font-medium leading-snug">{item.title}</p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => remove(item.blogId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-1.5 flex gap-1 pl-7">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        aria-label={`Move ${item.title} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        aria-label={`Move ${item.title} down`}
                        disabled={index === draft.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {atCapacity && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {MAX_ATTACHED_ARTICLES} is the maximum. Past that an email stops being read and starts
                being scrolled past.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(draft)
              onOpenChange(false)
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Cover thumbnail, or the brand block when the post has no uploaded cover.
 *
 * Mirrors what the email itself does. A post with no cover renders the brand mark on blue in the
 * sent email, so showing a grey placeholder here — or nothing — would misrepresent the thing the
 * operator is about to approve.
 */
function CoverThumb({ post, size }: { post: LeadMailContentCandidate; size: number }) {
  if (post.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.coverUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded bg-[#006fee] text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      RQ
    </div>
  )
}
