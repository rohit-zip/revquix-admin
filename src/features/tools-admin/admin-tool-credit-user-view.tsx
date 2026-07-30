/**
 * ─── PER-USER CREDIT DRILL-DOWN (§8.1) ───────────────────────────────────────
 *
 * The screen an admin opens when somebody disagrees about their balance.
 *
 * **The balance here is computed live, not read from the 60-second Redis cache the user-facing endpoint
 * uses.** That is deliberate: the whole reason this page is open is that a number is being disputed, and
 * showing a stale figure would make an admin conclude the ledger is inconsistent with itself.
 *
 * The most useful figure on the page is usually **credits on hold** — a user whose balance looks lower
 * than expected is very often looking at a run still in flight, and being able to say "3 credits are
 * reserved for a run that is still going" closes the ticket without touching anything.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useUserCreditProfile, useUserCreditStatement } from "./api/tools-admin.hooks"
import {
  ConstraintNote,
  CreditDelta,
  EntryTypeBadge,
  IdCell,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatDateTime,
  formatNumber,
} from "./components/tools-admin-shared"

export default function AdminToolCreditUserView({ userId }: { userId: string }) {
  const router = useRouter()
  const profile = useUserCreditProfile(userId)
  const [page, setPage] = React.useState(0)
  const statement = useUserCreditStatement(userId, page, 20)

  return (
    <div className="space-y-6">
      <ScreenHeader
        title={userId}
        description="Computed balance, lifetime totals, open holds, free-run allowance and pass state — plus the full statement."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(PATH_CONSTANTS.ADMIN_TOOL_CREDITS)}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Ledger
            </Button>
            <Button size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_TOOL_CREDITS_ADJUST)}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Adjust
            </Button>
          </>
        }
      />

      {profile.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>No such user</AlertTitle>
          <AlertDescription>
            The ledger holds no foreign key to the account table — it cannot, because erasure pseudonymises
            the column — so an unknown ID is only detectable here.
          </AlertDescription>
        </Alert>
      )}

      {profile.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted/40" aria-hidden="true" />
          ))}
        </div>
      )}

      {profile.data && (
        <>
          {profile.data.runsBlocked && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Balance is negative — runs are blocked</AlertTitle>
              <AlertDescription>
                A reversal exceeded what this user had already spent. That is allowed and is recorded in
                full: clamping at zero would have silently absorbed the difference and destroyed the
                information that the correction went further than the remaining balance.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Balance"
              value={profile.data.balance}
              tone={profile.data.balance < 0 ? "danger" : "default"}
              hint="SUM(delta), computed live rather than from the 60s cache"
            />
            <StatCard
              label="Credits on hold"
              value={profile.data.creditsOnHold}
              tone={profile.data.creditsOnHold > 0 ? "warning" : "default"}
              hint="Reserved but neither charged nor returned"
            />
            <StatCard label="Lifetime earned" value={formatNumber(profile.data.lifetimeEarned)} />
            <StatCard
              label="Lifetime spent"
              value={formatNumber(profile.data.lifetimeSpent)}
              hint="Committed runs only — not every hold ever placed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Free runs left today"
              value={profile.data.freeRunsRemainingToday}
              hint={
                profile.data.freeRunCustomQuota === null
                  ? "Configured default applies"
                  : profile.data.freeRunCustomQuota === -1
                    ? "Override: unlimited"
                    : `Override: ${profile.data.freeRunCustomQuota}/day`
              }
            />
            <StatCard
              label="Expiring in 30 days"
              value={profile.data.expiringSoon}
              hint="Always 0 while purchased-expiry-months is 0 — stated rather than omitted"
            />
            <StatCard
              label="Active pass"
              value={profile.data.hasActivePass ? "Yes" : "No"}
              hint="Always No until Phase 10 supplies a ToolPassService bean"
            />
            <StatCard
              label="Tools access"
              value={profile.data.hasToolsPermission ? "Granted" : "Revoked"}
              tone={profile.data.hasToolsPermission ? "default" : "danger"}
              hint="PERM_USE_TOOLS — revoked per-user, never by removing the role grant"
            />
          </div>

          {profile.data.openHolds.length > 0 && (
            <SectionCard
              title="Open holds"
              description="Credits reserved for runs that have neither settled nor been returned. Anything well past the configured hold timeout is genuinely stuck — release it from the run inspector."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hold entry</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Run status</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.data.openHolds.map((hold) => (
                    <TableRow key={hold.holdEntryId}>
                      <TableCell>
                        <IdCell value={hold.holdEntryId} />
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{hold.credits}</TableCell>
                      <TableCell>
                        <IdCell value={hold.runId} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {hold.runStatus?.toLowerCase() ?? "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {formatNumber(hold.ageMinutes)} min
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          <SectionCard
            title="Statement"
            description="Every ledger row for this user, newest first. This is the artefact the append-only ledger exists to produce."
            actions={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {page + 1}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(statement.data?.entries.length ?? 0) < 20}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            }
          >
            {statement.data && statement.data.entries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Movement</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.data.entries.map((entry) => (
                      <TableRow key={entry.entryId}>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <IdCell value={entry.entryId} />
                          {entry.adminAuditId && (
                            <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                              admin
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <EntryTypeBadge type={entry.entryType} />
                        </TableCell>
                        <TableCell>
                          <CreditDelta delta={entry.delta} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.refType ? (
                            <>
                              {entry.refType.replace(/_/g, " ").toLowerCase()}{" "}
                              {entry.refId && <span className="font-mono">{entry.refId}</span>}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">
                          {entry.note ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No ledger entries for this user.
              </p>
            )}
          </SectionCard>

          <ConstraintNote>
            A <strong>zero movement</strong> row is not missing data: a run confirmation carries
            <code> delta = 0</code> because the value was already removed by the hold, and the confirmation
            exists so the statement reads as a narrative rather than showing credits vanishing with nothing
            explaining it.
          </ConstraintNote>
        </>
      )}
    </div>
  )
}
