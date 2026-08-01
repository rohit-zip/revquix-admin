"use client"

/**
 * AllUsersAudiencePanel — the ALL_USERS audience option in the compose wizard (Phase 3,
 * requirement 5, plan §9.2 step 4 / §15 decision 1).
 *
 * Three deliberate frictions, each mirroring a corresponding backend guard so the UI never
 * promises something the server would reject:
 *
 *   1. Permission-gated visibility — this panel renders a "you don't have access" state rather
 *      than the send controls when the current admin lacks PERM_SEND_LEAD_MAIL_ALL_USERS
 *      (LeadMailService.guardAllUsersSend / RQ-AE-421 on the backend).
 *   2. ZeptoMail-only — a platform-wide blast cannot succeed over a consumer SMTP mailbox, so the
 *      panel visibly disables itself when sendMethod is SMTP rather than letting an admin
 *      discover that only after clicking Send (LEAD_MAIL_ALL_USERS_REQUIRES_ZEPTO / RQ-VE-414).
 *   3. Typed confirmation — the admin must type the exact phrase the dry-run count response
 *      carries in confirmationPhrase, not tick a checkbox. That phrase is echoed back verbatim as
 *      allUsersConfirmationPhrase on the send request and checked server-side
 *      (LEAD_MAIL_ALL_USERS_CONFIRMATION_MISMATCH / RQ-VE-420) — this panel never invents its own
 *      copy of the phrase, so the challenge can never silently drift from what the server checks.
 *
 * The dry-run count only fires when `active` is true (the caller should pass this exactly when
 * the ALL_USERS tab is the one currently selected) — see useLeadMailAllUsersCount's own
 * `enabled` default of false.
 */

import { AlertTriangle, Loader2, ShieldAlert, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthorization } from "@/hooks/useAuthorization"
import { useLeadMailAllUsersCount } from "../api/lead-mail.hooks"
import { LEAD_MAIL_SEND_METHOD, type LeadMailSendMethod } from "../api/lead-mail.types"

const PERM_SEND_LEAD_MAIL_ALL_USERS = "PERM_SEND_LEAD_MAIL_ALL_USERS"

interface AllUsersAudiencePanelProps {
  active: boolean
  sendMethod: LeadMailSendMethod
  confirmationInput: string
  onConfirmationInputChange: (value: string) => void
  disabled?: boolean
}

/**
 * @returns whether the confirmation phrase the admin typed matches the server-issued one exactly.
 * Exported so the parent compose view can gate its own Send button on this without duplicating
 * the comparison logic (and risking a trim/case mismatch between the two places).
 */
export function useAllUsersSendReady(active: boolean, confirmationInput: string): boolean {
  const { hasAnyAuthority } = useAuthorization()
  const hasPermission = hasAnyAuthority([PERM_SEND_LEAD_MAIL_ALL_USERS])
  const { data } = useLeadMailAllUsersCount({ enabled: active && hasPermission })
  if (!active) return true // this panel does not gate readiness when it is not the active tab
  return hasPermission && !!data && confirmationInput.trim() === data.confirmationPhrase
}

export function AllUsersAudiencePanel({
  active,
  sendMethod,
  confirmationInput,
  onConfirmationInputChange,
  disabled,
}: AllUsersAudiencePanelProps) {
  const { hasAnyAuthority } = useAuthorization()
  const hasPermission = hasAnyAuthority([PERM_SEND_LEAD_MAIL_ALL_USERS])
  const isZeptoMail = sendMethod === LEAD_MAIL_SEND_METHOD.ZEPTO_MAIL

  const { data, isLoading, isError } = useLeadMailAllUsersCount({ enabled: active && hasPermission })

  if (!hasPermission) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>All-users sending is restricted</AlertTitle>
        <AlertDescription>
          Sending to every Revquix user requires a separate permission from the one that lets you send lead-mail
          campaigns. Ask an administrator to grant it if you need this.
        </AlertDescription>
      </Alert>
    )
  }

  if (!isZeptoMail) {
    return (
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>ZeptoMail required</AlertTitle>
        <AlertDescription>
          Sending to all users requires ZeptoMail — a platform-wide blast is far beyond what any SMTP mailbox can
          deliver in a day. Switch the sender method above to ZeptoMail to use this audience.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" />
          Eligible recipients
        </div>

        {isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Counting eligible users…
          </div>
        ) : isError || !data ? (
          <p className="mt-3 text-sm text-rose-500">Could not load the eligible-recipient count. Try again.</p>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-semibold">{data.eligible.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              of {data.totalConsidered.toLocaleString()} total registered accounts
            </p>
            <dl className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground sm:grid-cols-3">
              <div>
                <dt className="inline">Unverified email: </dt>
                <dd className="inline font-medium text-foreground">{data.excludedUnverified.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="inline">Deleted/disabled: </dt>
                <dd className="inline font-medium text-foreground">{data.excludedDeleted.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="inline">Unsubscribed: </dt>
                <dd className="inline font-medium text-foreground">{data.excludedSuppressed.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-1.5">
          <Label htmlFor="lm-all-users-confirm">
            Type <code className="rounded bg-muted px-1 py-0.5 font-mono">{data.confirmationPhrase}</code> to confirm
          </Label>
          <Input
            id="lm-all-users-confirm"
            value={confirmationInput}
            onChange={(e) => onConfirmationInputChange(e.target.value)}
            placeholder={data.confirmationPhrase}
            disabled={disabled}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            This send cannot be undone once it starts. Typing the phrase exactly is required — a checkbox is too easy
            to click without reading what you are about to do.
          </p>
        </div>
      )}
    </div>
  )
}
