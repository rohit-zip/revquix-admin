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

  // ── Mock Interview Admin ──────────────────────────────────────────────────
  ADMIN_MENTOR_APPLICATIONS: "/mentor-applications",
  ADMIN_MENTOR_APPLICATION_DETAIL: "/mentor-applications",
  ADMIN_MOCK_BOOKINGS: "/mock-bookings",
  ADMIN_HOURLY_BOOKINGS: "/hourly-bookings",
  ADMIN_COUPONS: "/coupons",
  ADMIN_SESSION_DISPUTES: "/session-disputes",
  ADMIN_CONTACT_QUERIES: "/contact-queries",
  ADMIN_PROFESSIONAL_MENTORS: "/professional-mentor/mentors",

  // ── Payments Admin ────────────────────────────────────────────────────────
  ADMIN_PAYMENTS: "/payments",
  ADMIN_PAYOUTS: "/payouts",
  ADMIN_PAYOUT_REPORTS: "/payouts/reports",
  ADMIN_WALLETS: "/wallets",
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

  // ── Professional Mentor V2 (Phase 0+ internal verification tools) ────────
  /**
   * Console index for the whole subsystem — one card per console below, with what each one
   * answers. Exists because the eleven consoles were previously reachable only from sidebar
   * entries named after build phases, which told nobody where disputes or payouts live.
   */
  ADMIN_MENTORSHIP_V2_HOME: "/mentorship-v2",
  ADMIN_MENTORSHIP_V2_VERIFICATION: "/mentorship-v2/verification",
  /** Phase 1 — availability engine inspector, mentor health, exclusion-constraint proof, Google round trip. */
  ADMIN_MENTORSHIP_V2_AVAILABILITY: "/mentorship-v2/availability",
  /** Phase 2 — service catalog snapshot, publish-gate inspector, sanitiser XSS probe, type registry. */
  ADMIN_MENTORSHIP_V2_SERVICES: "/mentorship-v2/services",
  /** Phase 3 — commerce invariants, revenue lines, reservations/sweeps, webhook feed, order inspector, lifecycles. */
  ADMIN_MENTORSHIP_V2_COMMERCE: "/mentorship-v2/commerce",
  /** Phase 4 — 1:1 call lifecycle: meeting links, join evidence, reminders, attendance, auto-completion, reviews. */
  ADMIN_MENTORSHIP_V2_CALLS: "/mentorship-v2/calls",
  /** Phase 6 — package entitlement ledger, escrow invariant, SLA breach ladder, lifecycle sweep. */
  ADMIN_MENTORSHIP_V2_PACKAGES: "/mentorship-v2/packages",
  /** Phase 7 — dispute queue, SLA breach view, one-click executable resolutions, reliability feed. */
  ADMIN_MENTORSHIP_V2_DISPUTES: "/mentorship-v2/disputes",
  /** Phase 8 — pricing zones, multipliers, the country map and FX source health. */
  ADMIN_MENTORSHIP_V2_PRICING: "/mentorship-v2/pricing",
  /** Phase 9 — search projection health, content gate, query analytics, synonyms, SEO landing coverage. */
  ADMIN_MENTORSHIP_V2_SEARCH: "/mentorship-v2/search",
  /** Phase 10 — pgvector capability, embedding coverage, HNSW budget, V1/V2 A/B, offline job queues. */
  ADMIN_MENTORSHIP_V2_SEMANTIC: "/mentorship-v2/semantic",
  /** Phase 11 — legacy backfill ledger, dual-run bridge, revenue reconciliation, decommission readiness. */
  ADMIN_MENTORSHIP_V2_CUTOVER: "/mentorship-v2/cutover",

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


