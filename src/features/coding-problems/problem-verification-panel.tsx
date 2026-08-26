"use client"

import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VerificationReport, VerificationStatus } from "./api/problem.types"

/**
 * The publish gate's report — docs/CODING_PROBLEMS_MASTER_PLAN.md §5.3.
 *
 * ─── This panel exists to tell a reviewer what they DO NOT have to check ─────
 *
 * Before a problem reaches the queue the platform has already run the author's reference solution
 * against the author's test cases and watched it pass, in every language the problem offers. The
 * expected outputs were generated from that run rather than typed. The case counts, the topics and
 * the statement were validated.
 *
 * A reviewer who does not know that will re-do it by hand, badly. Leading with the report is what
 * frees their attention for the five things a machine cannot check (§5.4) — of which the first,
 * "is this a LeetCode statement pasted verbatim", is the whole reason human review exists.
 *
 * ─── WARN is never a blocker, and the copy has to make that obvious ─────────
 *
 * The only WARN today is the near-duplicate scan. A machine deciding two problems are "the same"
 * and refusing the second would be a machine overruling an author on a judgement call it is bad
 * at, so it flags and a human decides.
 */
export function ProblemVerificationPanel({
  status,
  report,
  verifiedAt,
}: {
  status: VerificationStatus
  report: VerificationReport | null
  verifiedAt: string | null
}) {
  if (status === "VERIFYING") {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        The checks are running. They take under a minute — this page updates itself.
      </div>
    )
  }

  if (!report) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Info className="size-4" /> Not checked yet
        </p>
        <p className="mt-1">
          Nothing here has been proved to run. A problem cannot be submitted or published until it
          passes, so this one is not ready for a decision.
        </p>
      </div>
    )
  }

  const failures = report.checks.filter((c) => c.status === "FAIL")
  const warnings = report.checks.filter((c) => c.status === "WARN")

  return (
    <section className="rounded-lg border">
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b px-4 py-3",
          report.passed ? "bg-emerald-500/5" : "bg-destructive/5",
        )}
      >
        <div className="flex items-center gap-2">
          {report.passed ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
          <h2 className="text-sm font-medium">
            {report.passed ? "Automated checks passed" : "Automated checks failed"}
          </h2>
          {warnings.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              · {warnings.length} to look at
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {verifiedAt ? new Date(verifiedAt).toLocaleString() : ""}
          {report.driverVersion ? ` · driver ${report.driverVersion}` : ""}
        </span>
      </header>

      {report.passed && (
        <p className="border-b bg-emerald-500/5 px-4 py-2 text-xs text-muted-foreground">
          The author&rsquo;s own solution was run against their own tests and passed, in every
          language this problem offers. The expected outputs came from that run, so they cannot be
          mistyped. What is left is the part a machine cannot do.
        </p>
      )}

      <ul className="divide-y">
        {[...failures, ...warnings, ...report.checks.filter((c) => c.status === "PASS")].map(
          (check) => (
            <li key={check.id} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 shrink-0">
                {check.status === "PASS" && (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
                {check.status === "FAIL" && <XCircle className="size-4 text-destructive" />}
                {check.status === "WARN" && (
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{check.title}</p>
                {check.detail && (
                  <p
                    className={cn(
                      "mt-0.5 text-xs whitespace-pre-wrap",
                      check.status === "PASS" ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {check.detail}
                  </p>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
