/**
 * ─── MENTORSHIP V2 (PHASE 0) VERIFICATION VIEW ──────────────────────────────
 *
 * Admin-only visual verification page for Professional Mentor V2 Phase 0.
 * Lets the CTO confirm what Phase 0 actually built without reading code or
 * running SQL by hand:
 *   1. System Health — schema/extension reachability, seeded row counts,
 *      the app.mentorship.v2 feature-flag state, and the phase ship-history strip.
 *   2. Pricing Zones & FX — every seeded mentorship.pricing_zone row with its
 *      mapped countries, and every seeded mentorship.fx_rate row.
 *   3. Live Pricing Calculator — type in an amount + currency (and, optionally,
 *      a commission override) and see PricingEngine's exact two-sided fee
 *      breakdown rendered, plus a "recent quotes" history panel.
 *
 * See docs/PROFESSIONAL_MENTOR_V2_IMPLEMENTATION_STRATEGY.md §3 "Phase 0" for
 * the full design this page verifies.
 *
 * Route: /mentorship-v2/verification
 */

"use client"

import React, { useState } from "react"
import {
  Activity,
  Calculator,
  CheckCircle2,
  Circle,
  CircleDot,
  Globe2,
  History,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useMentorshipV2FxRates,
  useMentorshipV2Health,
  useMentorshipV2RecentQuotes,
  useMentorshipV2Zones,
  usePreviewMentorshipV2PricingQuote,
} from "@/features/mentorship-v2/api/mentorship-v2.hooks"
import type { CurrencyCode, PricingQuotePreviewResponse } from "@/features/mentorship-v2/api/mentorship-v2.types"

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatMinor(minor: number, currency: string): string {
  const major = minor / 100
  if (currency === "INR") return `₹${major.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${major.toFixed(2)}`
}

function phaseStatusBadge(status: string) {
  if (status === "COMPLETE") {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </Badge>
    )
  }
  if (status === "IN_PROGRESS") {
    return (
      <Badge className="gap-1 bg-amber-500 hover:bg-amber-500">
        <CircleDot className="h-3 w-3" /> In progress
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Circle className="h-3 w-3" /> Not started
    </Badge>
  )
}

// ─── Main view ──────────────────────────────────────────────────────────────

export default function AdminMentorshipV2VerificationView() {
  const { data: health, isLoading: healthLoading } = useMentorshipV2Health()
  const { data: zones, isLoading: zonesLoading } = useMentorshipV2Zones()
  const { data: fxRates, isLoading: fxLoading } = useMentorshipV2FxRates()
  const { data: recentQuotes, isLoading: recentLoading } = useMentorshipV2RecentQuotes(10)
  const previewMutation = usePreviewMentorshipV2PricingQuote()

  const [amountInput, setAmountInput] = useState("1000")
  const [currency, setCurrency] = useState<CurrencyCode>("INR")
  const [overrideInput, setOverrideInput] = useState("")
  const [lastResult, setLastResult] = useState<PricingQuotePreviewResponse | null>(null)

  const handleComputeQuote = () => {
    const amountMajor = Number.parseFloat(amountInput)
    if (Number.isNaN(amountMajor) || amountMajor < 0) return

    const overridePct = overrideInput.trim() === "" ? null : Number.parseFloat(overrideInput)
    if (overridePct !== null && (Number.isNaN(overridePct) || overridePct < 0 || overridePct > 100)) return

    previewMutation.mutate(
      {
        amountMinor: Math.round(amountMajor * 100),
        currency,
        commissionOverridePercentage: overridePct,
      },
      { onSuccess: (data) => setLastResult(data) },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Professional Mentor V2 — Phase 0 Verification</h1>
        <p className="text-muted-foreground">
          Internal, admin-only tool to visually confirm the Phase 0 foundations built for
          Professional Mentor V2: schema health, seeded pricing reference data, and a live
          pricing-engine calculator.
        </p>
      </div>

      {/* ── System Health ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> System Health
          </CardTitle>
          <CardDescription>
            Schema reachability, seeded row counts, and the phase ship-history strip.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthLoading || !health ? (
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6">
                <HealthStat label="Schema" value={health.schemaExists ? "OK" : "MISSING"} ok={health.schemaExists} />
                <HealthStat
                  label="btree_gist ext."
                  value={health.btreeGistExtensionExists ? "OK" : "MISSING"}
                  ok={health.btreeGistExtensionExists}
                />
                <HealthStat label="Service types" value={String(health.serviceTypeCapabilityCount)} ok={health.serviceTypeCapabilityCount >= 3} />
                <HealthStat label="Pricing zones" value={String(health.pricingZoneCount)} ok={health.pricingZoneCount === 5} />
                <HealthStat label="Zone countries" value={String(health.pricingZoneCountryCount)} ok={health.pricingZoneCountryCount >= 30} />
                <HealthStat label="FX rates" value={String(health.fxRateCount)} ok={health.fxRateCount >= 4} />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">V2 feature flag (app.mentorship.v2.enabled):</span>
                <Badge variant={health.v2FeatureFlagEnabled ? "default" : "secondary"}>
                  {health.v2FeatureFlagEnabled ? "ENABLED" : "DISABLED"}
                </Badge>
                <span className="text-muted-foreground ml-4">Pilot mentors:</span>
                <span>{health.pilotUserIds.length === 0 ? "none" : health.pilotUserIds.join(", ")}</span>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-medium">Phase ship-history</p>
                <div className="space-y-2">
                  {health.phases.map((phase) => (
                    <div
                      key={phase.phaseNumber}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">P{phase.phaseNumber}</span>
                        <span className="font-medium">{phase.phaseName}</span>
                        <span className="text-xs text-muted-foreground">({phase.migrationsRange})</span>
                      </div>
                      {phaseStatusBadge(phase.status)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Pricing Zones & FX ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" /> Pricing Zones &amp; FX
          </CardTitle>
          <CardDescription>
            Seeded purchasing-power zones (strategy doc decision #3) and FX seed rates. Live from
            Phase 8 onward — Phase 0 only seeds the reference data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {zonesLoading || !zones ? (
            <Skeleton className="h-40" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Display currency</TableHead>
                  <TableHead>Countries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.zoneCode}>
                    <TableCell className="font-mono text-xs">{zone.zoneCode}</TableCell>
                    <TableCell>{zone.label}</TableCell>
                    <TableCell>{zone.defaultMultiplier.toFixed(1)}x</TableCell>
                    <TableCell>{zone.displayCurrency}</TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {zone.countryCodes.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Separator />

          {fxLoading || !fxRates ? (
            <Skeleton className="h-24" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fxRates.map((rate) => (
                  <TableRow key={`${rate.baseCurrency}-${rate.quoteCurrency}`}>
                    <TableCell className="font-mono text-xs">{rate.baseCurrency}</TableCell>
                    <TableCell className="font-mono text-xs">{rate.quoteCurrency}</TableCell>
                    <TableCell>{rate.rate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate.source}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Live Pricing Calculator ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Live Pricing Calculator
          </CardTitle>
          <CardDescription>
            Runs a real amount through the live PricingEngine. Strategy doc §1.1: buyer pays a
            flat fee below the threshold or a percentage at/above it; the mentor&apos;s commission is
            deducted separately from their payout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="mv2-amount">Amount</Label>
              <Input
                id="mv2-amount"
                type="number"
                min="0"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv2-currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                <SelectTrigger id="mv2-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv2-override">Commission override % (optional)</Label>
              <Input
                id="mv2-override"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                placeholder="default 10%"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleComputeQuote} disabled={previewMutation.isPending} className="w-full">
                {previewMutation.isPending ? "Computing…" : "Compute quote"}
              </Button>
            </div>
          </div>

          {lastResult && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ResultStat label="List amount" value={formatMinor(lastResult.listAmountMinor, lastResult.currency)} />
                <ResultStat
                  label={`Buyer platform fee (${lastResult.buyerPlatformFeeType})`}
                  value={formatMinor(lastResult.buyerPlatformFeeMinor, lastResult.currency)}
                />
                <ResultStat
                  label="Gross charged to buyer"
                  value={formatMinor(lastResult.grossAmountMinor, lastResult.currency)}
                  emphasize
                />
                <ResultStat
                  label={`Mentor commission (${lastResult.mentorCommissionPercentage}%)`}
                  value={formatMinor(lastResult.mentorCommissionMinor, lastResult.currency)}
                />
                <ResultStat label="GST on commission" value={formatMinor(lastResult.gstOnCommissionMinor, lastResult.currency)} />
                <ResultStat
                  label="Mentor net payout"
                  value={formatMinor(lastResult.mentorNetMinor, lastResult.currency)}
                  emphasize
                />
                <ResultStat label="Zero-amount order?" value={lastResult.zeroAmount ? "Yes" : "No"} />
                <ResultStat label="Quote log id" value={lastResult.quoteLogId} mono />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Quotes ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Recent Quotes
          </CardTitle>
          <CardDescription>
            The last 10 pricing-quote previews computed (from mentorship.pricing_quote_log —
            diagnostic only, never a real order).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading || !recentQuotes ? (
            <Skeleton className="h-32" />
          ) : recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes computed yet. Use the calculator above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead>List amount</TableHead>
                  <TableHead>Buyer fee</TableHead>
                  <TableHead>Gross charged</TableHead>
                  <TableHead>Mentor commission %</TableHead>
                  <TableHead>Mentor net</TableHead>
                  <TableHead>Computed at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.map((q) => (
                  <TableRow key={q.quoteLogId}>
                    <TableCell>{q.currency}</TableCell>
                    <TableCell>{formatMinor(q.listAmountMinor, q.currency)}</TableCell>
                    <TableCell>
                      {formatMinor(q.buyerPlatformFeeMinor, q.currency)}{" "}
                      <span className="text-xs text-muted-foreground">({q.buyerPlatformFeeType})</span>
                    </TableCell>
                    <TableCell>{formatMinor(q.grossAmountMinor, q.currency)}</TableCell>
                    <TableCell>{q.mentorCommissionPercentage}%</TableCell>
                    <TableCell>{formatMinor(q.mentorNetMinor, q.currency)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(q.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Small presentational helpers ───────────────────────────────────────────

function HealthStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${ok ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{value}</p>
    </div>
  )
}

function ResultStat({ label, value, emphasize, mono }: { label: string; value: string; emphasize?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`${emphasize ? "text-lg font-bold" : "text-base font-medium"} ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  )
}
