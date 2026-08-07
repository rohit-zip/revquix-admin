"use client"

/**
 * ─── DISPUTES ─────────────────────────────────────────────────────────────────
 *
 * Three stacked regions, in the order an operator uses them:
 *
 *   A. Stat tiles — each one a filter shortcut, so "3 unassigned" is a button, not a fact.
 *   B. The dispute table — sortable, filterable, paged, newest first, one click into the case.
 *   C. Feedback SLA breaches — read-only, no admin action, by design.
 *
 * <h3>Why the default sort is newest-first when the queue's is not</h3>
 * `GET /disputes/queue` orders urgent-band-first then oldest-first, and that ordering is correct for
 * working a queue: sorting newest-first starves the cases closest to breaching. But an order that
 * cannot be changed is not a table. So the table defaults to newest-first (what an operator expects
 * of any table), carries a sortable SLA column, and offers "Breaching soonest" as one click —
 * which sorts by `slaDueAt ASC` and reproduces the queue's intent from data rather than from a
 * hard-coded CASE expression nobody can see.
 *
 * <h3>Region C is not a work list</h3>
 * The breach sweep converts each of those rows into a real dispute within one sweep interval. A row
 * that outlives the interval is a statement about the job, not about the mentor — so the correct
 * response is to open Platform Health, not to action the row. That is why it has no buttons.
 */

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, Gavel, Loader2, Lock, ShieldAlert, UserX } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { getFeedbackBreaches, searchDisputes } from "@/features/mentorship-v2/api/admin-lists.api"
import { DISPUTES_FILTER_CONFIG } from "@/features/mentorship-v2/api/admin-lists.config"
import { useDisputeSnapshot } from "@/features/mentorship-v2/api/disputes.hooks"
import type { DisputePriority, DisputeRow } from "@/features/mentorship-v2/api/disputes.types"
import {
  PersonCell,
  RefLink,
  StatusBadge,
  formatHours,
  formatMinor,
  formatRelative,
  formatWhen,
} from "./console-format"

const PRIORITY_VARIANT: Record<DisputePriority, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  NORMAL: "secondary",
  HIGH: "default",
  URGENT: "destructive",
}

const LIVE_STATUSES = ["OPEN", "UNDER_REVIEW", "AWAITING_BUYER", "AWAITING_MENTOR", "ESCALATED"]
const TERMINAL_STATUSES = new Set(["RESOLVED", "REJECTED", "WITHDRAWN"])

export default function ProfessionalMentorDisputesView() {
  const router = useRouter()
  const snapshotQuery = useDisputeSnapshot()
  const snapshot = snapshotQuery.data

  const search = useGenericSearch<DisputeRow>({
    queryKey: "pm-disputes",
    searchFn: searchDisputes,
    config: DISPUTES_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<DisputeRow>[]>(
    () => [
      {
        key: "disputeId",
        header: "Dispute",
        render: (row) => (
          <div className="min-w-0">
            <RefLink id={row.disputeId} href={`${PATH_CONSTANTS.ADMIN_PM_DISPUTES}/${row.disputeId}`} />
            <p className="mt-0.5 truncate text-xs">{row.disputeTypeLabel}</p>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Raised",
        sortable: true,
        render: (row) => <span className="text-xs">{formatWhen(row.createdAt)}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} label={row.statusLabel} />,
      },
      {
        key: "priority",
        header: "Priority",
        sortable: true,
        render: (row) => (
          <Badge variant={PRIORITY_VARIANT[row.priority]} className="font-normal">
            {row.priority}
          </Badge>
        ),
      },
      {
        key: "buyer",
        header: "Buyer",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.buyerName} userId={row.buyerUserId} />,
      },
      {
        key: "mentor",
        header: "Mentor",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        key: "bookingId",
        header: "Session",
        hideOnMobile: true,
        render: (row) => (
          <RefLink
            id={row.bookingId}
            href={row.bookingId ? `${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${row.bookingId}` : undefined}
          />
        ),
      },
      {
        key: "amountInQuestionMinor",
        header: "Amount",
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {row.amountInQuestionMinor > 0
              ? formatMinor(row.amountInQuestionMinor, row.currency)
              : "—"}
          </span>
        ),
      },
      {
        key: "payoutHold",
        header: "Payout",
        sortable: true,
        render: (row) =>
          row.payoutHold ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-amber-600">
              <Lock className="size-3" aria-hidden="true" /> held
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">released</span>
          ),
      },
      {
        key: "slaDueAt",
        header: "SLA",
        sortable: true,
        render: (row) => {
          /*
            Two cases where the clock is meaningless and rendering it is actively misleading.

            A CLOSED dispute has no live deadline — but a resolved case that never recorded a first
            response still has a `slaDueAt` in the past, which rendered as an angry red "23h ago"
            against a case that was dealt with days ago. Terminal status wins over the clock.
          */
          if (TERMINAL_STATUSES.has(row.status)) {
            return <span className="text-xs text-muted-foreground">closed</span>
          }
          if (row.firstResponseAt) {
            return <span className="text-xs text-muted-foreground">responded</span>
          }
          const due = formatRelative(row.slaDueAt)
          if (!due) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <span
              className={
                due.overdue
                  ? "whitespace-nowrap text-xs font-medium text-destructive"
                  : "whitespace-nowrap text-xs"
              }
            >
              {due.text}
            </span>
          )
        },
      },
      {
        key: "assignedAdminId",
        header: "Assigned",
        sortable: true,
        hideOnMobile: true,
        render: (row) =>
          row.assignedAdminName ? (
            <span className="text-xs">{row.assignedAdminName}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          ),
      },
    ],
    [],
  )

  /** A tile is a filter shortcut. Each one replaces the current filters rather than adding to them. */
  function applyPreset(preset: "live" | "unassigned" | "breaching" | "held" | "all") {
    search.clearFilters()
    search.clearRangeFilters()
    search.clearSearch()
    switch (preset) {
      case "live":
        search.addFilter({ field: "status", operator: "IN", value: LIVE_STATUSES })
        search.setSort(DISPUTES_FILTER_CONFIG.defaultSort)
        break
      case "unassigned":
        search.addFilter({ field: "status", operator: "IN", value: LIVE_STATUSES })
        search.addFilter({ field: "assignedAdminId", operator: "IS_NULL", value: "" })
        search.setSort(DISPUTES_FILTER_CONFIG.defaultSort)
        break
      case "breaching":
        search.addFilter({ field: "status", operator: "IN", value: LIVE_STATUSES })
        // Ascending on the first-response deadline IS "breaching soonest" — the same intent the
        // work queue hard-codes, expressed as a sort so the operator can see and change it.
        search.setSort([{ field: "slaDueAt", direction: "ASC" }])
        break
      case "held":
        search.addFilter({ field: "payoutHold", operator: "EQUALS", value: true })
        search.setSort(DISPUTES_FILTER_CONFIG.defaultSort)
        break
      case "all":
        search.setSort(DISPUTES_FILTER_CONFIG.defaultSort)
        break
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldAlert className="size-6" /> Disputes
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every dispute raised against a Professional Mentor session. Open one to read the case file
          and resolve it — each resolution executes a real financial action. Reads need the usual
          internals permission; resolving needs{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">PERM_MANAGE_MENTORSHIP_DISPUTES</code>,
          enforced server-side.
        </p>
      </header>

      {/* ── A. Tiles ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Open"
          value={snapshot?.liveDisputes}
          loading={snapshotQuery.isLoading}
          onClick={() => applyPreset("live")}
        />
        <StatTile
          label="Unassigned"
          value={snapshot?.unassignedLive}
          tone={snapshot && snapshot.unassignedLive > 0 ? "warn" : undefined}
          loading={snapshotQuery.isLoading}
          icon={<UserX className="size-3.5" />}
          onClick={() => applyPreset("unassigned")}
        />
        <StatTile
          label="Breaching soonest"
          value={
            snapshot ? snapshot.firstResponseBreaches + snapshot.resolutionBreaches : undefined
          }
          tone={
            snapshot && snapshot.firstResponseBreaches + snapshot.resolutionBreaches > 0
              ? "warn"
              : undefined
          }
          loading={snapshotQuery.isLoading}
          icon={<Clock className="size-3.5" />}
          onClick={() => applyPreset("breaching")}
        />
        <StatTile
          label="Payout held"
          value={snapshot?.holdingPayoutPastAppealWindow}
          loading={snapshotQuery.isLoading}
          icon={<Lock className="size-3.5" />}
          onClick={() => applyPreset("held")}
        />
        <StatTile
          label="Auto-resolved"
          value={snapshot ? `${snapshot.autoResolutionRatePercentage}%` : undefined}
          tone={snapshot && snapshot.autoResolutionRatePercentage >= 50 ? "good" : undefined}
          loading={snapshotQuery.isLoading}
          icon={<Gavel className="size-3.5" />}
          onClick={() => applyPreset("all")}
        />
      </div>

      {/* An invariant violation is a real bug, not a statistic — so it is never a tile. */}
      {snapshot && snapshot.invariantViolations.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            {snapshot.invariantViolations.length} dispute invariant violation(s)
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {snapshot.invariantViolations.map((violation) => (
                <li key={violation}>{violation}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* ── B. The table ── */}
      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(row) => row.disputeId}
        title="All disputes"
        description="Newest first. Sort by SLA to work the queue in breach order."
        onRowClick={(row) => router.push(`${PATH_CONSTANTS.ADMIN_PM_DISPUTES}/${row.disputeId}`)}
      />

      {/* ── C. Feedback SLA breaches ── */}
      <FeedbackBreachTable />
    </div>
  )
}

// ─── Region C ─────────────────────────────────────────────────────────────────

function FeedbackBreachTable() {
  const query = useQuery({
    queryKey: ["pm-feedback-breaches"],
    queryFn: () => getFeedbackBreaches(100),
    staleTime: 30_000,
  })
  const rows = query.data ?? []
  const stuck = rows.filter((row) => row.sweepOverdue)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4" /> Feedback SLA breaches
        </CardTitle>
        <CardDescription>
          Sessions whose mentor missed the feedback deadline and which the breach sweep has not yet
          converted into a dispute. The sweep runs every couple of minutes and does that
          automatically — holding the payout and recording the reliability penalty — so{" "}
          <strong>there is no admin action to take here</strong>. This table exists so the breach is
          visible while it is still only a breach.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stuck.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>
              {stuck.length} session(s) have outlived a sweep interval — the sweep is not completing
            </AlertTitle>
            <AlertDescription className="text-xs">
              These should have become disputes automatically. That they have not means the
              feedback-breach stage of the booking lifecycle job is not finishing, so payout holds and
              reliability penalties are not being applied to anyone. Check Platform Health rather than
              actioning these rows.
            </AlertDescription>
          </Alert>
        ) : null}

        {query.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Loading…
          </p>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>Could not load the feedback breach list.</AlertDescription>
          </Alert>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing overdue. Every completed session either has its feedback report or has already
            become a dispute — which is what this table looks like when the sweep is healthy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead className="hidden md:table-cell">Buyer</TableHead>
                  <TableHead className="hidden lg:table-cell">Session ended</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Overdue by</TableHead>
                  <TableHead>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rows]
                  .sort((a, b) => b.overdueHours - a.overdueHours)
                  .map((row) => (
                    <TableRow key={row.bookingId} className={row.sweepOverdue ? "bg-destructive/5" : undefined}>
                      <TableCell>
                        <RefLink
                          id={row.bookingId}
                          href={`${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${row.bookingId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <PersonCell name={row.mentorName} userId={row.mentorUserId} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <PersonCell name={row.buyerName} userId={row.buyerUserId} />
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs lg:table-cell">
                        {formatWhen(row.endsAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatWhen(row.feedbackDeadlineAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            row.sweepOverdue
                              ? "whitespace-nowrap text-xs font-semibold text-destructive"
                              : "whitespace-nowrap text-xs"
                          }
                        >
                          {formatHours(row.overdueHours)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.payoutHeld ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-amber-600">
                            <Lock className="size-3" aria-hidden="true" /> held
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {row.payoutStatus ? row.payoutStatus.toLowerCase() : "no payout"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  tone,
  icon,
  loading,
  onClick,
}: {
  label: string
  value?: number | string
  tone?: "good" | "warn"
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border p-3 text-left transition-colors hover:bg-accent"
    >
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={
          tone === "good"
            ? "mt-1 text-2xl font-semibold text-emerald-600"
            : tone === "warn"
              ? "mt-1 text-2xl font-semibold text-amber-600"
              : "mt-1 text-2xl font-semibold"
        }
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : (value ?? "—")}
      </p>
    </button>
  )
}
