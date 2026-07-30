/**
 * ─── SCREEN 3: RUN INSPECTOR (§8.3) ──────────────────────────────────────────
 *
 * "Check all the runs with the IP and all."
 *
 * **The IP rule governs half this screen, so read it before changing anything here.** The stored value
 * is `ip_hash = sha256(ip + dailySalt)` — never an address. So this console *cannot* display an IP and
 * must not pretend to. What it does instead is what abuse triage actually needs:
 *
 *   (a) group and count runs by hash within a day,
 *   (b) "show every run sharing this run's hash" as a one-click pivot — an ordinary filter,
 *   (c) a hash-lookup box: paste an address from a Cloudflare log, the **server** hashes it with that
 *       day's salt, and the grid filters on the result.
 *
 * Because the salt rotates daily, cross-day correlation is impossible. The console states that in plain
 * language rather than showing an empty result — §8.9 criterion 6.
 */

"use client"

import React from "react"
import { Fingerprint, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchToolRuns } from "./api/tools-admin.api"
import { useLookupIpHash } from "./api/tools-admin.hooks"
import type { AdminRunRow } from "./api/tools-admin.types"
import { RunDetailPanel } from "./components/run-detail-panel"
import {
  ConstraintNote,
  IdCell,
  RunStatusBadge,
  ScreenHeader,
  SectionCard,
  formatDateTime,
  formatNumber,
  formatPaise,
  shortHash,
} from "./components/tools-admin-shared"

const RUN_FILTER_CONFIG: FilterConfig = {
  entityLabel: "Tool runs",
  searchableFields: ["runId", "userId", "anonId", "toolKey", "idempotencyKey"],
  filterFields: [
    { field: "runId", label: "Run ID", type: "STRING", operators: ["EQUALS"] },
    { field: "toolKey", label: "Tool", type: "STRING", operators: ["EQUALS", "LIKE"] },
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Running", value: "RUNNING" },
        { label: "Succeeded", value: "SUCCEEDED" },
        { label: "Failed", value: "FAILED" },
        { label: "Timed out", value: "TIMED_OUT" },
        { label: "Rejected", value: "REJECTED" },
      ],
    },
    { field: "userId", label: "User ID", type: "STRING", operators: ["EQUALS", "LIKE"] },
    { field: "anonId", label: "Anonymous ID", type: "STRING", operators: ["EQUALS"] },
    // The pivot. Filterable, never searchable: a substring of a hash is meaningless, and putting a
    // 64-character opaque value in front of every free-text query would match nothing, ever.
    { field: "ipHash", label: "IP hash (same-day only)", type: "STRING", operators: ["EQUALS"] },
    {
      field: "servedFromCache",
      label: "Cache hit",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Served from cache", value: true },
        { label: "Computed", value: false },
      ],
    },
    { field: "errorCode", label: "Error code", type: "STRING", operators: ["EQUALS", "IS_NOT_NULL"] },
    { field: "provider", label: "Provider", type: "STRING", operators: ["EQUALS"] },
    { field: "model", label: "Model", type: "STRING", operators: ["EQUALS"] },
    { field: "rubricVersion", label: "Rubric version", type: "STRING", operators: ["EQUALS"] },
    { field: "promptVersion", label: "Prompt version", type: "STRING", operators: ["EQUALS"] },
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
    { field: "createdAt", label: "Run date", type: "INSTANT" },
    { field: "creditsHeld", label: "Credits held", type: "INTEGER" },
    { field: "costMicroUsd", label: "Cost (µUSD)", type: "LONG" as never },
    { field: "latencyMs", label: "Latency (ms)", type: "INTEGER" },
  ],
  sortFields: [
    { field: "createdAt", label: "Run date" },
    { field: "status", label: "Status" },
    { field: "toolKey", label: "Tool" },
    { field: "latencyMs", label: "Latency" },
    { field: "costMicroUsd", label: "Cost" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

const columns: DataColumn<AdminRunRow>[] = [
  { key: "createdAt", header: "When", sortable: true },
  { key: "runId", header: "Run", sortable: false },
  { key: "toolKey", header: "Tool", sortable: true },
  { key: "subject", header: "Subject", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "creditsHeld", header: "Credits", sortable: true },
  { key: "cost", header: "Cost", sortable: true, hideOnMobile: true },
  { key: "latencyMs", header: "Latency", sortable: true, hideOnMobile: true },
  { key: "ipHash", header: "IP hash", sortable: false, hideOnMobile: true },
]

export default function AdminToolRunsView() {
  const search = useGenericSearch<AdminRunRow>({
    queryKey: "admin-tool-runs",
    searchFn: searchToolRuns,
    config: RUN_FILTER_CONFIG,
  })

  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null)

  const pivotOnHash = React.useCallback(
    (hash: string) => {
      search.addFilter({ field: "ipHash", operator: "EQUALS", value: hash })
    },
    [search],
  )

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Tool runs"
        description="Every tool execution with its cost, cache state, latency and outcome. Filter by tool, status, subject or IP hash; open a run for its timeline, its redacted input and its ledger entries."
      />

      <IpHashLookupBox onPivot={pivotOnHash} />

      <ConstraintNote>
        <strong>IP hashes, not IP addresses.</strong> The platform stores{" "}
        <code>sha256(ip + dailySalt)</code> and never an address, so this console cannot show you one.
        Clicking a hash pivots to every run that shares it <em>on the same UTC day</em> — the salt
        rotates daily, so two days&apos; hashes for one address are unrelated values and no query could
        join them. That is a design property, not a gap: an empty result means the address was not seen
        that day.
      </ConstraintNote>

      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(run) => run.runId}
        onRowClick={(run) => setSelectedRunId(run.runId)}
        renderRow={(run) => (
          <TableRow
            key={run.runId}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setSelectedRunId(run.runId)}
          >
            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDateTime(run.createdAt)}
            </TableCell>
            <TableCell>
              <IdCell value={run.runId} />
            </TableCell>
            <TableCell className="text-xs">
              {run.toolKey.replace(/_/g, " ").toLowerCase()}
              {run.servedFromCache && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-1.5 cursor-default text-[10px]">
                      cached
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Answered from a stored report for an identical input, so it cost nothing and the
                      user was not charged. Expected on 20–30% of calls.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TableCell>
            <TableCell className="text-xs">
              {run.userId ? (
                <IdCell value={run.userId} />
              ) : (
                <span className="text-muted-foreground">
                  anon <IdCell value={shortHash(run.anonId, 8)} className="text-[10px]" />
                </span>
              )}
            </TableCell>
            <TableCell>
              <RunStatusBadge status={run.status} />
              {run.errorCode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1.5 cursor-default font-mono text-[10px] text-amber-600 dark:text-amber-400">
                      {run.errorCode}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {run.status === "SUCCEEDED"
                        ? "The run succeeded but degraded — the user got a thinner report, with a 200."
                        : "The run failed with this code."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TableCell>
            <TableCell className="text-xs tabular-nums">
              {run.creditsHeld}
              {run.hasOpenHold && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-default text-[10px] text-amber-600 dark:text-amber-400">
                      open
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Credits are still reserved — neither charged nor returned. Open the run to
                      force-release the hold.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TableCell>
            <TableCell className="hidden text-xs tabular-nums text-muted-foreground md:table-cell">
              {formatPaise(run.costPaise)}
            </TableCell>
            <TableCell className="hidden text-xs tabular-nums text-muted-foreground md:table-cell">
              {run.latencyMs === null ? "—" : `${formatNumber(run.latencyMs)} ms`}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {run.ipHash ? (
                <button
                  type="button"
                  className="rounded font-mono text-[10px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation()
                    pivotOnHash(run.ipHash as string)
                  }}
                  title="Show every run sharing this hash on the same UTC day"
                >
                  {shortHash(run.ipHash)}
                </button>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        )}
        emptyState={
          <div className="py-10 text-center">
            <p className="text-sm font-medium">No runs match this filter.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No tool has been launched yet, so an empty table is the expected state rather than a
              fault. If you filtered on an IP hash, remember it only matches within the day it was
              computed.
            </p>
          </div>
        }
      />

      <RunDetailPanel
        runId={selectedRunId}
        onClose={() => setSelectedRunId(null)}
        onPivotIpHash={pivotOnHash}
      />
    </div>
  )
}

/**
 * §8.3's hash-lookup box.
 *
 * The address is posted in a **body**, not a query string: a query string lands in access logs, browser
 * history and any proxy in between, which would reintroduce exactly the exposure the hashing design
 * exists to remove. The response does not echo it back either.
 */
function IpHashLookupBox({ onPivot }: { onPivot: (hash: string) => void }) {
  const lookup = useLookupIpHash()
  const [ip, setIp] = React.useState("")
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))

  return (
    <SectionCard
      title="Look up an IP address"
      description="For an address you already hold from a Cloudflare log or an abuse report. The server hashes it; the address itself is neither stored nor logged."
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ip-lookup-address">IP address</Label>
            <Input
              id="ip-lookup-address"
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              placeholder="203.0.113.42"
              className="font-mono"
              aria-describedby="ip-lookup-help"
            />
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label htmlFor="ip-lookup-date">UTC day</Label>
            <Input
              id="ip-lookup-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={lookup.isPending || !ip.trim()}
            onClick={() => lookup.mutate({ ip: ip.trim(), utcDate: date })}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {lookup.isPending ? "Hashing…" : "Hash & search"}
          </Button>
        </div>

        <p id="ip-lookup-help" className="text-xs text-muted-foreground">
          The day is required in effect, because the salt rotates daily — a lookup without one could only
          ever answer &ldquo;was this address active today&rdquo;, and an abuse report almost always
          concerns a past day.
        </p>

        {lookup.data && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="font-mono text-xs break-all">{lookup.data.ipHash}</span>
              <Button size="sm" variant="outline" onClick={() => onPivot(lookup.data.ipHash)}>
                Filter runs by this hash
              </Button>
            </div>
            <p className="text-xs">
              <strong>{lookup.data.matchingRuns}</strong> run(s) from{" "}
              <strong>{lookup.data.distinctSubjects}</strong> distinct subject(s) on{" "}
              {lookup.data.utcDate}.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {lookup.data.correlationNote}
            </p>
            {!lookup.data.saltConfigured && (
              <p role="alert" className="text-xs text-amber-600 dark:text-amber-400">
                The IP salt is not configured in this environment, so this hash was computed with the
                development fallback and will not match anything a properly configured environment
                recorded.
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
