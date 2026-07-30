/**
 * ─── SCREEN 2: CREDIT ADJUSTMENT (§8.2) ──────────────────────────────────────
 *
 * The "increase / decrease credits" surface. Four things about it are deliberate and easy to get
 * wrong if this file is ever rewritten:
 *
 * 1. **The guardrail state is shown BEFORE the form, not after a refusal.** An admin sees "100 of your
 *    500 daily allowance left" before typing 300. A control that only speaks at the moment it refuses
 *    is experienced as an obstacle and gets routed around — and the workaround is a psql session with
 *    no cap, no audit row and no reason field.
 *
 * 2. **`amount` is always positive.** The action sets the sign server-side, so a stray minus in the
 *    "add" field cannot debit a user. The form does not even accept one.
 *
 * 3. **A 200 can mean "not applied".** An over-cap request comes back with
 *    `outcome: "PENDING_APPROVAL"`, and this screen shows it as queued rather than as done.
 *
 * 4. **Removing credits may take the balance negative.** That is allowed, flagged, and blocks further
 *    runs. The confirmation says so plainly rather than the form silently clamping — a clamped zero
 *    would lose the information that the correction exceeded what the user had left.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  RotateCcw,
  Undo2,
  Users,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useAuthorization } from "@/hooks/useAuthorization"
import {
  useAdjustCredits,
  useBulkGrantCredits,
  useCreditGuardrails,
  useDeclineAdjustment,
  useSetFreeQuotaOverride,
} from "./api/tools-admin.hooks"
import type {
  AdminAdjustmentAction,
  AdminAuditRow,
  ToolSubjectType,
} from "./api/tools-admin.types"
import {
  ConstraintNote,
  IdCell,
  OutcomeBadge,
  ReasonField,
  type ReasonState,
  ScreenHeader,
  SectionCard,
  StatementNoteField,
  formatDateTime,
  isReasonValid,
} from "./components/tools-admin-shared"

const ACTION_META: Record<
  Extract<AdminAdjustmentAction, "ADD_CREDITS" | "REMOVE_CREDITS" | "REFUND" | "REVOKE">,
  { label: string; ledger: string; Icon: typeof Plus; destructive: boolean; note: string }
> = {
  ADD_CREDITS: {
    label: "Add credits",
    ledger: "GRANT",
    Icon: Plus,
    destructive: false,
    note: "Writes a positive GRANT entry.",
  },
  REMOVE_CREDITS: {
    label: "Remove credits",
    ledger: "ADMIN_ADJUST",
    Icon: Minus,
    destructive: true,
    note: "Writes a negative ADMIN_ADJUST entry. May take the balance negative, which blocks further runs.",
  },
  REFUND: {
    label: "Refund",
    ledger: "REFUND",
    Icon: Undo2,
    destructive: false,
    note: "Writes a positive REFUND entry. Link a payment intent when the refund is tied to one.",
  },
  REVOKE: {
    label: "Revoke",
    ledger: "REVOKE",
    Icon: RotateCcw,
    destructive: true,
    note: "Writes a negative REVOKE entry for fraud or a chargeback. May take the balance negative.",
  },
}

const SUBJECT_TYPES: { value: ToolSubjectType; label: string }[] = [
  { value: "USER", label: "User account" },
  { value: "ANON", label: "Anonymous cookie" },
  { value: "IP", label: "IP hash" },
]

export default function AdminToolAdjustView() {
  const router = useRouter()
  const { hasAnyAuthority } = useAuthorization()
  const guardrails = useCreditGuardrails()

  const canAdjust = hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_CREDITS"])

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Adjust credits"
        description="Add, remove, refund or revoke a user's credits; grant a cohort; or override a subject's daily free-run allowance. Every action writes one ledger row and one audit row, and every action needs a reason."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(PATH_CONSTANTS.ADMIN_TOOL_CREDITS)}
          >
            Back to ledger
          </Button>
        }
      />

      {!canAdjust && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>You cannot apply adjustments</AlertTitle>
          <AlertDescription>
            This page needs <code>PERM_MANAGE_CREDITS</code>. The controls below are disabled, and the
            API would refuse them regardless — the server enforces the permission, not this page.
          </AlertDescription>
        </Alert>
      )}

      <GuardrailPanel
        status={guardrails.data}
        loading={guardrails.isLoading}
        canAdjust={canAdjust}
      />

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single adjustment</TabsTrigger>
          <TabsTrigger value="bulk">Cohort grant</TabsTrigger>
          <TabsTrigger value="quota">Free-run override</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleAdjustmentForm disabled={!canAdjust} />
        </TabsContent>
        <TabsContent value="bulk" className="mt-4">
          <BulkGrantForm disabled={!canAdjust} maxUsers={guardrails.data?.bulkGrantMaxUsers ?? 1000} />
        </TabsContent>
        <TabsContent value="quota" className="mt-4">
          <FreeQuotaForm disabled={!canAdjust} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Guardrail panel ─────────────────────────────────────────────────────────

function GuardrailPanel({
  status,
  loading,
  canAdjust,
}: {
  status: ReturnType<typeof useCreditGuardrails>["data"]
  loading: boolean
  canAdjust: boolean
}) {
  const decline = useDeclineAdjustment()
  const apply = useAdjustCredits()

  if (loading || !status) {
    return (
      <div className="h-28 animate-pulse rounded-lg border bg-muted/40" aria-hidden="true" />
    )
  }

  const usedPercent =
    status.dailyGrantCap > 0
      ? Math.min(100, (status.movedInWindow / status.dailyGrantCap) * 100)
      : 100

  const actionable = status.pendingApprovals.filter(
    (row) => row.adminUserId !== status.adminUserId,
  )

  return (
    <SectionCard
      title="Your adjustment allowance"
      description="Shown before the form, not after a refusal. The server re-checks the cap on every adjustment, so this figure can never let anything through."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Rolling 24h allowance
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {status.remainingToday}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                of {status.dailyGrantCap} left
              </span>
            </p>
            <Progress value={usedPercent} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {status.movedInWindow} credit(s) moved. Counted as the{" "}
              <strong>absolute</strong> total, so a grant and an equal revocation do not cancel out —
              the cap bounds the magnitude of unreviewed activity, in either direction.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Single adjustment cap
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {status.singleAdjustmentCap}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lower than the daily cap on purpose: this one catches a fat-finger — an extra zero on a
              goodwill grant — while the daily cap bounds a slow leak.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Awaiting a second approver
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {status.pendingApprovals.length}
              {status.pendingRaisedBySelf > 0 && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({status.pendingRaisedBySelf} yours)
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You may approve any of these you did not raise yourself. Self-approval is refused by the
              API and by a database constraint.
            </p>
          </div>
        </div>

        {status.pendingApprovals.length > 0 && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            {status.pendingApprovals.map((row) => (
              <PendingApprovalRow
                key={row.auditId}
                row={row}
                actionable={actionable.some((a) => a.auditId === row.auditId) && canAdjust}
                onApprove={() =>
                  apply.mutate({
                    userId: row.targetUserId ?? "",
                    action: row.action,
                    amount: Math.abs(row.delta ?? 0),
                    reasonCode: row.reasonCode,
                    reason: row.reason,
                    approvalOfAuditId: row.auditId,
                  })
                }
                onDecline={() => decline.mutate({ auditId: row.auditId })}
                busy={apply.isPending || decline.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function PendingApprovalRow({
  row,
  actionable,
  onApprove,
  onDecline,
  busy,
}: {
  row: AdminAuditRow
  actionable: boolean
  onApprove: () => void
  onDecline: () => void
  busy: boolean
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <IdCell value={row.auditId} />
          <Badge variant="outline" className="text-xs">
            {row.action.replace(/_/g, " ").toLowerCase()}
          </Badge>
          <span className="text-xs tabular-nums">
            {row.delta !== null && row.delta > 0 ? `+${row.delta}` : row.delta} credits
          </span>
          {row.targetUserId && <IdCell value={row.targetUserId} className="text-[10px]" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{row.reason}</p>
        <p className="text-[10px] text-muted-foreground">
          Raised by <IdCell value={row.adminUserId} className="text-[10px]" /> ·{" "}
          {formatDateTime(row.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actionable ? (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={onDecline}>
              Decline
            </Button>
            <Button size="sm" disabled={busy} onClick={onApprove}>
              Approve &amp; apply
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            You raised this — a different admin must approve it
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Single adjustment ───────────────────────────────────────────────────────

function SingleAdjustmentForm({ disabled }: { disabled: boolean }) {
  const adjust = useAdjustCredits()
  const [action, setAction] = React.useState<keyof typeof ACTION_META>("ADD_CREDITS")
  const [userId, setUserId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState<ReasonState>({ code: "", text: "" })
  const [statementNote, setStatementNote] = React.useState("")
  const [paymentIntentId, setPaymentIntentId] = React.useState("")
  const [confirming, setConfirming] = React.useState(false)

  const meta = ACTION_META[action]
  // Held as a string, not a number: a number-typed field cannot represent the intermediate states a
  // person types (an empty field, a lone digit being deleted), so storing those as a number either
  // wipes the field under the cursor or fills the panel with NaN. Same call P5 made on every money
  // input.
  const parsedAmount = Number.parseInt(amount, 10)
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0

  const canSubmit = !disabled && userId.trim().length > 0 && amountValid && isReasonValid(reason)

  const submit = () => {
    adjust.mutate(
      {
        userId: userId.trim(),
        action,
        amount: parsedAmount,
        reasonCode: reason.code as Exclude<ReasonState["code"], "">,
        reason: reason.text.trim(),
        statementNote: statementNote.trim() || undefined,
        paymentIntentId: paymentIntentId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setConfirming(false)
          setAmount("")
          setReason({ code: "", text: "" })
          setStatementNote("")
          setPaymentIntentId("")
        },
        onError: () => setConfirming(false),
      },
    )
  }

  return (
    <SectionCard
      title="One user"
      description="Writes exactly one ledger row and one audit row, linked by entry ID."
    >
      <div className="space-y-5">
        {/* Action picker as segmented buttons rather than a select: four options, and the destructive
            two need to look destructive before they are chosen, not after. */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Action</span>
          <div
            role="radiogroup"
            aria-label="Adjustment action"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {(Object.keys(ACTION_META) as (keyof typeof ACTION_META)[]).map((key) => {
              const item = ACTION_META[key]
              const selected = action === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => setAction(key)}
                  className={[
                    "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium",
                    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    selected
                      ? item.destructive
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  <item.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">{meta.note}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-user-id">
              User ID <span aria-hidden="true">*</span>
              <span className="sr-only">required</span>
            </Label>
            <Input
              id="adjust-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={disabled}
              placeholder="USR0000000123"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-amount">
              Credits <span aria-hidden="true">*</span>
              <span className="sr-only">required</span>
            </Label>
            <Input
              id="adjust-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              disabled={disabled}
              inputMode="numeric"
              placeholder="20"
              aria-describedby="adjust-amount-help"
            />
            <p id="adjust-amount-help" className="text-xs text-muted-foreground">
              Always a positive number — the action above sets the sign, so a minus sign here cannot
              debit anybody.
            </p>
          </div>
        </div>

        {(action === "REFUND" || action === "REVOKE") && (
          <div className="space-y-1.5">
            <Label htmlFor="adjust-payment-intent">Payment intent ID (optional)</Label>
            <Input
              id="adjust-payment-intent"
              value={paymentIntentId}
              onChange={(event) => setPaymentIntentId(event.target.value)}
              disabled={disabled}
              placeholder="PMI0000000041"
              className="font-mono"
              aria-describedby="adjust-payment-intent-help"
            />
            <p id="adjust-payment-intent-help" className="text-xs text-muted-foreground">
              Linking a payment makes this a statutory financial record, retained for eight years in
              pseudonymised form on erasure rather than deleted. Leave blank for a support gesture.
            </p>
          </div>
        )}

        <ReasonField value={reason} onChange={setReason} disabled={disabled} idPrefix="adjust" />

        <StatementNoteField
          value={statementNote}
          onChange={setStatementNote}
          disabled={disabled}
          idPrefix="adjust"
          placeholder={
            meta.destructive ? "Credit correction by Revquix support" : "Credits added by Revquix support"
          }
        />

        {meta.destructive && (
          <ConstraintNote tone="warning">
            This may take the balance <strong>negative</strong>. That is allowed and is not a mistake: a
            reversal on credits the user already spent must be recorded in full. The account is flagged
            and further runs are blocked. Clamping at zero would silently absorb the difference and
            destroy the information that the correction exceeded what was left.
          </ConstraintNote>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Over either cap this is <strong>held for a second administrator</strong> rather than lost —
            you will get an audit reference to hand over.
          </p>
          <Button
            disabled={!canSubmit || adjust.isPending}
            variant={meta.destructive ? "destructive" : "default"}
            onClick={() => setConfirming(true)}
          >
            <meta.Icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {adjust.isPending ? "Applying…" : meta.label}
          </Button>
        </div>

        {adjust.data && <AdjustmentOutcome result={adjust.data} />}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {meta.label}: {amountValid ? parsedAmount : 0} credit(s)
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Writes a <code>{meta.ledger}</code> entry of{" "}
                  <strong>
                    {meta.destructive ? "−" : "+"}
                    {amountValid ? parsedAmount : 0}
                  </strong>{" "}
                  against <span className="font-mono">{userId.trim() || "—"}</span>.
                </p>
                {meta.destructive && (
                  <p className="text-amber-600 dark:text-amber-400">
                    This can take the balance below zero, which blocks further runs until it is
                    corrected.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  The reason is recorded permanently and cannot be edited afterwards — the audit trail
                  is append-only.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

/**
 * The result panel.
 *
 * Reads `outcome` rather than assuming a 200 means applied. A `PENDING_APPROVAL` is rendered as queued
 * with its audit reference, because that is what actually happened.
 */
function AdjustmentOutcome({
  result,
}: {
  result: NonNullable<ReturnType<typeof useAdjustCredits>["data"]>
}) {
  if (result.outcome === "PENDING_APPROVAL") {
    return (
      <Alert>
        <Clock className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Held for a second administrator</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>{result.message}</p>
          {result.guardrail && (
            <p className="text-xs">
              {result.guardrail.cap === "DAILY_TOTAL"
                ? `You have moved ${result.guardrail.alreadyMovedToday} credit(s) in the last 24 hours against a cap of ${result.guardrail.limit}.`
                : `This single adjustment of ${result.guardrail.requested} exceeds the per-adjustment cap of ${result.guardrail.limit}.`}
            </p>
          )}
          <p className="text-xs">
            Nothing was written to the ledger. Reference{" "}
            <span className="font-mono">{result.auditId}</span>.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant={result.balanceNegative ? "destructive" : "default"}>
      {result.balanceNegative ? (
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      <AlertTitle>
        {result.outcome === "REPLAYED" ? "Already applied" : "Applied"}
        {result.balanceNegative && " — balance is negative"}
      </AlertTitle>
      <AlertDescription className="space-y-1">
        <p>{result.message}</p>
        <p className="text-xs">
          <OutcomeBadge outcome={result.outcome} />{" "}
          {result.entryId && (
            <>
              Ledger entry <span className="font-mono">{result.entryId}</span> ·{" "}
            </>
          )}
          Audit <span className="font-mono">{result.auditId}</span>
        </p>
      </AlertDescription>
    </Alert>
  )
}

// ─── Cohort grant ────────────────────────────────────────────────────────────

function BulkGrantForm({ disabled, maxUsers }: { disabled: boolean; maxUsers: number }) {
  const bulkGrant = useBulkGrantCredits()
  const [batchId, setBatchId] = React.useState("")
  const [raw, setRaw] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState<ReasonState>({ code: "", text: "" })
  const [statementNote, setStatementNote] = React.useState("")
  const [confirming, setConfirming] = React.useState(false)

  // Split on anything that is not part of an id, so a pasted CSV column, a newline-separated list and a
  // comma-separated one all work without the operator having to reformat.
  const userIds = React.useMemo(
    () => Array.from(new Set(raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))),
    [raw],
  )

  const parsedAmount = Number.parseInt(amount, 10)
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const batchIdValid = /^[A-Za-z0-9][A-Za-z0-9._-]{3,39}$/.test(batchId.trim())
  const withinLimit = userIds.length > 0 && userIds.length <= maxUsers

  const canSubmit = !disabled && batchIdValid && withinLimit && amountValid && isReasonValid(reason)

  return (
    <SectionCard
      title="Cohort grant"
      description="The campus and corporate path. One GRANT per user, idempotent on re-submission."
    >
      <div className="space-y-5">
        <ConstraintNote>
          The <strong>batch ID is chosen by you and is required</strong>, because it is what makes a
          re-submission safe: each row is keyed <code>batch:&#123;batchId&#125;:&#123;userId&#125;</code>,
          so submitting the same batch again grants nothing and reports it as already granted. A
          server-generated id would differ on every submission and the second click after a timeout
          would double-grant the whole cohort.
        </ConstraintNote>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-batch-id">
              Batch ID <span aria-hidden="true">*</span>
              <span className="sr-only">required</span>
            </Label>
            <Input
              id="bulk-batch-id"
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              disabled={disabled}
              placeholder="iitb-placement-2026-cohort-a"
              className="font-mono"
              aria-invalid={batchId.length > 0 && !batchIdValid ? true : undefined}
              aria-describedby="bulk-batch-id-help"
            />
            <p id="bulk-batch-id-help" className="text-xs text-muted-foreground">
              4–40 characters: letters, digits, dot, underscore, hyphen. Choose something that names the
              cohort, so re-running it later means what you intend.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-amount">
              Credits per user <span aria-hidden="true">*</span>
              <span className="sr-only">required</span>
            </Label>
            <Input
              id="bulk-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              disabled={disabled}
              inputMode="numeric"
              placeholder="50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-user-ids">
            User IDs <span aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </Label>
          <Textarea
            id="bulk-user-ids"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            disabled={disabled}
            rows={6}
            className="font-mono text-xs"
            placeholder={"USR0000000123\nUSR0000000124\nUSR0000000125"}
            aria-describedby="bulk-user-ids-help"
          />
          <p id="bulk-user-ids-help" aria-live="polite" className="text-xs text-muted-foreground">
            {userIds.length} distinct user(s) · {amountValid ? userIds.length * parsedAmount : 0} credit(s)
            total. Newlines, commas or spaces all work. Duplicates are collapsed.
            {userIds.length > maxUsers && (
              <span className="text-destructive">
                {" "}
                Above the {maxUsers}-user limit for one batch — split it.
              </span>
            )}
          </p>
        </div>

        <ReasonField value={reason} onChange={setReason} disabled={disabled} idPrefix="bulk" />
        <StatementNoteField
          value={statementNote}
          onChange={setStatementNote}
          disabled={disabled}
          idPrefix="bulk"
          placeholder="Credits from your placement cell"
        />

        <ConstraintNote tone="warning">
          The guardrail applies to the <strong>batch total</strong>, not to each row — so a cohort grant
          normally needs a second administrator. That is correct: a placement-cell allocation is a
          commercial commitment, not a support gesture.
        </ConstraintNote>

        <div className="flex justify-end">
          <Button disabled={!canSubmit || bulkGrant.isPending} onClick={() => setConfirming(true)}>
            <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {bulkGrant.isPending ? "Granting…" : `Grant to ${userIds.length} user(s)`}
          </Button>
        </div>

        {bulkGrant.data && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Batch {bulkGrant.data.batchId}</AlertTitle>
            <AlertDescription className="space-y-1">
              <p className="text-sm">
                {bulkGrant.data.granted} granted · {bulkGrant.data.alreadyGranted} already granted ·{" "}
                {bulkGrant.data.failed} failed · {bulkGrant.data.creditsMoved} credit(s) moved.
              </p>
              {bulkGrant.data.alreadyGranted > 0 && bulkGrant.data.granted === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nothing was written — this batch had already been applied. That is idempotency
                  working, not a failure.
                </p>
              )}
              {bulkGrant.data.failures.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs">
                  {bulkGrant.data.failures.slice(0, 10).map((failure) => (
                    <li key={failure.userId} className="text-destructive">
                      <span className="font-mono">{failure.userId}</span> — {failure.reason}
                    </li>
                  ))}
                  {bulkGrant.data.failures.length > 10 && (
                    <li className="text-muted-foreground">
                      …and {bulkGrant.data.failures.length - 10} more.
                    </li>
                  )}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Grant {amountValid ? parsedAmount : 0} credits to {userIds.length} user(s)?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Total movement:{" "}
                  <strong>{amountValid ? userIds.length * parsedAmount : 0} credits</strong> under batch{" "}
                  <span className="font-mono">{batchId.trim()}</span>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Safe to re-run with the same batch ID — each row is individually keyed, so nothing is
                  granted twice.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkGrant.mutate(
                  {
                    batchId: batchId.trim(),
                    userIds,
                    amount: parsedAmount,
                    reasonCode: reason.code as Exclude<ReasonState["code"], "">,
                    reason: reason.text.trim(),
                    statementNote: statementNote.trim() || undefined,
                  },
                  { onSettled: () => setConfirming(false) },
                )
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

// ─── Free-run override ───────────────────────────────────────────────────────

function FreeQuotaForm({ disabled }: { disabled: boolean }) {
  const setQuota = useSetFreeQuotaOverride()
  const [subjectType, setSubjectType] = React.useState<ToolSubjectType>("USER")
  const [subjectKey, setSubjectKey] = React.useState("")
  const [mode, setMode] = React.useState<"default" | "unlimited" | "explicit">("explicit")
  const [explicit, setExplicit] = React.useState("")
  const [reason, setReason] = React.useState<ReasonState>({ code: "", text: "" })

  const parsedExplicit = Number.parseInt(explicit, 10)
  const explicitValid = Number.isFinite(parsedExplicit) && parsedExplicit > 0
  const canSubmit =
    !disabled &&
    subjectKey.trim().length > 0 &&
    isReasonValid(reason) &&
    (mode !== "explicit" || explicitValid)

  const customQuota = mode === "default" ? null : mode === "unlimited" ? -1 : parsedExplicit

  return (
    <SectionCard
      title="Free-run override"
      description="Writes tool_free_quota.custom_quota for today. For beta testers, partners and support goodwill."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quota-subject-type">Subject type</Label>
            <Select
              value={subjectType}
              onValueChange={(value) => setSubjectType(value as ToolSubjectType)}
              disabled={disabled}
            >
              <SelectTrigger id="quota-subject-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quota-subject-key">
              {subjectType === "USER"
                ? "User ID"
                : subjectType === "ANON"
                  ? "Anonymous cookie value"
                  : "IP hash"}{" "}
              <span aria-hidden="true">*</span>
              <span className="sr-only">required</span>
            </Label>
            <Input
              id="quota-subject-key"
              value={subjectKey}
              onChange={(event) => setSubjectKey(event.target.value)}
              disabled={disabled}
              className="font-mono"
              placeholder={subjectType === "USER" ? "USR0000000123" : "…"}
            />
          </div>
        </div>

        {subjectType === "IP" && (
          <ConstraintNote tone="warning">
            An IP override is almost always the wrong instrument. The hash is salted with the UTC date,
            so the override silently stops applying at midnight — and one CGNAT address in India can
            represent thousands of unrelated people, so you would be changing their allowance too.
          </ConstraintNote>
        )}

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Allowance</span>
          <div role="radiogroup" aria-label="Allowance" className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["default", "Configured default", "Clears any override."],
                ["unlimited", "Unlimited", "Writes −1."],
                ["explicit", "Explicit cap", "Any positive number."],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                disabled={disabled}
                onClick={() => setMode(value)}
                className={[
                  "rounded-md border px-3 py-2 text-left transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  mode === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "explicit" && (
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="quota-explicit">Free runs per day</Label>
            <Input
              id="quota-explicit"
              value={explicit}
              onChange={(event) => setExplicit(event.target.value.replace(/[^0-9]/g, ""))}
              disabled={disabled}
              inputMode="numeric"
              placeholder="10"
            />
          </div>
        )}

        <ConstraintNote>
          <strong>Zero is not accepted.</strong> To remove tools access, revoke{" "}
          <code>PERM_USE_TOOLS</code> from the fraud queue — that is visible on the user&apos;s
          permission page and reversible. A silent zero in a quota table nobody thinks to check would
          leave a user hitting a bare wall with no explanation, which is the one outcome the free daily
          run exists to prevent.
        </ConstraintNote>

        <ReasonField value={reason} onChange={setReason} disabled={disabled} idPrefix="quota" />

        <div className="flex justify-end">
          <Button
            disabled={!canSubmit || setQuota.isPending}
            onClick={() =>
              setQuota.mutate({
                subjectType,
                subjectKey: subjectKey.trim(),
                customQuota,
                reasonCode: reason.code as Exclude<ReasonState["code"], "">,
                reason: reason.text.trim(),
              })
            }
          >
            {setQuota.isPending ? "Saving…" : "Apply override"}
          </Button>
        </div>

        {setQuota.data && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Override applied</AlertTitle>
            <AlertDescription>
              <p className="text-sm">{setQuota.data.message}</p>
              <p className="mt-1 text-xs">
                Audit <span className="font-mono">{setQuota.data.auditId}</span>
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </SectionCard>
  )
}
