"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 11 MIGRATION & CUTOVER VERIFICATION ───────────────
 *
 * The screen that answers one question: **may we cut over yet?**
 *
 * Six panels, each mapping to a stated Phase 11 exit criterion or mechanism:
 *
 *  1. **Stage** — which of the two booking systems is open, echoed from server config so this panel and
 *     the gate cannot disagree. Three stages rather than a boolean, because CUTOVER and DECOMMISSIONED
 *     permit different operations and conflating them is how a table gets archived while bookings are
 *     still landing in it.
 *  2. **Storefront coverage** — the exit criterion "zero mentors with an empty storefront". A mentor with
 *     no ACTIVE V2 service has nothing to sell the moment legacy booking closes, so this must reach zero
 *     before the stage moves.
 *  3. **Dual-run bridge** — the exit criterion "zero double-bookings across systems". Measured, not
 *     asserted: the double-booking list compares each system's *real* commitments (the legacy side read
 *     from the legacy tables, not from their mirrored intervals), so it reports a genuine conflict whether
 *     the bridge caught it, missed it, or never ran.
 *  4. **Revenue reconciliation** — the exit criterion "reconcile across the boundary to the paisa", with
 *     the buyer-side fee kept in its own column. A single revenue number makes the cutover look like a
 *     catastrophe followed by a windfall when per-booking platform revenue is in fact unchanged.
 *  5. **Backfill** — dry run, apply, per-mentor scope, per-mentor rollback, and the ledger that records
 *     every decision including the deliberate no-ops.
 *  6. **Decommission readiness + archive** — the exit criteria as a checklist, and the archive that
 *     copies but never drops.
 *
 * `crossSystemDoubleBookings`, `reconciliationChecks` and `invariantWarnings` are **assertions**, not
 * statistics. They must always be empty / all-passing and are rendered in red when they are not — the same
 * discipline as every prior phase's verification panel.
 */

import { useState } from "react"
import {
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Store,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  useCutoverSnapshot,
  useLedgerForMentor,
  useRollbackBackfill,
  useRunArchive,
  useRunBackfill,
} from "./api/cutover.hooks"
import type {
  AdminCutoverSnapshot,
  BackfillLedgerEntry,
  BackfillRunReport,
  DecommissionReadinessRow,
  RevenueReconciliationRow,
} from "./api/cutover.types"

function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₹"
  return symbol + (minor / 100).toLocaleString()
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  tone?: "default" | "good" | "warn" | "bad"
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "mt-0.5 text-lg font-semibold tabular-nums " +
          (tone === "good"
            ? "text-emerald-600 dark:text-emerald-500"
            : tone === "warn"
              ? "text-amber-600 dark:text-amber-500"
              : tone === "bad"
                ? "text-destructive"
                : "")
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Zero-is-good counters get an explicit green/red so a reviewer does not have to read the number. */
function zeroTone(n: number): "good" | "bad" {
  return n === 0 ? "good" : "bad"
}

export default function AdminCutoverVerificationView() {
  const snapshotQuery = useCutoverSnapshot()
  const snapshot = snapshotQuery.data

  const backfill = useRunBackfill()
  const rollback = useRollbackBackfill()
  const archive = useRunArchive()

  const [mentorScope, setMentorScope] = useState("")
  const [ledgerMentorId, setLedgerMentorId] = useState("")
  const [lastReport, setLastReport] = useState<BackfillRunReport | null>(null)

  const ledgerQuery = useLedgerForMentor(ledgerMentorId)

  const runDryRun = () =>
    backfill.mutate(
      { dryRun: true, mentorUserId: mentorScope.trim() || undefined },
      { onSuccess: (report) => setLastReport(report) },
    )

  const runApply = () =>
    backfill.mutate(
      { dryRun: false, mentorUserId: mentorScope.trim() || undefined },
      { onSuccess: (report) => setLastReport(report) },
    )

  if (snapshotQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (snapshotQuery.isError || !snapshot) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Could not load the cutover snapshot</AlertTitle>
        <AlertDescription>
          This needs <code>PERM_VIEW_MENTORSHIP_V2_INTERNALS</code> or <code>ROLE_ADMIN</code>. If you hold
          it, the Phase 11 migrations (V202–V208) may not have been applied to this environment.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="mt-0.5 size-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">Mentorship V2 — Phase 11 Migration &amp; Cutover</h1>
            <p className="text-sm text-muted-foreground">
              Legacy backfill, the dual-run blocking bridge, revenue reconciliation across the boundary,
              and decommission readiness.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void snapshotQuery.refetch()}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh
        </Button>
      </div>

      <InvariantWarnings snapshot={snapshot} />
      <StagePanel snapshot={snapshot} />
      <StorefrontPanel snapshot={snapshot} />
      <DualRunPanel snapshot={snapshot} />
      <RevenuePanel snapshot={snapshot} />

      {/* ── Backfill controls ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" />
            Backfill
          </CardTitle>
          <CardDescription>
            Calls <code>mentorship.backfill_run()</code> — the same SQL function the V204 migration ran, not
            a reimplementation. Idempotent: a second apply pass writes nothing and records{" "}
            <code>SKIPPED_EXISTS</code> for everything already present. Leave the mentor field blank to run
            platform-wide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!snapshot.backfillEndpointEnabled ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>Backfill endpoints are switched off</AlertTitle>
              <AlertDescription>
                Set <code>app.mentorship.cutover.backfill-endpoint-enabled=true</code> to enable these
                buttons. Off by default even though the SQL is idempotent, because idempotency is a property
                of the SQL and not of the operator — a button that is always pressable is one that
                eventually gets pressed to see what it does.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Ledger rows" value={snapshot.ledgerRows} />
            <Stat
              label="Skipped — ineligible"
              value={snapshot.skippedIneligible}
              tone={snapshot.skippedIneligible > 0 ? "warn" : "good"}
              hint="No usable legacy price to copy. Only a human can fill this gap."
            />
            <Stat
              label="Adjusted rows"
              value={snapshot.adjustedRows}
              tone={snapshot.adjustedRows > 0 ? "warn" : "default"}
              hint="Written, but a source value had to be corrected first."
            />
            <Stat label="Runs recorded" value={snapshot.recentRuns.length} />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="mentor-scope" className="text-xs text-muted-foreground">
                Scope to one mentor (optional)
              </label>
              <Input
                id="mentor-scope"
                value={mentorScope}
                onChange={(e) => setMentorScope(e.target.value)}
                placeholder="USR0000003"
                className="mt-1"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={runDryRun}
              disabled={backfill.isPending || !snapshot.backfillEndpointEnabled}
            >
              {backfill.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Search className="mr-1.5 size-3.5" />
              )}
              Dry run
            </Button>
            <Button
              size="sm"
              onClick={runApply}
              disabled={backfill.isPending || !snapshot.backfillEndpointEnabled}
            >
              <Play className="mr-1.5 size-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rollback.mutate(mentorScope.trim())}
              disabled={
                rollback.isPending || !snapshot.backfillEndpointEnabled || mentorScope.trim().length === 0
              }
              title="Rollback requires a mentor userId — there is no platform-wide rollback, deliberately."
            >
              {rollback.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-1.5 size-3.5" />
              )}
              Roll back this mentor
            </Button>
          </div>

          {lastReport ? <RunReport report={lastReport} /> : null}

          <Separator />

          <div>
            <label htmlFor="ledger-mentor" className="text-xs text-muted-foreground">
              Ledger — everything the migration did to one mentor
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                id="ledger-mentor"
                value={ledgerMentorId}
                onChange={(e) => setLedgerMentorId(e.target.value)}
                placeholder="USR0000003"
              />
            </div>
            {ledgerQuery.isFetching ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
            ) : ledgerQuery.data ? (
              <LedgerTable entries={ledgerQuery.data} />
            ) : ledgerQuery.isError ? (
              <p className="mt-2 text-xs text-destructive">No ledger rows found for that mentor.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ReadinessPanel snapshot={snapshot} archive={archive} />
    </div>
  )
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function InvariantWarnings({ snapshot }: { snapshot: AdminCutoverSnapshot }) {
  if (snapshot.invariantWarnings.length === 0) {
    return (
      <Alert className="border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
        <CheckCircle2 className="size-4" />
        <AlertTitle>No invariant warnings</AlertTitle>
        <AlertDescription>
          No cross-system double-bookings, no revenue reconciliation breaks, no mentors without a
          storefront, and the dual-run bridge is behaving. Recomputed live on this request, not read from
          when a migration ran.
        </AlertDescription>
      </Alert>
    )
  }
  return (
    <Alert variant="destructive">
      <XCircle className="size-4" />
      <AlertTitle>{snapshot.invariantWarnings.length} invariant warning(s)</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {snapshot.invariantWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function StagePanel({ snapshot }: { snapshot: AdminCutoverSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ArrowRightLeft className="size-4" />
          Cutover stage
          <Badge variant={snapshot.stage === "DUAL_RUN" ? "outline" : "default"}>{snapshot.stage}</Badge>
        </CardTitle>
        <CardDescription>{snapshot.stageDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4">
        <Stat
          label="Legacy booking writes"
          value={snapshot.legacyWritesBlocked ? "410 Gone" : "Allowed"}
          hint={
            snapshot.legacyWritesBlocked
              ? "New legacy bookings are refused."
              : "Both systems accept bookings."
          }
        />
        <Stat
          label="Legacy reads"
          value={snapshot.legacyReadsAllowed ? "Allowed" : "Blocked"}
          hint="Always allowed — support must still answer questions about existing bookings."
        />
        <Stat
          label="Archive permitted by stage"
          value={snapshot.archivePermittedByStage ? "Yes" : "No"}
          hint="Readiness is verified independently by the database."
        />
        <Stat
          label="Backfill endpoints"
          value={snapshot.backfillEndpointEnabled ? "Enabled" : "Disabled"}
        />
      </CardContent>
    </Card>
  )
}

function StorefrontPanel({ snapshot }: { snapshot: AdminCutoverSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="size-4" />
          Storefront coverage
        </CardTitle>
        <CardDescription>
          Exit criterion: <em>zero mentors with an empty storefront</em>. A mentor with no ACTIVE V2 service
          has nothing to sell the moment legacy booking closes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Active legacy mentors" value={snapshot.activeLegacyMentors} />
        <Stat label="With a V2 service" value={snapshot.mentorsWithActiveV2Service} />
        <Stat
          label="Empty storefront"
          value={snapshot.mentorsWithEmptyStorefront}
          tone={zeroTone(snapshot.mentorsWithEmptyStorefront)}
          hint="Must be 0 before cutover."
        />
        <Stat label="Active V2 services" value={snapshot.activeV2Services} />
        <Stat
          label="Schedules awaiting confirmation"
          value={snapshot.schedulesAwaitingConfirmation}
          tone={snapshot.schedulesAwaitingConfirmation > 0 ? "warn" : "good"}
          hint="Each mentor confirms their own migrated hours. Advisory, not blocking."
        />
        <Stat label="Schedules confirmed" value={snapshot.schedulesConfirmed} />
      </CardContent>
    </Card>
  )
}

function DualRunPanel({ snapshot }: { snapshot: AdminCutoverSnapshot }) {
  const doubles = snapshot.crossSystemDoubleBookings
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="size-4" />
          Dual-run bridge
        </CardTitle>
        <CardDescription>
          Exit criterion: <em>zero double-bookings across systems</em>. Measured by comparing each system&apos;s
          real commitments — the legacy side read from the legacy tables rather than from their mirrored
          intervals, so this reports a genuine conflict whether the bridge caught it, missed it, or never ran.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat
            label="Cross-system double-bookings"
            value={doubles.length}
            tone={zeroTone(doubles.length)}
          />
          <Stat label="Legacy bookings still open" value={snapshot.legacyBookingsStillOpen} />
          <Stat
            label="Legacy bookings mirrored into V2"
            value={snapshot.v2IntervalsMirroringLegacy}
            hint="Legacy → V2 half of the bridge."
          />
          <Stat
            label="Legacy slots blocked by V2"
            value={snapshot.legacySlotsBlockedByV2}
            hint="V2 → legacy half of the bridge."
          />
        </div>

        {doubles.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-destructive">
            <table className="w-full text-xs">
              <thead className="bg-destructive/10">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Mentor</th>
                  <th className="px-2 py-1.5 text-left font-medium">V2 interval</th>
                  <th className="px-2 py-1.5 text-left font-medium">Legacy booking</th>
                  <th className="px-2 py-1.5 text-left font-medium">Overlap</th>
                </tr>
              </thead>
              <tbody>
                {doubles.map((d) => (
                  <tr key={`${d.v2IntervalId}-${d.legacyBookingId}`} className="border-t">
                    <td className="px-2 py-1.5 font-mono">{d.mentorUserId}</td>
                    <td className="px-2 py-1.5 font-mono">{d.v2IntervalId}</td>
                    <td className="px-2 py-1.5 font-mono">
                      {d.legacySystem} · {d.legacyBookingId} ({d.legacyStatus})
                    </td>
                    <td className="px-2 py-1.5">
                      {new Date(d.overlapStartsAt).toLocaleString()} →{" "}
                      {new Date(d.overlapEndsAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {snapshot.bridgeConflicts.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-destructive">
              {snapshot.bridgeConflicts.length} bridge conflict ledger row(s)
            </p>
            <LedgerTable entries={snapshot.bridgeConflicts} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RevenuePanel({ snapshot }: { snapshot: AdminCutoverSnapshot }) {
  const failing = snapshot.reconciliationChecks.filter((c) => !c.passing)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="size-4" />
          Revenue reconciliation across the boundary
        </CardTitle>
        <CardDescription>
          Exit criterion: <em>revenue reports reconcile across the boundary to the paisa</em>. The buyer-side
          fee has its own column and is structurally 0 on the legacy leg — that zero is the finding, not a
          gap. Never read either fee column alone: commission alone reads as revenue halving at cutover and
          gross alone reads as sales jumping 10%, while per-booking platform revenue is unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.reconciliationChecks.map((c) => (
            <div
              key={c.checkName}
              className={
                "rounded-md border p-2.5 " +
                (c.passing ? "" : "border-destructive bg-destructive/5")
              }
            >
              <div className="flex items-center gap-1.5">
                {c.passing ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <XCircle className="size-3.5 text-destructive" />
                )}
                <p className="font-mono text-[11px]">{c.checkName}</p>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.expectation}</p>
              {!c.passing ? (
                <p className="mt-1 text-[11px] text-destructive">
                  {c.offendingRows} offending row(s): {c.sampleIds}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {failing.length === 0 && snapshot.revenue.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No revenue recorded on either system yet, so there is nothing to reconcile.
          </p>
        ) : null}

        {snapshot.revenue.length > 0 ? <RevenueTable rows={snapshot.revenue} /> : null}
      </CardContent>
    </Card>
  )
}

function RevenueTable({ rows }: { rows: RevenueReconciliationRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">System</th>
            <th className="px-2 py-1.5 text-left font-medium">Month</th>
            <th className="px-2 py-1.5 text-left font-medium">Cur</th>
            <th className="px-2 py-1.5 text-right font-medium">Orders</th>
            <th className="px-2 py-1.5 text-right font-medium">Buyer charged</th>
            <th className="px-2 py-1.5 text-right font-medium">Buyer fee (V2 only)</th>
            <th className="px-2 py-1.5 text-right font-medium">Mentor commission</th>
            <th className="px-2 py-1.5 text-right font-medium">Eff. %</th>
            <th className="px-2 py-1.5 text-right font-medium">GST</th>
            <th className="px-2 py-1.5 text-right font-medium">Mentor net</th>
            <th className="px-2 py-1.5 text-right font-medium">Platform revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.originSystem}-${r.periodMonth}-${r.currency}`} className="border-t">
              <td className="px-2 py-1.5">
                <Badge variant={r.originSystem === "V2" ? "default" : "outline"}>{r.originSystem}</Badge>
              </td>
              <td className="px-2 py-1.5 tabular-nums">{r.periodMonth}</td>
              <td className="px-2 py-1.5">{r.currency}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.orderCount}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatMinor(r.grossChargedMinor, r.currency)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatMinor(r.buyerPlatformFeeRevenueMinor, r.currency)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatMinor(r.mentorCommissionRevenueMinor, r.currency)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {r.effectiveCommissionPct === null || r.effectiveCommissionPct === undefined
                  ? "—"
                  : `${r.effectiveCommissionPct}%`}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatMinor(r.gstRemittedMinor, r.currency)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatMinor(r.mentorNetMinor, r.currency)}
              </td>
              <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                {formatMinor(r.platformRevenueMinor, r.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReadinessPanel({
  snapshot,
  archive,
}: {
  snapshot: AdminCutoverSnapshot
  archive: ReturnType<typeof useRunArchive>
}) {
  const blocking = snapshot.readiness.filter((r) => r.blocking)
  const advisory = snapshot.readiness.filter((r) => !r.blocking)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Archive className="size-4" />
          Decommission readiness &amp; archive
        </CardTitle>
        <CardDescription>
          The exit criteria as a checklist. Archiving <strong>copies, never drops</strong> — the master
          plan&apos;s 90-day retention clock is recorded as <code>purgeEligibleAt</code>, and dropping the
          originals is a separate, later, manifest-gated migration that deliberately does not exist yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          {blocking.map((r) => (
            <ReadinessRow key={r.checkName} row={r} />
          ))}
        </div>

        {advisory.length > 0 ? (
          <>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Advisory (does not block)</p>
            <div className="space-y-1.5">
              {advisory.map((r) => (
                <ReadinessRow key={r.checkName} row={r} />
              ))}
            </div>
          </>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => archive.mutate({ dryRun: true, force: true })}
            disabled={archive.isPending}
          >
            {archive.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Search className="mr-1.5 size-3.5" />
            )}
            Archive dry run
          </Button>
          <Button
            size="sm"
            onClick={() => archive.mutate({ dryRun: false, force: false })}
            disabled={archive.isPending || !snapshot.archivePermittedByStage}
            title={
              snapshot.archivePermittedByStage
                ? "Copies the legacy tables into the legacy schema."
                : "Requires stage DECOMMISSIONED."
            }
          >
            <Archive className="mr-1.5 size-3.5" />
            Archive now
          </Button>
          <span className="text-xs text-muted-foreground">
            Retention: {snapshot.archiveRetentionDays} days before a drop becomes permissible at all.
          </span>
        </div>

        {archive.data ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Source table</th>
                  <th className="px-2 py-1.5 text-right font-medium">Rows in source</th>
                  <th className="px-2 py-1.5 text-right font-medium">Archived</th>
                  <th className="px-2 py-1.5 text-left font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {archive.data.lines.map((l) => (
                  <tr key={l.sourceTable} className="border-t">
                    <td className="px-2 py-1.5 font-mono">{l.sourceTable}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.rowsInSource}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.rowsArchived}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{l.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {snapshot.archiveManifest.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium">Archive manifest</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Source</th>
                    <th className="px-2 py-1.5 text-right font-medium">Rows</th>
                    <th className="px-2 py-1.5 text-left font-medium">Archived at</th>
                    <th className="px-2 py-1.5 text-left font-medium">Purge eligible</th>
                    <th className="px-2 py-1.5 text-left font-medium">Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.archiveManifest.map((m) => (
                    <tr key={m.manifestId} className="border-t">
                      <td className="px-2 py-1.5 font-mono">{m.sourceTable}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {m.rowsArchived}/{m.rowsInSource}
                      </td>
                      <td className="px-2 py-1.5">{new Date(m.archivedAt).toLocaleDateString()}</td>
                      <td className="px-2 py-1.5">
                        {new Date(m.purgeEligibleAt).toLocaleDateString()}{" "}
                        <span className="text-muted-foreground">
                          ({m.daysUntilPurgeEligible}d)
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        {m.complete ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-500" />
                        ) : (
                          <XCircle className="size-3.5 text-destructive" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nothing archived yet. That is the expected state: archiving from a database whose legacy write
            path is still open produces an archive that is stale the moment it is taken.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ReadinessRow({ row }: { row: DecommissionReadinessRow }) {
  const bad = row.blocking && row.observed > 0
  return (
    <div
      className={"rounded-md border p-2.5 " + (bad ? "border-destructive bg-destructive/5" : "")}
    >
      <div className="flex flex-wrap items-center gap-2">
        {bad ? (
          <XCircle className="size-3.5 shrink-0 text-destructive" />
        ) : row.blocking ? (
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
        ) : (
          <AlertTriangle className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <p className="font-mono text-[11px]">{row.checkName}</p>
        <Badge variant={bad ? "destructive" : "outline"} className="text-[10px]">
          {row.observed}
        </Badge>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{row.detail}</p>
    </div>
  )
}

function RunReport({ report }: { report: BackfillRunReport }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
        <Badge variant={report.dryRun ? "outline" : "default"}>{report.runMode}</Badge>
        <span className="font-mono text-xs">{report.runId}</span>
        {report.scopedToMentorUserId ? (
          <span className="text-xs text-muted-foreground">
            scoped to {report.scopedToMentorUserId}
          </span>
        ) : null}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-5">
        <Stat label="Services" value={report.services} />
        <Stat label="Booking prefs" value={report.bookingPreferences} />
        <Stat label="Availability rules" value={report.availabilityRules} />
        <Stat label="Legacy intervals" value={report.legacyIntervals} />
        <Stat label="Conflicts" value={report.conflicts} tone={zeroTone(report.conflicts)} />
      </div>
      {report.tally && report.tally.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {report.tally.map((t) => (
            <Badge key={`${t.stage}-${t.action}`} variant="outline" className="text-[10px]">
              {t.stage} · {t.action} · {t.count}
            </Badge>
          ))}
        </div>
      ) : null}
      {report.entries && report.entries.length > 0 ? <LedgerTable entries={report.entries} /> : null}
    </div>
  )
}

function LedgerTable({ entries }: { entries: BackfillLedgerEntry[] }) {
  return (
    <div className="mt-2 max-h-96 overflow-auto rounded-md border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 text-muted-foreground backdrop-blur">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">Mentor</th>
            <th className="px-2 py-1.5 text-left font-medium">Stage</th>
            <th className="px-2 py-1.5 text-left font-medium">Action</th>
            <th className="px-2 py-1.5 text-left font-medium">Target</th>
            <th className="px-2 py-1.5 text-left font-medium">Reason / detail</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.ledgerId}
              className={
                "border-t " +
                (e.severity === "ERROR"
                  ? "bg-destructive/5"
                  : e.severity === "WARNING"
                    ? "bg-amber-50/50 dark:bg-amber-950/20"
                    : "")
              }
            >
              <td className="px-2 py-1.5 font-mono">{e.mentorUserId ?? "—"}</td>
              <td className="px-2 py-1.5">{e.stage}</td>
              <td className="px-2 py-1.5">
                <Badge
                  variant={
                    e.severity === "ERROR"
                      ? "destructive"
                      : e.severity === "WARNING"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-[10px]"
                >
                  {e.action}
                </Badge>
              </td>
              <td className="px-2 py-1.5 font-mono">{e.targetId ?? "—"}</td>
              <td className="px-2 py-1.5">
                <p className="text-muted-foreground">{e.reason}</p>
                {e.detail ? (
                  <pre className="mt-0.5 whitespace-pre-wrap break-all text-[10px] text-muted-foreground/80">
                    {e.detail}
                  </pre>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
