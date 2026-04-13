"use client"

/**
 * SocialAuthButtons — Centralized OAuth2 login/register buttons
 *
 * Used identically on both /auth/login and /auth/register.
 * Handles Google and GitHub via same-tab full-page navigation:
 *
 *   window.location.href = `${BACKEND_URL}/oauth2/authorization/{provider}`
 *
 * The browser is sent to the backend, which redirects to the provider's
 * consent screen, then back to the backend, then to /auth/callback?code=UUID.
 *
 * Environment variable required:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:7001   (no /api/v1 suffix)
 */

import { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import CentralizedLoader from "@/components/centralized-loader"

// ─── Types ────────────────────────────────────────────────────────────────────
type OAuthProvider = "google" | "github"

export interface SocialAuthButtonsProps {
  /**
   * Pass the parent form's isPending state so OAuth buttons are disabled while
   * an email/password submission is in progress.
   */
  disabled?: boolean
}

// ─── Static maps ──────────────────────────────────────────────────────────────
const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
}

const PROVIDER_REDIRECT_LABEL: Record<OAuthProvider, string> = {
  google: "Redirecting…",
  github: "Redirecting…",
}

const PROVIDER_SUB_MESSAGE: Record<OAuthProvider, string> = {
  google: "Connecting to Google…",
  github: "Connecting to GitHub…",
}

// ─── sessionStorage key — must match the constant in /auth/callback/page.tsx ──
const OAUTH_REDIRECT_KEY = "oauth_redirect_from"

// ─── Component ────────────────────────────────────────────────────────────────
export default function SocialAuthButtons({ disabled = false }: SocialAuthButtonsProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null)

  const backendBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v\d+\/?$/, "") ?? "http://localhost:7001")

  const handleOAuth = (provider: OAuthProvider) => {
    if (isRedirecting || disabled) return

    setIsRedirecting(true)
    setActiveProvider(provider)

    // Preserve the post-login destination across the OAuth redirect chain.
    // The user may have arrived here via middleware: / → no session →
    // /auth/login?from=/. We save ?from in sessionStorage so the
    // /auth/callback page can redirect there instead of always going to /.
    // sessionStorage survives full-page navigations to the provider and back.
    const from = new URLSearchParams(window.location.search).get("from")
    if (from && from.startsWith("/") && !from.startsWith("//")) {
      sessionStorage.setItem(OAUTH_REDIRECT_KEY, from)
    }

    // setTimeout(0) lets React flush state (render loader + disable buttons)
    // before the browser starts the navigation.
    setTimeout(() => {
      window.location.href = `${backendBaseUrl}/oauth2/authorization/${provider}`
    }, 0)
  }

  return (
    <>
      {/* ── Full-screen loader while the browser navigates to the provider ── */}
      <CentralizedLoader
        isVisible={isRedirecting}
        message="Redirecting to sign-in"
        subMessage={activeProvider ? PROVIDER_SUB_MESSAGE[activeProvider] : "Please wait…"}
      />

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {(["google", "github"] as OAuthProvider[]).map((provider) => {
          const isActive = activeProvider === provider && isRedirecting

          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="h-10 w-full gap-2.5 rounded-lg text-sm font-medium"
              disabled={disabled || isRedirecting}
              onClick={() => handleOAuth(provider)}
              aria-label={PROVIDER_LABEL[provider]}
            >
              {/* Icon — show spinner on the active provider, logo otherwise */}
              {isActive ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : provider === "google" ? (
                <Image
                  src="/svg/google-logo.svg"
                  alt="Google"
                  width={16}
                  height={16}
                  className="shrink-0"
                />
              ) : (
                <Image
                  src="/svg/github-logo.svg"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="shrink-0 dark:invert"
                />
              )}

              {/* Label — swap to "Redirecting…" only on the clicked button */}
              {isActive ? PROVIDER_REDIRECT_LABEL[provider] : PROVIDER_LABEL[provider]}
            </Button>
          )
        })}
      </div>
    </>
  )
}

