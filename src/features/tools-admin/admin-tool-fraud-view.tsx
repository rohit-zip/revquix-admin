/**
 * ─── SCREEN 7: FRAUD & ABUSE QUEUE (§8.7) ────────────────────────────────────
 *
 * **Every signal here is triage input for a human. Nothing on this page acts automatically.**
 *
 * That is correctness rather than caution. The strongest signal available — several accounts behind one
 * `ip_hash` — has a completely ordinary explanation in India: CGNAT means one carrier address can front
 * thousands of unrelated people, and a household NAT means a family shares one. §12.3 makes the same
 * call about referral IP matches ("same-household false positives exist; 7 days plus manual review is
 * the right trade").
 *
 * And revoking tools access is **not** an account lock. That is the whole reason `PERM_USE_TOOLS` is a
 * separate permission: someone who abused the free tier may also have a ₹599 mock interview booked next
 * Tuesday, and taking that away is a refund conversation we chose not to have.
 */

"use client"

import React from "react"
import { AlertTriangle, CheckCircle2, Flag, ShieldOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFraudQueue } from "./api/tools-admin.hooks"
import type { ToolSubjectType } from "./api/tools-admin.types"
import { TriageDialog } from "./components/triage-dialog"
import {
  ConstraintNote,
  IdCell,
  OutcomeBadge,
  PendingPhasePanel,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatDate,
  formatDateTime,
  formatNumber,
  shortHash,
} from "./components/tools-admin-shared"

type TriageTarget = { subjectType: ToolSubjectType; subjectKey: string } | null

export default function AdminToolFraudView() {
  const queue = useFraudQueue()
  const [target, setTarget] = React.useState<TriageTarget>(null)
  const [intent, setIntent] = React.useState<"MARK_ABUSE" | "WHITELIST" | "REVOKE">("MARK_ABUSE")

  const openTriage = (
    subjectType: ToolSubjectType,
    subjectKey: string,
    nextIntent: typeof intent,
  ) => {
    setIntent(nextIntent)
    setTarget({ subjectType, subjectKey })
  }

  const data = queue.data

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Fraud & abuse"
        description="Negative balances, abnormal run rates, same-day IP-hash clusters and subjects pinned at their free-run cap. Every row is a hint for a person, never an automatic action."
      />

      {queue.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load the queue</AlertTitle>
          <AlertDescription>
            This page needs <code>PERM_MANAGE_CREDITS</code>, because acting on it revokes access or
            reverses money.
          </AlertDescription>
        </Alert>
      )}

      {queue.isLoading && (
        <div className="h-40 animate-pulse rounded-lg border bg-muted/40" aria-hidden="true" />
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Negative balances"
              value={data.negativeBalances.length}
              tone={data.negativeBalances.length > 0 ? "danger" : "default"}
              hint="A reversal exceeded what the user had spent. Runs are blocked."
            />
            <StatCard
              label="Abnormal run rates"
              value={data.abnormalRunRates.length}
              hint={`Above ${data.thresholds.abnormalRunsPerDay}/day over ${data.thresholds.windowDays} days`}
            />
            <StatCard
              label="IP clusters today"
              value={data.ipClusters.length}
              hint={`${data.thresholds.ipClusterMinSubjects}+ distinct subjects behind one hash`}
            />
            <StatCard
              label="Pinned at quota cap"
              value={data.quotaExhaustion.length}
              hint={`${data.thresholds.quotaExhaustionDays} consecutive days`}
            />
          </div>

          <ConstraintNote tone="warning">{data.ipCorrelationNote}</ConstraintNote>

          <Tabs defaultValue="negative">
            <TabsList className="flex-wrap">
              <TabsTrigger value="negative">Negative balances</TabsTrigger>
              <TabsTrigger value="rates">Run rates</TabsTrigger>
              <TabsTrigger value="clusters">IP clusters</TabsTrigger>
              <TabsTrigger value="quota">Quota cap</TabsTrigger>
              <TabsTrigger value="referral">Referrals</TabsTrigger>
              <TabsTrigger value="triage">Already triaged</TabsTrigger>
            </TabsList>

            <TabsContent value="negative" className="mt-4">
              <SectionCard
                title="Accounts with a negative balance"
                description="The cheapest signal there is. A negative balance is information, not a bug — clamping at zero would have destroyed the fact that a reversal exceeded what was already spent."
              >
                {data.negativeBalances.length === 0 ? (
                  <EmptyRow text="No account has a negative balance." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Lifetime spent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.negativeBalances.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell>
                            <IdCell value={row.userId} />
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
                            {row.balance}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {formatNumber(row.lifetimeSpent)}
                          </TableCell>
                          <TableCell className="text-right">
                            <TriageButtons
                              onMark={() => openTriage("USER", row.userId, "MARK_ABUSE")}
                              onWhitelist={() => openTriage("USER", row.userId, "WHITELIST")}
                              onRevoke={() => openTriage("USER", row.userId, "REVOKE")}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="rates" className="mt-4">
              <SectionCard
                title="Abnormal run rates"
                description={`Subjects with more than ${data.thresholds.abnormalRunsPerDay} runs per day over the last ${data.thresholds.windowDays} days. A high distinct-hash count for one subject suggests either travel or automation across proxies.`}
              >
                {data.abnormalRunRates.length === 0 ? (
                  <EmptyRow text="No subject is running abnormally often." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Credits held</TableHead>
                        <TableHead className="text-right">Distinct hashes</TableHead>
                        <TableHead>Last run</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.abnormalRunRates.map((row) => (
                        <TableRow key={`${row.subjectType}-${row.subjectKey}`}>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="mr-1.5 text-[10px]">
                              {row.subjectType.toLowerCase()}
                            </Badge>
                            <IdCell value={shortHash(row.subjectKey, 16)} />
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {formatNumber(row.runs)}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {formatNumber(row.creditsHeld)}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {formatNumber(row.distinctIpHashes)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(row.lastRunAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <TriageButtons
                              onMark={() =>
                                openTriage(row.subjectType as ToolSubjectType, row.subjectKey, "MARK_ABUSE")
                              }
                              onWhitelist={() =>
                                openTriage(row.subjectType as ToolSubjectType, row.subjectKey, "WHITELIST")
                              }
                              onRevoke={
                                row.subjectType === "USER"
                                  ? () => openTriage("USER", row.subjectKey, "REVOKE")
                                  : undefined
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="clusters" className="mt-4">
              <SectionCard
                title="Same-day IP-hash clusters"
                description="Distinct registered accounts behind one hash is the number that matters — that is the referral-abuse shape. Several anonymous cookies behind one address is just a shared network."
              >
                {data.ipClusters.length === 0 ? (
                  <EmptyRow text="No cluster today. Not a gap — the salt rotates daily, so this panel only ever covers the current UTC day." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP hash</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Subjects</TableHead>
                        <TableHead className="text-right">Accounts</TableHead>
                        <TableHead>Window</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ipClusters.map((row) => (
                        <TableRow key={row.ipHash}>
                          <TableCell>
                            <IdCell value={shortHash(row.ipHash, 16)} />
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {formatNumber(row.runs)}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {formatNumber(row.distinctSubjects)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium tabular-nums">
                            {formatNumber(row.distinctUsers)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(row.firstRunAt)} → {formatDateTime(row.lastRunAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="quota" className="mt-4">
              <SectionCard
                title="Pinned at the free-run cap"
                description={`Subjects at their cap on every one of the last ${data.thresholds.quotaExhaustionDays} days. Hitting the daily free run once is the product working as designed; three days running is a pattern.`}
              >
                {data.quotaExhaustion.length === 0 ? (
                  <EmptyRow text="No subject is pinned at the cap." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Days at cap</TableHead>
                        <TableHead className="text-right">Peak used</TableHead>
                        <TableHead>Last day</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.quotaExhaustion.map((row) => (
                        <TableRow key={`${row.subjectType}-${row.subjectKey}`}>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="mr-1.5 text-[10px]">
                              {row.subjectType.toLowerCase()}
                            </Badge>
                            <IdCell value={shortHash(row.subjectKey, 16)} />
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.daysAtCap}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {row.peakUsed}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(row.lastDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="referral" className="mt-4">
              <PendingPhasePanel
                title="Referral abuse clusters"
                phase="P12"
                reason={data.referralUnavailableReason ?? "Not available."}
              />
            </TabsContent>

            <TabsContent value="triage" className="mt-4">
              <SectionCard
                title="Decisions already recorded"
                description="Shown so a handled subject stops resurfacing at the top of the queue, and so two admins do not both act on the same account."
              >
                {data.recentTriage.length === 0 ? (
                  <EmptyRow text="No triage decisions in the last 30 days." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTriage.map((row) => (
                        <TableRow key={row.auditId}>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                            {formatDateTime(row.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs">
                            <OutcomeBadge outcome={row.outcome} />{" "}
                            {row.action.replace(/_/g, " ").toLowerCase()}
                          </TableCell>
                          <TableCell>
                            <IdCell value={row.targetUserId ?? "—"} />
                          </TableCell>
                          <TableCell>
                            <IdCell value={row.adminUserId} />
                          </TableCell>
                          <TableCell className="max-w-[20rem] truncate text-xs text-muted-foreground">
                            {row.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>

          <ConstraintNote>
            <strong>Marking and acting are separate decisions.</strong> Marking records an observation one
            admin can make from this queue; revoking has consequences for a paying customer. Collapsing
            them would mean the only way to record &ldquo;I looked at this and it is abuse&rdquo; is to
            also punish — which pushes admins toward recording nothing at all. Whitelisting is audited too,
            because suppressing a signal is a decision the next reviewer needs to know somebody made.
          </ConstraintNote>
        </>
      )}

      <TriageDialog
        target={target}
        intent={intent}
        onClose={() => setTarget(null)}
      />
    </div>
  )
}

function TriageButtons({
  onMark,
  onWhitelist,
  onRevoke,
}: {
  onMark: () => void
  onWhitelist: () => void
  onRevoke?: () => void
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={onMark} title="Record that this is abuse">
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Mark as abuse</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onWhitelist} title="Record that this is a false positive">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Whitelist</span>
      </Button>
      {onRevoke && (
        <Button size="sm" variant="ghost" onClick={onRevoke} title="Revoke tools access (not an account lock)">
          <ShieldOff className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          <span className="sr-only">Revoke tools access</span>
        </Button>
      )}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
}
