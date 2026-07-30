/**
 * ─── TRIAGE DIALOG (§8.7 actions) ────────────────────────────────────────────
 *
 * One dialog for all three triage decisions, because the mandatory-reason rule is identical for all of
 * them and three near-identical dialogs would let one drift and lose the reason floor.
 *
 * The copy differs per intent on purpose. "Revoke tools access" has to say what it does *not* do —
 * §8.7's whole design point is that it is not an account lock — and "Whitelist" has to say that it is
 * recorded, because an operator will reasonably assume clearing a false positive is a no-op.
 */

"use client"

import React from "react"
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
import {
  useMarkSubjectAbuse,
  useRevokeToolsAccess,
  useWhitelistSubject,
} from "../api/tools-admin.hooks"
import type { ToolSubjectType } from "../api/tools-admin.types"
import { ConstraintNote, ReasonField, type ReasonState, isReasonValid } from "./tools-admin-shared"

export type TriageIntent = "MARK_ABUSE" | "WHITELIST" | "REVOKE"

const COPY: Record<TriageIntent, { title: string; body: React.ReactNode; confirm: string }> = {
  MARK_ABUSE: {
    title: "Record this subject as abusive",
    body: (
      <>
        Records the judgement and <strong>revokes nothing</strong>. Marking and acting are separate
        decisions — use &ldquo;Revoke tools access&rdquo; if that is warranted.
      </>
    ),
    confirm: "Record",
  },
  WHITELIST: {
    title: "Clear this subject as a false positive",
    body: (
      <>
        Recorded like any other decision. Whitelisting <strong>suppresses a signal</strong>, so the next
        reviewer needs to know somebody looked at this and cleared it — a silent clearance is
        indistinguishable from a missed one.
      </>
    ),
    confirm: "Clear",
  },
  REVOKE: {
    title: "Revoke tools access",
    body: (
      <>
        Removes <code>PERM_USE_TOOLS</code> from this account. <strong>Not an account lock</strong> — any
        session, booking or paid service the user already has is unaffected. That separation is the entire
        reason tools access is its own permission. Reversible from the user&apos;s permission overrides.
      </>
    ),
    confirm: "Revoke access",
  },
}

export function TriageDialog({
  target,
  intent,
  onClose,
}: {
  target: { subjectType: ToolSubjectType; subjectKey: string } | null
  intent: TriageIntent
  onClose: () => void
}) {
  const markAbuse = useMarkSubjectAbuse()
  const whitelist = useWhitelistSubject()
  const revoke = useRevokeToolsAccess()
  const [reason, setReason] = React.useState<ReasonState>({ code: "", text: "" })

  // Reset when a new subject is opened, so a reason typed for one account cannot be submitted against
  // another — the sort of carry-over that produces an audit row nobody can explain.
  React.useEffect(() => {
    if (target) {
      setReason({ code: "", text: "" })
    }
  }, [target])

  const copy = COPY[intent]
  const busy = markAbuse.isPending || whitelist.isPending || revoke.isPending
  const valid = isReasonValid(reason) && target !== null

  const submit = () => {
    if (!target || !reason.code) return
    const payload = {
      subjectType: target.subjectType,
      subjectKey: target.subjectKey,
      reasonCode: reason.code,
      reason: reason.text.trim(),
    }
    const options = { onSettled: onClose }
    if (intent === "MARK_ABUSE") markAbuse.mutate(payload, options)
    else if (intent === "WHITELIST") whitelist.mutate(payload, options)
    else revoke.mutate(payload, options)
  }

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>{copy.body}</p>
              {target && (
                <p className="text-xs text-muted-foreground">
                  Subject: <span className="uppercase">{target.subjectType}</span>{" "}
                  <span className="font-mono break-all">{target.subjectKey}</span>
                </p>
              )}
              {intent === "REVOKE" && (
                <ConstraintNote tone="warning">
                  The account keeps everything else. Someone who abused the free tier may also have a paid
                  mock interview booked — taking that away is a refund conversation we chose not to have.
                </ConstraintNote>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <ReasonField
            value={reason}
            onChange={setReason}
            disabled={busy}
            idPrefix={`triage-${intent}`}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!valid || busy}
            onClick={(event) => {
              // The dialog's default action closes it; submitting first keeps the mutation's own
              // onSettled in charge of closing, so a failure leaves the typed reason on screen instead of
              // discarding it.
              event.preventDefault()
              submit()
            }}
          >
            {busy ? "Recording…" : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
