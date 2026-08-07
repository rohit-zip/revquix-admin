/**
 * ─── REFERRAL REVIEW QUEUE ───────────────────────────────────────────────────
 *
 * **This screen is what makes paying referrals on conversion safe.**
 *
 * The anti-abuse guard has three answers, not two. Conclusive signals — the two accounts are the
 * same person, the same mailbox, or the same device — reject outright and never appear here.
 * Ambiguous ones are *held* instead of being silently refused, because in this market the strongest
 * of them has an entirely ordinary explanation: a shared IP is usually a hostel, a placement cell or
 * a household, and CGNAT means one carrier address can front thousands of unrelated people.
 *
 * A held referral pays nobody, tells nobody, and **consumes no monthly referral slot** — so
 * releasing it tomorrow costs the referrer nothing. That is the whole reason the state exists.
 *
 * ─── Why the funnel sits above the queue ─────────────────────────────────────
 *
 * A queue tells you what to look at and nothing about whether the thresholds behind it are right. A
 * 40% hold rate and a 2% hold rate produce identical-looking lists of rows. The counters are the
 * only thing that answers **is the guard protecting growth or eating it** — so they are the first
 * thing on the page, not a footnote.
 *
 * Read `rejectionsByRule` before tuning anything. A spike in `IP_HASH_MATCH` is far more likely to
 * be one college campus than a fraud ring.
 */

"use client"

import React from "react"
import { AlertTriangle, Check, Users, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useReferralReview,
  useRejectReferral,
  useReleaseReferral,
} from "./api/tools-admin.hooks"
import type {
  AdminReferralReviewRow,
  ReferralRejectionReason,
} from "./api/tools-admin.types"
import { ReferralDecisionDialog } from "./components/referral-decision-dialog"
import {
  ConstraintNote,
  IdCell,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatDateTime,
  formatNumber,
} from "./components/tools-admin-shared"

/**
 * Plain-language explanations, keyed by rule.
 *
 * The reviewer's job is to judge a case, not to reverse-engineer an enum name. Each line states the
 * innocent reading first, because for everything that reaches this queue the innocent reading is the
 * more likely one — that is precisely why it was held rather than rejected.
 */
const RULE_EXPLANATION: Record<ReferralRejectionReason, string> = {
  IP_HASH_MATCH:
    "Both accounts registered from the same IP. Usually a household, hostel, campus lab or office — and CGNAT can put thousands of unrelated people behind one address.",
  RUN_IP_OVERLAP:
    "Different registration IPs, but both accounts ran tools from one address today. Consistent with sharing a home connection; also consistent with accounts registered on mobile data and then used from one laptop.",
  VELOCITY_EXCEEDED:
    "This referrer attracted several referees unusually fast. A genuinely viral share looks like this; so does a script.",
  REFERRER_NOT_ESTABLISHED:
    "The referrer's own account is very new, or they have never completed a tool run themselves. Enthusiastic new users look like this; so does an account created solely to farm.",
  SELF_REFERRAL: "The same account on both sides.",
  EMAIL_ROOT_MATCH: "Both addresses deliver to the same mailbox.",
  DEVICE_HASH_MATCH: "The same device signature on both sides, or shared with a sibling referee.",
  MONTHLY_CAP_EXCEEDED: "The referrer is already at their monthly ceiling.",
  REFERRER_NOT_FOUND: "The referrer's account no longer exists.",
}

type Decision = { row: AdminReferralReviewRow; action: "release" | "reject" } | null

export default function AdminReferralReviewView() {
  const { data, isLoading, isError } = useReferralReview()
  const release = useReleaseReferral()
  const reject = useRejectReferral()
  const [decision, setDecision] = React.useState<Decision>(null)

  const held = data?.statusCounts?.HELD ?? 0
  const granted = data?.statusCounts?.GRANTED ?? 0
  const rejected = data?.statusCounts?.REJECTED ?? 0
  const decided = granted + rejected + held
  // The number that decides whether the thresholds are right. Expressed against decided attempts
  // rather than all attempts, so referrals still working their way through the funnel do not
  // artificially deflate it.
  const holdRate = decided > 0 ? Math.round((held / decided) * 100) : 0

  return (
    <div className="flex w-full flex-col gap-6">
      <ScreenHeader
        title="Referral review"
        description="Referrals the guard could not decide on its own. Every one of these has a plausible innocent explanation — that is why it is here rather than rejected."
      />

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not load the review queue</AlertTitle>
          <AlertDescription>Refresh to try again.</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* ── The funnel ─────────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Awaiting review" value={formatNumber(held)} />
            <StatCard label="Granted" value={formatNumber(granted)} />
            <StatCard label="Rejected" value={formatNumber(rejected)} />
            <StatCard
              label="Hold rate"
              value={`${holdRate}%`}
              hint={`of decided attempts in ${data.windowDays} days`}
            />
          </div>

          {/*
            The single most useful sentence on the page. Without it, a reviewer draining a long queue
            concludes there is a fraud problem, when the likelier reading is that one threshold is
            set too tight.
          */}
          {holdRate >= 25 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>The guard may be eating real growth</AlertTitle>
              <AlertDescription>
                {holdRate}% of decided referrals are being held for review. Check the rule breakdown
                below before working through the queue — a concentration in one rule usually means a
                threshold is too tight, not that fraud has increased. A spike in{" "}
                <code>IP_HASH_MATCH</code> in particular is far more likely to be a single campus or
                office than a farm.
              </AlertDescription>
            </Alert>
          )}

          <SectionCard
            title="What the guard is firing on"
            description={`Holds and rejections by rule, last ${data.windowDays} days. Read this before changing any threshold.`}
          >
            {data.rejectionsByRule.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing has tripped a rule in this window.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead>What it means</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rejectionsByRule.map((rule) => (
                    <TableRow key={`${rule.status}-${rule.reasonCode}`}>
                      <TableCell className="font-mono text-xs">{rule.reasonCode}</TableCell>
                      <TableCell>
                        <Badge variant={rule.status === "HELD" ? "secondary" : "destructive"}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{rule.count}</TableCell>
                      <TableCell className="max-w-md text-xs text-muted-foreground">
                        {RULE_EXPLANATION[rule.reasonCode]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          {/* ── The queue ──────────────────────────────────────────────────── */}
          <SectionCard
            title="Awaiting a decision"
            description="Oldest first. The referrer has already been told their friend joined, so every day here is a day they are wondering where their credits went."
          >
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : data.held.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing is waiting. The guard is deciding everything on its own.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Held</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right">Their history</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.held.map((row) => (
                    <TableRow key={row.attemptId}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{row.referrerEmail ?? "—"}</span>
                          <IdCell value={row.referrerUserId} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{row.refereeEmail ?? "—"}</span>
                          <IdCell value={row.refereeUserId} />
                          {row.referralSource && (
                            <span className="text-[11px] text-muted-foreground">
                              via {row.referralSource}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {row.reasonCode}
                        </Badge>
                      </TableCell>
                      {/*
                        The cluster signal, and the reason it is on the row rather than behind a
                        click: the tripped rule alone cannot tell a flatmate apart from a farm. One
                        held attempt from someone with one other referral is a household; the same
                        rule firing on their ninth is a pattern.
                      */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end text-xs tabular-nums">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" aria-hidden />
                            {row.referrerTotalAttempts} total
                          </span>
                          <span className="text-muted-foreground">
                            {row.referrerGrantedAttempts} paid · {row.referrerBlockedAttempts}{" "}
                            blocked
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDecision({ row, action: "release" })}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
                            Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDecision({ row, action: "reject" })}
                          >
                            <X className="mr-1 h-3.5 w-3.5" aria-hidden />
                            Refuse
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          <ConstraintNote>
            A rejection is <strong>silent to both parties</strong>. Naming the rule that caught
            someone is a tuning signal for a fraudster, so nobody is told — which also means a
            legitimate user is not told either, and the reason you record here is the only
            explanation that will exist when they contact support.
            <br />
            <br />
            Guard settings in force: credits land{" "}
            {data.guardConfig.grantDelayHours === 0
              ? "on conversion"
              : `${data.guardConfig.grantDelayHours}h after conversion`}
            ; {data.guardConfig.monthlyCap} referrals per referrer per month; an isolated IP match{" "}
            {data.guardConfig.ipMatchAction === "HOLD" ? "holds for review" : "rejects outright"};
            velocity {data.guardConfig.velocityPerHour}/hour and {data.guardConfig.velocityPerDay}
            /day; referrers must be {data.guardConfig.referrerMinAccountAgeHours}h old
            {data.guardConfig.requireReferrerHasRun ? " and have run a tool themselves" : ""}.
          </ConstraintNote>
        </>
      )}

      <ReferralDecisionDialog
        open={decision !== null}
        row={decision?.row ?? null}
        action={decision?.action ?? "release"}
        pending={release.isPending || reject.isPending}
        onCancel={() => setDecision(null)}
        onConfirm={(reason) => {
          if (!decision) return
          const payload = { attemptId: decision.row.attemptId, reason }
          const mutation = decision.action === "release" ? release : reject
          mutation.mutate(payload, { onSuccess: () => setDecision(null) })
        }}
      />
    </div>
  )
}
