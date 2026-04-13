import type { Metadata } from "next"
import type React from "react"
import AuthRouteGuard from "@/components/auth-route-guard"

// ─── Shared metadata inherited by every page inside /auth/* ──────────────────
// Page-level files (register/page.tsx, login/page.tsx …) override the fields
// that are specific to them (title, description, keywords, canonical, OG url).
export const metadata: Metadata = {
  // ── Title template (pages override with their own string) ───────────────
  title: {
    default: "Auth | Revquix Admin",
    template: "%s | Revquix Admin",
  },

  // ── Shared site identity ─────────────────────────────────────────────────
  authors:         [{ name: "Revquix", url: "https://www.revquix.com" }],
  creator:         "Revquix",
  publisher:       "Revquix",
  generator:       "Next.js",
  applicationName: "Revquix Admin",
  referrer:        "origin-when-cross-origin",

  // ── Auth pages must never be indexed ────────────────────────────────────
  robots: {
    index:   false,
    follow:  false,
    nocache: true,
    googleBot: {
      index:            false,
      follow:           false,
      noimageindex:     true,
      "max-snippet":    0,
    },
  },

  // ── Icons ────────────────────────────────────────────────────────────────
  icons: {
    icon:     "/favicon.ico",
    shortcut: "/favicon.ico",
    apple:    "/favicon.ico",
  },
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthRouteGuard>
      <div className="min-h-screen w-full bg-background">
        {children}
      </div>
    </AuthRouteGuard>
  )
}
