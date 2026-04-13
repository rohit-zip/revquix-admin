import type { Metadata } from "next"
import { Suspense } from "react"
import LoginForm from "@/features/auth/login-form"

// ─── Page-specific metadata (merges on top of auth/layout.tsx) ───────────────
export const metadata: Metadata = {
  title: "Sign In",   // renders as "Sign In | Revquix" via layout template

  description:
    "Sign in to your Revquix account to access mentorship programmes, software consulting, interview preparation, resume reviews, and career growth tools.",

  keywords: [
    "Revquix login",
    "sign in Revquix",
    "login Revquix account",
    "Revquix platform login",
    "mentorship platform login",
    "software consulting login",
    "interview prep login",
    "career growth platform",
    "Revquix user login",
    "access Revquix account",
  ],

  alternates: {
    canonical: "https://www.revquix.com/auth/login",
  },

  openGraph: {
    url:         "https://www.revquix.com/auth/login",
    title:       "Sign In to Your Revquix Account",
    description:
      "Sign in to Revquix and unlock mentorship, software consulting, interview prep, and career growth — all in one place.",
  },

  twitter: {
    title:       "Sign In to Your Revquix Account",
    description:
      "Sign in to Revquix and unlock mentorship, software consulting, interview prep, and career growth — all in one place.",
  },
}

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
const webPageSchema = {
  "@context": "https://schema.org",
  "@type":    "WebPage",
  "@id":      "https://www.revquix.com/auth/login#webpage",
  url:        "https://www.revquix.com/auth/login",
  name:       "Sign In to Revquix",
  description:
    "Sign in to your Revquix account to access mentorship, consulting, interview preparation, and career development resources.",
  isPartOf:   { "@id": "https://www.revquix.com/#website" },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: "https://www.revquix.com" },
      { "@type": "ListItem", position: 2, name: "Sign In", item: "https://www.revquix.com/auth/login" },
    ],
  },
  potentialAction: {
    "@type":  "LoginAction",
    target:   "https://www.revquix.com/auth/login",
    name:     "Sign in to Revquix",
    object: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.revquix.com/auth/login",
    },
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* Interactive form (client component) */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  )
}

