"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 8 PRICING CONSOLE ─────────────────────────────────
 *
 * Master-plan §6.3's <i>"Admin console for zones, multipliers, FX source health"</i>, plus the runtime
 * verification panel every prior phase established.
 *
 * Four panels:
 *
 *  1. **Invariants &amp; config** — live assertions recomputed on every open, not a stored log. This
 *     panel's whole subject matter is data admins edit by hand, so a check that only ran when a row was
 *     written would catch nothing. `invariantViolations` must always render empty.
 *  2. **FX health** — every stored rate with its age, and the forced-fetch button. A rate older than the
 *     configured staleness limit is refused for *charging* while display conversion keeps using it, and
 *     the table says which is which rather than showing one undifferentiated "stale" flag.
 *  3. **Zones** — the multiplier ladder, editable, with the guardrail enforced at the point of typing.
 *     Zones are retired, never deleted, because historical orders carry the zone code as a snapshot.
 *  4. **Country map** — what each country pays, and the ability to remap or unmap one.
 */

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Globe2,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  useMapCountry,
  usePricingSnapshot,
  useRefreshFxRates,
  useUnmapCountry,
  useUpdateZone,
} from "./api/pricing.hooks"
import type { ZoneRow } from "./api/pricing.types"

export default function AdminPricingVerificationView() {
  const snapshotQuery = usePricingSnapshot()
  const snapshot = snapshotQuery.data
  const refreshFx = useRefreshFxRates()

  const invariantsBroken = (snapshot?.invariantViolations.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Globe2 className="size-5" /> Pricing zones &amp; FX
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The purchasing-power multiplier ladder, the country map it is applied through, and the FX
            source that display conversion depends on. Editing a multiplier affects new quotes only —
            every existing order snapshotted its own zone, multiplier and rate at purchase.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void snapshotQuery.refetch()}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading pricing snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 8 schema may not be migrated yet. Run the app once against a database with
            V192–V195 applied, then refresh.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants & config ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">Invariants &amp; live config</CardTitle>
              <CardDescription>
                Recomputed on every open, not stored. Asserted here: the configured fallback zone exists
                and is live (otherwise every unidentifiable buyer prices against a zone we no longer
                stand behind); no zone has a non-positive multiplier; no zone sits outside the platform
                guardrail (the engine clamps it, so buyers stay safe — but this table would then be lying
                about what it charges); and at least one FX rate exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.invariantViolations.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="size-4" /> No invariant violations.
                </p>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertTitle>
                    {snapshot.invariantViolations.length} violation(s) — real bugs
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                      {snapshot.invariantViolations.map((violation) => (
                        <li key={violation}>{violation}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {snapshot.warnings.length > 0 ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>{snapshot.warnings.length} warning(s)</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                      {snapshot.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Country pricing"
                  value={snapshot.zonePricingEnabled ? "On" : "OFF"}
                  tone={snapshot.zonePricingEnabled ? "good" : "warn"}
                />
                <Stat
                  label="Display conversion"
                  value={snapshot.displayConversionEnabled ? "On" : "OFF"}
                  tone={snapshot.displayConversionEnabled ? "good" : "warn"}
                />
                <Stat
                  label="Guardrail"
                  value={`${snapshot.guardrailMinMultiplier}× – ${snapshot.guardrailMaxMultiplier}×`}
                />
                <Stat label="Fallback zone" value={snapshot.fallbackZoneCode} />
                <Stat label="Countries mapped" value={snapshot.mappedCountries} />
                <Stat
                  label="Services with country pricing"
                  value={snapshot.servicesWithCountryPricing}
                />
                <Stat label="Per-service overrides" value={snapshot.servicesWithZoneOverrides} />
                <Stat label="Quote TTL" value={`${snapshot.quoteTtlMinutes} min`} />
              </div>
            </CardContent>
          </Card>

          {/* ── 2. FX health ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="size-4" /> FX source health
              </CardTitle>
              <CardDescription>
                Provider <code className="rounded bg-muted px-1">{snapshot.fxProviderName}</code>,
                cached {snapshot.fxCacheHours}h, refused for <strong>charging</strong> beyond{" "}
                {snapshot.fxMaxStalenessHours}h. A failed fetch never clears anything — only
                successfully parsed rates are written, so a provider outage leaves every existing rate
                exactly as it was. That is what makes &quot;never fail a page render on FX&quot; true
                rather than aspirational.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                size="sm"
                onClick={() => refreshFx.mutate()}
                disabled={refreshFx.isPending}
              >
                {refreshFx.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Fetching…
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Fetch rates now
                  </>
                )}
              </Button>

              {refreshFx.data && refreshFx.data.errors.length > 0 ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {refreshFx.data.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {snapshot.fxRates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rates stored.</p>
              ) : (
                <ul className="divide-y rounded-md border text-xs">
                  {snapshot.fxRates.map((row) => (
                    <li
                      key={`${row.baseCurrency}-${row.quoteCurrency}`}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5"
                    >
                      <span className="font-mono">
                        {row.baseCurrency} → {row.quoteCurrency}
                      </span>
                      <span className="font-medium">{row.rate ?? "—"}</span>
                      <span className="text-muted-foreground">{row.source}</span>
                      <span
                        className={
                          row.staleForCharging ? "font-medium text-amber-600" : "text-muted-foreground"
                        }
                      >
                        {row.ageHours < 0
                          ? "never fetched"
                          : `${row.ageHours}h old${row.staleForCharging ? " · display only" : ""}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Zones ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing zones</CardTitle>
              <CardDescription>
                A multiplier outside the guardrail is <strong>refused here</strong>, not silently clamped
                later: an admin who types 30 instead of 3.0 finds out immediately, and the engine&apos;s
                own clamp means a value that somehow got in still cannot produce a wrong charge. A zone
                can be retired but never deleted, because{" "}
                <code className="rounded bg-muted px-1">commerce_order.pricing_zone</code> is a snapshot
                string historical orders carry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.zones.map((zone) => (
                <ZoneEditor key={zone.zoneCode} zone={zone} fallbackZone={snapshot.fallbackZoneCode} />
              ))}
            </CardContent>
          </Card>

          {/* ── 4. Country map ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Country map</CardTitle>
              <CardDescription>
                Takes effect on the next quote; nothing is retroactive. An <em>unmapped</em> country
                falls back to the mentor&apos;s own home price — the cheapest outcome, so it cannot
                over-charge anyone, but it does give up the uplift for that market.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CountryMapper zones={snapshot.zones} />
              <Separator />
              <div className="space-y-2">
                {snapshot.zones.map((zone) => (
                  <div key={zone.zoneCode} className="rounded-md border p-2.5">
                    <p className="text-xs font-medium">
                      {zone.zoneCode} — {zone.countryCount} country/countries
                    </p>
                    {zone.sampleCountries.length > 0 ? (
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {zone.sampleCountries.join(", ")}
                        {zone.countryCount > zone.sampleCountries.length ? ", …" : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground">No countries mapped.</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ─── Pieces ─────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone?: "good" | "warn"
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "good"
            ? "mt-0.5 text-lg font-semibold text-emerald-600"
            : tone === "warn"
              ? "mt-0.5 text-lg font-semibold text-amber-600"
              : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}

function ZoneEditor({ zone, fallbackZone }: { zone: ZoneRow; fallbackZone: string }) {
  const [multiplier, setMultiplier] = useState(zone.defaultMultiplier)
  const [label, setLabel] = useState(zone.label)
  const update = useUpdateZone()

  const isFallback = zone.zoneCode === fallbackZone
  const dirty = multiplier !== zone.defaultMultiplier || label !== zone.label

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          <span className="font-mono">{zone.zoneCode}</span>
          {isFallback ? (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              fallback
            </Badge>
          ) : null}
          {!zone.active ? (
            <Badge variant="destructive" className="h-4 px-1 text-[10px]">
              retired
            </Badge>
          ) : null}
        </p>
        <span className="text-xs text-muted-foreground">
          {zone.countryCount} countries · {zone.overrideCount} overrides · charges in{" "}
          {zone.displayCurrency}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor={`mult-${zone.zoneCode}`}>
            Multiplier
          </label>
          <Input
            id={`mult-${zone.zoneCode}`}
            type="number"
            step="0.1"
            value={multiplier}
            onChange={(event) => setMultiplier(event.target.value)}
            className="h-8 w-24 text-xs"
          />
        </div>
        <div className="min-w-40 flex-1 space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor={`label-${zone.zoneCode}`}>
            Label
          </label>
          <Input
            id={`label-${zone.zoneCode}`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate({ zoneCode: zone.zoneCode, defaultMultiplier: multiplier, label })
          }
        >
          {update.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant={zone.active ? "ghost" : "outline"}
          disabled={update.isPending || (zone.active && isFallback)}
          title={
            zone.active && isFallback
              ? "This is the configured fallback zone — point fallback-zone-code elsewhere before retiring it."
              : undefined
          }
          onClick={() => update.mutate({ zoneCode: zone.zoneCode, active: !zone.active })}
        >
          {zone.active ? "Retire" : "Reactivate"}
        </Button>
      </div>
    </div>
  )
}

function CountryMapper({ zones }: { zones: ZoneRow[] }) {
  const [countryCode, setCountryCode] = useState("")
  const [zoneCode, setZoneCode] = useState(zones.find((zone) => zone.active)?.zoneCode ?? "")
  const map = useMapCountry()
  const unmap = useUnmapCountry()

  const normalised = countryCode.trim().toUpperCase()
  const valid = /^[A-Z]{2}$/.test(normalised)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor="country-code">
            Country (ISO-2)
          </label>
          <Input
            id="country-code"
            placeholder="FR"
            maxLength={2}
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            className="h-8 w-20 text-xs uppercase"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor="country-zone">
            Zone
          </label>
          <select
            id="country-zone"
            value={zoneCode}
            onChange={(event) => setZoneCode(event.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            {zones
              .filter((zone) => zone.active)
              .map((zone) => (
                <option key={zone.zoneCode} value={zone.zoneCode}>
                  {zone.zoneCode} ({zone.defaultMultiplier}×)
                </option>
              ))}
          </select>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!valid || !zoneCode || map.isPending}
          onClick={() => map.mutate({ countryCode: normalised, zoneCode })}
        >
          {map.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Map
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!valid || unmap.isPending}
          onClick={() => unmap.mutate(normalised)}
        >
          {unmap.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Unmap
        </Button>
      </div>
      {countryCode && !valid ? (
        <p className="text-xs text-destructive">A country code is exactly two letters.</p>
      ) : null}
    </div>
  )
}
