"use client"

/**
 * ─── ADMIN ACTION AUDIT ───────────────────────────────────────────────────────
 *
 * Every administrative write against the Professional Mentor subsystem, in one place.
 *
 * <h3>Why this overlaps the trails that already existed</h3>
 * Disputes have `dispute_audit`; payouts have `payout_audit_log`. Those answer *"what happened to
 * this record"* and are read on the record's own page. This answers *"what did anyone do"* — a
 * question neither can, because it spans them. Everything else an admin could do wrote nothing at
 * all: force-completing a booking (which releases a payout), hiding a review (which changes a public
 * rating), retuning a pricing zone, rebuilding the search index, suspending a listing.
 *
 * <h3>Failures are shown, not filtered out</h3>
 * An attempt that was refused is often the more interesting row — somebody repeatedly trying
 * something the server keeps rejecting is a signal, and it is invisible if only successes are kept.
 */

import { useMemo } from "react"
import { ShieldCheck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters"
import { searchAudit } from "@/features/mentorship-v2/api/ops.api"
import type { AdminAuditRow } from "@/features/mentorship-v2/api/ops.types"
import { PersonCell, formatWhen } from "./console-format"

const AUDIT_FILTER_CONFIG: FilterConfig = {
  key: "pm-audit",
  entityLabel: "Admin actions",
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 25,
  searchableFields: ["actorUserId", "targetId"],
  filterFields: [
    { field: "action", label: "Action", type: "STRING", operators: ["EQUALS"], allowSort: true },
    { field: "actorUserId", label: "Admin user id", type: "STRING", operators: ["EQUALS"] },
    {
      field: "targetType",
      label: "Target type",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Booking", value: "BOOKING" },
        { label: "Service", value: "SERVICE" },
        { label: "Review", value: "REVIEW" },
        { label: "Pricing zone", value: "PRICING_ZONE" },
        { label: "Country", value: "COUNTRY" },
        { label: "Job", value: "JOB" },
        { label: "Search", value: "SEARCH" },
        { label: "Semantic", value: "SEMANTIC" },
      ],
    },
    { field: "targetId", label: "Target id", type: "STRING", operators: ["EQUALS"] },
    {
      field: "succeeded",
      label: "Outcome",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Succeeded", value: true },
        { label: "Refused", value: false },
      ],
    },
  ],
  rangeFields: [
    { field: "createdAt", label: "When", type: "INSTANT", allowRange: true, allowSort: true },
  ],
  sortFields: [
    { field: "createdAt", label: "When" },
    { field: "action", label: "Action" },
  ],
}

export default function AuditView() {
  const search = useGenericSearch<AdminAuditRow>({
    queryKey: "pm-audit",
    searchFn: searchAudit,
    config: AUDIT_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<AdminAuditRow>[]>(
    () => [
      {
        key: "createdAt",
        header: "When",
        sortable: true,
        render: (row) => <span className="whitespace-nowrap text-xs">{formatWhen(row.createdAt)}</span>,
      },
      {
        key: "action",
        header: "Action",
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="text-sm font-medium">{row.actionLabel}</p>
            {!row.succeeded ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive">
                <XCircle className="size-3" aria-hidden="true" /> refused
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "actor",
        header: "Admin",
        render: (row) => <PersonCell name={row.actorName} userId={row.actorUserId} />,
      },
      {
        key: "target",
        header: "Target",
        render: (row) =>
          row.targetId ? (
            <div className="min-w-0">
              <span className="font-mono text-xs">{row.targetId}</span>
              {row.targetType ? (
                <p className="text-[10px] text-muted-foreground">{row.targetType.toLowerCase()}</p>
              ) : null}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.targetType ? row.targetType.toLowerCase() : "platform-wide"}
            </span>
          ),
      },
      {
        key: "reason",
        header: "Reason",
        hideOnMobile: true,
        render: (row) => (
          <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
            {row.reason ?? "—"}
          </span>
        ),
      },
      {
        key: "detail",
        header: "Detail",
        hideOnMobile: true,
        render: (row) => {
          if (row.error) {
            return <span className="font-mono text-[10px] text-destructive">{row.error}</span>
          }
          if (!row.detail || Object.keys(row.detail).length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>
          }
          return (
            <div className="flex max-w-[320px] flex-wrap gap-1">
              {Object.entries(row.detail).map(([key, value]) => (
                <Badge key={key} variant="outline" className="h-4 px-1 text-[10px] font-normal">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="size-5" /> Admin action audit
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every administrative write against this subsystem — force-completions, review moderation,
          pricing edits, reindexes, suspensions, manual sweeps. Append-only at the database: the
          table carries rules that rewrite UPDATE and DELETE to do nothing.
        </p>
      </header>

      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(row) => row.auditId}
        title="Actions"
        description="Newest first. Refused attempts are kept — somebody repeatedly trying something the server rejects is a signal."
      />
    </div>
  )
}
