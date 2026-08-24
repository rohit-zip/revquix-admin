"use client"

/**
 * ─── ONE DISPUTE ──────────────────────────────────────────────────────────────
 *
 * The case file and the actions, on their own route.
 *
 * <h3>Why a route and not a modal</h3>
 * Three reasons, all of them operational. An admin alert email deep-links straight here, so the URL
 * has to be a real destination. An operator who resolves a dispute and then wants the one before it
 * needs the back button. And "send me the dispute" between two people on a support rotation is a
 * pasted URL — a modal has none of that.
 *
 * <h3>What is carried over unchanged from the old console, and why</h3>
 * The resolve form reads `requiresAmount` / `requiresEntitlement` from the server's own resolution
 * catalogue instead of keeping a private copy of those rules, and it refuses an amount larger than
 * the order's refundable headroom rather than clamping it. Both were right before and are right now:
 * a private copy of the rules is how an admin ends up submitting a PARTIAL_REFUND with no amount,
 * and a clamped over-refund is a silent wrong answer where a refusal is a loud correct one.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Gavel,
  Loader2,
  Lock,
  ServerCog,
  Sparkles,
  HelpCircle,
  UserCheck,
  UserX,
  Video,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useAdminReplyOnDispute,
  useAssignDispute,
  useInspectDispute,
  useRefundableHeadroom,
  useRequestDisputeInfo,
  useResolutionCatalogue,
  useResolveDispute,
  useTryAutoResolveDispute,
} from "@/features/mentorship-v2/api/disputes.hooks"
import type { DisputeAttendance, DisputeRow } from "@/features/mentorship-v2/api/disputes.types"
import {
  PersonCell,
  RefLink,
  StatusBadge,
  evidenceLabel,
  formatMinor,
  formatWhen,
  humanise,
  settlementLabel,
} from "./console-format"

export default function DisputeDetailView({ disputeId }: { disputeId: string }) {
  const router = useRouter()
  const query = useInspectDispute(disputeId)
  const dispute = query.data

  if (query.isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-5 animate-spin" /> Loading dispute…
      </p>
    )
  }

  if (query.isError || !dispute) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_DISPUTES)}>
          <ArrowLeft className="size-4" /> Back to disputes
        </Button>
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>No dispute found</AlertTitle>
          <AlertDescription>
            Nothing matches <span className="font-mono">{disputeId}</span>. It may have been opened
            against a different environment.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_DISPUTES)}
        >
          <ArrowLeft className="size-4" /> Disputes
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
              {dispute.disputeTypeLabel}
              <StatusBadge status={dispute.status} label={dispute.statusLabel} />
              <Badge variant="outline" className="font-normal">
                {dispute.priority}
              </Badge>
              {dispute.payoutHold ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <Lock className="size-3.5" aria-hidden="true" /> payout held
                </span>
              ) : null}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{dispute.disputeId}</p>
            {/*
              `statusExplanation` is deliberately NOT rendered here. It is participant-facing copy —
              "Our team is reviewing this now, you do not need to do anything unless we ask" — which
              is correct on the buyer's and mentor's pages and nonsense on this one, where the reader
              IS the team. The status chip above already says the same thing to an admin.
            */}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── Left: the case file ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Case file</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <Field label="Buyer">
                <PersonCell name={dispute.buyerName} userId={dispute.buyerUserId} />
              </Field>
              <Field label="Mentor">
                <PersonCell name={dispute.mentorName} userId={dispute.mentorUserId} />
              </Field>
              <Field label="Order">
                <RefLink
                  id={dispute.orderNumber ?? dispute.orderId}
                  href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${dispute.orderId}`}
                />
              </Field>
              <Field label="Session">
                <RefLink
                  id={dispute.bookingId}
                  href={
                    dispute.bookingId
                      ? `${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${dispute.bookingId}`
                      : undefined
                  }
                />
              </Field>
              <Field label="Service">
                {dispute.serviceTitle ? (
                  <Link
                    href={`${PATH_CONSTANTS.ADMIN_PM_SERVICES}/${dispute.serviceId}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {dispute.serviceTitle}
                  </Link>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Amount in question">
                {formatMinor(dispute.amountInQuestionMinor, dispute.currency)}
              </Field>
              <Field label="Raised by">
                {dispute.raisedByRole}
                {dispute.raisedByUserId ? ` · ${dispute.raisedByUserId}` : ""}
              </Field>
              <Field label="Assigned">{dispute.assignedAdminName ?? "Unassigned"}</Field>
              <Field label="Opened">{formatWhen(dispute.createdAt)}</Field>
              <Field label="First response">{formatWhen(dispute.firstResponseAt)}</Field>
              <Field label="Resolved">{formatWhen(dispute.resolvedAt)}</Field>
              <Field label="Appeal window ends">{formatWhen(dispute.appealWindowEndsAt)}</Field>
              <Field label="Payout hold">
                {dispute.payoutHold
                  ? "HELD"
                  : `released ${formatWhen(dispute.payoutHoldReleasedAt)}`}
              </Field>
              <Field label="Reopened">{dispute.reopenedCount} / 1 allowed</Field>
              {dispute.resolution ? (
                <>
                  <Field label="Resolution">{dispute.resolutionLabel ?? dispute.resolution}</Field>
                  <Field label="Amount moved">
                    {formatMinor(dispute.resolutionAmountMinor, dispute.currency)}
                  </Field>
                  <Field label="Auto-resolved">
                    {dispute.autoResolved ? (dispute.autoResolutionRule ?? "yes") : "no"}
                  </Field>
                </>
              ) : null}
            </CardContent>
          </Card>

          {dispute.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Original complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{dispute.description}</p>
              </CardContent>
            </Card>
          ) : null}

          {dispute.attendance ? <AttendancePanel attendance={dispute.attendance} /> : null}

          {dispute.evidence && dispute.evidence.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence</CardTitle>
                <CardDescription>
                  System-attached entries are highlighted — the join ledger is auto-attached on every
                  dispute and is the evidence a chargeback response is written from.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dispute.evidence.map((item) => (
                  <div
                    key={item.evidenceId}
                    className={
                      item.kind === "SYSTEM_LOG"
                        ? "rounded-md border border-primary/40 bg-primary/5 p-3"
                        : "rounded-md border p-3"
                    }
                  >
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      {item.kind === "SYSTEM_LOG" ? <ServerCog className="size-3.5" /> : null}
                      {item.kindLabel} · {item.uploadedByName ?? "Revquix"} ·{" "}
                      {formatWhen(item.createdAt)}
                    </p>
                    {item.systemSummary ? <p className="mt-1 text-sm">{item.systemSummary}</p> : null}
                    {item.caption ? (
                      <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
                    ) : null}
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs underline underline-offset-2"
                      >
                        Open attachment
                      </a>
                    ) : null}
                    {item.systemPayload ? (
                      <pre className="mt-2 max-h-64 overflow-auto rounded bg-background/80 p-2 text-[10px]">
                        {JSON.stringify(item.systemPayload, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {dispute.messages && dispute.messages.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thread ({dispute.messages.length})</CardTitle>
                <CardDescription>
                  Internal staff notes are visible here and nowhere else — neither party ever sees
                  them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dispute.messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={
                      message.internal
                        ? "rounded-md border border-dashed border-amber-500/60 bg-amber-500/5 p-2.5"
                        : "rounded-md border p-2.5"
                    }
                  >
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                      {message.authorName ?? "Revquix"}
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {message.authorRole}
                      </Badge>
                      {message.internal ? (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                          internal
                        </Badge>
                      ) : null}
                      <span className="font-normal text-muted-foreground">
                        {formatWhen(message.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {dispute.audit && dispute.audit.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit trail ({dispute.audit.length})</CardTitle>
                <CardDescription>Append-only. Every action on this case, in order.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5 border-l pl-3">
                  {dispute.audit.map((row) => (
                    <li key={row.auditId} className="text-xs">
                      <p className="font-medium">
                        {row.action} · {row.actorType}
                        {row.actorName ? ` (${row.actorName})` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {formatWhen(row.createdAt)}
                        {row.note ? ` · ${row.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ── Right: actions ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <DisputeActionsPanel dispute={dispute} />
        </div>
      </div>
    </div>
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

function DisputeActionsPanel({ dispute }: { dispute: DisputeRow }) {
  const catalogue = useResolutionCatalogue()
  const headroom = useRefundableHeadroom(dispute.disputeId)
  const assign = useAssignDispute(dispute.disputeId)
  const reply = useAdminReplyOnDispute(dispute.disputeId)
  const requestInfo = useRequestDisputeInfo(dispute.disputeId)
  const tryAuto = useTryAutoResolveDispute(dispute.disputeId)
  const resolve = useResolveDispute(dispute.disputeId)

  const [messageBody, setMessageBody] = useState("")
  const [internal, setInternal] = useState(false)
  const [resolution, setResolution] = useState("")
  const [amount, setAmount] = useState("")
  const [extendDays, setExtendDays] = useState("")
  const [note, setNote] = useState("")
  const [reject, setReject] = useState(false)

  const terminal =
    dispute.status === "RESOLVED" || dispute.status === "REJECTED" || dispute.status === "WITHDRAWN"

  const selected = (catalogue.data ?? []).find((option) => option.value === resolution)
  const needsAmount = selected?.requiresAmount ?? false
  const needsEntitlement = selected?.requiresEntitlement ?? false
  const amountMinor = amount.trim() ? Number(amount.trim()) : undefined
  const refundable = headroom.data?.refundableMinor ?? 0
  const amountTooLarge = needsAmount && amountMinor !== undefined && amountMinor > refundable

  const canResolve =
    !terminal &&
    !!resolution &&
    note.trim().length >= 10 &&
    (!needsAmount || (amountMinor !== undefined && amountMinor > 0)) &&
    !amountTooLarge &&
    (!needsEntitlement || !!dispute.entitlementId) &&
    !resolve.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {terminal ? (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertDescription className="text-xs">
              This dispute is closed ({dispute.statusLabel}). Only the parties can reopen it, once,
              inside the appeal window.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => assign.mutate(undefined)}
                disabled={assign.isPending}
              >
                {assign.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserCheck className="size-4" />
                )}
                Take this case
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => tryAuto.mutate()}
                disabled={tryAuto.isPending}
              >
                {tryAuto.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Try the automatic rules
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium">Message</p>
              <Textarea
                rows={3}
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="What do you want to say, or note internally?"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                />
                Internal note — staff only, never shown to either party
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    reply.mutate(
                      { body: messageBody.trim(), internal },
                      { onSuccess: () => setMessageBody("") },
                    )
                  }
                  disabled={!messageBody.trim() || reply.isPending}
                >
                  {reply.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {internal ? "Save internal note" : "Reply to both"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    requestInfo.mutate(
                      { fromBuyer: true, body: messageBody.trim() },
                      { onSuccess: () => setMessageBody("") },
                    )
                  }
                  disabled={!messageBody.trim() || internal || requestInfo.isPending}
                >
                  Ask the customer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    requestInfo.mutate(
                      { fromBuyer: false, body: messageBody.trim() },
                      { onSuccess: () => setMessageBody("") },
                    )
                  }
                  disabled={!messageBody.trim() || internal || requestInfo.isPending}
                >
                  Ask the mentor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                &quot;Ask&quot; moves the ball to that side and puts the dispute on their
                pending-action list, rather than leaving it reading &quot;under review&quot; while
                everyone waits for everyone else.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium">
                <Gavel className="size-3.5" /> Resolve
              </p>
              <p className="text-xs text-muted-foreground">
                Every option performs a real action — a refund through the single refund path, a
                payout release, a package-validity extension, a service suspension. Refundable
                headroom on this order: <strong>{formatMinor(refundable, dispute.currency)}</strong>.
                An amount larger than that is refused, not clamped.
              </p>

              <select
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Choose a resolution…</option>
                {(catalogue.data ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.requiresAmount ? " (needs an amount)" : ""}
                    {option.penalisesMentor ? " · penalises mentor" : ""}
                  </option>
                ))}
              </select>

              {needsAmount ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Amount in minor units (paise/cents)"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  {amountTooLarge ? (
                    <p className="text-xs font-medium text-destructive">
                      That is more than this order can still refund (
                      {formatMinor(refundable, dispute.currency)}).
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {amountMinor ? formatMinor(amountMinor, dispute.currency) : "In minor units."}
                    </p>
                  )}
                </div>
              ) : null}

              {needsEntitlement ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Extend validity by how many days (default 30)"
                    value={extendDays}
                    onChange={(event) => setExtendDays(event.target.value)}
                  />
                  {dispute.entitlementId ? (
                    /*
                      Named, not merely implied. On a dispute filed against a session the buyer
                      redeemed, the item being extended is the one that session came out of — which
                      is nowhere else on this screen, and an operator pushing a validity window out
                      should be able to see which window they are moving before they move it.
                    */
                    <p className="text-xs text-muted-foreground">
                      Extends package item <strong>{dispute.entitlementId}</strong>
                      {dispute.bookingId ? " — the one this session was redeemed from" : ""}.
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-destructive">
                      This dispute is not about a package item — it names no entitlement and its
                      booking was not redeemed from one — so there is no validity window to extend.
                      Pick a different resolution.
                    </p>
                  )}
                </div>
              ) : null}

              <Textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explain the decision — both parties will read this (min 10 characters)"
              />

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={reject}
                  onChange={(event) => setReject(event.target.checked)}
                />
                Decline instead of resolve — no remedy executed, payout hold lifted, nothing recorded
                against the mentor
              </label>

              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() =>
                  resolve.mutate({
                    resolution,
                    note: note.trim(),
                    amountMinor,
                    reject,
                    extendValidityDays: extendDays.trim() ? Number(extendDays.trim()) : undefined,
                  })
                }
                disabled={!canResolve}
              >
                {resolve.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Applying…
                  </>
                ) : (
                  <>
                    <Gavel className="size-4" /> {reject ? "Decline dispute" : "Resolve and execute"}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * ─── ATTENDANCE ───────────────────────────────────────────────────────────────
 *
 * The screen an attendance dispute is actually decided on.
 *
 * <h3>Why this sits above the evidence list rather than inside it</h3>
 * The `SYSTEM_LOG` evidence row below is a **snapshot**, frozen when the complaint was filed —
 * deliberately, because a case resolved six weeks later should be judged against what was true when
 * it was made. But Google's participant records for the room are ingested once its conference has
 * ended, which on a session a buyer disputes the moment it fails is *after* that. So the panel reads
 * live, and both are on screen. When the two disagree, that disagreement is the finding.
 *
 * <h3>The verdict line is the panel, and the tables are its working</h3>
 * Every branch of `verdict` is written to claim no more than its source supports, and the ordering
 * here follows from that: an operator who reads only the first sentence must not be able to reach a
 * wrong conclusion. The tables are for the operator who distrusts it, which is the right instinct on
 * a screen that moves money.
 *
 * <h3>What is deliberately not rendered</h3>
 * The room's join URL. It is a bearer capability — anyone holding it walks in, signed in or not —
 * and a URL on an admin screen is a URL in a screenshot. The server does not send it; do not add it.
 */
function AttendancePanel({ attendance }: { attendance: DisputeAttendance }) {
  const participants = attendance.meetParticipants ?? []
  const joinEvents = attendance.joinEvents ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Video className="size-4" aria-hidden="true" />
          Attendance
          {attendance.revquixHostedRoom ? (
            <Badge variant="outline" className="font-normal">
              Revquix-hosted room
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-normal">
              Room not ours
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Read live, not from the snapshot below. Google&apos;s record of who was in the room usually
          arrives after the complaint was filed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── The one sentence ── */}
        {attendance.verdict ? (
          <Alert variant={attendance.evidenceUsable ? "default" : "destructive"}>
            {attendance.absenceProven ? (
              <UserX className="size-4" />
            ) : attendance.evidenceUsable ? (
              <UserCheck className="size-4" />
            ) : (
              <HelpCircle className="size-4" />
            )}
            <AlertTitle>
              {attendance.absenceProven
                ? "Nobody entered the room"
                : !attendance.evidenceUsable
                  ? "No attendance record exists for this session"
                  : presenceHeadline(attendance)}
            </AlertTitle>
            <AlertDescription>{attendance.verdict}</AlertDescription>
          </Alert>
        ) : null}

        {/*
          The caveat, when there is one. It exists because the blank space is the problem: Revquix
          signs users in by email, so an unlabelled participant is an ORDINARY participant — but on
          the screen a refund is decided from it reads as an intruder unless something says so.
        */}
        {attendance.caveat ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            {attendance.caveat}
          </p>
        ) : null}

        {attendance.meetUnexpectedParticipantCount > 0 ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <strong>{attendance.meetUnexpectedParticipantCount}</strong> signed-in{" "}
            {attendance.meetUnexpectedParticipantCount === 1 ? "identity was" : "identities were"} in
            this room and matched neither party. Very often that is the mentor on a second Google
            account or a colleague they brought — it is a flag for you, not a finding.
          </p>
        ) : null}

        {/* ── The facts behind it ── */}
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Mentor">
            <PresencePill present={attendance.mentorAttended} usable={attendance.evidenceUsable} />
          </Field>
          <Field label="Customer">
            <PresencePill present={attendance.buyerAttended} usable={attendance.evidenceUsable} />
          </Field>
          <Field label="Evidence source">{evidenceLabel(attendance.evidenceSource)}</Field>
          <Field label="Platform settled it as">
            {settlementLabel(attendance.settlementDecision)}
          </Field>
          <Field label="Where it was held">{attendance.meetingProviderLabel ?? "—"}</Field>
          <Field label="How the link was produced">
            {humanise(attendance.meetingLinkSource) || "—"}
            {attendance.hasMeetingLink ? "" : " · no link was ever set"}
          </Field>
          <Field label="Scheduled">
            {formatWhen(attendance.startsAt)} → {formatWhen(attendance.endsAt)}
          </Field>
          <Field label="Join window">
            {formatWhen(attendance.joinWindowOpensAt)} → {formatWhen(attendance.joinWindowClosesAt)}
          </Field>
          <Field label="Mentor first clicked Join">{formatWhen(attendance.mentorJoinedAt)}</Field>
          <Field label="Customer first clicked Join">{formatWhen(attendance.buyerJoinedAt)}</Field>
          <Field label="Mentor confirmed attendance">
            {formatWhen(attendance.mentorConfirmedAttendedAt)}
          </Field>
          <Field label="Customer confirmed attendance">
            {formatWhen(attendance.buyerConfirmedAttendedAt)}
          </Field>
          {attendance.revquixHostedRoom ? (
            <>
              <Field label="Google's read of the room">
                {/*
                  NO_RECORD is evidence, not an error — the tracked Join hop is the only door to a
                  Revquix room, so no conference means nobody entered. Rendering it in red would
                  teach an operator to discount the strongest finding this panel can produce.
                */}
                {humanise(attendance.meetAttendanceStatus) || "not read yet"}
                {attendance.meetAttendanceSyncedAt
                  ? ` · ${formatWhen(attendance.meetAttendanceSyncedAt)}`
                  : ""}
              </Field>
              <Field label="Distinct signed-in identities">
                {attendance.meetDistinctSignedInCount}
              </Field>
            </>
          ) : null}
          {attendance.meetingLinkError ? (
            <Field label="Last link error">{attendance.meetingLinkError}</Field>
          ) : null}
        </div>

        {/* ── Google's participant records ── */}
        {attendance.revquixHostedRoom ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              In the room, in arrival order ({participants.length})
            </p>
            {participants.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                {attendance.meetAttendanceStatus === "NO_RECORD"
                  ? "Google has no conference for this room at all."
                  : "Google's records for this room have not been read yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Who</th>
                      <th className="py-1.5 pr-3 font-medium">Joined</th>
                      <th className="py-1.5 pr-3 font-medium">Left</th>
                      <th className="py-1.5 pr-3 font-medium">Present</th>
                      <th className="py-1.5 font-medium">Conference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((row) => (
                      <tr key={row.meetParticipantId} className="border-b last:border-0">
                        <td className="py-1.5 pr-3">
                          <span className="flex flex-wrap items-center gap-1.5">
                            {/*
                              `identified` and nothing else. A display name is typed by whoever
                              joined the lobby, so rendering an UNMATCHED row as "Mentor" would let a
                              no-show claim — which is a refund — be defeated by typing.
                            */}
                            {row.identified ? (
                              <Badge variant="outline" className="font-normal">
                                {humanise(row.resolvedRole)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-normal">
                                Unidentified
                              </Badge>
                            )}
                            <span className={row.identified ? "" : "text-muted-foreground"}>
                              {row.displayName ?? "no name"}
                            </span>
                            {row.kind === "ANONYMOUS" ? (
                              <span className="text-xs text-muted-foreground">
                                (not signed in — name typed by them)
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 tabular-nums">{formatWhen(row.joinedAt)}</td>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {row.leftAt ? formatWhen(row.leftAt) : "still in the room when read"}
                        </td>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {row.minutesPresent == null ? "—" : `${row.minutesPresent} min`}
                        </td>
                        <td className="py-1.5 font-mono text-xs text-muted-foreground">
                          {shortConference(row.conferenceRecord)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* ── The click ledger ── */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Join button clicks ({joinEvents.length})
          </p>
          {joinEvents.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Nobody pressed Join.
              {attendance.revquixHostedRoom
                ? " On a Revquix-hosted room that is the only way in, so this is meaningful."
                : " This room could be reached without it, so this says little on its own."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-3 font-medium">Who</th>
                    <th className="py-1.5 pr-3 font-medium">Clicked</th>
                    <th className="py-1.5 pr-3 font-medium">Counted</th>
                    <th className="py-1.5 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {joinEvents.map((row) => (
                    <tr key={row.joinEventId} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">{humanise(row.role)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{formatWhen(row.joinClickedAt)}</td>
                      <td className="py-1.5 pr-3">
                        {/*
                          Two separate reasons a click does not count, and they mean different
                          things: outside the window is "too early or too late", no link is "there
                          was nothing to join". Both prove intent; neither proves attendance.
                        */}
                        {!row.withinWindow ? (
                          <span className="text-muted-foreground">outside the window</span>
                        ) : row.linkPresent === false ? (
                          <span className="text-muted-foreground">no link to join</span>
                        ) : (
                          <span>yes</span>
                        )}
                      </td>
                      <td className="py-1.5 font-mono text-xs text-muted-foreground">
                        {row.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** The headline above the verdict, kept in step with the two booleans below it. */
function presenceHeadline(attendance: DisputeAttendance): string {
  if (attendance.mentorAttended && attendance.buyerAttended) return "Both parties attended"
  if (attendance.mentorAttended) return "Mentor attended, customer did not"
  if (attendance.buyerAttended) return "Customer attended, mentor did not"
  return "No attendance recorded for either party"
}

/**
 * Present / not recorded / cannot say — three states, not two.
 *
 * The third is the one that matters. "Not recorded" on a booking that can produce evidence is a
 * finding; on one that cannot it is an absence of data, and collapsing them into a red "absent"
 * chip is how an operator refunds against somebody who was there.
 */
function PresencePill({ present, usable }: { present: boolean; usable: boolean }) {
  if (!usable) {
    return <span className="text-muted-foreground">cannot say — no usable record</span>
  }
  return present ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
      <UserCheck className="size-3.5" aria-hidden="true" /> recorded as present
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
      <UserX className="size-3.5" aria-hidden="true" /> no record of attending
    </span>
  )
}

/**
 * The tail of `conferenceRecords/{id}`, which is all that is worth showing.
 *
 * The full name is long and identical on every row of the same conference; the tail is what lets an
 * operator see at a glance that two rows belong to DIFFERENT conferences — somebody dropped and
 * rejoined, or a false start preceded the real call, which is exactly the shape a confused dispute
 * takes.
 */
function shortConference(value: string | null): string {
  if (!value) return "—"
  const slash = value.lastIndexOf("/")
  return slash >= 0 ? value.slice(slash + 1) : value
}
