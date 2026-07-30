/**
 * ─── ADMIN AUDIT TRAIL ───────────────────────────────────────────────────────
 *
 * Every administrative action against the tools platform — applied, rejected, replayed or held for
 * approval.
 *
 * **Append-only.** There is no edit or delete affordance anywhere on this page, and the database silently
 * discards both. An audit trail that can be edited is not an audit trail — which is also why the two-admin
 * approval flow appends a second row pointing back at the first rather than flipping a status on it.
 *
 * Readable with any of the three tools-admin permissions: the trail records actions across all of them, so
 * gating it on credits alone would hide a rubric publication from the person who published it.
 */

"use client"

import React from "react"
import { Fingerprint } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TableCell, TableRow } from "@/components/ui/table"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchToolAudit } from "./api/tools-admin.api"
import { useToolAuditRow } from "./api/tools-admin.hooks"
import type { AdminAuditRow } from "./api/tools-admin.types"
import {
  ConstraintNote,
  CreditDelta,
  IdCell,
  OutcomeBadge,
  ScreenHeader,
  formatDateTime,
  shortHash,
} from "./components/tools-admin-shared"

const AUDIT_FILTER_CONFIG: FilterConfig = {
  entityLabel: "Audit rows",
  searchableFields: ["adminUserId", "targetUserId", "entryId", "runId", "batchId", "reason"],
  filterFields: [
    { field: "adminUserId", label: "Acting admin", type: "STRING", operators: ["EQUALS", "LIKE"] },
    { field: "approvedByAdminId", label: "Approved by", type: "STRING", operators: ["EQUALS"] },
    { field: "targetUserId", label: "Target user", type: "STRING", operators: ["EQUALS", "LIKE"] },
    { field: "entryId", label: "Ledger entry", type: "STRING", operators: ["EQUALS"] },
    { field: "runId", label: "Run", type: "STRING", operators: ["EQUALS"] },
    { field: "batchId", label: "Batch", type: "STRING", operators: ["EQUALS"] },
    {
      field: "action",
      label: "Action",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      options: [
        { label: "Add credits", value: "ADD_CREDITS" },
        { label: "Remove credits", value: "REMOVE_CREDITS" },
        { label: "Refund", value: "REFUND" },
        { label: "Revoke", value: "REVOKE" },
        { label: "Bulk grant", value: "BULK_GRANT" },
        { label: "Refund run", value: "REFUND_RUN" },
        { label: "Set free quota", value: "SET_FREE_QUOTA" },
        { label: "Force-release hold", value: "FORCE_RELEASE_HOLD" },
        { label: "Mark abuse", value: "MARK_ABUSE" },
        { label: "Revoke tools access", value: "REVOKE_TOOL_ACCESS" },
        { label: "Whitelist subject", value: "WHITELIST_SUBJECT" },
        { label: "Decline adjustment", value: "DECLINE_ADJUSTMENT" },
      ],
    },
    {
      field: "outcome",
      label: "Outcome",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      options: [
        { label: "Applied", value: "APPLIED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Replayed", value: "REPLAYED" },
        { label: "Awaiting approval", value: "PENDING_APPROVAL" },
      ],
    },
    {
      field: "reasonCode",
      label: "Reason code",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      options: [
        { label: "Support goodwill", value: "SUPPORT_GOODWILL" },
        { label: "Campaign", value: "CAMPAIGN" },
        { label: "Migration", value: "MIGRATION" },
        { label: "Partner", value: "PARTNER" },
        { label: "Fraud", value: "FRAUD" },
        { label: "Payment refund", value: "PAYMENT_REFUND" },
        { label: "Internal testing", value: "INTERNAL_TESTING" },
        { label: "Other", value: "OTHER" },
      ],
    },
    { field: "parentAuditId", label: "Resolves", type: "STRING", operators: ["EQUALS"] },
    {
      field: "brand",
      label: "Brand",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Revquix", value: "REVQUIX" },
        { label: "Astro", value: "ASTRO" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "When", type: "INSTANT" },
    { field: "delta", label: "Credit movement", type: "INTEGER" },
  ],
  sortFields: [
    { field: "createdAt", label: "When" },
    { field: "action", label: "Action" },
    { field: "outcome", label: "Outcome" },
    { field: "delta", label: "Movement" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

const columns: DataColumn<AdminAuditRow>[] = [
  { key: "createdAt", header: "When", sortable: true },
  { key: "auditId", header: "Audit", sortable: false },
  { key: "action", header: "Action", sortable: true },
  { key: "adminUserId", header: "Admin", sortable: false },
  { key: "targetUserId", header: "Target", sortable: false },
  { key: "delta", header: "Movement", sortable: true },
  { key: "outcome", header: "Outcome", sortable: true },
  { key: "reason", header: "Reason", sortable: false, hideOnMobile: true },
]

export default function AdminToolAuditView() {
  const search = useGenericSearch<AdminAuditRow>({
    queryKey: "admin-tool-audit",
    searchFn: searchToolAudit,
    config: AUDIT_FILTER_CONFIG,
  })
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Admin audit trail"
        description="Who asked, why, and from where — for every administrative action against credits, runs, quotas, pricing and rubrics. The ledger records what changed; this records who asked."
      />

      <ConstraintNote>
        <strong>Append-only, with no exception.</strong> There is no edit or delete anywhere for this table
        and the database discards both silently. That is why a request held for a second administrator is
        resolved by a <em>new</em> row pointing back at the original rather than by changing its outcome —
        and why a rejection is recorded rather than dropped: a refusal that leaves no trace is how an admin
        ends up doing the same thing by hand in a psql session.
      </ConstraintNote>

      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(row) => row.auditId}
        onRowClick={(row) => setSelected(row.auditId)}
        renderRow={(row) => (
          <TableRow
            key={row.auditId}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setSelected(row.auditId)}
          >
            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDateTime(row.createdAt)}
            </TableCell>
            <TableCell>
              <IdCell value={row.auditId} />
            </TableCell>
            <TableCell className="text-xs">
              {row.action.replace(/_/g, " ").toLowerCase()}
              {row.parentAuditId && (
                <Badge variant="outline" className="ml-1.5 text-[10px]">
                  resolves {row.parentAuditId}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <IdCell value={row.adminUserId} />
              {row.approvedByAdminId && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  + {row.approvedByAdminId}
                </span>
              )}
            </TableCell>
            <TableCell>
              <IdCell value={row.targetUserId} />
            </TableCell>
            <TableCell>
              <CreditDelta delta={row.delta} />
            </TableCell>
            <TableCell>
              <OutcomeBadge outcome={row.outcome} />
            </TableCell>
            <TableCell className="hidden max-w-[20rem] truncate text-xs text-muted-foreground md:table-cell">
              {row.reason}
            </TableCell>
          </TableRow>
        )}
        emptyState={
          <div className="py-10 text-center">
            <p className="text-sm font-medium">No administrative actions recorded.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expected until the first adjustment is made. Every action from that point on appears here,
              including the ones that were refused.
            </p>
          </div>
        }
      />

      <AuditRowSheet auditId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

/**
 * The single-row read, which is the only place the original request payload is returned.
 *
 * Kept out of list responses on purpose: it is the full body of the original request, and a hundred of
 * them in one page would make the grid enormous for a field an operator reads one at a time.
 */
function AuditRowSheet({ auditId, onClose }: { auditId: string | null; onClose: () => void }) {
  const row = useToolAuditRow(auditId ?? "")

  return (
    <Sheet open={auditId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-hidden sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{auditId ?? ""}</SheetTitle>
          <SheetDescription>
            The verbatim request, so a dispute is reconstructed from what was asked rather than from what
            the resulting ledger row implies.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {row.isLoading && (
            <div className="h-40 animate-pulse rounded-md bg-muted" aria-hidden="true" />
          )}

          {row.data && (
            <div className="space-y-4 pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <OutcomeBadge outcome={row.data.outcome} />
                <Badge variant="outline" className="text-xs">
                  {row.data.action.replace(/_/g, " ").toLowerCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {row.data.reasonCode.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <Field label="Acting admin">
                  <IdCell value={row.data.adminUserId} />
                </Field>
                <Field label="Approved by">
                  <IdCell value={row.data.approvedByAdminId} />
                </Field>
                <Field label="Target user">
                  <IdCell value={row.data.targetUserId} />
                </Field>
                <Field label="Movement">
                  <CreditDelta delta={row.data.delta} />
                </Field>
                <Field label="Ledger entry">
                  <IdCell value={row.data.entryId} />
                </Field>
                <Field label="Run">
                  <IdCell value={row.data.runId} />
                </Field>
                <Field label="Batch">
                  <IdCell value={row.data.batchId} />
                </Field>
                <Field label="When">{formatDateTime(row.data.createdAt)}</Field>
              </dl>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Reason</h3>
                <p className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
                  {row.data.reason}
                </p>
                {row.data.rejectionReason && (
                  <p className="text-xs text-destructive">
                    Rejected: {row.data.rejectionReason}
                  </p>
                )}
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
                  Provenance
                </h3>
                <p className="text-xs">
                  IP hash:{" "}
                  <span className="font-mono">{shortHash(row.data.adminIpHash, 20)}</span>
                </p>
                <p className="text-xs break-all text-muted-foreground">
                  {row.data.userAgent ?? "No user agent recorded."}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  A daily-salted hash, never an address — the same rule that applies to end users applies
                  here. To check a suspected origin, hash that address for this day from the run inspector
                  and compare.
                </p>
              </section>

              <Separator />

              <section className="space-y-1">
                <h3 className="text-sm font-semibold">Original request</h3>
                <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed">
                  {JSON.stringify(row.data.requestPayload ?? {}, null, 2)}
                </pre>
              </section>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}
