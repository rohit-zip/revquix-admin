"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 6 PACKAGE VERIFICATION ────────────────────────────
 *
 * Four panels, each mapping to a stated Phase 6 exit criterion:
 *
 *  1. **Escrow invariant** — the live restatement of master plan §5.1's own exactness
 *     requirement, Σ(unit_value_minor × quantity_total) == mentor_net_minor, over every
 *     package order that has minted entitlements. A one-time check at mint time cannot catch
 *     a later code or data-fix bug; this re-derives it fresh every time the panel is opened.
 *  2. **Entitlement counts & breach ladder** — how many packages are active, how many are
 *     overdue for expiry settlement, how many have accrued breach days, and the live config
 *     the ladder actually runs on (3/7/14-day thresholds, max validity, unused-expiry policy)
 *     — echoed from the server so this panel and the server cannot disagree about what "day 7"
 *     means.
 *  3. **Lifecycle sweep** — runs the exact same `PackageLifecycleJob.sweep()` the nightly
 *     scheduler runs, not a parallel copy, so a green manual run is real evidence about the
 *     scheduled one. Every Phase 6 escalation is time-driven, so this button is the only
 *     practical way to verify it without waiting for real days to pass.
 *  4. **Entitlement inspector** — every quantity, clock and ladder counter for one entitlement,
 *     plus its full redemption history.
 */

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { usePackageSnapshot, useInspectEntitlement, useRunPackageLifecycleSweep } from "./api/packages.hooks"
import type { PackageSweepReport } from "./api/packages.types"

function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₹"
  return symbol + (minor / 100).toLocaleString()
}

export default function AdminPackageVerificationView() {
  const snapshotQuery = usePackageSnapshot()
  const snapshot = snapshotQuery.data
  const sweep = useRunPackageLifecycleSweep()

  const [entitlementIdInput, setEntitlementIdInput] = useState("")
  const [activeEntitlementId, setActiveEntitlementId] = useState("")
  const entitlementQuery = useInspectEntitlement(activeEntitlementId)
  const entitlement = entitlementQuery.data

  const invariantsBroken =
    (snapshot?.escrowInvariantViolations.length ?? 0) > 0 ||
    (snapshot?.invariantWarnings.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Package className="size-5" /> Packages engine
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Verification surface for the entitlement ledger, redemption-driven escrow release, the
            validity clock pause, the SLA breach ladder, and expiry settlement. Only the sweep
            button writes anything.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void snapshotQuery.refetch()}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading package snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 6 tables may not be migrated yet. Run the app once against a database with
            V186–V187 applied, then refresh.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Escrow invariant ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" /> Escrow invariant
              </CardTitle>
              <CardDescription>
                Both lists are assertions, not statistics — they must always be empty. That is what
                makes them worth rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InvariantRow
                label="Escrow invariant violations"
                detail="For every package order that has minted entitlements: Σ(unit_value_minor × quantity_total) must equal mentor_net_minor exactly. A non-empty entry means a package order's payout no longer matches what was actually escrowed for its items."
                values={snapshot.escrowInvariantViolations}
              />
              <InvariantRow
                label="Invariant warnings"
                detail="Non-fatal signals worth a look — for example, entitlements overdue for expiry settlement that the nightly sweep has not yet reached."
                values={snapshot.invariantWarnings}
              />
            </CardContent>
          </Card>

          {/* ── 2. Entitlement counts & breach ladder config ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> Entitlements &amp; the SLA breach ladder
              </CardTitle>
              <CardDescription>
                The ladder config below is read live from the server. If this panel and a mentor&apos;s
                actual auto-pause date ever disagree, it is this row that is authoritative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Metric label="Total entitlements" value={String(snapshot.totalEntitlements)} />
                <Metric label="Active" value={String(snapshot.activeEntitlements)} />
                <Metric label="Total redemptions" value={String(snapshot.totalRedemptions)} />
                <Metric
                  label="Overdue for expiry"
                  value={String(snapshot.overdueForExpiry)}
                  tone={snapshot.overdueForExpiry > 0 ? "warning" : undefined}
                  hint="Non-zero is normal between nightly sweeps. Persistently non-zero means the scheduler is not running."
                />
                <Metric
                  label="With breach days"
                  value={String(snapshot.entitlementsWithBreachDays)}
                  hint="Have accrued at least one day of zero mentor availability."
                />
                <Metric
                  label="Auto-paused"
                  value={String(snapshot.autoPausedEntitlements)}
                  tone={snapshot.autoPausedEntitlements > 0 ? "warning" : undefined}
                  hint="Reached day 7 of the breach ladder — the child service was paused and the mentor's reliability count was penalised."
                />
                <Metric
                  label="Self-refund eligible"
                  value={String(snapshot.selfRefundEligibleEntitlements)}
                  tone={snapshot.selfRefundEligibleEntitlements > 0 ? "warning" : undefined}
                  hint="Reached day 14 — the buyer can now refund the unused remainder with one click."
                />
                <Metric label="By status" value={Object.entries(snapshot.entitlementsByStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"} />
              </div>
              <Separator />
              <div className="grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                <span>Unused-expiry policy: <strong>{snapshot.unusedExpiryPolicy}</strong></span>
                <span>Max validity: <strong>{snapshot.maxValidityDays} days</strong></span>
                <span>Nudge after: <strong>{snapshot.nudgeAfterBreachDays} breach day(s)</strong></span>
                <span>Auto-pause after: <strong>{snapshot.autoPauseAfterBreachDays} breach day(s)</strong></span>
                <span>Self-refund after: <strong>{snapshot.selfRefundAfterBreachDays} breach day(s)</strong></span>
                <span>Sweep cron: <code className="text-[11px]">{snapshot.lifecycleSweepCron}</code></span>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Lifecycle sweep ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="size-4" /> Lifecycle sweep
              </CardTitle>
              <CardDescription>
                Runs the clock-pause + breach-ladder check, the T-14/7/2 expiry reminders, and
                expiry settlement, in that order, over every active entitlement. Safe to press
                repeatedly — every escalation is ledgered on the entitlement itself and fires at
                most once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sweep.isPending}
                onClick={() => sweep.mutate()}
              >
                {sweep.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Run sweep now
              </Button>
              <SweepNotes result={sweep.data} />
            </CardContent>
          </Card>

          {/* ── 4. Entitlement inspector ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4" /> Entitlement inspector
              </CardTitle>
              <CardDescription>
                Every quantity, clock and ladder counter for one entitlement, plus its full
                redemption history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={entitlementIdInput}
                  onChange={(event) => setEntitlementIdInput(event.target.value)}
                  placeholder="entitlement id"
                  className="max-w-xs font-mono text-xs"
                  aria-label="Entitlement id"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveEntitlementId(entitlementIdInput.trim())}
                  disabled={!entitlementIdInput.trim()}
                >
                  Load
                </Button>
                {snapshot.recentEntitlements.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const latest = snapshot.recentEntitlements[0].entitlementId
                      setEntitlementIdInput(latest)
                      setActiveEntitlementId(latest)
                    }}
                  >
                    Use latest
                  </Button>
                ) : null}
              </div>

              {entitlementQuery.isError ? (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertDescription>No entitlement found with that id.</AlertDescription>
                </Alert>
              ) : null}

              {entitlement ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{entitlement.entitlementId}</span>
                    <Badge>{entitlement.statusLabel}</Badge>
                    {entitlement.autoPaused ? <Badge variant="destructive">auto-paused</Badge> : null}
                    {entitlement.selfRefundAvailable ? (
                      <Badge variant="secondary">self-refund available</Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    <Kv k="Package" v={entitlement.packageServiceTitle ?? entitlement.packageServiceId} />
                    <Kv k="Child service" v={entitlement.childServiceTitle} />
                    <Kv k="Buyer" v={entitlement.buyerName ?? entitlement.buyerUserId} />
                    <Kv k="Mentor" v={entitlement.mentorName ?? entitlement.mentorUserId} />
                    <Kv k="Quantity total" v={String(entitlement.quantityTotal)} />
                    <Kv k="Redeemed" v={String(entitlement.quantityRedeemed)} />
                    <Kv k="Refunded" v={String(entitlement.quantityRefunded)} />
                    <Kv k="Remaining" v={String(entitlement.quantityRemaining)} strong />
                    <Kv k="Unit value" v={formatMinor(entitlement.unitValueMinor, entitlement.currency)} strong />
                    <Kv k="Expires at" v={new Date(entitlement.expiresAt).toLocaleString()} />
                    <Kv k="Days until expiry" v={String(entitlement.daysUntilExpiry)} />
                    <Kv k="Clock-paused days" v={String(entitlement.clockPausedDays)} />
                    <Kv k="Mentor availability breach days" v={String(entitlement.mentorAvailabilityBreachDays)} />
                    <Kv k="Parent order" v={entitlement.parentOrderNumber ?? entitlement.parentOrderId} />
                  </div>

                  <Alert>
                    <CheckCircle2 className="size-4" />
                    <AlertDescription className="text-xs">
                      Pool identity check: quantity_redeemed ({entitlement.quantityRedeemed}) +
                      quantity_refunded ({entitlement.quantityRefunded}) + remaining (
                      {entitlement.quantityRemaining}) = total ({entitlement.quantityTotal}). Enforced
                      as a DB CHECK constraint, so a row that violated it could not have been inserted.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <p className="mb-1.5 text-xs font-medium">Redemption history</p>
                    {(entitlement.redemptions ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">None yet.</p>
                    ) : (
                      <ol className="space-y-1.5 border-l border-border/60 pl-3">
                        {(entitlement.redemptions ?? []).map((row) => (
                          <li key={row.redemptionId} className="text-xs">
                            <span className="font-mono">{row.bookingId}</span> ·{" "}
                            {row.startsAt ? new Date(row.startsAt).toLocaleString() : "—"} ·{" "}
                            {row.revertedAt ? (
                              <Badge variant="destructive" className="text-[10px]">
                                reverted {new Date(row.revertedAt).toLocaleDateString()}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{row.bookingStatusLabel}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── Recent entitlements ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent entitlements</CardTitle>
            </CardHeader>
            <CardContent>
              {snapshot.recentEntitlements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No entitlements yet. Complete a package checkout from a mentor&apos;s public page.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="pb-1.5 pr-3">Id</th>
                        <th className="pb-1.5 pr-3">Status</th>
                        <th className="pb-1.5 pr-3">Child service</th>
                        <th className="pb-1.5 pr-3">Remaining</th>
                        <th className="pb-1.5 pr-3">Unit value</th>
                        <th className="pb-1.5">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentEntitlements.map((row) => (
                        <tr key={row.entitlementId} className="border-t border-border/50">
                          <td className="py-1.5 pr-3">
                            <button
                              type="button"
                              className="font-mono hover:underline"
                              onClick={() => {
                                setEntitlementIdInput(row.entitlementId)
                                setActiveEntitlementId(row.entitlementId)
                              }}
                            >
                              {row.entitlementId.slice(0, 10)}…
                            </button>
                          </td>
                          <td className="py-1.5 pr-3">{row.statusLabel}</td>
                          <td className="max-w-[14rem] truncate py-1.5 pr-3">{row.childServiceTitle}</td>
                          <td className="py-1.5 pr-3">
                            {row.quantityRemaining} / {row.quantityTotal}
                          </td>
                          <td className="py-1.5 pr-3">{formatMinor(row.unitValueMinor, row.currency)}</td>
                          <td className="py-1.5">{new Date(row.expiresAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function InvariantRow({
  label,
  detail,
  values,
}: {
  label: string
  detail: string
  values: string[]
}) {
  const broken = values.length > 0
  return (
    <div className="flex items-start gap-2">
      {broken ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
      )}
      <div className="min-w-0">
        <p className={broken ? "text-sm font-medium text-destructive" : "text-sm font-medium"}>
          {label}: {broken ? values.join(", ") : "none"}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "positive" | "warning"
}) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "positive"
            ? "mt-0.5 text-lg font-semibold text-emerald-600 dark:text-emerald-500"
            : tone === "warning"
              ? "mt-0.5 text-lg font-semibold text-amber-600 dark:text-amber-500"
              : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SweepNotes({ result }: { result?: PackageSweepReport }) {
  if (!result) return null
  return (
    <div className="rounded-lg border border-border/60 p-3 text-xs">
      <p className="font-medium">
        Clock pauses {result.clockPausesApplied} · Nudges {result.nudgesSent} · Auto-pauses{" "}
        {result.autoPausesApplied} · Self-refunds unlocked {result.selfRefundsUnlocked} · Expiry
        reminders {result.expiryRemindersSent} · Expiries settled {result.expiriesSettled}
        {result.failures > 0 ? ` · Failures ${result.failures}` : ""}
      </p>
      {result.notes ? <p className="mt-1 text-muted-foreground">{result.notes}</p> : null}
      <p className="mt-1 text-muted-foreground">
        Ran at {new Date(result.ranAt).toLocaleString()}
      </p>
    </div>
  )
}

function Kv({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={strong ? "font-semibold" : undefined}>{v}</span>
    </div>
  )
}
