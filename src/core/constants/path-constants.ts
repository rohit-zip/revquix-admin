/**
 * ─── PATH CONSTANTS — revquix-admin ─────────────────────────────────────────
 *
 * All admin routes.  The /admin/ prefix is DROPPED here because the entire
 * application is the admin panel — there is no ambiguity.
 *
 * Cross-app links (to revquix-dashboard) use NEXT_PUBLIC_DASHBOARD_URL.
 */

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:2000"

export const PATH_CONSTANTS = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  HOME: "/",
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_VERIFY_EMAIL: "/auth/verify-email",
  AUTH_CALLBACK: "/auth/callback",

  // ── Dashboard ────────────────────────────────────────────────────────────
  DASHBOARD: "/",
  UNAUTHORIZED: "/unauthorized",
  NOTIFICATIONS: "/notifications",

  // ── Access Control ────────────────────────────────────────────────────────
  ADMIN_USERS: "/users",
  ADMIN_USER_DETAIL: "/users",
  ADMIN_ROLE: "/roles",
  ADMIN_ROLE_ASSIGN: "/roles/assign",

  // ── Support ───────────────────────────────────────────────────────────────
  ADMIN_CONTACT_QUERIES: "/contact-queries",

  // ── Professional Mentor ───────────────────────────────────────────────────
  //
  // One section, ten routes. This replaces both the old nine-item "Professional Mentor" section
  // (built for V1, three of whose pages were windows onto empty tables) and the twelve-item
  // "Professional Mentor V2" section of per-phase verification consoles.
  //
  // The path is `/professional-mentor` rather than `/mentorship-v2` because V2 *is* Professional
  // Mentor now — a version number in a URL an operator reads is the same leak as a phase number in
  // a nav label. The old paths redirect; see `src/app/(protected)/(dash)/mentorship-v2`.
  ADMIN_PM_HOME: "/professional-mentor",
  ADMIN_PM_DISPUTES: "/professional-mentor/disputes",
  ADMIN_PM_SESSIONS: "/professional-mentor/sessions",
  ADMIN_PM_ORDERS: "/professional-mentor/orders",
  ADMIN_PM_SERVICES: "/professional-mentor/services",
  ADMIN_PM_MENTORS: "/professional-mentor/mentors",
  ADMIN_PM_APPLICATIONS: "/professional-mentor/applications",
  ADMIN_PM_PAYOUTS: "/professional-mentor/payouts",
  ADMIN_PM_COUPONS: "/professional-mentor/coupons",
  ADMIN_PM_PLATFORM: "/professional-mentor/platform",

  /**
   * Wallet drill-down. A route rather than a tab because it is deep — balance, ledger, payout
   * accounts and their verification state — and because the payouts queue links into it per mentor.
   */
  ADMIN_PM_WALLET_DETAIL: "/professional-mentor/payouts/wallets",

  // Retained: the mentor-application detail route is built by appending `/${applicationId}`.
  ADMIN_MENTOR_APPLICATION_DETAIL: "/professional-mentor/applications",

  // ── Payments Admin ────────────────────────────────────────────────────────
  ADMIN_PAYMENTS: "/payments",
  ADMIN_WEBHOOKS: "/webhooks",


  // ── Notification Management Admin ─────────────────────────────────────────
  ADMIN_NOTIFICATION_SEND: "/notification-management/send",
  ADMIN_NOTIFICATION_HISTORY: "/notification-management/history",
  ADMIN_NOTIFICATION_ANALYTICS: "/notification-management/analytics",

  // ── Business Mentor ───────────────────────────────────────────────────────
  BUSINESS_MENTOR_SLOTS: "/business-mentor/slots",
  BUSINESS_MENTOR_BOOKINGS: "/business-mentor/bookings",
  BUSINESS_MENTOR_ALL_BOOKINGS: "/business-mentor/all-bookings",
  BUSINESS_MENTOR_INTAKES: "/business-mentor/intakes",
  // ── Platform / Content Management ────────────────────────────────────────────
  ADMIN_COMPANIES: "/companies",
  ADMIN_SCHOOLS: "/schools",
  ADMIN_SKILLS: "/skills",
  ADMIN_ASSETS: "/assets",

  /**
   * The eight engineering diagnostics, now tabs on one page rather than eight sidebar rows.
   *
   * Values match the `?tab=` the Platform Health page reads, and the old `/mentorship-v2/<name>`
   * routes redirect onto them — an engineer's bookmark keeps working, it just arrives as a tab.
   */
  ADMIN_PM_PLATFORM_TABS: {
    JOBS: "jobs",
    AUDIT: "audit",
    SESSIONS_ENGINE: "sessions-engine",
    COMMERCE_ENGINE: "commerce-engine",
    DISPUTES_ENGINE: "disputes-engine",
    AVAILABILITY: "availability",
    PRICING: "pricing",
    SEARCH: "search",
    SEMANTIC: "semantic",
    PACKAGES: "packages",
    CATALOGUE_TOOLS: "catalogue-tools",
    MIGRATION: "migration",
    FOUNDATIONS: "foundations",
  },

  // ── News / Editorial (admin curation control plane) ───────────────────────
  ADMIN_NEWS: "/news",
  ADMIN_NEWS_CURATION: "/news", // + `/${blogId}/curation`
  ADMIN_NEWS_CATEGORIES: "/news/categories",
  ADMIN_NEWS_END_STRIPS: "/news/end-strips",
  ADMIN_NEWS_LANDING: "/news/landing",
  ADMIN_NEWS_ANALYTICS: "/news/analytics",


  // ── Offer Services (Global Offer Service) ─────────────────────────────────
  ADMIN_OFFER_SERVICES: "/offer-services",
  ADMIN_OFFER_SERVICE_DETAIL: "/offer-services",
  ADMIN_OFFER_ORDERS: "/offer-orders",
  ADMIN_OFFER_ORDER_DETAIL: "/offer-orders",
  ADMIN_OFFER_COUPONS: "/offer-coupons",
  ADMIN_CUSTOM_QUOTES: "/custom-quotes",
  ADMIN_CUSTOM_QUOTE_NEW: "/custom-quotes/new",
  ADMIN_CUSTOM_QUOTE_DETAIL: "/custom-quotes",  // ── Cross-app: revquix-dashboard ──────────────────────────────────────────

  // ── Marketing / Lead Generation ────────────────────────────────────────────
  ADMIN_LEAD_MAIL: "/lead-mail",
  ADMIN_LEAD_MAIL_COMPOSE: "/lead-mail/compose",
  ADMIN_LEAD_MAIL_CAMPAIGN_DETAIL: "/lead-mail/campaigns",

  // ── Tools platform admin control plane (Phase 8) ───────────────────────────
  /** §8.1 — credit ledger browser. Read-only: the ledger is append-only at the database. */
  ADMIN_TOOL_CREDITS: "/tools/credits",
  /** §8.1 — per-user drill-down. Appended with `/users/{userId}`. */
  ADMIN_TOOL_CREDIT_USER: "/tools/credits/users",
  /** §8.2 — the increase/decrease surface, cohort grants and free-run overrides. */
  ADMIN_TOOL_CREDITS_ADJUST: "/tools/credits/adjust",
  /** §8.3 — run inspector, including the ip_hash pivot and the hash-lookup box. */
  ADMIN_TOOL_RUNS: "/tools/runs",
  /** §8.4 — spend, cache and degradation dashboard. */
  ADMIN_TOOL_SPEND: "/tools/spend",
  /** §8.5 — credit packages, passes and per-tool credit-cost overrides. */
  ADMIN_TOOL_PRICING: "/tools/pricing",
  /** §8.6 — rubric versions and the before/after score-distribution diff. */
  ADMIN_TOOL_RUBRIC: "/tools/rubric",
  /** §8.7 — fraud and abuse queue. Every signal is triage input for a human. */
  ADMIN_TOOL_FRAUD: "/tools/fraud",
  /** §8.8 — editorial content library. Scaffolding; the tables belong to the tool phases. */
  ADMIN_TOOL_CONTENT: "/tools/content-library",
  /** The administrative audit trail across all three tools-admin permissions. */
  ADMIN_TOOL_AUDIT: "/tools/audit",

  EXTERNAL_DASHBOARD: DASHBOARD_URL,
  EXTERNAL_PROFILE: `${DASHBOARD_URL}/profile`,
  EXTERNAL_BOOKING: `${DASHBOARD_URL}/booking`,

  // ── Cross-app: web editorial editor (Option C — admin deep-links out) ─────
  WEB_EDITORIAL_LIST: `${DASHBOARD_URL}/dashboard/editorial`,
  WEB_EDITORIAL_NEW: `${DASHBOARD_URL}/dashboard/editorial/new`,
  WEB_EDITORIAL_EDIT: (blogId: string) => `${DASHBOARD_URL}/dashboard/editorial/${blogId}/edit`,
  WEB_EDITORIAL_PREVIEW: (blogId: string) => `${DASHBOARD_URL}/dashboard/editorial/${blogId}/preview`,

  // ── User-facing external links (point to revquix-dashboard) ──────────────
  // Needed by feature files copied from revquix-dashboard that reference these paths.
  // In the admin context they are purely cross-app navigation links.
  PROFILE: `${DASHBOARD_URL}/profile`,
  SETTINGS: `${DASHBOARD_URL}/settings`,
  BOOKING: `${DASHBOARD_URL}/booking`,
  SETUP_PROFILE: `${DASHBOARD_URL}/setup-profile`,

  // Mock Interview (user-facing — cross-app links)
  MOCK_INTERVIEW: `${DASHBOARD_URL}/mock-interview`,
  MOCK_INTERVIEW_BROWSE: `${DASHBOARD_URL}/mock-interview/browse`,
  MOCK_INTERVIEW_BOOK: `${DASHBOARD_URL}/mock-interview/book`,
  MY_BOOKINGS: `${DASHBOARD_URL}/my-bookings`,
  MY_BOOKINGS_MOCK_INTERVIEW: `${DASHBOARD_URL}/my-bookings/mock-interview`,
  MY_BOOKINGS_HOURLY_SESSION: `${DASHBOARD_URL}/my-bookings/hourly-session`,
  MOCK_INTERVIEW_MENTOR_DETAIL: `${DASHBOARD_URL}/mock-interview/browse`,

  // Professional Mentor (user-facing — cross-app links)
  PROFESSIONAL_MENTOR: `${DASHBOARD_URL}/professional-mentor`,
  PROFESSIONAL_MENTOR_SLOTS: `${DASHBOARD_URL}/professional-mentor/slots`,
  PROFESSIONAL_MENTOR_BOOKINGS: `${DASHBOARD_URL}/professional-mentor/bookings`,
  PROFESSIONAL_MENTOR_COUPONS: `${DASHBOARD_URL}/professional-mentor/coupons`,
  PROFESSIONAL_MENTOR_PROFILE: `${DASHBOARD_URL}/professional-mentor/profile`,
  PROFESSIONAL_MENTOR_PAYOUTS: `${DASHBOARD_URL}/professional-mentor/payouts`,

  // Mentor Application (user-facing — cross-app links)
  MENTOR_APPLICATION: `${DASHBOARD_URL}/mentor-application`,
  MENTOR_APPLICATION_APPLY: `${DASHBOARD_URL}/mentor-application/apply`,

  // ── Legal / external ─────────────────────────────────────────────────────
  PRIVACY_POLICY: "https://www.revquix.com/legal/privacy-policy",
  TERMS_OF_SERVICE: "https://www.revquix.com/legal/terms-of-service",
} as const


