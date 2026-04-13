/**
 * ─── PRIVACY TAB ─────────────────────────────────────────────────────────────
 *
 * Implements the change/add-password flow inside the Settings → Privacy tab.
 *
 * Steps:
 *  1. Idle    — shows current password status + "Change / Set Password" button
 *  2. Loading — calls initiate endpoint, checks IP
 *  3a. OTP    — different IP: collect 6-digit OTP with countdown timer
 *  3b. Form   — same IP or OTP verified: show password form
 *  4. Done    — success state, auto-resets after 4 seconds
 */

"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"

import { useAppSelector } from "@/hooks/useRedux"
import {
  useApplyPasswordChange,
  useInitiatePasswordChange,
  useVerifyPasswordChangeOtp,
} from "@/features/user/api/password.hooks"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "idle" | "loading" | "otp" | "form" | "success"

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" }
  if (score <= 4) return { score, label: "Fair", color: "bg-amber-500" }
  if (score === 5) return { score, label: "Good", color: "bg-emerald-400" }
  return { score, label: "Strong", color: "bg-emerald-500" }
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number | null) {
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSeconds = useRef<number | null>(null)

  useEffect(() => {
    if (initialSeconds == null || initialSeconds <= 0) return
    if (initialSeconds === prevSeconds.current) return
    prevSeconds.current = initialSeconds

    if (intervalRef.current) clearInterval(intervalRef.current)
    setRemaining(initialSeconds)

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeconds])

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0")
  const ss = String(remaining % 60).padStart(2, "0")
  return { remaining, formatted: `${mm}:${ss}` }
}

// ─── Password input with show/hide toggle ─────────────────────────────────────

function ShowHideInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { id: string }
) {
  const [visible, setVisible] = useState(false)
  const { id, ...rest } = props
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="pr-10"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrivacyTab() {
  const currentUser = useAppSelector((s) => s.userProfile.currentUser)
  const hasPassword = currentUser?.hasPassword ?? false

  // ── State machine ────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("idle")
  const [changeToken, setChangeToken] = useState<string | null>(null)
  const [otpSeconds, setOtpSeconds] = useState<number | null>(null)
  const [otpValue, setOtpValue] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)

  // RHF for the password form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const newPasswordValue = watch("newPassword")
  const strength = getPasswordStrength(newPasswordValue)

  const { remaining: otpRemaining, formatted: otpFormatted } = useCountdown(otpSeconds)

  // ── Mutations ────────────────────────────────────────────────────────────
  const initiateMutation = useInitiatePasswordChange(
    (requiresOtp, token, expires) => {
      if (requiresOtp) {
        setOtpSeconds(expires ?? 900)
        setStep("otp")
      } else {
        setChangeToken(token ?? null)
        setStep("form")
      }
    },
  )

  const verifyOtpMutation = useVerifyPasswordChangeOtp((token) => {
    setChangeToken(token)
    setStep("form")
  })

  const applyMutation = useApplyPasswordChange(() => {
    setStep("success")
    reset()
    setTimeout(() => resetAll(), 4000)
  })

  // ── Handlers ─────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setStep("idle")
    setChangeToken(null)
    setOtpSeconds(null)
    setOtpValue("")
    setOtpError(null)
    reset()
  }, [reset])

  function handleInitiate() {
    setStep("loading")
    initiateMutation.mutate()
  }

  function handleOtpSubmit() {
    if (otpValue.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.")
      return
    }
    setOtpError(null)
    verifyOtpMutation.mutate({ otp: otpValue })
  }

  function handleResendOtp() {
    setOtpValue("")
    setOtpError(null)
    setOtpSeconds(null)
    setStep("loading")
    initiateMutation.mutate()
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    if (!changeToken) return
    applyMutation.mutate({
      changeToken,
      currentPassword: hasPassword ? values.currentPassword : undefined,
      newPassword: values.newPassword,
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header card ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Password
          </CardTitle>
          <CardDescription>
            Manage how you sign in to your Revquix account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Status row ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 flex-wrap p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <KeyRound className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">Password sign-in</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasPassword
                    ? "Your account has a password set."
                    : "No password set — you are using social or email OTP login."}
                </p>
              </div>
            </div>
            <Badge
              variant={hasPassword ? "outline" : "secondary"}
              className={
                hasPassword
                  ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shrink-0"
                  : "shrink-0"
              }
            >
              {hasPassword ? (
                <><CheckCircle2 className="size-3 mr-1" />Enabled</>
              ) : (
                "Not set"
              )}
            </Badge>
          </div>

          {/* ── Step: idle ───────────────────────────────────────────────── */}
          {step === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {hasPassword
                  ? "You can change your password at any time. Depending on your location, we may ask you to verify your identity with a one-time code."
                  : "Add a password to enable email + password sign-in alongside your current sign-in method. A one-time verification may be required."}
              </p>
              <Button onClick={handleInitiate} className="gap-2">
                <KeyRound className="size-4" />
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </div>
          )}

          {/* ── Step: loading ─────────────────────────────────────────────── */}
          {step === "loading" && (
            <div className="flex items-center gap-3 py-4 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-sm">Verifying your identity&hellip;</p>
            </div>
          )}

          {/* ── Step: OTP ────────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <AlertCircle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-0.5">Verification required</p>
                  <p>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">
                      {currentUser?.email}
                    </span>
                    . Enter it below to continue.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Verification code</Label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otpValue}
                  onChange={(val) => {
                    setOtpValue(val)
                    setOtpError(null)
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {otpError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {otpError}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Code expires in{" "}
                  <span
                    className={
                      otpRemaining > 0 && otpRemaining <= 60
                        ? "text-destructive font-semibold"
                        : "font-semibold text-foreground"
                    }
                  >
                    {otpFormatted}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleOtpSubmit}
                  disabled={verifyOtpMutation.isPending || otpValue.length < 6}
                  className="gap-2"
                >
                  {verifyOtpMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  Verify Code
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={initiateMutation.isPending || otpRemaining > 0}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  {otpRemaining > 0 ? `Resend in ${otpFormatted}` : "Resend Code"}
                </Button>
                <Button variant="ghost" onClick={resetAll} className="text-muted-foreground">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: form ───────────────────────────────────────────────── */}
          {step === "form" && (
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-5">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Identity verified. Please enter your{" "}
                  {hasPassword ? "current and new password." : "new password below."}
                </p>
              </div>

              {/* Current password — only if account already has one */}
              {hasPassword && (
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <ShowHideInput
                    id="currentPassword"
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                    {...register("currentPassword", {
                      required: "Current password is required",
                    })}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>
              )}

              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <ShowHideInput
                  id="newPassword"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Must be at least 8 characters" },
                    maxLength: { value: 128, message: "Must be at most 128 characters" },
                  })}
                />
                {/* Strength indicator */}
                {newPasswordValue && (
                  <div className="space-y-1 mt-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-300 ${
                            strength.score >= i * 1.5 ? strength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs text-muted-foreground">
                        Strength:{" "}
                        <span
                          className={
                            strength.label === "Weak"
                              ? "text-destructive"
                              : strength.label === "Fair"
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }
                        >
                          {strength.label}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {errors.newPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, numbers, and symbols.
                </p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <ShowHideInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (val) =>
                      val === newPasswordValue || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="gap-2"
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  {hasPassword ? "Change Password" : "Set Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetAll}
                  disabled={applyMutation.isPending}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ── Step: success ─────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {hasPassword ? "Password changed successfully!" : "Password set successfully!"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasPassword
                    ? "Your new password is active. All your current sessions remain open."
                    : "You can now sign in with your email and new password."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground text-xs uppercase tracking-wide">
              Security notes
            </p>
            <ul className="space-y-1.5 text-xs list-disc list-inside">
              <li>
                If you are signing in from a new location, we will send a verification
                code to your email before allowing a password change.
              </li>
              <li>
                Changing your password does not sign you out of other devices.
              </li>
              <li>
                After adding a password, you can sign in using either your password
                or your existing sign-in method.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
