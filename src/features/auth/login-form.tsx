"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useLogin } from "@/features/auth/api/auth.hooks"
import CentralizedLoader from "@/components/centralized-loader"

// ─── Validation schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or username is required")
    .refine(
      (val) =>
        val.includes("@")
          ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
          : val.length >= 3 && !/\s/.test(val),
      "Enter a valid email address, or a username (min. 3 characters, no spaces)",
    ),
  password: z.string().min(1, "Password is required"),
})

// ─── Login Form (client component) ────────────────────────────────────────────
export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)


  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  })

  const { mutate: login, isPending: isLoginPending, isRedirecting: isLoginRedirecting } = useLogin(setError)

  const identifierValue = watch("identifier") ?? ""
  const isEmailMode = identifierValue.includes("@")

  return (
    <>
      <CentralizedLoader
        isVisible={isLoginRedirecting}
        message="Signing you in"
        subMessage="Loading your workspace..."
      />

      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Image src="/svg/revquix.svg" alt="Revquix" width={40} height={40} />
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">Revquix Admin</h1>
              <p className="text-sm text-muted-foreground">Sign in to your admin account</p>
            </div>
          </div>

          {/* Form card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">

                {/* Identifier */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="identifier" className="text-sm font-medium">
                    {isEmailMode ? "Email address" : "Email or username"}
                  </Label>
                  <div className="relative">
                    {isEmailMode ? (
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    ) : (
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    )}
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@example.com or username"
                      autoComplete="email username"
                      autoCapitalize="none"
                      aria-invalid={!!errors.identifier}
                      {...register("identifier")}
                      className={cn(
                        "h-10 pl-9 text-sm",
                        errors.identifier && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-[11px] text-destructive" role="alert">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                  {errors.password && (
                    <p className="text-[11px] text-destructive" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="h-10 w-full rounded-lg text-sm font-semibold"
                  disabled={isLoginPending}
                >
                  {isLoginPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Revquix Admin Portal · Authorised personnel only
          </p>
        </div>
      </div>
    </>
  )
}

