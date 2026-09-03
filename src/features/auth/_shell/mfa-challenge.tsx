/**
 * MfaChallenge - the "one more step" screen for the admin console.
 *
 * A deliberate mirror of `AuthMfaChallenge` in revquix-web, sized to this console's plainer auth
 * surface. The two repos deploy independently and share no package; keep them in step.
 *
 * ─── The mfaToken never leaves this component's props ────────────────────────
 * Not in the URL, not in storage, not in Redux. It lives in the caller's state for the ~30 seconds
 * somebody takes to reach their phone and dies with the component. A single-use credential that
 * outlives its interaction ends up somewhere it should not be.
 */

"use client"

import { useState } from "react"
import { AlertCircle, KeyRound, Loader2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-error"
import type { NetworkError } from "@/lib/api-error"
import { verifyMfaChallenge } from "@/features/auth/api/mfa.api"
import type { LoginResponse, MfaMethod } from "@/features/auth/api/auth.types"

interface MfaChallengeProps {
  mfaToken: string
  methods?: MfaMethod[] | null
  onComplete: (response: LoginResponse) => void | Promise<void>
  onCancel?: () => void
}

export default function MfaChallenge({ mfaToken, methods, onComplete, onCancel }: MfaChallengeProps) {
  const [code, setCode] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [usingRecovery, setUsingRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only offer recovery when codes actually remain. Linking to codes that no longer exist is a
  // dead end on the one screen somebody reaches when their phone is gone.
  const recoveryAvailable = !methods || methods.includes("RECOVERY_CODE")

  async function submit(payload: { code?: string; recoveryCode?: string }) {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onComplete(await verifyMfaChallenge({ mfaToken, ...payload }))
    } catch (caught) {
      // The interceptor in axios.ts ALREADY parsed this — it rejects with ApiError | NetworkError,
      // not the raw AxiosError. Re-parsing finds no `.response` on an ApiError and returns
      // NetworkError(isServerDown), which reports a wrong 6-digit code as a server outage.
      const parsed = caught as ApiError | NetworkError
      setError(parsed.message)

      // The token is gone or spent: there is nothing left to retry against, so send them back
      // rather than leaving a field that can only fail.
      const errorCode = parsed instanceof ApiError ? parsed.code : null
      if (errorCode === "RQ-AE-440" || errorCode === "RQ-AE-447") {
        onCancel?.()
        return
      }
      setCode("")
      setRecoveryCode("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        void submit(usingRecovery ? { recoveryCode } : { code })
      }}
    >
      {/* Centred to match the sign-in card this replaces. */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Two-step verification</h1>
        <p className="text-sm text-muted-foreground">
          {usingRecovery
            ? "Enter one of the recovery codes you saved when you set this up."
            : "Open your authenticator app and enter the 6-digit code it shows."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfa-input">{usingRecovery ? "Recovery code" : "Authenticator code"}</Label>
        <Input
          id="mfa-input"
          value={usingRecovery ? recoveryCode : code}
          onChange={(event) =>
            usingRecovery ? setRecoveryCode(event.target.value) : setCode(event.target.value)
          }
          placeholder={usingRecovery ? "XXXXX-XXXXX" : "123456"}
          inputMode={usingRecovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          autoCapitalize={usingRecovery ? "characters" : "off"}
          spellCheck={false}
          autoFocus
          disabled={isSubmitting}
          className="font-mono tracking-wider"
        />
        {usingRecovery && (
          <p className="text-xs text-muted-foreground">
            Each code works once. Using one does not switch off two-step verification.
          </p>
        )}
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0 translate-y-0.5" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || (usingRecovery ? recoveryCode.trim().length < 10 : code.trim().length < 6)}
        className="gap-2"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Verify and sign in
      </Button>

      {/* Ghost buttons rather than bare <button>s: these had no hit area and no hover surface, and
          sat left-aligned under a centred control, which is what made them read as raw markup. */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {recoveryAvailable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
            onClick={() => {
              setUsingRecovery((current) => !current)
              setError(null)
              setCode("")
              setRecoveryCode("")
            }}
          >
            {usingRecovery ? "Use my authenticator app instead" : "I don't have my phone"}
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            Start over
          </Button>
        )}
      </div>
    </form>
  )
}
