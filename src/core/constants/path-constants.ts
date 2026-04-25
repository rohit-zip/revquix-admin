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
  ADMIN_HOURLY_SESSION_MENTORS: "/hourly-session/mentors",
  ADMIN_HOURLY_SESSION_MENTOR_DETAIL: "/hourly-session/mentors",
  ADMIN_COUPONS: "/coupons",
  ADMIN_MENTOR_REPORTS: "/mentor-reports",
  ADMIN_SESSION_DISPUTES: "/session-disputes",

  // ── Resume Review Admin ──────────────────────────────────────────────────
  ADMIN_RESUME_REVIEWS: "/resume-reviews",
  ADMIN_RESUME_REVIEW_PLANS: "/resume-review-plans",
  ADMIN_RESUME_REVIEW_ANALYTICS: "/resume-review-analytics",

  // ── Payments Admin ────────────────────────────────────────────────────────
  ADMIN_PAYMENTS: "/payments",
  ADMIN_PAYOUTS: "/payouts",
  ADMIN_WALLETS: "/wallets",
  ADMIN_WEBHOOKS: "/webhooks",

  // ── Website Builder Admin ─────────────────────────────────────────────────
  ADMIN_WEBSITE_TEMPLATES: "/website/templates",
  ADMIN_WEBSITE_COMPONENTS: "/website/components",
  ADMIN_WEBSITE_PRICING: "/website/pricing",
  ADMIN_WEBSITE_WATERMARK: "/website/watermark",
  ADMIN_WEBSITE_WEBSITES: "/website/websites",
  ADMIN_WEBSITE_SUBSCRIPTIONS: "/website/subscriptions",
  ADMIN_WEBSITE_STATS: "/website/stats",

  // ── Notification Management Admin ─────────────────────────────────────────
  ADMIN_NOTIFICATION_SEND: "/notification-management/send",
  ADMIN_NOTIFICATION_HISTORY: "/notification-management/history",
  ADMIN_NOTIFICATION_ANALYTICS: "/notification-management/analytics",

  // ── Business Mentor ───────────────────────────────────────────────────────
  BUSINESS_MENTOR_SLOTS: "/business-mentor/slots",
  BUSINESS_MENTOR_BOOKINGS: "/business-mentor/bookings",
  BUSINESS_MENTOR_ALL_BOOKINGS: "/business-mentor/all-bookings",
  BUSINESS_MENTOR_INTAKES: "/business-mentor/intakes",

  // ── Cross-app: revquix-dashboard ──────────────────────────────────────────
  EXTERNAL_DASHBOARD: DASHBOARD_URL,
  EXTERNAL_PROFILE: `${DASHBOARD_URL}/profile`,
  EXTERNAL_BOOKING: `${DASHBOARD_URL}/booking`,

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
  MOCK_INTERVIEW_MY_BOOKINGS: `${DASHBOARD_URL}/mock-interview/my-bookings`,
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


