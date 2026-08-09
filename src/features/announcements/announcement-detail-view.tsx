"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { ArrowLeft, Download, ExternalLink, Eye, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { AnnouncementSparkline } from "./announcement-sparkline"
import {
  useAnnouncement,
  useAnnouncementInteractions,
  useAnnouncementStats,
  useDownloadAnnouncementInteractionsCsv,
  useMintAnnouncementPreview,
} from "./api/announcement.hooks"
import type { AnnouncementStats } from "./api/announcement.types"

/**
 * ─── ANNOUNCEMENT DETAIL / ANALYTICS ─────────────────────────────────────────
 *
 * Phase 3, plan §10.2: counters, a 30-day series, the interaction table and CSV.
 *
 * ─── ⚠ Two kinds of number share this screen, and the UI has to say which ───
 *
 * The tiles and the chart are NOT the same measurement, and presenting them as
 * though they were is the failure mode this layout is built to avoid:
 *
 *   • `newSubjects`, `clicks`, `dismissals` are EXACT — counted from the
 *     interaction ledger, each off a single timestamp, reproducible by a re-run.
 *   • `impressions` is a DIFFERENCE between two nightly cumulative snapshots. It
 *     is unknowable on the first day of a series and after any night the rollup
 *     did not run, and it arrives as `null` on those days.
 *
 * So the impressions tile is labelled as a lower bound whenever the window
 * contains a gap, and the sparkline breaks its line rather than drawing through
 * one. A chart that interpolated across a gap would show a launch day as a flat
 * zero — on the day the announcement almost certainly did best — with nothing
 * about it looking wrong.
 *
 * ─── Why the window is a select rather than a date picker ───────────────────
 *
 * There is one question this screen answers ("is this still working?") and three
 * windows worth asking it over. A free date range would let an admin land on a
 * window with no rollup rows and conclude the feature is broken.
 */

const WINDOWS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const

export function AnnouncementDetailView({ announcementId }: { announcementId: string }) {
  const router = useRouter()
  const [days, setDays] = useState<string>("30")
  const [page, setPage] = useState(0)

  const { data: announcement, isLoading, isError } = useAnnouncement(announcementId)
  const { data: stats, isLoading: statsLoading } = useAnnouncementStats(
    announcementId,
    Number(days),
  )
  const { data: interactions, isLoading: interactionsLoading } = useAnnouncementInteractions(
    announcementId,
    page,
  )

  const mintPreview = useMintAnnouncementPreview()
  const downloadCsv = useDownloadAnnouncementInteractionsCsv()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !announcement) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">That announcement no longer exists.</p>
        <Link
          href={PATH_CONSTANTS.ADMIN_ANNOUNCEMENTS}
          className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-4"
        >
          Back to announcements
        </Link>
      </div>
    )
  }

  const isBar = announcement.surface === "BAR"

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 h-8 gap-1.5 text-muted-foreground"
            onClick={() => router.push(PATH_CONSTANTS.ADMIN_ANNOUNCEMENTS)}
          >
            <ArrowLeft className="size-4" />
            Announcements
          </Button>
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {announcement.internalName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-[11px]">
              {announcement.announcementId}
            </Badge>
            <Badge variant="outline">{announcement.surface}</Badge>
            <Badge variant="outline">{announcement.category}</Badge>
            <Badge variant="outline">{announcement.status}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BAR only. A modal preview would need the queue, the ledger and the
              fatigue rules bypassed too, and a modal's shell is fixed by
              construction — the editor's schematic already answers what a live
              modal preview would. */}
          {isBar ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={mintPreview.isPending}
              onClick={() => mintPreview.mutate(announcementId)}
            >
              {mintPreview.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4" />
              )}
              Preview on site
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={downloadCsv.isPending}
            onClick={() =>
              downloadCsv.mutate({
                announcementId,
                fallbackFileName: `${announcementId}-interactions.csv`,
              })
            }
          >
            {downloadCsv.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Lifetime counters ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Impressions" value={announcement.impressionCount} />
        <Tile label="Unique people" value={announcement.uniqueSubjects} />
        <Tile
          label="Clicks"
          value={announcement.clickCount}
          hint={formatRate(announcement.clickThroughRate, "CTR")}
        />
        <Tile
          label="Dismissals"
          value={announcement.dismissCount}
          hint={formatRate(announcement.dismissRate, "of people")}
        />
      </div>

      {/* ── Time series ────────────────────────────────────────────────────── */}
      <section className="rounded-xl border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Daily activity</h2>
            <p className="text-xs text-muted-foreground">
              Rolled up nightly. Dates are UTC days, rendered here as-is.
            </p>
          </div>
          <Select value={days} onValueChange={(next) => setDays(next)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((window) => (
                <SelectItem key={window.value} value={window.value}>
                  {window.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {statsLoading ? (
          <div className="flex h-30 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <StatsBody stats={stats} />
        )}
      </section>

      {/* ── Interaction table ──────────────────────────────────────────────── */}
      <section className="rounded-xl border">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Who saw it</h2>
          <p className="text-xs text-muted-foreground">
            One row per person, most recently active first. Signed-out visitors show a
            truncated marker — the full device identifier is never returned.
          </p>
        </div>

        {interactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : !interactions || interactions.content.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nobody has interacted with this announcement yet.
          </p>
        ) : (
          <>
            {/* Horizontal scroll on the table only. The page body must never
                scroll sideways, and this table has eight columns. */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">Seen</TableHead>
                    <TableHead>First seen</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead>Dismissed</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>CTA</TableHead>
                    <TableHead>Last page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.content.map((row) => (
                    <TableRow key={`${row.subjectLabel}-${row.firstSeenAt}`}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {row.userId ? (
                          // Links to the user console — the reason a user id is
                          // returned in full while an anonymous one is not.
                          <Link
                            href={`${PATH_CONSTANTS.ADMIN_USERS}/${row.userId}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {row.userId}
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{row.subjectLabel}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.seenCount}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.firstSeenAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.lastSeenAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.dismissedAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.clickedAt)}
                      </TableCell>
                      <TableCell className="text-xs">{row.clickedCta ?? "—"}</TableCell>
                      <TableCell className="max-w-50 truncate text-xs text-muted-foreground">
                        {row.lastSurfacePath ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {interactions.totalElements.toLocaleString()} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={interactions.first}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={interactions.last}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

/**
 * The chart plus its window totals.
 *
 * `impressionsPartial` is surfaced rather than swallowed. When the window
 * contains an unmeasurable day the sum under-reports, and an admin comparing it
 * against the lifetime counter above would otherwise conclude the numbers were
 * simply wrong.
 */
function StatsBody({ stats }: { stats: AnnouncementStats | undefined }) {
  if (!stats || stats.points.length === 0) {
    return (
      <div className="flex h-30 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        No rollup rows in this window yet. The nightly job writes yesterday&apos;s numbers.
      </div>
    )
  }

  const gaps = stats.points.filter((point) => point.impressions == null).length

  return (
    <div className="flex flex-col gap-4">
      <div className="text-primary">
        <AnnouncementSparkline
          points={stats.points}
          metric="impressions"
          ariaLabel={`Daily impressions from ${stats.from} to ${stats.to}`}
        />
      </div>

      {gaps > 0 ? (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          {gaps === 1 ? "One day in this window has" : `${gaps} days in this window have`} no
          measurable impression figure — a day&apos;s impressions is the difference between two
          nightly snapshots, and the first day of a series (or a night the rollup missed) has
          nothing to compare against. The line breaks there rather than reading as zero.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Impressions"
          value={stats.totals.impressions}
          hint={stats.totals.impressionsPartial ? "at least — window has gaps" : undefined}
        />
        <Tile label="New people" value={stats.totals.newSubjects} />
        <Tile label="Clicks" value={stats.totals.clicks} />
        <Tile label="Dismissals" value={stats.totals.dismissals} />
      </div>
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/**
 * An em dash for a rate that does not exist yet.
 *
 * A brand-new announcement has no impressions, and "0%" reads as a failed
 * campaign rather than an unmeasured one. The backend returns null for exactly
 * this reason; the console must not helpfully turn it into a zero.
 */
function formatRate(rate: number | null, suffix: string): string | undefined {
  if (rate == null) return undefined
  return `${(rate * 100).toFixed(1)}% ${suffix}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso))
}
