"use client"

/**
 * ─── ONE SERVICE ──────────────────────────────────────────────────────────────
 *
 * Merges what used to be three separate consoles' worth of answers about a single service:
 * the publish-gate checks (catalogue console), the marketplace projection state (search console),
 * and its own commercial history.
 *
 * <h3>Why the two "why can't people see this" answers belong on one page</h3>
 * A service can be invisible for two unrelated reasons — it fails a publish gate, so it was never
 * eligible; or it passes every gate and simply has no projection row, so the marketplace does not
 * know about it. Those live in different subsystems and used to live on different consoles, which
 * meant diagnosing the second required first ruling out the first somewhere else. Both are here.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Loader2, RefreshCw, ShieldOff, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useServicePublishGate } from "@/features/mentorship-v2/api/service-catalog.hooks"
import { useRefreshSearchDocument, useSearchDocument } from "@/features/mentorship-v2/api/search.hooks"
import { suspendService, unsuspendService } from "@/features/mentorship-v2/api/ops.api"
import { Textarea } from "@/components/ui/textarea"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"

export default function ServiceDetailView({ serviceId }: { serviceId: string }) {
  const router = useRouter()
  const gate = useServicePublishGate(serviceId)
  const document = useSearchDocument(serviceId, true)
  const refresh = useRefreshSearchDocument()

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_SERVICES)}
        >
          <ArrowLeft className="size-4" /> Service Catalogue
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {document.data?.title ?? "Service"}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{serviceId}</p>
        </div>
      </header>

      {/* ── Publish gate ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publish gate</CardTitle>
          <CardDescription>
            Every check the service must pass to be publishable. A failing check is the reason a
            mentor cannot take their service live — and the answer to give them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {gate.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Running the checks…
            </p>
          ) : gate.isError || !gate.data ? (
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>Could not run the publish gate for this service.</AlertDescription>
            </Alert>
          ) : (
            <>
              <p
                className={
                  gate.data.publishable
                    ? "flex items-center gap-2 text-sm font-medium text-emerald-600"
                    : "flex items-center gap-2 text-sm font-medium text-destructive"
                }
              >
                {gate.data.publishable ? (
                  <>
                    <CheckCircle2 className="size-4" /> Publishable
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4" /> Blocked —{" "}
                    {gate.data.blockingReasons.length} reason(s)
                  </>
                )}
              </p>
              <ul className="space-y-1.5">
                {gate.data.checks.map((check) => (
                  <li key={check.key} className="flex items-start gap-2 text-sm">
                    {check.notApplicable ? (
                      <Badge variant="outline" className="mt-0.5 h-4 shrink-0 px-1 text-[10px]">
                        n/a
                      </Badge>
                    ) : check.passed ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span className="min-w-0">
                      {check.label}
                      {check.detail ? (
                        <span className="block text-xs text-muted-foreground">{check.detail}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Marketplace projection ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Marketplace projection</CardTitle>
            <CardDescription>
              The denormalised row the marketplace actually searches. A service with no row here is
              invisible to buyers no matter how healthy it looks above.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => refresh.mutate(serviceId)}
            disabled={refresh.isPending}
          >
            {refresh.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Rebuild
          </Button>
        </CardHeader>
        <CardContent>
          {document.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Loading…
            </p>
          ) : !document.data ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>No projection row</AlertTitle>
              <AlertDescription className="text-xs">
                {gate.data?.publishable
                  ? "This service passes its publish gate but is not in the marketplace index. Rebuild it, then check Platform Health → Search for whether the projection sweep is running at all."
                  : "This service is not publishable, so having no projection row is expected — fix the gate above first."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">{document.data.status}</Field>
              <Field label="Visibility">{document.data.visibility}</Field>
              <Field label="Slug">{document.data.slug}</Field>
              <Field label="Mentor">
                {document.data.mentorName ?? document.data.mentorUsername}
              </Field>
              <Field label="Skills">
                {document.data.skillNames.length > 0
                  ? document.data.skillNames.join(", ")
                  : "none — this service will not match a skill query"}
              </Field>
              <Field label="Type">{document.data.serviceType}</Field>
            </div>
          )}
        </CardContent>
      </Card>

      <ModerationCard serviceId={serviceId} status={document.data?.status ?? null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commercial history</CardTitle>
          <CardDescription>
            Orders and sessions for this service, filtered from the tables that own them.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}?serviceId=${serviceId}`}>Orders</a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`${PATH_CONSTANTS.ADMIN_PM_SESSIONS}?serviceId=${serviceId}`}>Sessions</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Suspension.
 *
 * <h3>Why this is not "pause"</h3>
 * Pausing is a mentor-owned state — their console can pause and re-publish at will. Until this
 * existed, the only admin route to taking a listing down went through resolving a dispute against
 * it, which fabricated a case and penalised the mentor's reliability score for a complaint nobody
 * made — and still only set PAUSED, which the suspended party could quietly undo.
 *
 * Suspension sets a status the mentor cannot clear: `publish()` refuses to move it.
 */
function ModerationCard({ serviceId, status }: { serviceId: string; status: string | null }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState("")
  const suspended = status === "SUSPENDED"

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["mentorship-v2", "search-document", serviceId] })
    void queryClient.invalidateQueries({ queryKey: ["pm-services"] })
  }

  const suspend = useMutation({
    mutationFn: () => suspendService(serviceId, reason.trim()),
    onSuccess: () => {
      showSuccessToast("Service suspended", {
        description: "It is off the market and the mentor cannot republish it.",
      })
      setReason("")
      invalidate()
    },
    onError: (error: Error) => showErrorToast(error),
  })

  const unsuspend = useMutation({
    mutationFn: () => unsuspendService(serviceId, reason.trim() || undefined),
    onSuccess: () => {
      showSuccessToast("Suspension lifted", {
        description: "Returned to DRAFT so the publish gate runs again before it can go live.",
      })
      setReason("")
      invalidate()
    },
    onError: (error: Error) => showErrorToast(error),
  })

  return (
    <Card className={suspended ? "border-destructive" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldOff className="size-4" /> Moderation
        </CardTitle>
        <CardDescription>
          {suspended
            ? "This service is suspended. It is not listed, not bookable and not reachable by URL, and the mentor cannot republish it."
            : "Take this listing off the market directly. Unlike pausing, the mentor cannot reverse a suspension."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            suspended
              ? "Why are you lifting this? (optional, recorded in the audit trail)"
              : "Why is this being suspended? The mentor is shown this verbatim (min 10 characters)."
          }
        />
        {suspended ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => unsuspend.mutate()}
            disabled={unsuspend.isPending}
          >
            {unsuspend.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Lift the suspension
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => suspend.mutate()}
            disabled={reason.trim().length < 10 || suspend.isPending}
          >
            {suspend.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
            Suspend this service
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {suspended
            ? "Lifting returns the service to DRAFT rather than to live — whatever was wrong is presumed still in the listing, so the publish gate has to pass again."
            : "Recorded in the admin audit trail with your name and this reason."}
        </p>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{children}</div>
    </div>
  )
}
