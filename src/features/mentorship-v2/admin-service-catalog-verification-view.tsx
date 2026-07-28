"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 2 SERVICE CATALOG VERIFICATION ────────────────────
 *
 * Four panels, each mapping to a stated Phase 2 exit criterion:
 *
 *  1. **Catalog snapshot** — counts by status and type across every mentor, plus the most
 *     recent services with their publish readiness and public URLs. Read the status
 *     breakdown closely: there is no `PENDING_REVIEW` bucket, because decision #6 removed
 *     the marketplace review gate. A new key appearing there would mean one came back.
 *  2. **Publish-gate inspector** — run the gate against any service and read the full
 *     checklist, including the live availability check for session-backed types.
 *  3. **Sanitiser XSS probe** — paste HTML (or fire one of the bundled attack payloads) and
 *     see exactly what survives. This is the "XSS suite passes against the description
 *     sanitiser" criterion made interactive; it also catches a widened safelist that nobody
 *     updated the tests for.
 *  4. **Type registry** — every `service_type_capability` row with whether a fulfilment
 *     handler bean actually exists. This is the table that makes "a new service type needs
 *     no frontend deploy" true.
 */

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  FlaskConical,
  Layers,
  Loader2,
  MinusCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  useSanitiserPayloads,
  useSanitiserProbe,
  useServiceCatalogSnapshot,
  useServicePublishGate,
  useServiceTypeRegistry,
} from "./api/service-catalog.hooks"
import type { SanitiserProbeResult } from "./api/service-catalog.types"

function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₹"
  return symbol + (minor / 100).toLocaleString()
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default"
  if (status === "DRAFT") return "outline"
  return "secondary"
}

export default function AdminServiceCatalogVerificationView() {
  const snapshotQuery = useServiceCatalogSnapshot(25)
  const registryQuery = useServiceTypeRegistry()
  const payloadsQuery = useSanitiserPayloads()

  const [serviceId, setServiceId] = useState("")
  const publishGateQuery = useServicePublishGate(serviceId)

  const [probeInput, setProbeInput] = useState("")
  const [probeResult, setProbeResult] = useState<SanitiserProbeResult | null>(null)
  const probeMutation = useSanitiserProbe()

  const snapshot = snapshotQuery.data

  /**
   * An explicit assertion rather than a passing comment: if a review-gate state is ever
   * reintroduced, it surfaces here instead of going unnoticed.
   */
  const reviewGateStates = useMemo(() => {
    if (!snapshot) return []
    const expected = new Set(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
    return Object.keys(snapshot.countsByStatus).filter((key) => !expected.has(key))
  }, [snapshot])

  function runProbe(html: string) {
    setProbeInput(html)
    probeMutation.mutate(html, { onSuccess: (data) => setProbeResult(data) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mentorship V2 — Service Catalog (Phase 2)</h1>
        <p className="text-sm text-muted-foreground">
          Verification tools for the service catalog: what exists across the platform, whether any
          given service can publish, whether the description sanitiser actually strips attacks, and
          the type registry that makes new service types deployable without frontend changes.
        </p>
      </div>

      {/* ── 1 · Catalog snapshot ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Catalog snapshot</CardTitle>
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
          </div>
          <CardDescription>
            Every service across every mentor. Click a row&apos;s id to load it into the publish-gate
            inspector below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {snapshotQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !snapshot ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Could not load the snapshot</AlertTitle>
              <AlertDescription>Refresh to try again.</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{snapshot.totalServices} total</Badge>
                {Object.entries(snapshot.countsByStatus).map(([status, count]) => (
                  <Badge key={status} variant={statusVariant(status)}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(snapshot.countsByType).map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type.replace(/_/g, " ")}: {count}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{snapshot.servicesWithCover} with an uploaded cover</span>
                <span>{snapshot.servicesWithIntakeForm} with an intake form</span>
                <span>{snapshot.packagesWithChildren} packages with 2+ items</span>
              </div>

              {reviewGateStates.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Unexpected service status found</AlertTitle>
                  <AlertDescription>
                    {reviewGateStates.join(", ")} — decision #6 removed the marketplace review gate, so
                    only DRAFT / ACTIVE / PAUSED / ARCHIVED should exist. Something reintroduced a
                    review state.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>No review-gate state exists</AlertTitle>
                  <AlertDescription>
                    Only DRAFT, ACTIVE, PAUSED and ARCHIVED are present. Publishing is immediate —
                    there is no pending-approval bucket and no admin queue.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {snapshot.recentServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No services created yet. Create one from the mentor dashboard at{" "}
                  <span className="font-mono">/dashboard/mentor/services</span>, then refresh.
                </p>
              ) : (
                <div className="space-y-2">
                  {snapshot.recentServices.map((row) => (
                    <div key={row.serviceId} className="rounded-lg border border-border/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <button
                              type="button"
                              className="font-mono underline"
                              onClick={() => setServiceId(row.serviceId)}
                            >
                              {row.serviceId}
                            </button>{" "}
                            · {row.serviceType.replace(/_/g, " ")} ·{" "}
                            {row.mentorUsername ? `@${row.mentorUsername}` : row.mentorUserId} ·{" "}
                            {formatMinor(row.basePriceMinor, row.baseCurrency)}
                            {row.durationMinutes ? ` · ${row.durationMinutes} min` : ""} ·{" "}
                            {row.skillCount} skills · {row.formFieldCount} form fields
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                          {row.visibility !== "PUBLIC" ? (
                            <Badge variant="secondary">{row.visibility}</Badge>
                          ) : null}
                          <Badge variant={row.publishable ? "default" : "outline"}>
                            {row.publishable ? "publishable" : `${row.blockingReasons.length} blocked`}
                          </Badge>
                          {row.publicUrl && row.status === "ACTIVE" ? (
                            <a
                              href={row.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs underline"
                            >
                              open <ExternalLink className="size-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                      {row.blockingReasons.length > 0 ? (
                        <ul className="mt-2 space-y-0.5">
                          {row.blockingReasons.map((reason) => (
                            <li key={reason} className="text-xs text-muted-foreground">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── 2 · Publish-gate inspector ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Publish-gate inspector</CardTitle>
          </div>
          <CardDescription>
            Runs the real publish gate against any service, read-only. For session-backed types this
            includes asking the live availability engine whether the service&apos;s duration has any
            bookable start in the next 14 days — the check that prevents published-but-uncalendared
            listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 sm:max-w-sm">
            <Label htmlFor="pg-service-id">Service id</Label>
            <Input
              id="pg-service-id"
              value={serviceId}
              placeholder="MSV00000001"
              onChange={(event) => setServiceId(event.target.value)}
            />
          </div>

          {serviceId.trim().length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Enter a service id, or click one in the snapshot above.
            </p>
          ) : publishGateQuery.isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : publishGateQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>No such service</AlertTitle>
              <AlertDescription>Check the id and try again.</AlertDescription>
            </Alert>
          ) : publishGateQuery.data ? (
            <>
              <Badge variant={publishGateQuery.data.publishable ? "default" : "outline"}>
                {publishGateQuery.data.publishable ? "Publishable" : "Not publishable"}
              </Badge>
              <ul className="space-y-2">
                {publishGateQuery.data.checks.map((check) => (
                  <li key={check.key} className="flex items-start gap-2">
                    {check.notApplicable ? (
                      <MinusCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    ) : check.passed ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={
                          check.notApplicable ? "text-sm text-muted-foreground line-through" : "text-sm"
                        }
                      >
                        {check.label}{" "}
                        <span className="font-mono text-[11px] text-muted-foreground">{check.key}</span>
                      </p>
                      {check.detail ? (
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* ── 3 · Sanitiser probe ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Description sanitiser — XSS probe</CardTitle>
          </div>
          <CardDescription>
            Runs HTML through the live sanitiser without saving anything. The permitted set is exactly
            the eight editor controls (bold, italic, underline, strikethrough, both list types, link,
            image); scripts, styles, iframes, tables and inline event handlers are stripped, and every
            link is forced to{" "}
            <span className="font-mono">rel=&quot;nofollow noopener noreferrer&quot;</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(payloadsQuery.data ?? []).map((payload, index) => (
              <Button
                key={payload}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runProbe(payload)}
              >
                Attack #{index + 1}
              </Button>
            ))}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="probe-input">HTML to test</Label>
            <Textarea
              id="probe-input"
              rows={5}
              className="font-mono text-xs"
              value={probeInput}
              onChange={(event) => setProbeInput(event.target.value)}
              placeholder="<script>alert('xss')</script><p>Legitimate copy.</p>"
            />
          </div>

          <Button
            type="button"
            disabled={probeMutation.isPending || probeInput.trim().length === 0}
            onClick={() => runProbe(probeInput)}
          >
            {probeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run through the sanitiser
          </Button>

          {probeResult ? (
            <div className="space-y-3">
              {probeResult.survivingConstructs.length > 0 ? (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertTitle>Dangerous markup survived</AlertTitle>
                  <AlertDescription>
                    {probeResult.survivingConstructs.join(", ")} — this should never happen. The
                    safelist has been widened or the sanitiser is not being applied.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Nothing dangerous survived</AlertTitle>
                  <AlertDescription>
                    {probeResult.strippedConstructs.length > 0
                      ? `Stripped: ${probeResult.strippedConstructs.join(", ")}.`
                      : "The input contained nothing dangerous to strip — try one of the attack payloads above for a real test."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-1.5">
                <Label>Sanitised output</Label>
                <pre className="max-h-48 overflow-auto rounded bg-muted/50 p-2 text-[11px]">
                  {probeResult.sanitisedOutput ?? "(null — everything was stripped)"}
                </pre>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>input {probeResult.inputLength} chars</span>
                <span>plain text {probeResult.plainTextLength} chars</span>
                <span>modified: {probeResult.modified ? "yes" : "no"}</span>
                <span>
                  publish length check ({probeResult.publishMinimumChars} min):{" "}
                  {probeResult.wouldPassPublishLengthCheck ? "passes" : "fails"}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── 4 · Type registry ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Service type registry</CardTitle>
          </div>
          <CardDescription>
            Every <span className="font-mono">service_type_capability</span> row. This is what makes
            adding a service type a data change rather than a frontend deploy — the type picker and the
            editor&apos;s section visibility both render from these flags. A row that is enabled but has
            no handler is a misconfiguration this view exists to surface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registryQuery.isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-2">
              {(registryQuery.data ?? []).map((row) => (
                <div
                  key={row.serviceType}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {row.label}{" "}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {row.serviceType}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.bookingStateMachine ?? "no state machine"} ·{" "}
                      {row.fulfilmentHandler ?? "no handler configured"}
                      {row.maxDurationMinutes ? ` · max ${row.maxDurationMinutes} min` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.requiresScheduling ? <Badge variant="outline">scheduled</Badge> : null}
                    {row.requiresMentorFeedback ? <Badge variant="outline">feedback</Badge> : null}
                    {row.isBundle ? <Badge variant="outline">bundle</Badge> : null}
                    <Badge variant={row.enabled ? "default" : "secondary"}>
                      {row.enabled ? "enabled" : "disabled"}
                    </Badge>
                    <Badge variant={row.handlerAvailable ? "default" : "destructive"}>
                      {row.handlerAvailable ? "handler present" : "no handler bean"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
