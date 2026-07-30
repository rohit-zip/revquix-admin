/**
 * ─── SCREEN 1: CREDIT LEDGER BROWSER (§8.1) ──────────────────────────────────
 *
 * **This grid never edits.** Not a UI limitation — `tools.credit_ledger` is append-only at the
 * database, with `DO INSTEAD NOTHING` rules on UPDATE and DELETE. A correction is a new row, written
 * from Screen 2. There is deliberately no edit affordance anywhere on this page.
 *
 * Filtering runs through the existing generic engine (`useGenericSearch` + `DataExplorer`), the same
 * machinery `admin-payments-view` uses, against a server-side `@FilterField` whitelist. That whitelist
 * is what stops an admin console from becoming an arbitrary-column query surface over a financial
 * table.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { Download, ExternalLink, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { searchCreditLedger } from "./api/tools-admin.api"
import { useExportCreditLedger, useResolveCreditUser } from "./api/tools-admin.hooks"
import type { AdminLedgerEntry } from "./api/tools-admin.types"
import {
  ConstraintNote,
  CreditDelta,
  EntryTypeBadge,
  IdCell,
  ScreenHeader,
  formatDateTime,
} from "./components/tools-admin-shared"

// ─── Filter configuration ────────────────────────────────────────────────────
//
// Every field here must be annotated @FilterField on the CreditLedger entity, or FilterService
// returns a 400 naming the allowed set. `balanceAfter` is deliberately absent from both sides: it is
// an advisory snapshot that can legitimately disagree with the running total under concurrent grants,
// so filtering or sorting on it would invite conclusions drawn from a value the codebase everywhere
// else says must never be read for logic.

const LEDGER_FILTER_CONFIG: FilterConfig = {
  entityLabel: "Ledger entries",
  searchableFields: ["entryId", "userId", "refId", "idempotencyKey", "actorId", "note"],
  filterFields: [
    { field: "userId", label: "User ID", type: "STRING", operators: ["EQUALS", "LIKE"] },
    {
      field: "entryType",
      label: "Entry type",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      options: [
        { label: "Signup grant", value: "SIGNUP_GRANT" },
        { label: "Grant", value: "GRANT" },
        { label: "Earn", value: "EARN" },
        { label: "Purchase", value: "PURCHASE" },
        { label: "Hold", value: "HOLD" },
        { label: "Run charged (commit)", value: "DEBIT_COMMIT" },
        { label: "Hold released", value: "HOLD_RELEASE" },
        { label: "Refund", value: "REFUND" },
        { label: "Admin adjust", value: "ADMIN_ADJUST" },
        { label: "Expiry", value: "EXPIRY" },
        { label: "Revoke", value: "REVOKE" },
      ],
    },
    {
      field: "refType",
      label: "Reference type",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Tool run", value: "TOOL_RUN" },
        { label: "Payment intent", value: "PAYMENT_INTENT" },
        { label: "Referral", value: "REFERRAL" },
        { label: "Admin", value: "ADMIN" },
        { label: "Pass", value: "PASS" },
        { label: "Ledger entry", value: "LEDGER_ENTRY" },
      ],
    },
    {
      field: "actorType",
      label: "Actor",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "System", value: "SYSTEM" },
        { label: "User", value: "USER" },
        { label: "Admin", value: "ADMIN" },
      ],
    },
    { field: "actorId", label: "Acting admin", type: "STRING", operators: ["EQUALS", "LIKE"] },
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
    { field: "refId", label: "Reference ID", type: "STRING", operators: ["EQUALS", "LIKE"] },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Entry date", type: "INSTANT" },
    { field: "delta", label: "Credit movement", type: "INTEGER" },
  ],
  sortFields: [
    { field: "createdAt", label: "Entry date" },
    { field: "delta", label: "Credit movement" },
    { field: "entryType", label: "Entry type" },
    { field: "userId", label: "User" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

const columns: DataColumn<AdminLedgerEntry>[] = [
  { key: "createdAt", header: "When", sortable: true },
  { key: "entryId", header: "Entry", sortable: false },
  { key: "userId", header: "User", sortable: true },
  { key: "entryType", header: "Type", sortable: true },
  { key: "delta", header: "Movement", sortable: true },
  { key: "balanceAfter", header: "Balance after", sortable: false, hideOnMobile: true },
  { key: "ref", header: "Reference", sortable: false, hideOnMobile: true },
  { key: "actor", header: "Actor", sortable: false, hideOnMobile: true },
  { key: "note", header: "Statement note", sortable: false, hideOnMobile: true },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminToolCreditsView() {
  const router = useRouter()
  const search = useGenericSearch<AdminLedgerEntry>({
    queryKey: "admin-tool-credit-ledger",
    searchFn: searchCreditLedger,
    config: LEDGER_FILTER_CONFIG,
  })

  const exportCsv = useExportCreditLedger()
  const resolveUser = useResolveCreditUser()
  const [identifier, setIdentifier] = React.useState("")

  /**
   * Resolves an email or username to a user id, then applies it as a filter.
   *
   * §8.1's filter offers "user (id / email / name)" while the ledger stores only an id. Resolving first
   * avoids a cross-schema join on a financial table and — the part that matters operationally — shows
   * the operator which account they landed on, which is exactly what they need to see when two people
   * share a name.
   */
  const handleResolve = React.useCallback(() => {
    const trimmed = identifier.trim()
    if (!trimmed) return
    resolveUser.mutate(trimmed, {
      onSuccess: (result) => {
        if (result.resolved) {
          search.addFilter({ field: "userId", operator: "EQUALS", value: result.userId })
          setIdentifier(result.userId)
        }
      },
    })
  }, [identifier, resolveUser, search])

  const resolvedUserId = React.useMemo(() => {
    const filter = search.filters.find((f) => f.field === "userId" && f.operator === "EQUALS")
    return typeof filter?.value === "string" ? filter.value : null
  }, [search.filters])

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Credit ledger"
        description="Every credit movement on the platform, newest first. Read-only by design — the ledger is append-only at the database, so a correction is a new row written from the adjustment screen."
        actions={
          <>
            {resolvedUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`${PATH_CONSTANTS.ADMIN_TOOL_CREDITS}/users/${resolvedUserId}`)
                }
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Open {resolvedUserId}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={exportCsv.isPending}
              onClick={() =>
                exportCsv.mutate({
                  searchCriteria: search.searchTerms.length ? search.searchTerms : undefined,
                  filters: search.filters.length ? search.filters : undefined,
                  rangeFilters: search.rangeFilters.length ? search.rangeFilters : undefined,
                  sort: search.sort.length ? search.sort : undefined,
                })
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {exportCsv.isPending ? "Preparing…" : "Export CSV"}
            </Button>
            <Button size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_TOOL_CREDITS_ADJUST)}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Adjust credits
            </Button>
          </>
        }
      />

      {/* User resolution, above the grid, because it changes what the grid shows. */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ledger-user-identifier">Find a user by ID, email or username</Label>
            <Input
              id="ledger-user-identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleResolve()
                }
              }}
              placeholder="USR0000000123 or priya@example.com"
              aria-describedby="ledger-user-identifier-help"
            />
            <p id="ledger-user-identifier-help" className="text-xs text-muted-foreground">
              The ledger stores only user IDs, so an email is resolved to one first and then applied as
              a filter — you will see which account it matched.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleResolve}
            disabled={resolveUser.isPending || !identifier.trim()}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {resolveUser.isPending ? "Resolving…" : "Resolve & filter"}
          </Button>
        </div>
        {resolveUser.data && !resolveUser.data.resolved && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            No account matches &ldquo;{resolveUser.data.identifier}&rdquo;.
          </p>
        )}
      </div>

      <ConstraintNote>
        <strong>Balance after</strong> is an advisory snapshot written best-effort inside the same
        transaction as the insert. Under concurrent grants two rows can legitimately disagree about the
        running total while <code>SUM(delta)</code> stays exactly right — so never reconcile against
        that column. It is shown because it is useful in a support conversation, not because it is
        authoritative. Open a user to see their computed balance.
      </ConstraintNote>

      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(entry) => entry.entryId}
        renderRow={(entry) => (
          <TableRow
            key={entry.entryId}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() =>
              router.push(`${PATH_CONSTANTS.ADMIN_TOOL_CREDITS}/users/${entry.userId}`)
            }
          >
            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDateTime(entry.createdAt)}
            </TableCell>
            <TableCell>
              <IdCell value={entry.entryId} />
              {entry.adminAuditId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1.5 cursor-default text-[10px] text-amber-600 dark:text-amber-400">
                      admin
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      An administrative action produced this row. Audit {entry.adminAuditId}.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TableCell>
            <TableCell>
              <IdCell value={entry.userId} />
            </TableCell>
            <TableCell>
              <EntryTypeBadge type={entry.entryType} />
            </TableCell>
            <TableCell>
              <CreditDelta delta={entry.delta} />
            </TableCell>
            <TableCell className="hidden text-xs tabular-nums text-muted-foreground md:table-cell">
              {entry.balanceAfter ?? "—"}
            </TableCell>
            <TableCell className="hidden text-xs md:table-cell">
              {entry.refType ? (
                <span className="text-muted-foreground">
                  {entry.refType.replace(/_/g, " ").toLowerCase()}
                  {entry.refId && (
                    <>
                      {" "}
                      <span className="font-mono">{entry.refId}</span>
                    </>
                  )}
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden text-xs md:table-cell">
              <span className="text-muted-foreground">{entry.actorType.toLowerCase()}</span>
              {entry.actorId && (
                <>
                  {" "}
                  <IdCell value={entry.actorId} className="text-[10px]" />
                </>
              )}
            </TableCell>
            <TableCell className="hidden max-w-[18rem] truncate text-xs text-muted-foreground md:table-cell">
              {entry.note ?? "—"}
            </TableCell>
          </TableRow>
        )}
        emptyState={
          <div className="py-10 text-center">
            <p className="text-sm font-medium">No ledger entries match this filter.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The ledger is empty until the tools platform is enabled and the first credit moves. Until
              then this is the expected state, not a fault.
            </p>
          </div>
        }
      />
    </div>
  )
}
