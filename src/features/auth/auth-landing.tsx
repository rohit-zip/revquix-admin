"use client"

/**
 * AuthLanding — Gateway page at /auth
 *
 * Structurally identical to login-form / register-form so the three auth pages
 * feel cohesive.  Left panel = branding with the four pillars as a feature list.
 * Right panel = Card with two CTA rows + social OAuth buttons.
 */

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Globe,
  GraduationCap,
  LogIn,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import SocialAuthButtons from "@/components/social-auth-buttons"
import { cn } from "@/lib/utils"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Left-panel feature list (one line per pillar) ───────────────────────────

const BRAND_FEATURES = [
  "Custom software, mobile apps, AI & automation for businesses & startups",
  "Smart hiring with mock interviews, candidate screening & talent sourcing",
  "1-on-1 mentorship, IT training, resume review & career roadmaps for professionals",
  "No-code website builder with Contact form, SEO templates & custom hosting",
] as const

// ─── Mobile pillar badges (shown inside CardFooter on small screens) ──────────

const PILLAR_BADGES = [
  { label: "Software Dev",    icon: Briefcase,     color: "text-blue-500 dark:text-blue-400" },
  { label: "Smart Hiring",    icon: Users,         color: "text-violet-500 dark:text-violet-400" },
  { label: "Mentorship",      icon: GraduationCap, color: "text-emerald-500 dark:text-emerald-400" },
  { label: "Web Builder",     icon: Globe,         color: "text-amber-500 dark:text-amber-400" },
  { label: "AI & Automation", icon: Bot,           color: "text-primary-500 dark:text-primary-400" },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthLanding() {
  const searchParams = useSearchParams()
  const fromParam    = searchParams.get("from")

  const loginHref    = fromParam
    ? `/auth/login?from=${encodeURIComponent(fromParam)}`
    : "/auth/login"

  const registerHref = fromParam
    ? `/auth/register?from=${encodeURIComponent(fromParam)}`
    : "/auth/register"

  return (
    <div className="flex min-h-screen w-full">

      {/* ── Left branding panel — identical structure to login / register ──── */}
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
          <div className="inline-flex items-center gap-3">
            <Image
              src="/svg/revquix-white.svg"
              alt="Revquix"
              width={36}
              height={36}
              className="drop-shadow-lg"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-white">Revquix</span>
          </div>
        </div>

        {/* Headline + feature list */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-200">
              <Sparkles className="h-3 w-3" />
              Four Pillars. One Platform.
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
              One platform,{" "}
              <span className="bg-linear-to-r from-primary-300 via-violet-300 to-primary-200 bg-clip-text text-transparent">
                four ways
              </span>{" "}
              to grow
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              Whether you&apos;re a startup scaling fast, an HR team hiring smarter, a professional
              levelling up, or a business needing a web presence — Revquix has you covered.
            </p>
          </div>

          {/* Feature list — same CheckCircle2 pattern as login / register */}
          <ul className="flex flex-col gap-3">
            {BRAND_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" />
                <span className="text-sm leading-relaxed text-white/70">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer — testimonial identical to login page */}
        <div className="relative z-10 flex flex-col gap-4 border-t border-white/10 pt-8">
          <p className="text-xs leading-relaxed text-white/50">
            &quot;Revquix brought our entire tech stack, hiring pipeline, and web presence under
            one roof. Absolutely game-changing for our team.&quot;
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <Image
                src="/images/rohitparihar.jpeg"
                alt="Rohit Parihar"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-white/20"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Rohit Parihar</p>
              <p className="text-xs text-white/50">Revquix Developer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right panel — same structure as login / register ────────────────── */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="flex lg:hidden">
            <div className="inline-flex items-center gap-2">
              <Image src="/svg/revquix.svg" alt="Revquix" width={32} height={32} />
              <span className="text-lg font-bold tracking-tight">Revquix</span>
            </div>
          </div>

          {/* ── Card — same styling token as login / register ─────────────────── */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Get started</CardTitle>
              <CardDescription>
                New here or returning? Choose how you&apos;d like to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">

              {/* ── Create Account ───────────────────────────────────────────── */}
              <Link href={registerHref} className="group block">
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-lg border-2 p-4",
                    "border-primary-500/30 bg-primary-500/5",
                    "transition-all duration-150",
                    "hover:border-primary-500/60 hover:bg-primary-500/10",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 ring-1 ring-primary-500/25 transition-colors group-hover:bg-primary-500/25">
                    <UserPlus className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Create a free account</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      New to Revquix — takes less than a minute
                    </p>
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary-500",
                      "-translate-x-1 opacity-0 transition-all duration-150",
                      "group-hover:translate-x-0 group-hover:opacity-100",
                    )}
                  />
                </div>
              </Link>

              {/* ── Sign In ───────────────────────────────────────────────────── */}
              <Link href={loginHref} className="group block">
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-4",
                    "border-border/60 bg-muted/20",
                    "transition-all duration-150",
                    "hover:border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/50 transition-colors group-hover:bg-muted">
                    <LogIn className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Sign in to your account</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Already a member — continue where you left off
                    </p>
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground",
                      "-translate-x-1 opacity-0 transition-all duration-150",
                      "group-hover:translate-x-0 group-hover:opacity-100",
                    )}
                  />
                </div>
              </Link>

              {/* ── OR divider ────────────────────────────────────────────────── */}
              <div className="relative my-2">
                <Separator />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                  <span className="bg-card/40 px-2 text-xs text-muted-foreground">OR</span>
                </div>
              </div>

              {/* ── Social OAuth buttons ──────────────────────────────────────── */}
              <SocialAuthButtons />
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border/40 pt-6">
              {/* Mobile pillar strip */}
              <div className="flex w-full flex-wrap justify-center gap-1.5 lg:hidden">
                {PILLAR_BADGES.map(({ label, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2 py-1"
                  >
                    <Icon className={cn("h-3 w-3 shrink-0", color)} />
                    <span className="text-[10px] font-medium text-foreground/60">{label}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <a
                  href={PATH_CONSTANTS.TERMS_OF_SERVICE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href={PATH_CONSTANTS.PRIVACY_POLICY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Privacy Policy
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
