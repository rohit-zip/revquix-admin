"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  useForgotPassword,
  useVerifyPasswordResetOtp,
  useResetPassword,
} from "@/features/auth/api/auth.hooks"

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Email" },
  { id: 2, label: "Verify OTP" },
  { id: 3, label: "New Password" },
] as const

type Step = 1 | 2 | 3

const OTP_COOLDOWN_SECONDS = 60

// ─── Validation schemas ────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
})

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ─── Password requirements ─────────────────────────────────────────────────────

const PASSWORD_REQUIREMENTS = [
  { id: "length",    label: "At least 8 characters",      test: (v: string) => v.length >= 8 },
  { id: "uppercase", label: "Uppercase letter (A–Z)",      test: (v: string) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "Lowercase letter (a–z)",      test: (v: string) => /[a-z]/.test(v) },
  { id: "number",    label: "Number (0–9)",                test: (v: string) => /[0-9]/.test(v) },
  { id: "special",   label: "Special character (!@#$…)",   test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

// ─── Animation variants ────────────────────────────────────────────────────────

const slideVariants = {
  enter:  (direction: number) => ({ x: direction > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (direction: number) => ({ x: direction < 0 ? 64 : -64, opacity: 0 }),
}

const transition = { type: "spring" as const, stiffness: 320, damping: 32 }

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { mutate: sendForgotPassword, isPending: isSending } = useForgotPassword()
  const { mutate: verifyOtpMutate, isPending: isVerifying } = useVerifyPasswordResetOtp()
  const { mutate: doResetPassword, isPending: isResetting } = useResetPassword()

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { newPassword: "", confirmPassword: "" } })

  const newPasswordValue = watchPassword("newPassword") ?? ""

  const startCooldown = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCooldown(seconds)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const goToStep = (next: Step) => { setDirection(next > step ? 1 : -1); setStep(next) }

  const handleSendOtp = handleEmailSubmit((data) => {
    sendForgotPassword({ email: data.email }, {
      onSuccess: () => { setEmail(data.email); setOtp(""); setOtpError(null); startCooldown(OTP_COOLDOWN_SECONDS); goToStep(2) },
    })
  })

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) { setOtpError("Please enter the full 6-digit code."); return }
    setOtpError(null)
    verifyOtpMutate({ email, otp }, { onSuccess: (data) => { setResetToken(data.resetToken); goToStep(3) } })
  }

  const handleOtpChange = (value: string) => {
    setOtp(value); setOtpError(null)
    if (value.length === 6) verifyOtpMutate({ email, otp: value }, { onSuccess: (data) => { setResetToken(data.resetToken); goToStep(3) } })
  }

  const handleResendOtp = () => {
    if (cooldown > 0 || isSending) return
    sendForgotPassword({ email }, { onSuccess: () => { setOtp(""); setOtpError(null); startCooldown(OTP_COOLDOWN_SECONDS) } })
  }

  const handleResetPassword = handlePasswordSubmit((data) => {
    doResetPassword({ resetToken, newPassword: data.newPassword })
  })

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/svg/revquix.svg" alt="Revquix" width={40} height={40} />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">Revquix Admin</h1>
          </div>
        </div>

        {/* Back to login */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {/* Stepper */}
        <div className="flex items-start justify-center gap-0">
          {STEPS.map((s, idx) => {
            const isCompleted = step > s.id
            const isActive = step === s.id
            return (
              <div key={s.id} className="flex items-start">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    initial={false}
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
                      isCompleted && "bg-primary-500 text-white shadow-sm shadow-primary-500/30",
                      isActive && "bg-primary-500/15 text-primary-600 ring-2 ring-primary-500 dark:text-primary-400",
                      !isCompleted && !isActive && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                  </motion.div>
                  <span className={cn("text-[10px] font-medium transition-colors duration-300", isActive ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="mx-3 mt-4 h-0.5 w-14 overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={false}
                      animate={{ width: step > s.id ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="h-full bg-primary-500"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Animated step content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}>

              {/* Step 1: Email */}
              {step === 1 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
                      <Mail className="h-5 w-5 text-primary-500" />
                    </div>
                    <CardTitle className="text-lg">Forgot your password?</CardTitle>
                    <CardDescription>
                      Enter your account email and we&apos;ll send a reset code.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="forgot-email" className="text-sm font-medium">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoCapitalize="none"
                            aria-invalid={!!emailErrors.email}
                            {...registerEmail("email")}
                            className={cn("h-10 pl-9 text-sm", emailErrors.email && "border-destructive focus-visible:ring-destructive")}
                          />
                        </div>
                        {emailErrors.email && <p className="text-[11px] text-destructive" role="alert">{emailErrors.email.message}</p>}
                      </div>
                      <Button type="submit" className="h-10 w-full rounded-lg text-sm font-semibold" disabled={isSending}>
                        {isSending ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Sending code…</span>
                          : <span className="inline-flex items-center gap-2">Send Reset Code<ArrowRight className="h-4 w-4" /></span>}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 pt-4">
                    <p className="w-full text-center text-sm text-muted-foreground">
                      Remember your password?{" "}
                      <Link href="/auth/login" className="font-semibold text-primary-600 underline-offset-4 hover:underline dark:text-primary-400">Sign in</Link>
                    </p>
                  </CardFooter>
                </Card>
              )}

              {/* Step 2: Verify OTP */}
              {step === 2 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
                      <ShieldCheck className="h-5 w-5 text-primary-500" />
                    </div>
                    <CardTitle className="text-lg">Check your inbox</CardTitle>
                    <CardDescription>
                      We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="flex flex-col items-center gap-3">
                        <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={isVerifying} aria-label="One-time password">
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <InputOTPSlot key={i} index={i} className={cn(otpError && "border-destructive focus-visible:ring-destructive")} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        {otpError && <p className="text-[11px] text-destructive" role="alert">{otpError}</p>}
                      </div>
                      <Button type="submit" className="h-10 w-full rounded-lg text-sm font-semibold" disabled={isVerifying || otp.length < 6}>
                        {isVerifying ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Verifying…</span>
                          : <span className="inline-flex items-center gap-2">Verify Code<ArrowRight className="h-4 w-4" /></span>}
                      </Button>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <button type="button" onClick={() => goToStep(1)} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                          <Pencil className="h-3 w-3" />Change email
                        </button>
                        <button type="button" onClick={handleResendOtp} disabled={cooldown > 0 || isSending}
                          className={cn("inline-flex items-center gap-1 transition-colors", cooldown > 0 || isSending ? "cursor-not-allowed opacity-50" : "hover:text-foreground")}>
                          {isSending ? <><Loader2 className="h-3 w-3 animate-spin" />Resending…</> : cooldown > 0 ? <>Resend in {cooldown}s</> : <>Resend code</>}
                        </button>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 pt-4">
                    <p className="w-full text-center text-xs text-muted-foreground">
                      Code expires in <span className="font-medium text-foreground">15 minutes</span>. Check your spam folder if needed.
                    </p>
                  </CardFooter>
                </Card>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20">
                      <KeyRound className="h-5 w-5 text-primary-500" />
                    </div>
                    <CardTitle className="text-lg">Set new password</CardTitle>
                    <CardDescription>
                      Create a strong password for <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      {/* New password */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="new-password" className="text-sm font-medium">New password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="new-password" type={showNewPassword ? "text" : "password"} placeholder="••••••••"
                            autoComplete="new-password" aria-invalid={!!passwordErrors.newPassword}
                            {...registerPassword("newPassword")}
                            className={cn("h-10 pl-9 pr-10 text-sm", passwordErrors.newPassword && "border-destructive focus-visible:ring-destructive")}
                          />
                          <button type="button" onClick={() => setShowNewPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}>
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && <p className="text-[11px] text-destructive" role="alert">{passwordErrors.newPassword.message}</p>}
                      </div>
                      {/* Requirements */}
                      {newPasswordValue.length > 0 && (
                        <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-border/40 bg-muted/30 p-3">
                          {PASSWORD_REQUIREMENTS.map((req) => {
                            const met = req.test(newPasswordValue)
                            return (
                              <li key={req.id} className={cn("flex items-center gap-1.5 text-[11px] transition-colors", met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                                <CheckCircle2 className={cn("h-3 w-3 shrink-0 transition-colors", met ? "text-emerald-500" : "text-muted-foreground/40")} />
                                {req.label}
                              </li>
                            )
                          })}
                        </motion.ul>
                      )}
                      {/* Confirm password */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                            autoComplete="new-password" aria-invalid={!!passwordErrors.confirmPassword}
                            {...registerPassword("confirmPassword")}
                            className={cn("h-10 pl-9 pr-10 text-sm", passwordErrors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
                          />
                          <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-[11px] text-destructive" role="alert">{passwordErrors.confirmPassword.message}</p>}
                      </div>
                      <Button type="submit" className="h-10 w-full rounded-lg text-sm font-semibold" disabled={isResetting}>
                        {isResetting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Resetting password…</span>
                          : <span className="inline-flex items-center gap-2">Reset Password<ArrowRight className="h-4 w-4" /></span>}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 pt-4">
                    <p className="w-full text-center text-xs text-muted-foreground">
                      All active sessions will be <span className="font-medium text-foreground">signed out</span> after reset.
                    </p>
                  </CardFooter>
                </Card>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Revquix Admin Portal · Authorised personnel only
        </p>
      </div>
    </div>
  )
}
