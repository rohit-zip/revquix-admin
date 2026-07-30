/**
 * ─── RUN DETAIL PANEL (§8.3 drill-down) ──────────────────────────────────────
 *
 * A sheet rather than a route: an admin triaging an incident is comparing runs, and a full navigation
 * per run loses the grid's filter and scroll position — which is the state they are actually working in.
 *
 * **The input preview is redacted AND truncated, and the panel says so.** Names, emails, phone numbers,
 * addresses and dates of birth were replaced with stable tokens before the text was ever stored, so
 * there is no unredacted copy for this panel to expose. It is truncated on top of that because an admin
 * diagnosing a parse failure needs the *shape* of the extraction, not the document — §8.3: "an admin
 * console is not an exemption from DPDP minimisation, and 'support could read every resume' is a finding
 * in any audit."
 */

"use client"

import React from "react"
import { AlertTriangle, RotateCcw, ShieldOff, Undo2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuthorization } from "@/hooks/useAuthorization"
import {
  useForceReleaseHold,
  useInspectToolRun,
  useRefundRun,
  useRetryRun,
} from "../api/tools-admin.hooks"
import {
  ConstraintNote,
  CreditDelta,
  EntryTypeBadge,
  IdCell,
  OutcomeBadge,
  RunStatusBadge,
  ReasonField,
  type ReasonState,
  formatDateTime,
  formatNumber,
  formatPaise,
  isReasonValid,
  shortHash,
} from "./tools-admin-shared"

export function RunDetailPanel({
  runId,
  onClose,
  onPivotIpHash,
}: {
  runId: string | null
  onClose: () => void
  onPivotIpHash: (hash: string) => void
}) {
  const detail = useInspectToolRun(runId ?? "")

  return (
    <Sheet open={runId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-hidden sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{runId ?? ""}</SheetTitle>
          <SheetDescription>
            Timeline, redacted input, report, ledger entries and administrative actions.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {detail.isLoading && (
            <div className="space-y-3 p-1">
              <div className="h-20 animate-pulse rounded-md bg-muted" aria-hidden="true" />
              <div className="h-32 animate-pulse rounded-md bg-muted" aria-hidden="true" />
            </div>
          )}

          {detail.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Run not found</AlertTitle>
              <AlertDescription>
                The run does not exist. One code covers both &ldquo;not found&rdquo; and &ldquo;not
                yours&rdquo; on purpose — distinguishing them would confirm another user&apos;s run to
                anyone enumerating IDs.
              </AlertDescription>
            </Alert>
          )}

          {detail.data && (
            <div className="space-y-5 pb-8">
              {/* ── Summary ── */}
              <section className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <RunStatusBadge status={detail.data.run.status} />
                  <Badge variant="outline" className="text-xs">
                    {detail.data.run.toolKey.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                  {detail.data.run.servedFromCache && (
                    <Badge variant="outline" className="text-xs">
                      served from cache — cost nothing
                    </Badge>
                  )}
                  {detail.data.reportPartial && (
                    <Badge variant="secondary" className="text-xs">
                      partial report
                    </Badge>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                  <Field label="Subject">
                    {detail.data.run.userId ? (
                      <IdCell value={detail.data.run.userId} />
                    ) : (
                      <span>anon {shortHash(detail.data.run.anonId, 10)}</span>
                    )}
                  </Field>
                  <Field label="Credits held">{detail.data.run.creditsHeld}</Field>
                  <Field label="Cost">{formatPaise(detail.data.run.costPaise)}</Field>
                  <Field label="Latency">
                    {detail.data.run.latencyMs === null
                      ? "—"
                      : `${formatNumber(detail.data.run.latencyMs)} ms`}
                  </Field>
                  <Field label="Provider / model">
                    {detail.data.run.provider ?? "—"}
                    {detail.data.run.model ? ` / ${detail.data.run.model}` : ""}
                  </Field>
                  <Field label="Rubric / prompt">
                    {detail.data.run.rubricVersion ?? "—"} / {detail.data.run.promptVersion ?? "—"}
                  </Field>
                  <Field label="Tokens (prompt / cached / out)">
                    {detail.data.run.promptTokens ?? "—"} / {detail.data.run.cachedTokens ?? "—"} /{" "}
                    {detail.data.run.completionTokens ?? "—"}
                  </Field>
                  <Field label="Score">{detail.data.score ?? "—"}</Field>
                  <Field label="Error code">{detail.data.run.errorCode ?? "—"}</Field>
                </dl>
              </section>

              {/* ── IP hash pivot ── */}
              {detail.data.run.ipHash && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Same-day IP hash</h3>
                  <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3">
                    <span className="font-mono text-[11px] break-all">
                      {detail.data.run.ipHash}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onPivotIpHash(detail.data.run.ipHash as string)
                        onClose()
                      }}
                    >
                      Show all {detail.data.sameIpHashRunsToday} run(s) with this hash
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A hash, never an address. Comparable only within the UTC day it was computed on.
                  </p>
                </section>
              )}

              <Separator />

              {/* ── Timeline ── */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Timeline</h3>
                <ol className="space-y-2">
                  {detail.data.timeline.map((event, index) => (
                    <li key={`${event.label}-${index}`} className="flex gap-3 text-xs">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{event.label}</p>
                        <p className="text-muted-foreground">
                          {formatDateTime(event.at)}
                          {event.deltaMs !== null && ` · +${formatNumber(event.deltaMs)} ms`}
                          {event.detail && ` · ${event.detail}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">
                  Two points is the honest maximum: <code>tool_run</code> carries created and updated
                  timestamps, not a transition log. Inventing intermediate times from the measured
                  latency would produce a timeline that looks precise and is fabricated.
                </p>
              </section>

              <Separator />

              {/* ── Redacted input ── */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">What the parser extracted</h3>
                {detail.data.inputPreview ? (
                  <>
                    <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {detail.data.inputPreview}
                    </pre>
                    <ConstraintNote>
                      <strong>Redacted before storage, and truncated here.</strong> Names, emails, phone
                      numbers, addresses and dates of birth were replaced with stable tokens by the run
                      pipeline before this text was ever written, so there is no unredacted copy to show.
                      {detail.data.inputPreviewTruncated && (
                        <>
                          {" "}
                          This is the first part of{" "}
                          {formatNumber(detail.data.extractedChars)} extracted characters — an admin
                          diagnosing a parse failure needs the shape of the extraction, not the document.
                        </>
                      )}
                    </ConstraintNote>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No retained input can be associated with this run. Either it was a text-input run, or
                    the uploaded asset has passed its retention window (24 hours anonymous, 30 days
                    authenticated). <code>tool_run</code> stores a hash of the input rather than the
                    input, and carries no asset reference — so the association is best-effort by subject
                    and time.
                  </p>
                )}
              </section>

              <Separator />

              {/* ── Ledger entries ── */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Ledger entries for this run</h3>
                {detail.data.ledgerEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    None — this run was free, a cache hit, or covered by a pass.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.data.ledgerEntries.map((entry) => (
                      <li
                        key={entry.entryId}
                        className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-2 text-xs"
                      >
                        <EntryTypeBadge type={entry.entryType} />
                        <CreditDelta delta={entry.delta} />
                        <IdCell value={entry.entryId} className="text-[10px]" />
                        <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  This list is the answer to &ldquo;was the user charged?&rdquo; A hold with no commit and
                  no release means credits are still reserved.
                </p>
              </section>

              {/* ── Prior admin actions ── */}
              {detail.data.adminActions.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Administrative actions already taken</h3>
                    <ul className="space-y-1.5">
                      {detail.data.adminActions.map((action) => (
                        <li
                          key={action.auditId}
                          className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-2 text-xs"
                        >
                          <OutcomeBadge outcome={action.outcome} />
                          <span>{action.action.replace(/_/g, " ").toLowerCase()}</span>
                          <IdCell value={action.adminUserId} className="text-[10px]" />
                          <span className="text-muted-foreground">
                            {formatDateTime(action.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Shown so two admins working the same incident do not both force-release the hold.
                    </p>
                  </section>
                </>
              )}

              <Separator />

              <RunActions detail={detail.data} />
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

/**
 * The three §8.3 actions.
 *
 * The refund button is gated on `PERM_MANAGE_CREDITS` rather than the runs permission, because it writes
 * to the ledger — and the server enforces the same split, so hiding it here is a courtesy rather than
 * the control.
 */
function RunActions({ detail }: { detail: NonNullable<ReturnType<typeof useInspectToolRun>["data"]> }) {
  const { hasAnyAuthority } = useAuthorization()
  const release = useForceReleaseHold()
  const refund = useRefundRun()
  const retry = useRetryRun()

  const [reason, setReason] = React.useState<ReasonState>({ code: "", text: "" })
  const [refundAmount, setRefundAmount] = React.useState("")

  const canMoveCredits = hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_CREDITS"])
  const reasonValid = isReasonValid(reason)
  const run = detail.run
  const busy = release.isPending || refund.isPending || retry.isPending

  const payload = () => ({
    reasonCode: reason.code as Exclude<ReasonState["code"], "">,
    reason: reason.text.trim(),
  })

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Actions</h3>

      <ReasonField value={reason} onChange={setReason} idPrefix={`run-${run.runId}`} />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!reasonValid || busy || !run.hasOpenHold}
          onClick={() => release.mutate({ runId: run.runId, payload: payload() })}
        >
          <ShieldOff className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Force-release hold
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!reasonValid || busy || !canMoveCredits || run.creditsHeld === 0 || !run.userId}
          onClick={() =>
            refund.mutate({
              runId: run.runId,
              payload: {
                ...payload(),
                amount: refundAmount ? Number.parseInt(refundAmount, 10) : undefined,
              },
            })
          }
        >
          <Undo2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Refund {run.creditsHeld} credit(s)
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!reasonValid || busy}
          onClick={() => retry.mutate({ runId: run.runId, payload: payload() })}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Locate input to retry
        </Button>
      </div>

      {canMoveCredits && run.creditsHeld > 0 && (
        <div className="space-y-1.5 sm:max-w-[10rem]">
          <Label htmlFor={`refund-amount-${run.runId}`} className="text-xs">
            Partial refund (optional)
          </Label>
          <Input
            id={`refund-amount-${run.runId}`}
            value={refundAmount}
            onChange={(event) => setRefundAmount(event.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={String(run.creditsHeld)}
            aria-describedby={`refund-amount-help-${run.runId}`}
          />
          <p id={`refund-amount-help-${run.runId}`} className="text-xs text-muted-foreground">
            Defaults to {run.creditsHeld}. Cannot exceed it — a larger gesture belongs on the adjustment
            screen, where the guardrail applies.
          </p>
        </div>
      )}

      {!canMoveCredits && (
        <p className="text-xs text-muted-foreground">
          Refunding needs <code>PERM_MANAGE_CREDITS</code> because it writes to the ledger. Seeing why a
          run failed does not require the ability to move money, so the two are separate permissions.
        </p>
      )}

      <ConstraintNote>
        <strong>Release and refund are different actions.</strong> A release returns credits that were
        never charged because the run did not complete; a refund returns credits that <em>were</em>
        charged for a run that completed badly. Both are idempotent, so a second click — or a race with
        the hold sweeper — writes once.
      </ConstraintNote>

      {retry.data && (
        <Alert>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Input located</AlertTitle>
          <AlertDescription className="space-y-1">
            <p className="text-xs">
              Asset <span className="font-mono">{retry.data.assetId}</span>. Re-submit it through the
              tool&apos;s own endpoint so the run passes the standard pre-flight — the admin plane
              deliberately owns no second path that can create a run.
            </p>
            <p className="text-xs text-muted-foreground">{retry.data.message}</p>
          </AlertDescription>
        </Alert>
      )}
    </section>
  )
}
