/**
 * ─── SCREEN 4: SPEND & COST DASHBOARD (§8.4) ──────────────────────────────────
 *
 * **Why this screen exists when the ceiling already protects us:** because the ceiling *degrades* rather
 * than fails. On breach, runs are served from the deterministic layers with `RQ-TL-08` attached as a
 * warning and a 200 status — a user gets a thinner report, never an error. That is the right product
 * behaviour and it means a breach is completely invisible from the outside. Without this gauge, the
 * first sign that the AI layer had been off for a week would be a drop in conversion nobody could
 * explain.
 *
 * No chart library. Every visual here is a hand-rolled bar — see `MiniBar`. `recharts` is in this
 * repo's dependency tree and is deliberately not imported: ~90 KB gzipped rendering on the JS thread,
 * for a bar that is one div with a width. P2, P5 and P6 each made the same call.
 */

"use client"

import React from "react"
import { AlertTriangle, CalendarRange, TrendingDown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToolSpend } from "./api/tools-admin.hooks"
import {
  ConstraintNote,
  MiniBar,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatDate,
  formatNumber,
  formatPaise,
  formatPercent,
} from "./components/tools-admin-shared"

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

export default function AdminToolSpendView() {
  const [from, setFrom] = React.useState(() => isoDaysAgo(29))
  const [to, setTo] = React.useState(() => isoDaysAgo(0))
  const spend = useToolSpend({ from, to })

  const data = spend.data
  const maxDailyCost = React.useMemo(
    () => Math.max(1, ...(data?.daily.map((d) => d.costPaise) ?? [1])),
    [data],
  )

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Spend & cost"
        description="Cost per day, per tool and per model against the configured daily ceiling, with the dedupe hit ratio, the cached-token share and the p95 cost per run. Every figure is derived from tool_run's integer micro-USD column — the same column the ceiling itself sums."
        actions={
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="spend-from" className="text-xs">
                From
              </Label>
              <Input
                id="spend-from"
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
                className="h-9 w-[9.5rem]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="spend-to" className="text-xs">
                To
              </Label>
              <Input
                id="spend-to"
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
                className="h-9 w-[9.5rem]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom(isoDaysAgo(29))
                setTo(isoDaysAgo(0))
              }}
            >
              <CalendarRange className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Last 30 days
            </Button>
          </div>
        }
      />

      {spend.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted/40" aria-hidden="true" />
          ))}
        </div>
      )}

      {spend.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load the dashboard</AlertTitle>
          <AlertDescription>
            A range longer than 180 days is refused — aggregating longer periods is a reporting job, not a
            dashboard read. Narrow the dates and try again.
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* ── Today's ceiling ── */}
          <SectionCard
            title="Today's spend against the ceiling"
            description="A breach degrades runs to the deterministic layers with a 200 and an RQ-TL-08 warning. Users see a thinner report, never an error — which is why this gauge is the only place a breach is visible."
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {formatPaise(data.ceiling.spentPaise)}
                </span>
                <span className="text-sm text-muted-foreground">
                  of ${data.ceiling.ceilingUsd.toFixed(2)} · {formatPercent(data.ceiling.percentUsed)}{" "}
                  used
                </span>
                {data.ceiling.breached ? (
                  <Badge variant="destructive" className="text-xs">
                    ceiling reached — Layer 1 only
                  </Badge>
                ) : data.ceiling.warning ? (
                  <Badge variant="secondary" className="text-xs">
                    above 80% — worth a look
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    healthy
                  </Badge>
                )}
              </div>
              <Progress value={Math.min(100, data.ceiling.percentUsed)} className="h-3" />
              {data.ceiling.breached && (
                <ConstraintNote tone="warning">
                  The daily ceiling has been reached. Runs are still succeeding, but the narrative layer
                  is off and reports are thinner than usual. Nothing is failing and nobody is being
                  charged for a partial report — this is the designed degradation, and it clears at
                  midnight UTC.
                </ConstraintNote>
              )}
            </div>
          </SectionCard>

          {/* ── Totals ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Runs" value={formatNumber(data.totals.runs)} hint={`${formatDate(data.from)} – ${formatDate(data.to)}`} />
            <StatCard label="Total cost" value={formatPaise(data.totals.costPaise)} />
            <StatCard
              label="Dedupe hit rate"
              value={formatPercent(data.totals.cacheHitPercent)}
              hint="Target ≥ 15% — validates the cache design"
              tone={data.totals.cacheHitPercent >= 15 ? "positive" : "warning"}
            />
            <StatCard
              label="Cached token share"
              value={formatPercent(data.totals.cachedTokenPercent)}
              hint="A falling share is the earliest signal of prompt bloat"
              tone={data.totals.cachedTokenPercent >= 50 ? "positive" : "warning"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Failure rate"
              value={formatPercent(data.totals.failurePercent)}
              tone={data.totals.failurePercent > 10 ? "danger" : "default"}
            />
            <StatCard
              label="Degradation rate"
              value={formatPercent(data.totals.degradedPercent)}
              hint="Succeeded, but with a thinner report"
              tone={data.totals.degradedPercent > 20 ? "warning" : "default"}
            />
            <StatCard
              label="Embedding failures"
              value={data.embeddingUnavailableCount === null ? "no signal" : formatNumber(data.embeddingUnavailableCount)}
              hint="Reported as unknown rather than healthy until a Layer-2 tool ships (P16)"
            />
          </div>

          {/* ── Per-tool table ── */}
          <SectionCard
            title="Per tool"
            description="Ordered by spend. The percentiles exclude cache hits and free runs — including them would drag the median toward zero exactly when the cache is doing well."
          >
            {data.tools.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No runs in this range. No tool is launched yet, so this is the expected state.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="w-40">Dedupe hits</TableHead>
                      <TableHead className="text-right">Median / p95</TableHead>
                      <TableHead className="text-right">Fail / degraded</TableHead>
                      <TableHead className="text-right">p95 latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tools.map((tool) => (
                      <TableRow key={tool.toolKey}>
                        <TableCell className="text-xs font-medium">
                          {tool.toolKey.replace(/_/g, " ").toLowerCase()}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatNumber(tool.runs)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatPaise(tool.costPaise)}
                        </TableCell>
                        <TableCell>
                          <MiniBar
                            percent={tool.cacheHitPercent}
                            tone={tool.cacheBelowTarget ? "warning" : "positive"}
                            label={`${tool.cacheHitPercent.toFixed(1)} percent of runs served from cache`}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatPaise(tool.medianCostPaise)} /{" "}
                          {tool.aboveCostTarget ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default text-amber-600 dark:text-amber-400">
                                  {formatPaise(tool.p95CostPaise)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Above the ₹0.15 per-run target. A mean would hide this — the expensive
                                  tail is what actually costs money.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            formatPaise(tool.p95CostPaise)
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatPercent(tool.failurePercent)} / {formatPercent(tool.degradedPercent)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatNumber(tool.p95LatencyMs)} ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* ── Daily bars ── */}
          <SectionCard
            title="Cost by day"
            description="Days with no runs are explicit zeroes — a gap in a time series is ambiguous, and a sparse series silently rescales a chart's axis."
          >
            {data.daily.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No days in range.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.daily.map((day) => (
                  <li key={day.day} className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-muted-foreground">{formatDate(day.day)}</span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                          style={{ width: `${(day.costPaise / maxDailyCost) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 shrink-0 text-right tabular-nums">
                      {formatPaise(day.costPaise)}
                    </span>
                    <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">
                      {formatNumber(day.runs)} run(s)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Model mix ── */}
            <SectionCard
              title="Provider & model mix"
              description="A model here that nobody configured is the point of the panel."
            >
              {data.models.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No runs in range.</p>
              ) : (
                <ul className="space-y-2">
                  {data.models.map((model) => (
                    <li
                      key={`${model.provider}-${model.model}`}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-mono">
                        {model.provider} / {model.model}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(model.runs)} run(s) · {formatPaise(model.costPaise)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* ── Why runs degraded ── */}
            <SectionCard
              title="Why runs failed or degraded"
              description="Without the reason a degradation rate is unactionable: RQ-TL-08 is our own budget, RQ-TL-06 is the provider — opposite responses."
            >
              {data.errors.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No failures or degradations in range.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.errors.map((error) => (
                    <li key={error.errorCode} className="flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono">{error.errorCode}</span>
                        <p className="text-muted-foreground">{error.label}</p>
                      </div>
                      <span className="shrink-0 tabular-nums">{formatNumber(error.runs)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <ConstraintNote>
            <TrendingDown className="mr-1 inline h-3 w-3" aria-hidden="true" />
            Costs are stored as integer micro-USD and converted here from a single configured rate
            ({data.microUsdPerPaise} µUSD per paise), so the ceiling gauge and the per-run figures cannot
            disagree about the exchange rate. Integer arithmetic end to end is why the ceiling can be
            summed on every run without drifting.
          </ConstraintNote>
        </>
      )}
    </div>
  )
}
