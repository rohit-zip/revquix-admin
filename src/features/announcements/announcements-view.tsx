"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Loader2, Plus, Radio } from "lucide-react"

import { cn } from "@/lib/utils"
import { toEditorErrors } from "@/lib/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { AnnouncementEditor } from "./announcement-editor"
import {
  useAnnouncement,
  useAnnouncements,
  useArchiveAnnouncement,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePauseAnnouncement,
  usePublishAnnouncement,
  useResumeAnnouncement,
  useSuppressAnnouncement,
  useUnsuppressAnnouncement,
  useUpdateAnnouncement,
} from "./api/announcement.hooks"
import type {
  AdminAnnouncement,
  AnnouncementScopeFilter,
  AnnouncementStatus,
} from "./api/announcement.types"

/**
 * ─── ANNOUNCEMENTS CONSOLE ───────────────────────────────────────────────────
 *
 * List and editor for the site-wide announcement bar.
 *
 * ─── The "currently live" header is the point of the list ───────────────────
 *
 * Many announcements may be published at once — that is deliberate, so next
 * week's banner can be scheduled while this week's runs — and exactly one is
 * ever served. The header states which one, because "why is the wrong banner
 * showing" is the question this console will actually be opened to answer, and
 * a table sorted by creation date does not answer it.
 */

const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  LIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  PAUSED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  EXPIRED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
}

const STATUS_FILTERS: { value: AnnouncementStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "LIVE", label: "Live" },
  { value: "PAUSED", label: "Paused" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ARCHIVED", label: "Archived" },
]

const SCOPE_FILTERS: { value: AnnouncementScopeFilter | "ALL"; label: string }[] = [
  { value: "ALL", label: "All scopes" },
  { value: "PLATFORM", label: "Platform (staff)" },
  { value: "MENTOR", label: "Mentor banners" },
]

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; announcementId: string }

export function AnnouncementsView() {
  const [mode, setMode] = useState<Mode>({ kind: "list" })
  const [status, setStatus] = useState<AnnouncementStatus | "ALL">("ALL")
  const [scope, setScope] = useState<AnnouncementScopeFilter | "ALL">("ALL")
  const [page, setPage] = useState(0)

  // No surface filter: Phase 2 added modals, and an admin looking for "why is
  // the wrong thing showing" needs both surfaces in one list. The row badges
  // distinguish them.
  //
  // A SCOPE filter, however, is genuinely needed (Phase 4). Platform
  // announcements are written by staff; mentor banners are user-generated
  // content on a public page of this domain. Mixed into one feed, the question
  // this console exists to answer during a moderation review — "what have
  // mentors published lately" — has no way to be asked.
  const list = useAnnouncements({
    status: status === "ALL" ? undefined : status,
    scope: scope === "ALL" ? undefined : scope,
    page,
    size: 20,
  })

  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()

  const editing = useAnnouncement(mode.kind === "edit" ? mode.announcementId : "")

  if (mode.kind === "create") {
    return (
      <EditorShell title="New announcement" onBack={() => setMode({ kind: "list" })}>
        <AnnouncementEditor
          submitting={create.isPending}
          serverErrors={toEditorErrors(create.error)}
          onCancel={() => setMode({ kind: "list" })}
          onSubmit={(request) =>
            create.mutate(request, { onSuccess: () => setMode({ kind: "list" }) })
          }
        />
      </EditorShell>
    )
  }

  if (mode.kind === "edit") {
    if (editing.isLoading || !editing.data) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return (
      <EditorShell title={editing.data.internalName} onBack={() => setMode({ kind: "list" })}>
        <AnnouncementEditor
          existing={editing.data}
          submitting={update.isPending}
          serverErrors={toEditorErrors(update.error)}
          onCancel={() => setMode({ kind: "list" })}
          onSubmit={(request) =>
            update.mutate(
              { announcementId: editing.data!.announcementId, request },
              { onSuccess: () => setMode({ kind: "list" }) },
            )
          }
        />
      </EditorShell>
    )
  }

  const rows = list.data?.content ?? []

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            The bar above the navbar, and the modal dialog, across the site.
          </p>
        </div>
        <Button onClick={() => setMode({ kind: "create" })}>
          <Plus className="mr-1.5 size-4" />
          New announcement
        </Button>
      </header>

      <LiveNow rows={rows} />

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as AnnouncementStatus | "ALL")
            setPage(0)
          }}
        >
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scope}
          onValueChange={(value) => {
            setScope(value as AnnouncementScopeFilter | "ALL")
            setPage(0)
          }}
        >
          <SelectTrigger className="h-9 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <AnnouncementRow
              key={row.announcementId}
              row={row}
              onEdit={() => setMode({ kind: "edit", announcementId: row.announcementId })}
            />
          ))}
        </div>
      )}

      {list.data && list.data.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {list.data.number + 1} of {list.data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={list.data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={list.data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * States which announcement a visitor would see right now.
 *
 * Resolved on the client from the rows already loaded, using the same rule the server applies —
 * highest priority, then latest start, then id. That duplication is deliberate rather than a
 * second API call: this is a hint on a page an admin is already looking at, and it costs nothing.
 * If it ever disagrees with the site, the site is right and this rule has drifted.
 */
function LiveNow({ rows }: { rows: AdminAnnouncement[] }) {
  // Sampled through an external store rather than read during render. `Date.now()`
  // in a render body is impure — two renders a millisecond apart disagree — and
  // React Compiler rejects it. Quantising to the tick interval makes the snapshot
  // stable between ticks, which `useSyncExternalStore` requires.
  //
  // It genuinely needs to update: this line answers "what are visitors seeing
  // right now", and an announcement can start or end while the console sits open.
  const now = useNow(30_000)

  const winner = useMemo(() => {
    if (!now) return null
    return (
      rows
        .filter(
          (row) =>
            // Bars only. Exactly one bar is ever served, so "what are visitors
            // seeing" has a single answer for that surface. Modals are a per-
            // visitor queue gated on what each person has already been shown, so
            // there is no one modal this could name.
            row.surface === "BAR" &&
            (row.status === "LIVE" || row.status === "SCHEDULED") &&
            new Date(row.startsAt).getTime() <= now &&
            (!row.endsAt || new Date(row.endsAt).getTime() > now),
        )
        .sort(
          (a, b) =>
            b.priority - a.priority ||
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime() ||
            a.announcementId.localeCompare(b.announcementId),
        )[0] ?? null
    )
  }, [rows, now])

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
        winner ? "border-emerald-500/30 bg-emerald-500/5" : "bg-muted/30",
      )}
    >
      <Radio
        className={cn("size-4 shrink-0", winner ? "text-emerald-600" : "text-muted-foreground")}
        aria-hidden="true"
      />
      {winner ? (
        <p>
          Visitors are seeing <strong>{winner.internalName}</strong>{" "}
          <span className="text-muted-foreground">
            (priority {winner.priority}) — audience-targeted announcements may differ per visitor.
          </span>
        </p>
      ) : (
        <p className="text-muted-foreground">No announcement is being shown right now.</p>
      )}
    </div>
  )
}

function AnnouncementRow({ row, onEdit }: { row: AdminAnnouncement; onEdit: () => void }) {
  const publish = usePublishAnnouncement()
  const pause = usePauseAnnouncement()
  const resume = useResumeAnnouncement()
  const archive = useArchiveAnnouncement()
  const remove = useDeleteAnnouncement()
  const suppress = useSuppressAnnouncement()
  const unsuppress = useUnsuppressAnnouncement()

  const busy =
    publish.isPending || pause.isPending || resume.isPending || archive.isPending ||
    remove.isPending || suppress.isPending || unsuppress.isPending

  const isMentor = row.scope === "MENTOR"
  const suppressed = row.moderationStatus === "SUPPRESSED"

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border-0", STATUS_STYLES[row.status])}>{row.status}</Badge>
          <Badge variant="outline" className="text-[10px]">{row.surface}</Badge>
          {/* Mentor rows are marked because the whole point of the scope filter
              is that these two kinds of row need different scrutiny — one is
              staff copy, the other is user-generated content on a public page. */}
          {isMentor ? (
            <Badge className="border-0 bg-violet-500/15 text-[10px] text-violet-600 dark:text-violet-400">
              MENTOR
            </Badge>
          ) : null}
          {suppressed ? (
            <Badge className="border-0 bg-red-500/15 text-[10px] text-red-600 dark:text-red-400">
              REMOVED
            </Badge>
          ) : null}
          <span className="truncate text-sm font-medium">{row.internalName}</span>
          <span className="text-[11px] text-muted-foreground">{row.category}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {row.surface === "MODAL" ? row.heading : row.message}
        </p>
        {suppressed && row.moderationNote ? (
          <p className="mt-1 truncate text-[11px] text-red-600 dark:text-red-400">
            Removed: {row.moderationNote}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4 text-xs tabular-nums text-muted-foreground">
        <Stat label="Seen" value={row.impressionCount} />
        <Stat label="People" value={row.uniqueSubjects} />
        <Stat label="CTR" value={formatRate(row.clickThroughRate)} />
        <Stat label="Dismissed" value={formatRate(row.dismissRate)} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Analytics is a link, not a button: the detail screen has its own URL so
            an admin can bookmark one announcement's numbers or paste them into a
            thread. A modal would make both impossible. Hidden for a DRAFT, which
            by definition has nothing to show and would open an empty screen. */}
        {row.status !== "DRAFT" ? (
          <Button variant="ghost" size="sm" asChild disabled={busy}>
            <Link href={`${PATH_CONSTANTS.ADMIN_ANNOUNCEMENTS}/${row.announcementId}`}>
              <BarChart3 className="size-4" aria-hidden="true" />
              <span className="sr-only">Analytics for {row.internalName}</span>
            </Link>
          </Button>
        ) : null}

        <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
          Edit
        </Button>

        {row.status === "DRAFT" || row.status === "EXPIRED" ? (
          <Button size="sm" onClick={() => publish.mutate(row.announcementId)} disabled={busy}>
            Publish
          </Button>
        ) : null}

        {row.status === "LIVE" || row.status === "SCHEDULED" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pause.mutate({ announcementId: row.announcementId })}
            disabled={busy}
          >
            Pause
          </Button>
        ) : null}

        {row.status === "PAUSED" ? (
          <Button size="sm" onClick={() => resume.mutate(row.announcementId)} disabled={busy}>
            Resume
          </Button>
        ) : null}

        {/* Suppression is offered ONLY for mentor rows, and it is not the same
            control as Pause. A mentor holds pause/resume on their own banner;
            this one they cannot undo by resuming — the only way out is to edit
            the copy, which is the point of a takedown. */}
        {isMentor ? (
          suppressed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unsuppress.mutate(row.announcementId)}
              disabled={busy}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => {
                // A prompt, deliberately. The reason is mandatory server-side and
                // is shown to the mentor verbatim, so an admin must not be able to
                // take a banner down without composing one — a takedown with no
                // explanation is one nobody can defend a week later.
                const reason = window.prompt(
                  "Why is this banner being removed? The mentor sees this message.",
                )
                if (reason && reason.trim()) {
                  suppress.mutate({ announcementId: row.announcementId, reason: reason.trim() })
                }
              }}
              disabled={busy}
            >
              Remove
            </Button>
          )
        ) : null}

        {row.status === "DRAFT" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => remove.mutate(row.announcementId)}
            disabled={busy}
          >
            Delete
          </Button>
        ) : row.status !== "ARCHIVED" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => archive.mutate(row.announcementId)}
            disabled={busy}
          >
            Archive
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="font-medium text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  )
}

/** An em dash, not "0%": a brand-new announcement is unmeasured, not unsuccessful. */
function formatRate(rate: number | null): string {
  return rate == null ? "—" : `${(rate * 100).toFixed(1)}%`
}

function EditorShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="mr-1.5 size-4" />
          Announcements
        </Button>
        <span className="text-sm font-medium">{title}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * A clock that ticks on an interval, safe to read during render.
 *
 * `getSnapshot` quantises to the interval so it returns an identical value between ticks —
 * `useSyncExternalStore` calls it on every render and would loop forever on a raw `Date.now()`.
 * The server snapshot is 0, which callers treat as "not yet known" rather than as the epoch.
 */
function useNow(intervalMs: number): number {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, intervalMs)
      return () => clearInterval(id)
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  )
}
