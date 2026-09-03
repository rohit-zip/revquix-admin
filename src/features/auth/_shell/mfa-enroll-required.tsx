/**
 * MfaEnrollRequired - the screen an admin sees when their grace period has run out.
 *
 * ─── Why this exists in the admin console specifically ───────────────────────
 * The admin console has no settings route, so there is nowhere else an admin could go to enrol.
 * Without this screen, an admin past their grace period would be refused a session by the server
 * and have no way at all to satisfy the requirement — the exact lockout the grace ladder is
 * designed to avoid. It has to live on the sign-in surface, and it does.
 *
 * Authorised by the `mfaToken` rather than a Bearer token, because no session exists yet.
 *
 * ─── ⚠ Mirror of `AuthMfaEnrollRequired` in revquix-web ──────────────────────
 * The two repos deploy independently and share no package. Keep them in step: `QrCode`,
 * `MfaSetupKey`, `MfaAppPicker` and `authenticator-apps.ts` are all deliberate twins of files
 * there, and this is the same enrolment against the same endpoints.
 *
 * ─── Four things the design turns on ─────────────────────────────────────────
 *
 * 1. The QR is drawn HERE, from the `otpauth://` URI, as vectors. The secret reaches the client
 *    regardless — manual entry is a required fallback — so rendering an image server-side would buy
 *    nothing and add a question about who may cache it.
 *
 * 2. **The manual key is a first-class path.** It shipped once as a bare `<code>` block with no copy
 *    control, which made the fallback the worst experience on the screen. {@link MfaSetupKey} owns
 *    it now, along with the fields a manual-entry form asks for.
 *
 * 3. **Which app was used is asked, not detected**, and this is the only chance to ask an admin —
 *    there is no settings screen in this console to ask on later. Optional, and worded everywhere as
 *    the member's own claim.
 *
 * 4. **Recovery codes are shown exactly once** and sit behind an acknowledgement, because the button
 *    beneath them hands over the session and navigates away. Nothing can retrieve them again.
 */

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, Check, Copy, Download, Loader2, ScanLine, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { QrCode } from "@/components/ui/qr-code"
import { cn } from "@/lib/utils"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import { ApiError } from "@/lib/api-error"
import type { NetworkError } from "@/lib/api-error"
import { beginForcedEnrolment, confirmForcedEnrolment } from "@/features/auth/api/mfa.api"
import type { LoginResponse } from "@/features/auth/api/auth.types"

import { findAuthenticatorApp, type AuthenticatorAppId } from "./authenticator-apps"
import MfaAppPicker from "./mfa-app-picker"
import MfaSetupKey from "./mfa-setup-key"

interface MfaEnrollRequiredProps {
  mfaToken: string
  onComplete: (response: LoginResponse) => void | Promise<void>
  onCancel?: () => void
}

export default function MfaEnrollRequired({ mfaToken, onComplete, onCancel }: MfaEnrollRequiredProps) {
  const [secret, setSecret] = useState("")
  const [otpauthUri, setOtpauthUri] = useState("")
  const [code, setCode] = useState("")
  const [chosenApp, setChosenApp] = useState<AuthenticatorAppId | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [pendingLogin, setPendingLogin] = useState<LoginResponse | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const report = useCallback(
    (caught: unknown) => {
      // Already parsed by the axios interceptor — see mfa-challenge.tsx.
      const parsed = caught as ApiError | NetworkError
      setError(parsed.message)
      const errorCode = parsed instanceof ApiError ? parsed.code : null
      // Nothing left to enrol against — send them back rather than leaving a QR that cannot be
      // confirmed.
      if (errorCode === "RQ-AE-440" || errorCode === "RQ-AE-447") onCancel?.()
    },
    [onCancel],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const enrolment = await beginForcedEnrolment(mfaToken)
        if (cancelled) return
        setSecret(enrolment.secret)
        // Held as the URI, not a rendered image: QrCode draws it as SVG at paint time, so it stays
        // crisp at any size and the secret never becomes a bitmap.
        setOtpauthUri(enrolment.otpauthUri)
      } catch (caught) {
        if (!cancelled) report(caught)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mfaToken, report])

  async function confirm(value: string) {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await confirmForcedEnrolment(mfaToken, value, chosenApp ?? undefined)
      // Codes first, session second: this is the only moment they exist, and handing the session on
      // would navigate away from them.
      setRecoveryCodes(result.recoveryCodes)
      setPendingLogin(result.login)
    } catch (caught) {
      report(caught)
      setCode("")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Recovery codes, then in ────────────────────────────────────────────────

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"))
      setCopied(true)
      showSuccessToast("Recovery codes copied", {
        description: "Paste them into your password manager now.",
      })
      if (copyResetRef.current) clearTimeout(copyResetRef.current)
      copyResetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // No silent failure on this screen of all screens — Download is right there and still works.
      showErrorToast(new Error("Couldn't reach your clipboard"), {
        description: "Use Download instead — these codes are not shown again.",
      })
    }
  }

  function downloadCodes() {
    const body = [
      "Revquix admin recovery codes",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Each code can be used once, in place of the code from your authenticator app.",
      "Keep them somewhere that is not the phone holding your authenticator.",
      "",
      ...recoveryCodes,
    ].join("\n")

    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "revquix-recovery-codes.txt"
    link.click()
    URL.revokeObjectURL(url)
  }

  if (pendingLogin) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Save your recovery codes</h1>
          <p className="text-sm text-muted-foreground">
            This is the only time they are shown. Each works once, and they are how you get in if you
            lose your phone.
          </p>
        </div>

        {/* Numbered so somebody checking a saved copy against the screen can tell at a glance
            whether they have all ten. */}
        <ol className="grid grid-cols-2 gap-1.5 rounded-xl border bg-muted/30 p-2">
          {recoveryCodes.map((recoveryCode, index) => (
            <li
              key={recoveryCode}
              // `bg-card`, not `bg-background`: `--background` is the off-white page ground, which
              // against this container's own tint leaves the ten rows all but invisible.
              className="flex items-center gap-1.5 rounded-md bg-card px-2 py-1.5"
            >
              <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <code className="min-w-0 flex-1 font-mono text-xs tracking-wider select-all">
                {recoveryCode}
              </code>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => void copyCodes()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy codes"}
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={downloadCodes}>
            <Download className="size-4" /> Download
          </Button>
        </div>

        {/* A real gate, not a reflex "Done". Nothing can retrieve these again — not support, not an
            admin — and the button below hands over the session and navigates away from them.
            The gate and the thing it gates sit together across a rule, so the reason the button is
            disabled is on screen next to the button. */}
        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="mfa-codes-saved"
              checked={acknowledged}
              onCheckedChange={(next) => setAcknowledged(next === true)}
              className="mt-0.5"
            />
            <Label htmlFor="mfa-codes-saved" className="text-sm leading-snug font-normal">
              I&rsquo;ve saved my recovery codes somewhere safe.
            </Label>
          </div>

          <Button disabled={!acknowledged} onClick={() => void onComplete(pendingLogin)}>
            Continue to the console
          </Button>
        </div>
      </div>
    )
  }

  // ── Enrol ──────────────────────────────────────────────────────────────────
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        void confirm(code)
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Set up two-step verification</h1>
        <p className="text-sm text-muted-foreground">
          Admin accounts need an authenticator app. Set one up now to finish signing in.
        </p>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Preparing your setup code…
        </p>
      ) : (
        <>
          <MfaAppPicker value={chosenApp} onChange={setChosenApp} disabled={isSubmitting} />

          {otpauthUri && (
            <div className="flex flex-col items-center gap-2">
              {/* Its own white ground and a ring rather than the surface's border: an inverted QR
                  does not scan, so this block must not inherit the dark surface. */}
              <div className="rounded-xl bg-white p-2.5 shadow-overlay ring-1 ring-foreground/10">
                <QrCode
                  value={otpauthUri}
                  size={168}
                  label="Scan this with your authenticator app to add Revquix"
                />
              </div>
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ScanLine className="size-3.5" />
                {chosenApp
                  ? `Open ${findAuthenticatorApp(chosenApp)?.name ?? "your app"} and scan`
                  : "Point your authenticator app here"}
              </p>
            </div>
          )}

          {secret && <MfaSetupKey secret={secret} otpauthUri={otpauthUri} />}

          <div className="flex flex-col items-center gap-1.5 border-t pt-4">
            <Label className="self-start text-xs font-medium">Code from your app</Label>
            {/* Segmented, matching the console's own verify-email and register forms. It is the same
                thing — six digits, nothing else — so a plain text box was the odd one out. */}
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(next) => {
                setCode(next)
                if (error) setError(null)
              }}
              onComplete={(complete) => void confirm(complete)}
              disabled={isSubmitting}
              autoComplete="one-time-code"
              inputMode="numeric"
              aria-label="Authenticator code"
              containerClassName="gap-2"
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={cn("h-11 w-10 text-base font-semibold", error && "border-destructive")}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="self-start text-[11px] text-muted-foreground">
              {isSubmitting ? "Checking your code…" : "We'll check it as soon as you finish typing."}
            </p>
          </div>
        </>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3.5 shrink-0 translate-y-0.5" />
          {error}
        </p>
      )}

      <Button type="submit" disabled={isLoading || isSubmitting || code.trim().length < 6}>
        {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Finish setup and sign in
      </Button>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <AlertCircle className="size-3.5 shrink-0 translate-y-0.5" />
        There is no way past this step — it protects the admin console.
      </p>

      {onCancel && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            Sign in as someone else
          </Button>
        </div>
      )}
    </form>
  )
}
