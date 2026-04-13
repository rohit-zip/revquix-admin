"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { REGISTER_BRAND_FEATURES } from "@/core/constants/auth-constants"
import { useInitiateEmailOtp, useRegister, useVerifyEmailOtp } from "./api/auth.hooks"
import SocialAuthButtons from "@/components/social-auth-buttons"
import CentralizedLoader from "@/components/centralized-loader"

export const PASSWORD_REQUIREMENTS = [
  { id: "length",    label: "At least 8 characters",      test: (v: string) => v.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A–Z)",  test: (v: string) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "One lowercase letter (a–z)",  test: (v: string) => /[a-z]/.test(v) },
  { id: "number",    label: "One number (0–9)",            test: (v: string) => /[0-9]/.test(v) },
] as const

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
})

const otpEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
})

type RegisterMode = "password" | "otp"
type OtpStep = "email" | "verify"

const OTP_INITIAL_COOLDOWN = 60

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)

  // ── OTP-mode state ─────────────────────────────────────────────────────────
  const [registerMode, setRegisterMode] = useState<RegisterMode>("password")
  const [otpStep, setOtpStep] = useState<OtpStep>("email")
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(OTP_INITIAL_COOLDOWN)
  const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Search params ──────────────────────────────────────────────────────────
  const searchParams = useSearchParams()
  const fromParam = searchParams.get("from")
  const loginHref = fromParam
    ? `/auth/login?from=${encodeURIComponent(fromParam)}`
    : "/auth/login"

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  })

  // ── OTP email form ─────────────────────────────────────────────────────────
  const {
    register: registerOtp,
    handleSubmit: handleOtpEmailSubmit,
    formState: { errors: otpEmailErrors },
  } = useForm({
    resolver: zodResolver(otpEmailSchema),
    defaultValues: { email: "" },
  })

  const { mutate: registerUser, isPending, isRedirecting: isRegisterRedirecting } = useRegister(setError)
  const { mutate: initiateOtp, isPending: isInitiating } = useInitiateEmailOtp()
  const { mutate: verifyOtp, isPending: isVerifying, isRedirecting: isOtpRedirecting } = useVerifyEmailOtp()

  const passwordValue = watch("password") ?? ""
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(passwordValue))

  /** True while we are navigating away — keeps the UI locked and shows the overlay */
  const isNavigating = isRegisterRedirecting || isOtpRedirecting

  // ── Cooldown ticker ────────────────────────────────────────────────────────
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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Mode switch helpers ────────────────────────────────────────────────────
  const switchToOtp = () => {
    setRegisterMode("otp")
    setOtpStep("email")
    setOtp("")
    setOtpError(null)
  }

  const switchToPassword = () => {
    setRegisterMode("password")
    setOtpStep("email")
    setOtp("")
    setOtpError(null)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  // ── OTP initiate handler ───────────────────────────────────────────────────
  const handleSendOtp = handleOtpEmailSubmit((data) => {
    initiateOtp(
      { email: data.email },
      {
        onSuccess: (res) => {
          setOtpEmail(data.email)
          setOtpExpiresIn(res.otpExpiresInSeconds)
          setOtp("")
          setOtpError(null)
          setOtpStep("verify")
          startCooldown(OTP_INITIAL_COOLDOWN)
        },
      },
    )
  })

  // ── OTP resend handler ─────────────────────────────────────────────────────
  const handleResendOtp = () => {
    if (cooldown > 0 || isInitiating) return
    initiateOtp(
      { email: otpEmail },
      {
        onSuccess: (res) => {
          setOtpExpiresIn(res.otpExpiresInSeconds)
          setOtp("")
          setOtpError(null)
          startCooldown(OTP_INITIAL_COOLDOWN)
        },
      },
    )
  }

  // ── OTP verify handler ─────────────────────────────────────────────────────
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setOtpError("Please enter the full 6-digit code.")
      return
    }
    setOtpError(null)
    verifyOtp({ email: otpEmail, otp })
  }

  // Auto-submit when all 6 digits are filled
  const handleOtpChange = (value: string) => {
    setOtp(value)
    setOtpError(null)
    if (value.length === 6) {
      setOtpError(null)
      verifyOtp({ email: otpEmail, otp: value })
    }
  }

  // ── Shared branding panel ──────────────────────────────────────────────────
  const brandingPanel = (
    <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border/40 bg-linear-to-br from-primary-900/60 via-primary-800/40 to-violet-900/50 p-12 lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-500/30 blur-[80px]" />
        <div className="absolute bottom-10 right-0 h-60 w-60 rounded-full bg-violet-500/25 blur-[70px]" />
      </div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-3">
          <Image src="/svg/revquix-white.svg" alt="Revquix" width={36} height={36} className="drop-shadow-lg" />
          <span className="text-xl font-bold tracking-tight text-white">Revquix</span>
        </div>
      </div>
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-200">
            <Sparkles className="h-3 w-3" />
            Your growth starts here
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Build something{" "}
            <span className="bg-linear-to-r from-primary-300 via-violet-300 to-primary-200 bg-clip-text text-transparent">
              remarkable
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            Join thousands of businesses and professionals who use Revquix to scale their ambitions.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {REGISTER_BRAND_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
              <span className="text-sm text-white/70">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative z-10 text-xs text-white/30">
        © {new Date().getFullYear()} Revquix. All rights reserved.
      </p>
    </aside>
  )

  // ── OTP mode ───────────────────────────────────────────────────────────────
  if (registerMode === "otp") {
    return (
      <>
        <CentralizedLoader
          isVisible={isNavigating}
          message="Just a moment"
          subMessage="Redirecting, please wait..."
        />
        <div className="flex min-h-screen w-full">
        {brandingPanel}

        <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile logo */}
            <div className="flex lg:hidden">
              <div className="inline-flex items-center gap-2">
                <Image src="/svg/revquix.svg" alt="Revquix" width={32} height={32} />
                <span className="text-lg font-bold tracking-tight">Revquix</span>
              </div>
            </div>

            <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
                  <ShieldCheck className="h-5 w-5 text-primary-500" />
                </div>

                {otpStep === "email" ? (
                  <>
                    <CardTitle className="text-2xl">Sign up with OTP</CardTitle>
                    <CardDescription>
                      Enter your email and we&apos;ll send you a one-time code — no password needed.
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl">Check your inbox</CardTitle>
                    <CardDescription>
                      We sent a 6-digit code to{" "}
                      <span className="font-medium text-foreground">{otpEmail}</span>
                      {otpExpiresIn != null && (
                        <span className="text-muted-foreground">
                          {" "}· expires in {Math.floor(otpExpiresIn / 60)}m
                        </span>
                      )}
                    </CardDescription>
                  </>
                )}
              </CardHeader>

              <CardContent>
                {/* ── Step 1: Email input ─────────────────────────────── */}
                {otpStep === "email" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="otp-email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          autoCapitalize="none"
                          aria-invalid={!!otpEmailErrors.email}
                          {...registerOtp("email")}
                          className={cn(
                            "h-10 pl-9 text-sm",
                            otpEmailErrors.email && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </div>
                      {otpEmailErrors.email && (
                        <p className="text-[11px] text-destructive" role="alert">
                          {otpEmailErrors.email.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="h-10 w-full rounded-lg text-sm font-semibold" disabled={isInitiating}>
                      {isInitiating ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending code…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Send OTP
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}

                {/* ── Step 2: OTP verification ────────────────────────── */}
                {otpStep === "verify" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-medium text-foreground">{otpEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("email")
                          setOtp("")
                          setOtpError(null)
                          if (intervalRef.current) clearInterval(intervalRef.current)
                        }}
                        className="ml-2 flex shrink-0 items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
                        aria-label="Change email"
                      >
                        <Pencil className="h-3 w-3" />
                        Change
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={isVerifying} aria-label="One-time password">
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
                        <p className="text-[11px] text-destructive" role="alert">
                          {otpError}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="h-10 w-full rounded-lg text-sm font-semibold" disabled={isVerifying || otp.length < 6}>
                      {isVerifying ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Verify & Continue
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Didn&apos;t receive it?{" "}
                      {cooldown > 0 ? (
                        <span className="tabular-nums">Resend in {cooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isInitiating}
                          className="font-semibold text-primary-600 underline-offset-4 hover:underline disabled:opacity-50 dark:text-primary-400"
                        >
                          {isInitiating ? "Sending…" : "Resend code"}
                        </button>
                      )}
                    </p>
                  </form>
                )}

                {/* ── Divider ─────────────────────────────────────────── */}
                <div className="relative my-6">
                  <Separator />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                    <span className="bg-card/40 px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>

                {/* ── OAuth buttons ────────────────────────────────────── */}
                <SocialAuthButtons disabled={isInitiating || isVerifying} />
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 border-t border-border/40 pt-6">
                <button
                  type="button"
                  onClick={switchToPassword}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Sign up with password instead
                </button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href={loginHref} className="font-semibold text-primary-600 underline-offset-4 hover:underline dark:text-primary-400">
                    Sign in
                  </Link>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      </>
    )
  }

  // ── Password mode (default) ────────────────────────────────────────────────
  return (
    <>
      <CentralizedLoader
        isVisible={isNavigating}
        message="Just a moment"
        subMessage="Redirecting, please wait..."
      />
      <div className="flex min-h-screen w-full">
      {brandingPanel}

      {/* Right form panel */}
      <main className="flex w-full flex-col items-center justify-center px-5 py-12 lg:w-1/2 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
          <Image src="/svg/revquix.svg" alt="Revquix" width={30} height={30} />
          <span className="text-lg font-bold tracking-tight text-foreground">Revquix</span>
        </div>

        <Card className="w-full max-w-md shadow-xl ring-1 ring-border/60 dark:ring-white/8">
          {/* Card Header */}
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Create your account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Start your journey — it only takes a minute.
            </CardDescription>
          </CardHeader>

          {/* OAuth Buttons */}
          <CardContent className="pb-0">
            <SocialAuthButtons disabled={isPending} />
          </CardContent>

          {/* ── Divider ────────────────────────────────────────────── */}
          <CardContent className="py-4">
            <div className="relative flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                or
              </span>
              <Separator className="flex-1" />
            </div>
          </CardContent>

          {/* ── Email / Password Form ──────────────────────────────── */}
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit((data) => registerUser(data))} className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                    className={cn(
                      "h-10 pl-9 text-sm",
                      errors.email && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                    className={cn(
                      "h-10 pl-9 pr-10 text-sm",
                      errors.password && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Live requirements checklist */}
                {passwordValue.length > 0 && !allRequirementsMet && (
                  <ul className="flex flex-col gap-1 pt-0.5">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const met = req.test(passwordValue)
                      return (
                        <li key={req.id} className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                              met ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {met ? "✓" : "✗"}
                          </span>
                          <span className={cn("text-[11px]", met ? "text-emerald-500" : "text-muted-foreground")}>
                            {req.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {errors.password && allRequirementsMet && (
                  <p className="text-[11px] text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className={cn(
                  "h-10 w-full rounded-lg text-sm font-semibold",
                  "bg-primary-500 text-white hover:bg-primary-600",
                  "dark:bg-primary-400 dark:text-primary-900 dark:hover:bg-primary-300",
                  "shadow-md transition-all duration-200",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                )}
                style={{ boxShadow: "0 4px 20px oklch(0.567 0.210 257.951 / 0.30)" }}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              {/* ── OTP mode toggle ─────────────────────────────────── */}
              <button
                type="button"
                onClick={switchToOtp}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-transparent py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Sign up with Email OTP instead
              </button>
            </form>
          </CardContent>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <CardFooter className="flex-col gap-4 pt-2">
            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link
                href="/legal/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <Separator />

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={loginHref}
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
