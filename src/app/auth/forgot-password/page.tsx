import type { Metadata } from "next"
import { Suspense } from "react"
import ForgotPasswordForm from "@/features/auth/forgot-password-form"

// ─── Page-specific metadata (merges on top of auth/layout.tsx) ───────────────
export const metadata: Metadata = {
  title: "Forgot Password",

  description:
    "Reset your Revquix account password securely. Enter your email to receive a one-time code and create a new password.",

  keywords: [
    "Revquix forgot password",
    "reset Revquix password",
    "account recovery Revquix",
    "Revquix password reset",
    "forgot password mentorship platform",
  ],

  alternates: {
    canonical: "https://www.revquix.com/auth/forgot-password",
  },

  openGraph: {
    url: "https://www.revquix.com/auth/forgot-password",
    title: "Reset Your Revquix Password",
    description:
      "Forgot your password? Enter your email to receive a secure OTP and reset your Revquix account password.",
  },

  twitter: {
    title: "Reset Your Revquix Password",
    description:
      "Forgot your password? Enter your email to receive a secure OTP and reset your Revquix account password.",
  },
}

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.revquix.com/auth/forgot-password#webpage",
  url: "https://www.revquix.com/auth/forgot-password",
  name: "Forgot Password — Revquix",
  description:
    "Reset your Revquix account password using a one-time verification code sent to your email.",
  isPartOf: { "@id": "https://www.revquix.com/#website" },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.revquix.com" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sign In",
        item: "https://www.revquix.com/auth/login",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Forgot Password",
        item: "https://www.revquix.com/auth/forgot-password",
      },
    ],
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* Interactive form (client component) */}
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </>
  )
}

