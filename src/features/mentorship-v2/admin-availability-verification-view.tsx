"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 1 AVAILABILITY VERIFICATION ──────────────────────
 *
 * The surface that turns "the availability engine works" into something a human
 * can confirm. Four panels, each mapping to a stated Phase 1 exit criterion:
 *
 *   1. Mentors — every mentor with a V2 calendar, with health numbers, so a
 *      broken calendar is visible without impersonating anyone.
 *   2. Engine inspector — run the real engine for any mentor/duration/date range
 *      and read the step-by-step trace. Change the duration between 45, 60 and 90
 *      to see different bookable starts from one unchanged rule set; point it at a
 *      DST week to check the expansion.
 *   3. Double-booking proof — create a MANUAL busy interval twice over the same
 *      range. The second attempt must fail with 409 RQ-VE-338 from the Postgres
 *      `EXCLUDE USING gist` constraint. Then re-run the inspector and watch the
 *      affected starts disappear.
 *   4. Google round trip — create an event with a Meet link, patch its time,
 *      delete it, all within the `calendar.events.owned` scope.
 *
 * Plus an audit feed, because availability is computed: when someone says "that
 * slot was open", the configuration history is the only evidence there is.
 */

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarSearch,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAvailabilityAudit,
  useAvailabilityMentors,
  useBookedIntervals,
  useCreateManualInterval,
  useGoogleCalendarRoundTrip,
  useInspectAvailability,
  useReleaseInterval,
} from "./api/availability.hooks"
import type { GoogleCalendarRoundTripResponse, TraceSpan } from "./api/availability.types"

const DURATIONS = [15, 30, 45, 60, 75, 90]

function isoDate(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

/** UTC instants are rendered with the zone shown, so a reader is never guessing. */
function fmt(instant?: string | null): string {
  if (!instant) return "—"
  return new Date(instant).toISOString().replace("T", " ").slice(0, 16) + " UTC"
}

function SpanList({ spans, emptyLabel }: { spans: TraceSpan[]; emptyLabel: string }) {
  if (spans.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-1">
      {spans.slice(0, 12).map((span) => (
        <li key={`${span.start}-${span.end}`} className="font-mono text-xs">
          {fmt(span.start)} → {fmt(span.end)}{" "}
          <span className="text-muted-foreground">({span.minutes}m)</span>
        </li>
      ))}
      {spans.length > 12 ? (
        <li className="text-xs text-muted-foreground">+{spans.length - 12} more</li>
      ) : null}
    </ul>
  )
}

export default function AdminAvailabilityVerificationView() {
  const [mentor, setMentor] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [from, setFrom] = useState(() => isoDate(0))
  const [to, setTo] = useState(() => isoDate(13))

  const mentorsQuery = useAvailabilityMentors()
  const inspectQuery = useInspectAvailability(mentor, durationMinutes, from, to)
  const intervalsQuery = useBookedIntervals(mentor)
  const auditQuery = useAvailabilityAudit(mentor.trim() === "" ? undefined : mentor, 25)

  const createInterval = useCreateManualInterval(mentor)
  const releaseInterval = useReleaseInterval(mentor)
  const roundTrip = useGoogleCalendarRoundTrip(mentor)

  const [intervalStart, setIntervalStart] = useState("")
  const [intervalEnd, setIntervalEnd] = useState("")
  const [roundTripResult, setRoundTripResult] = useState<GoogleCalendarRoundTripResponse | null>(null)

  const trace = inspectQuery.data?.trace ?? null
  const mentorChosen = mentor.trim().length > 0

  const mentorsNeedingAttention = useMemo(
    () => (mentorsQuery.data ?? []).filter((m) => m.needsAttention).length,
    [mentorsQuery.data],
  )

  function handleCreateInterval() {
    if (!intervalStart || !intervalEnd) return
    createInterval.mutate({
      startsAt: new Date(intervalStart).toISOString(),
      endsAt: new Date(intervalEnd).toISOString(),
      status: "ACTIVE",
      note: "Admin verification — exclusion constraint test",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mentorship V2 — Availability (Phase 1)</h1>
        <p className="text-sm text-muted-foreground">
          Verification tools for the availability engine: run it for any mentor, read the step-by-step
          trace, prove the database rejects double-bookings, and round-trip a Google Calendar event.
        </p>
      </div>

      {/* ── 1. Mentors ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Mentors with a V2 calendar</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {mentorsQuery.data ? (
                <Badge variant={mentorsNeedingAttention > 0 ? "destructive" : "secondary"}>
                  {mentorsNeedingAttention} need attention
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void mentorsQuery.refetch()}
                disabled={mentorsQuery.isFetching}
              >
                {mentorsQuery.isFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Click a row to load that mentor into the inspector below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mentorsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (mentorsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mentor has saved a V2 availability configuration yet. Open{" "}
              <span className="font-mono">/dashboard/mentor/calendar</span> in the main app and save a
              schedule, then refresh this list.
            </p>
          ) : (
            <div className="space-y-2">
              {(mentorsQuery.data ?? []).map((summary) => (
                <button
                  key={summary.mentorUserId}
                  type="button"
                  onClick={() => setMentor(summary.mentorUserId)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-left hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {summary.name ?? summary.mentorUserId}{" "}
                      {summary.username ? (
                        <span className="text-muted-foreground">@{summary.username}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.mentorUserId} · {summary.timezone} · {summary.enabledRuleCount} rule(s) ·{" "}
                      {summary.blockCount} block(s) · {summary.blockingIntervalCount} busy interval(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={summary.active ? "default" : "secondary"}>
                      {summary.active ? "Live" : "Paused"}
                    </Badge>
                    <Badge variant="outline">
                      {summary.bookableStartsNext7Days} starts / 7d
                    </Badge>
                    <Badge variant={summary.needsAttention ? "destructive" : "outline"}>
                      {summary.bookableHoursNext14Days}h / 14d
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Engine inspector ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <CalendarSearch className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Engine inspector</CardTitle>
          </div>
          <CardDescription>
            Runs the real AvailabilityEngine, uncached, and shows what survived each of the six steps.
            Vary the duration to confirm 45 / 60 / 90-minute services see different starts from the
            same rules; set the dates to a DST week in the mentor&apos;s timezone to check the
            expansion.
          </CardDescription>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="inspect-mentor">Mentor (userId or username)</Label>
              <Input
                id="inspect-mentor"
                value={mentor}
                onChange={(event) => setMentor(event.target.value)}
                placeholder="USR0001 or rohitparihar"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Duration</Label>
              <Select
                value={String(durationMinutes)}
                onValueChange={(value) => setDurationMinutes(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inspect-from">From</Label>
              <Input
                id="inspect-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inspect-to">To</Label>
              <Input
                id="inspect-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void inspectQuery.refetch()}
            disabled={!mentorChosen || inspectQuery.isFetching}
          >
            {inspectQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run engine
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {!mentorChosen ? (
            <p className="text-sm text-muted-foreground">Choose a mentor to run the engine.</p>
          ) : inspectQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : inspectQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Engine call failed</AlertTitle>
              <AlertDescription>
                Check the mentor identifier, that the duration is 15–90, and that the range is 120 days
                or fewer.
              </AlertDescription>
            </Alert>
          ) : inspectQuery.data ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold">{inspectQuery.data.totalStarts}</span>
                <span className="text-sm text-muted-foreground">
                  bookable {inspectQuery.data.durationMinutes}-minute start(s) between {from} and {to}
                </span>
                {inspectQuery.data.unavailableReason ? (
                  <Badge variant="destructive">{inspectQuery.data.unavailableReason}</Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Mentor tz: {inspectQuery.data.mentorTimezone}</span>
                <span>Notice: {inspectQuery.data.noticePeriodMinutes}m</span>
                <span>Window: {inspectQuery.data.bookingPeriodDays}d</span>
                <span>
                  Buffers: {inspectQuery.data.bufferBeforeMinutes}/{inspectQuery.data.bufferAfterMinutes}
                </span>
                <span>Granularity: {inspectQuery.data.slotGranularityMinutes}m</span>
                <span>Cache: {inspectQuery.data.cacheHit ? "hit" : "bypassed (explain mode)"}</span>
              </div>

              {trace ? (
                <div className="space-y-3 rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">Step trace</p>

                  <div>
                    <p className="text-xs font-medium">1 · Window</p>
                    <p className="font-mono text-xs">
                      {fmt(trace.windowStart)} → {fmt(trace.windowEnd)}
                    </p>
                    {trace.windowExplanation ? (
                      <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                        {trace.windowExplanation}
                      </p>
                    ) : null}
                  </div>

                  <Separator />
                  <div>
                    <p className="text-xs font-medium">
                      2 · Expand rules — {trace.enabledRuleCount} enabled rule(s) →{" "}
                      {trace.expandedRuleIntervalCount} interval(s)
                    </p>
                    <SpanList spans={trace.afterRuleExpansion} emptyLabel="No free time after expansion." />
                  </div>

                  <Separator />
                  <div>
                    <p className="text-xs font-medium">
                      3 · Subtract blocks — {trace.blockCount} block row(s)
                    </p>
                    <SpanList
                      spans={trace.afterBlockSubtraction}
                      emptyLabel="Everything was blocked out."
                    />
                  </div>

                  <Separator />
                  <div>
                    <p className="text-xs font-medium">
                      4 · Subtract busy — {trace.busyIntervalCount} HELD/ACTIVE interval(s), inflated by
                      buffers
                    </p>
                    <SpanList
                      spans={trace.afterBusySubtraction}
                      emptyLabel="No free time left after existing bookings."
                    />
                  </div>

                  <Separator />
                  <div>
                    <p className="text-xs font-medium">
                      5 · Slice → {trace.candidateStartsBeforeCaps} candidate start(s)
                    </p>
                    <p className="text-xs font-medium">
                      6 · Apply caps → {trace.candidateStartsAfterCaps} start(s)
                    </p>
                    {trace.capsApplied.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {trace.capsApplied.map((entry) => (
                          <li key={entry} className="text-xs text-muted-foreground">
                            {entry}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No caps configured or none fired.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {inspectQuery.data.startsByDate.length > 0 ? (
                <div className="space-y-2">
                  {inspectQuery.data.startsByDate.map((day) => (
                    <div key={day.date}>
                      <p className="text-sm font-medium">
                        {day.date} <span className="text-muted-foreground">({day.count})</span>
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {day.starts
                          .slice(0, 20)
                          .map((start) => new Date(start).toISOString().slice(11, 16))
                          .join("  ")}
                        {day.starts.length > 20 ? `  +${day.starts.length - 20}` : ""}{" "}
                        <span className="not-italic">UTC</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* ── 3. Double-booking proof ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Double-booking proof</CardTitle>
          </div>
          <CardDescription>
            Create a busy interval, then submit the <em>same</em> range again. The second attempt must
            fail with <span className="font-mono">409 RQ-VE-338</span> — that is the Postgres
            <span className="font-mono"> EXCLUDE USING gist</span> constraint rejecting the overlap at
            the storage layer. Re-run the inspector afterwards and the affected starts will be gone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="interval-start">Starts at (your local time)</Label>
              <Input
                id="interval-start"
                type="datetime-local"
                value={intervalStart}
                onChange={(event) => setIntervalStart(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="interval-end">Ends at</Label>
              <Input
                id="interval-end"
                type="datetime-local"
                value={intervalEnd}
                onChange={(event) => setIntervalEnd(event.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreateInterval}
            disabled={!mentorChosen || !intervalStart || !intervalEnd || createInterval.isPending}
          >
            {createInterval.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Create busy interval
          </Button>

          {intervalsQuery.data && intervalsQuery.data.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent intervals</p>
              {intervalsQuery.data.map((interval) => (
                <div
                  key={interval.intervalId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="font-mono text-xs">
                      {fmt(interval.startsAt)} → {fmt(interval.endsAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interval.intervalId} · {interval.source}
                      {interval.note ? ` · ${interval.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        interval.status === "RELEASED"
                          ? "secondary"
                          : interval.status === "ACTIVE"
                            ? "default"
                            : "outline"
                      }
                    >
                      {interval.status}
                    </Badge>
                    {interval.status !== "RELEASED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => releaseInterval.mutate(interval.intervalId)}
                        disabled={releaseInterval.isPending}
                      >
                        Release
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : mentorChosen ? (
            <p className="text-sm text-muted-foreground">No intervals for this mentor yet.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* ── 4. Google round trip ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Google Calendar round trip</CardTitle>
          </div>
          <CardDescription>
            Creates an event ~7 days out with a Google Meet link, patches its start time, then deletes
            it — using only the <span className="font-mono">calendar.events.owned</span> scope. Nothing
            is left on the mentor&apos;s calendar. Requires the mentor to have connected Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={() =>
              roundTrip.mutate(undefined, {
                onSuccess: (data) => setRoundTripResult(data),
              })
            }
            disabled={!mentorChosen || roundTrip.isPending}
          >
            {roundTrip.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run round trip
          </Button>

          {roundTripResult ? (
            <Alert variant={roundTripResult.success ? "default" : "destructive"}>
              {roundTripResult.success ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              <AlertTitle>
                {roundTripResult.success ? "Round trip passed" : "Round trip did not complete"}
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-1 space-y-0.5">
                  {roundTripResult.steps.map((step) => (
                    <li key={step} className="text-xs">
                      {step}
                    </li>
                  ))}
                </ul>
                {roundTripResult.meetingUrl ? (
                  <p className="mt-2 break-all font-mono text-xs">{roundTripResult.meetingUrl}</p>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Audit feed ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Calendar mutation audit</CardTitle>
          </div>
          <CardDescription>
            Every rule, block, preference and interval change — newest first. Filtered to the selected
            mentor, or platform-wide when no mentor is chosen. This is the evidence trail for &quot;that
            slot was open&quot; disputes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (auditQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No calendar mutations recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(auditQuery.data ?? []).map((row) => (
                <div key={row.auditId} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{row.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {row.entityType}
                        {row.entityId ? ` · ${row.entityId}` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmt(row.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    mentor {row.mentorUserId}
                    {row.actorUserId && row.actorUserId !== row.mentorUserId
                      ? ` · by ${row.actorUserId}`
                      : ""}
                  </p>
                  {row.afterState ? (
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/50 p-2 text-[11px]">
                      {JSON.stringify(row.afterState, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
