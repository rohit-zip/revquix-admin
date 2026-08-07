/**
 * ─── PHASE 2 OPS TYPES ────────────────────────────────────────────────────────
 *
 * Job health, the admin action audit, and reference lookup — the three surfaces that answer
 * "is the platform working", "who did that" and "where does this id live".
 */

/** One scheduled job's health. Mirrors `AdminJobHealthRow`. */
export interface JobHealthRow {
  jobName: string
  label: string

  /** The live cron from configuration, not the compiled default. */
  cron: string
  intervalMinutes: number

  lastRunAt: string | null
  lastOutcome: "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED" | null
  lastDurationMs: number | null
  lastCounters: Record<string, unknown> | null
  lastError: string | null
  lastTriggerSource: "SCHEDULED" | "MANUAL" | null

  lastSuccessAt: string | null
  minutesSinceLastSuccess: number | null

  runsLast24h: number
  failuresLast24h: number
  consecutiveFailures: number

  /**
   * No *successful* run within 3x this job's own period.
   *
   * Successful, not merely attempted — a job failing every two minutes is still broken, and a page
   * keyed on the last attempt would render it green.
   */
  stale: boolean

  /**
   * A run started and never reported back.
   *
   * Worse than stale, and a different problem: a stale job is idle, a stuck one may be holding
   * locks. This is the exact signature of the 7 Aug deadlock.
   */
  stuck: boolean

  neverRun: boolean
}

/** One execution. Mirrors the `JobRun` entity. */
export interface JobRunRow {
  runId: string
  jobName: string
  startedAt: string
  finishedAt: string | null
  outcome: "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED"
  durationMs: number | null
  counters: Record<string, unknown> | null
  error: string | null
  triggerSource: "SCHEDULED" | "MANUAL"
  triggeredBy: string | null
}

/** One row of the cross-cutting admin action audit. Mirrors `AdminAuditRow`. */
export interface AdminAuditRow {
  auditId: string
  action: string
  actionLabel: string

  actorUserId: string
  actorName: string | null

  targetType: string | null
  targetId: string | null

  reason: string | null
  detail: Record<string, unknown> | null

  succeeded: boolean
  error: string | null

  createdAt: string
}

/** Where a pasted reference lives. Mirrors `AdminReferenceLookupService.LookupResult`. */
export interface LookupResult {
  type: string | null
  id: string | null
  /** Admin-app path to navigate to. Null when nothing matched. */
  path: string | null
  message: string | null
}

/** Outcome of a bulk dispute assignment. */
export interface BulkAssignResult {
  requested: number
  assigned: string[]
  /** disputeId → why it was skipped. */
  skipped: Record<string, string>
}
