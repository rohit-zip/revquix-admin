/**
 * ─── DECIDING A HELD REFERRAL ────────────────────────────────────────────────
 *
 * Confirms a release or a rejection, and takes the reason that makes the decision reviewable.
 *
 * ── Why the reason is mandatory in both directions ───────────────────────────
 * A **release** pays real credits against a signal the system raised. Whoever audits it later needs
 * to know what the reviewer saw that the guard could not.
 *
 * A **rejection** is terminal and deliberately silent to both parties — naming the rule that caught
 * someone is a tuning signal for a fraudster. The cost of that silence is that a legitimate user is
 * not told either, so the text typed here is the only explanation that will exist when they
 * eventually contact support.
 *
 * ── Why the two paths look different ─────────────────────────────────────────
 * Not decoration. A release is the recoverable action — if it turns out to be wrong, credits can be
 * revoked. A rejection cannot be undone from this screen and the user will never know it happened,
 * so it is the one that gets the warning tone and the slower-reading confirmation.
 */

"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { AdminReferralReviewRow } from "../api/tools-admin.types"

/** Long enough to be a sentence rather than "ok". Short enough not to be a chore. */
const MIN_REASON_LENGTH = 15

interface ReferralDecisionDialogProps {
  open: boolean
  row: AdminReferralReviewRow | null
  action: "release" | "reject"
  pending: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function ReferralDecisionDialog({
  open,
  row,
  action,
  pending,
  onCancel,
  onConfirm,
}: ReferralDecisionDialogProps) {
  const [reason, setReason] = React.useState("")

  // Clear between openings, so a reason typed for one attempt can never be submitted against
  // another — which would put a false explanation in an audit trail nobody would think to doubt.
  React.useEffect(() => {
    if (open) setReason("")
  }, [open, row?.attemptId])

  const trimmed = reason.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_REASON_LENGTH
  const canSubmit = trimmed.length >= MIN_REASON_LENGTH && !pending

  const isRelease = action === "release"

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isRelease ? "Pay this referral" : "Refuse this referral"}
          </DialogTitle>
          <DialogDescription>
            {isRelease ? (
              <>
                The referrer and the referee are both paid, through exactly the path a clean referral
                takes. Self-referral and same-mailbox matches cannot be overridden this way — if one
                of those is what held it, the decision is recorded but nothing is paid.
              </>
            ) : (
              <>
                Terminal, and <strong>neither party is told</strong>. If this is a false positive,
                the referrer will simply never receive credits and will not know why — the reason you
                write below is the only record support will have.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {row && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Referrer</span>
              <span className="font-medium">{row.referrerEmail ?? row.referrerUserId}</span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Referee</span>
              <span className="font-medium">{row.refereeEmail ?? row.refereeUserId}</span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Held by</span>
              <span className="font-mono">{row.reasonCode}</span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Referrer history</span>
              <span className="tabular-nums">
                {row.referrerTotalAttempts} referrals · {row.referrerGrantedAttempts} paid ·{" "}
                {row.referrerBlockedAttempts} blocked
              </span>
            </div>
          </div>
        )}

        {!isRelease && (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Most attempts in this queue have an innocent explanation — that is why they were held
              rather than rejected outright. If you are unsure, leaving it here costs nothing.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="referral-decision-reason">
            What did you see? <span aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </Label>
          <Textarea
            id="referral-decision-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
            rows={3}
            maxLength={500}
            placeholder={
              isRelease
                ? "e.g. Both accounts are on one campus network; different devices, weeks apart, both actively using the product."
                : "e.g. Six referees registered within nine minutes, all from one device signature."
            }
            aria-describedby="referral-decision-reason-help"
          />
          <p
            id="referral-decision-reason-help"
            className={tooShort ? "text-xs text-red-600" : "text-xs text-muted-foreground"}
          >
            {tooShort
              ? `At least ${MIN_REASON_LENGTH} characters — this is the audit record.`
              : "Recorded against your admin id, permanently."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={isRelease ? "default" : "destructive"}
            disabled={!canSubmit}
            onClick={() => onConfirm(trimmed)}
          >
            {pending ? "Saving…" : isRelease ? "Pay the referral" : "Refuse it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
