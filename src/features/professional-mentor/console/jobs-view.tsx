"use client"

/**
 * ─── JOBS ─────────────────────────────────────────────────────────────────────
 *
 * Every scheduled job in the subsystem, its schedule, and whether it is actually running.
 *
 * <h3>Why this page exists</h3>
 * Twelve `@Scheduled` methods drive Professional Mentor — the booking lifecycle every two minutes,
 * dispute SLA every five, checkout expiry, reconciliation, FX, packages. Until `mentorship.job_run`
 * existed, none of them left a durable trace, so "did the sweep run?" could only be answered by
 * reading the application log or noticing a stuck row downstream.
 *
 * On 7 Aug 2026 that cost a day. The feedback-breach stage wedged on a cross-connection deadlock: it
 * logged a complete breach — status transition, payout hold, dispute opened — committed none of it,
 * and then held its connection open, blocking eight further sessions including three mentors trying
 * to submit feedback. It was found because somebody noticed one odd booking.
 *
 * <h3>The two red states are different problems</h3>
 * **Stale** — no *successful* run within 3× the job's own period. The job is idle.
 * **Stuck** — a run started and never reported back. The job may be holding locks right now. That
 * is the deadlock's exact signature, and it is why the two are not collapsed into one "unhealthy".
 */

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  SkipForward,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import { getJobHealth, getJobRuns, runJob } from "@/features/mentorship-v2/api/ops.api"
import type { JobHealthRow } from "@/features/mentorship-v2/api/ops.types"
import { formatWhen } from "./console-format"

export default function JobsView() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const jobs = useQuery({
    queryKey: ["pm-job-health"],
    queryFn: getJobHealth,
    // Short, because this is the page you keep open during an incident.
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const trigger = useMutation({
    mutationFn: runJob,
    onSuccess: (counters, jobName) => {
      showSuccessToast(`${jobName} ran`, {
        description: Object.keys(counters ?? {}).length
          ? Object.entries(counters)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(" · ")
          : "Completed with nothing to report.",
      })
      void queryClient.invalidateQueries({ queryKey: ["pm-job-health"] })
    },
    onError: (error: Error) => showErrorToast(error),
  })

  const unhealthy = useMemo(
    () => (jobs.data ?? []).filter((job) => job.stale || job.stuck),
    [jobs.data],
  )
  const stuck = useMemo(() => (jobs.data ?? []).filter((job) => job.stuck), [jobs.data])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Scheduled jobs</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Every job that runs this subsystem, and whether it is actually running. A job is{" "}
            <strong>stale</strong> when it has had no successful run in three times its own period,
            and <strong>stuck</strong> when a run started and never reported back — the second is
            worse, because a stuck run may still be holding database locks.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void jobs.refetch()}
          disabled={jobs.isFetching}
        >
          {jobs.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {stuck.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            {stuck.length} job{stuck.length === 1 ? " has" : "s have"} a run that never finished
          </AlertTitle>
          <AlertDescription className="text-xs">
            A run that started and never reported back is not merely idle — the thread may still be
            inside a transaction, holding locks that block other work. Check{" "}
            <code className="rounded bg-background/60 px-1">pg_stat_activity</code> for{" "}
            <code className="rounded bg-background/60 px-1">idle in transaction</code> before
            assuming the business logic is at fault.
          </AlertDescription>
        </Alert>
      ) : unhealthy.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            {unhealthy.length} job{unhealthy.length === 1 ? " has" : "s have"} had no successful run
            recently
          </AlertTitle>
          <AlertDescription className="text-xs">
            Payout releases, dispute escalation and reservation expiry all depend on these. Run one
            by hand to see the error, then check whether the scheduler is alive at all.
          </AlertDescription>
        </Alert>
      ) : jobs.data && jobs.data.length > 0 ? (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="size-4" /> Every job has run successfully within its own schedule.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All jobs</CardTitle>
          <CardDescription>
            Click a row for its recent run history. Running a job by hand is recorded as a manual run
            so it cannot mask a dead scheduler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Loading…
            </p>
          ) : jobs.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not load job health. The <code>mentorship.job_run</code> table may not be
                migrated yet — restart the app against a database with V249 applied.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last run</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="hidden lg:table-cell">Last success</TableHead>
                    <TableHead className="hidden lg:table-cell">24h</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jobs.data ?? []).map((job) => (
                    <JobRowGroup
                      key={job.jobName}
                      job={job}
                      expanded={expanded === job.jobName}
                      onToggle={() =>
                        setExpanded((prev) => (prev === job.jobName ? null : job.jobName))
                      }
                      onRun={() => trigger.mutate(job.jobName)}
                      running={trigger.isPending && trigger.variables === job.jobName}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function JobRowGroup({
  job,
  expanded,
  onToggle,
  onRun,
  running,
}: {
  job: JobHealthRow
  expanded: boolean
  onToggle: () => void
  onRun: () => void
  running: boolean
}) {
  return (
    <>
      <TableRow
        className={
          job.stuck
            ? "cursor-pointer bg-destructive/10"
            : job.stale
              ? "cursor-pointer bg-amber-500/10"
              : "cursor-pointer"
        }
        onClick={onToggle}
      >
        <TableCell>
          <p className="text-sm font-medium">{job.label}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{job.jobName}</p>
        </TableCell>
        <TableCell>
          <code className="text-[10px]">{job.cron}</code>
          <p className="text-[10px] text-muted-foreground">every {formatPeriod(job.intervalMinutes)}</p>
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs">
          {job.lastRunAt ? formatWhen(job.lastRunAt) : "never"}
          {job.lastTriggerSource === "MANUAL" ? (
            <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
              manual
            </Badge>
          ) : null}
        </TableCell>
        <TableCell>
          <OutcomeBadge outcome={job.lastOutcome} durationMs={job.lastDurationMs} />
        </TableCell>
        <TableCell className="hidden whitespace-nowrap text-xs lg:table-cell">
          {job.lastSuccessAt ? formatWhen(job.lastSuccessAt) : "—"}
        </TableCell>
        <TableCell className="hidden text-xs lg:table-cell">
          {job.runsLast24h} run{job.runsLast24h === 1 ? "" : "s"}
          {job.failuresLast24h > 0 ? (
            <span className="block text-destructive">{job.failuresLast24h} failed</span>
          ) : null}
        </TableCell>
        <TableCell>
          {job.stuck ? (
            <Badge variant="destructive">stuck</Badge>
          ) : job.stale ? (
            <Badge variant="destructive">stale</Badge>
          ) : job.neverRun ? (
            <Badge variant="outline">never run</Badge>
          ) : (
            <Badge variant="secondary">healthy</Badge>
          )}
          {job.consecutiveFailures > 1 ? (
            <p className="mt-0.5 text-[10px] text-destructive">
              {job.consecutiveFailures} in a row
            </p>
          ) : null}
        </TableCell>
        <TableCell className="text-right">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              onRun()
            }}
            disabled={running}
          >
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Run
          </Button>
          <ChevronDown
            className={expanded ? "ml-1 inline size-3.5 rotate-180" : "ml-1 inline size-3.5"}
            aria-hidden="true"
          />
        </TableCell>
      </TableRow>

      {job.lastError ? (
        <TableRow className="bg-destructive/5">
          <TableCell colSpan={8} className="py-2">
            <p className="font-mono text-[11px] text-destructive">{job.lastError}</p>
          </TableCell>
        </TableRow>
      ) : null}

      {expanded ? (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <JobRunHistory jobName={job.jobName} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

function JobRunHistory({ jobName }: { jobName: string }) {
  const runs = useQuery({
    queryKey: ["pm-job-runs", jobName],
    queryFn: () => getJobRuns(jobName, 25),
    staleTime: 15_000,
  })

  if (runs.isLoading) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        <Loader2 className="mx-auto mb-1 size-3.5 animate-spin" /> Loading history…
      </p>
    )
  }
  if (!runs.data || runs.data.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">No runs recorded yet.</p>
  }

  return (
    <ol className="divide-y">
      {runs.data.map((run) => (
        <li key={run.runId} className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs">
          <OutcomeBadge outcome={run.outcome} durationMs={run.durationMs} />
          <span className="whitespace-nowrap">{formatWhen(run.startedAt)}</span>
          {run.triggerSource === "MANUAL" ? (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              manual{run.triggeredBy ? ` · ${run.triggeredBy}` : ""}
            </Badge>
          ) : null}
          {run.finishedAt === null ? (
            <span className="font-medium text-destructive">never reported back</span>
          ) : null}
          {run.counters && Object.keys(run.counters).length > 0 ? (
            <span className="text-muted-foreground">
              {Object.entries(run.counters)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" · ")}
            </span>
          ) : null}
          {run.error ? <span className="font-mono text-destructive">{run.error}</span> : null}
        </li>
      ))}
    </ol>
  )
}

function OutcomeBadge({
  outcome,
  durationMs,
}: {
  outcome: string | null
  durationMs: number | null
}) {
  if (!outcome) return <span className="text-xs text-muted-foreground">—</span>
  const duration = durationMs === null ? null : formatDuration(durationMs)
  const label = duration ? `${outcome.toLowerCase()} · ${duration}` : outcome.toLowerCase()

  switch (outcome) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-emerald-600">
          <CheckCircle2 className="size-3" aria-hidden="true" /> {label}
        </span>
      )
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-destructive">
          <XCircle className="size-3" aria-hidden="true" /> {label}
        </span>
      )
    case "SKIPPED":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
          <SkipForward className="size-3" aria-hidden="true" /> {label}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-amber-600">
          <Clock className="size-3" aria-hidden="true" /> running
        </span>
      )
  }
}

function formatPeriod(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`
  if (minutes < 10080) return `${Math.round(minutes / 1440)}d`
  return `${Math.round(minutes / 10080)}w`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m`
}
