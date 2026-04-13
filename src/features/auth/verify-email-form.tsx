"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Loader2, Mail, Pencil, ShieldCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"
import { useResendOtp, useVerifyEmail } from "./api/auth.hooks"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import CentralizedLoader from "@/components/centralized-loader"

// ─── Constants ─────────────────────────────────────────────────────────────────
const VERIFY_EMAIL_BRAND_FEATURES = [
  "One-time OTP sent securely to your inbox",
  "Your email is never shared with third parties",
  "Verification keeps your account protected",
]

/** Fallback used on first mount before the API has responded. */
const INITIAL_COOLDOWN_SECONDS = 60

// ─── Props ─────────────────────────────────────────────────────────────────────
interface VerifyEmailFormProps {
  userId: string
  email: string
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function VerifyEmailForm({ userId, email }: VerifyEmailFormProps) {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  // Seed with INITIAL_COOLDOWN_SECONDS; overridden by nextResendAvailableInSeconds
  // returned from the API on every subsequent resend.
  const [cooldown, setCooldown] = useState(INITIAL_COOLDOWN_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { mutate: verify, isPending: isVerifying, isRedirecting } = useVerifyEmail()
  const { mutate: resend, isPending: isResending } = useResendOtp()

  // ── Cooldown ticker ────────────────────────────────────────────────────────
  // Called from event handlers only (not inside an effect) to avoid the
  // react-hooks/set-state-in-effect lint rule.
  // `seconds` is sourced from the API's nextResendAvailableInSeconds field.
  const startCooldown = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCooldown(seconds)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Start the initial interval on mount — state is already seeded to
  // INITIAL_COOLDOWN_SECONDS above so no synchronous setState needed here.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
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
  }, [])

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setOtpError("Please enter the full 6-digit code.")
      return
    }
    setOtpError(null)
    verify({ userId, otp })
  }

  // ── Resend handler ─────────────────────────────────────────────────────────
  const handleResend = () => {
    if (cooldown > 0 || isResending) return
    resend(
      { userId, purpose: "REGISTER" },
      { onSuccess: (data) => startCooldown(data.nextResendAvailableInSeconds) },
    )
  }

  // ── Auto-submit when all 6 digits are filled ───────────────────────────────
  const handleOtpChange = (value: string) => {
    setOtp(value)
    setOtpError(null)
    if (value.length === 6) {
      setOtpError(null)
      verify({ userId, otp: value })
    }
  }

  const isPending = isVerifying || isResending

  return (
    <>
      <CentralizedLoader
        isVisible={isRedirecting}
        message="Email verified!"
        subMessage="Setting up your dashboard..."
      />
      <div className="flex min-h-screen w-full">
      {/* ── Left branding panel (desktop only) ──────────────────────────── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border/40 bg-linear-to-br from-primary-900/60 via-primary-800/40 to-violet-900/50 p-12 lg:flex">
        {/* mesh grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* decorative orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-500/30 blur-[80px]" />
          <div className="absolute bottom-10 right-0 h-60 w-60 rounded-full bg-violet-500/25 blur-[70px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/svg/revquix-white.svg"
              alt="Revquix"
              width={36}
              height={36}
              className="drop-shadow-lg"
            />
            <span className="text-xl font-bold tracking-tight text-white">Revquix</span>
          </Link>
        </div>

        {/* Headline */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-200">
              <Sparkles className="h-3 w-3" />
              Almost there
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Verify your{" "}
              <span className="bg-linear-to-r from-primary-300 via-violet-300 to-primary-200 bg-clip-text text-transparent">
                identity
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              We sent a 6-digit code to your email. Enter it below to activate your account and
              start your journey with Revquix.
            </p>
          </div>

          {/* Feature list */}
          <ul className="flex flex-col gap-3">
            {VERIFY_EMAIL_BRAND_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                <span className="text-sm text-white/70">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} Revquix. All rights reserved.
        </p>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <main className="flex w-full flex-col items-center justify-center px-5 py-12 lg:w-1/2 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
          <Image src="/svg/revquix.svg" alt="Revquix" width={30} height={30} />
          <span className="text-lg font-bold tracking-tight text-foreground">Revquix</span>
        </Link>

        <Card className="w-full max-w-md gap-4 py-4 shadow-xl ring-1 ring-border/60 sm:gap-6 sm:py-6 dark:ring-white/8">
          {/* ── Card Header ─────────────────────────────────────────────── */}
          <CardHeader className="gap-2 px-4 pb-2 sm:px-6">
            {/* Shield icon badge */}
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
              <ShieldCheck className="h-6 w-6 text-primary-500" />
            </div>

            <CardTitle className="text-2xl font-bold text-foreground">
              Verify your email
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your inbox.
            </CardDescription>
          </CardHeader>

          {/* ── Email display ─────────────────────────────────────────── */}
          <CardContent className="px-4 pb-2 sm:px-6">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 sm:px-4 sm:py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">{email}</span>
              </div>
              <button
                type="button"
                aria-label="Change email — go back to register"
                onClick={() => router.push(PATH_CONSTANTS.AUTH_REGISTER)}
                className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>

          {/* ── OTP Form ─────────────────────────────────────────────── */}
          <CardContent className="px-4 pt-2 sm:px-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col items-center gap-3">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={isPending}
                  containerClassName="gap-2"
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className={cn(
                          "h-9 w-9 text-sm font-semibold sm:h-11 sm:w-11 sm:text-base",
                          otpError && "border-destructive",
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {otpError && (
                  <p className="text-[11px] text-destructive" role="alert">
                    {otpError}
                  </p>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  Didn&apos;t receive the code? Check your spam folder or{" "}
                  <button
                    type="button"
                    disabled={cooldown > 0 || isResending}
                    onClick={handleResend}
                    className={cn(
                      "font-semibold underline-offset-4 transition-colors",
                      cooldown > 0 || isResending
                        ? "cursor-not-allowed text-muted-foreground"
                        : "text-primary-600 hover:underline dark:text-primary-400",
                    )}
                  >
                    {isResending
                      ? "Sending…"
                      : cooldown > 0
                        ? `resend in ${cooldown}s`
                        : "resend it"}
                  </button>
                  .
                </p>
              </div>

              {/* ── Submit ──────────────────────────────────────────── */}
              <Button
                type="submit"
                disabled={isPending || otp.length < 6}
                className={cn(
                  "h-10 w-full rounded-lg text-sm font-semibold",
                  "bg-primary-500 text-white hover:bg-primary-600",
                  "dark:bg-primary-400 dark:text-primary-900 dark:hover:bg-primary-300",
                  "shadow-md transition-all duration-200",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                )}
                style={{
                  boxShadow: "0 4px 20px oklch(0.567 0.210 257.951 / 0.30)",
                }}
              >
                {isVerifying ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Verify email
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <CardFooter className="flex-col gap-4 px-4 pt-2 sm:px-6">
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              Already verified?{" "}
              <Link
                href={PATH_CONSTANTS.AUTH_LOGIN}
                className="font-semibold text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
    </>
  )
}

