/**
 * ─── PAGE ACCESS CONFIGURATION — revquix-admin ───────────────────────────────
 *
 * Maps each protected admin route to the authorities that may access it.
 * A user needs at least ONE of the listed authorities (anyOf) to view the page.
 *
 * NOTE: Paths here have NO /admin/ prefix — the entire app is the admin panel.
 *
 * Authority naming convention
 * ───────────────────────────
 *   ROLE_*  → coarse-grained Spring Security roles   (e.g. ROLE_ADMIN)
 *   PERM_*  → fine-grained permissions               (e.g. PERM_MANAGE_ROLE)
 *
 * Matching strategy
 * ─────────────────
 *   pathname === key  OR  pathname.startsWith(key + "/")
 *
 * Usage
 * ─────
 *   Wrap any page with <PageGuard> — it auto-reads this config.
 *   Or pass `requireAnyAuthority` / `requireAllAuthorities` props explicitly.
 */

import { PATH_CONSTANTS } from "@/core/constants/path-constants"

export interface PageAccessRule {
  /** OR logic — user must hold AT LEAST ONE of these authorities */
  anyOf?: string[]
  /** AND logic — user must hold EVERY authority in this list */
  allOf?: string[]
  /** Human-readable label for the dev permission-denied watermark */
  label?: string
}

export const PAGE_ACCESS_CONFIG: Record<string, PageAccessRule> = {
  // ── Access Control ────────────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_ROLE]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_ROLES", "PERM_MANAGE_PERMISSIONS"],
    label: "Roles & Permissions",
  },

  // ── Interest Graph ────────────────────────────────────────────────────────
  //
  // Note the matching strategy at the top of this file: a rule for "/interests" also
  // covers "/interests/unmapped". Both child routes are listed anyway, because the
  // taxonomy screens are the ones that WRITE into a registry two other subsystems
  // read, and a reader of this file should not have to infer that from a prefix.

  [PATH_CONSTANTS.ADMIN_INTERESTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_USER_INTERESTS"],
    label: "Interest Graph",
  },

  [PATH_CONSTANTS.ADMIN_INTERESTS_UNMAPPED]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_USER_INTERESTS"],
    label: "Unmapped Terms",
  },

  [PATH_CONSTANTS.ADMIN_INTERESTS_AUTO_MATCHES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_USER_INTERESTS"],
    label: "Auto-matches",
  },

  [PATH_CONSTANTS.ADMIN_USERS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_USERS", "PERM_MANAGE_ROLES", "PERM_MANAGE_USER_ROLES"],
    label: "Users",
  },

  // ── Business Mentor ───────────────────────────────────────────────────────

  [PATH_CONSTANTS.BUSINESS_MENTOR_SLOTS]: {
    anyOf: ["ROLE_ADMIN", "ROLE_BUSINESS_MENTOR", "PERM_MANAGE_OWN_SLOTS"],
    label: "Business Mentor — Slots",
  },

  [PATH_CONSTANTS.BUSINESS_MENTOR_BOOKINGS]: {
    anyOf: ["ROLE_ADMIN", "ROLE_BUSINESS_MENTOR", "PERM_VIEW_OWN_BOOKINGS"],
    label: "Business Mentor — My Bookings",
  },

  [PATH_CONSTANTS.BUSINESS_MENTOR_ALL_BOOKINGS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_BOOKINGS"],
    label: "Business Mentor — All Bookings",
  },

  [PATH_CONSTANTS.BUSINESS_MENTOR_INTAKES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_INTAKES"],
    label: "Business Mentor — Intake Management",
  },

  // ── Offer Services Admin ──────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CUSTOM_QUOTES"],
    label: "Custom Quotes",
  },

  // ── Professional Mentor ───────────────────────────────────────────────────
  //
  // One block for the whole subsystem, replacing both the V1 "Mock Interview Admin" entries and the
  // eleven per-phase V2 console entries. The phase numbers are gone from the labels: a phase number
  // is a fact about how the subsystem was BUILT, and this label is what an operator reads in the
  // permission-denied watermark.
  //
  // ⚠ Key ORDER matters. PageGuard resolves with `Object.keys(...).find(...)` — the FIRST key that
  // matches, not the longest. `/professional-mentor` is a prefix of all nine pages below, so its
  // rule is registered AFTER them; otherwise every child page would resolve to the overview's rule
  // and report the overview's label.
  //
  // Each rule is READ access only. Every write behind these pages carries its own server-side
  // @PreAuthorize, and the two are deliberately different permissions:
  //   • PERM_MANAGE_MENTORSHIP_V2_COMMERCE — refunds, sweeps, force-completes, pricing, reindexes
  //   • PERM_MANAGE_MENTORSHIP_DISPUTES    — resolving a dispute
  // Collapsing them would grant every support agent blanket refund rights and make every finance
  // admin a judge of conduct complaints.

  [PATH_CONSTANTS.ADMIN_PM_DISPUTES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Disputes",
  },

  [PATH_CONSTANTS.ADMIN_PM_SESSIONS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Sessions",
  },

  [PATH_CONSTANTS.ADMIN_PM_ORDERS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Orders",
  },

  [PATH_CONSTANTS.ADMIN_PM_SERVICES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Service Catalogue",
  },

  [PATH_CONSTANTS.ADMIN_PM_MENTORS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Professional Mentor — Mentors",
  },

  [PATH_CONSTANTS.ADMIN_PM_APPLICATIONS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTOR_APPLICATIONS", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Professional Mentor — Mentor Applications",
  },

  [PATH_CONSTANTS.ADMIN_PM_PAYOUTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Professional Mentor — Payouts",
  },

  [PATH_CONSTANTS.ADMIN_PM_COUPONS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_COUPONS"],
    label: "Professional Mentor — Coupons",
  },

  [PATH_CONSTANTS.ADMIN_PM_PLATFORM]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Platform Health",
  },

  // Registered LAST in this block — see the ordering note above. Same permission as the pages it
  // links to, so the overview can never advertise a page the viewer is refused.
  [PATH_CONSTANTS.ADMIN_PM_HOME]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor — Overview",
  },

  // Legacy paths, kept only so the redirect pages behind them are reachable rather than 403-ing on
  // the way to their destination.
  ["/mentorship-v2"]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Professional Mentor (moved)",
  },
  ["/payouts"]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Payouts (moved)",
  },
  ["/wallets"]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Mentor Wallets (moved)",
  },
  ["/coupons"]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_COUPONS"],
    label: "Coupons (moved)",
  },
  ["/mentor-applications"]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTOR_APPLICATIONS", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Mentor Applications (moved)",
  },

  // ── Payments Admin ────────────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_PAYMENTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_PAYMENTS"],
    label: "All Payments",
  },

  [PATH_CONSTANTS.ADMIN_WEBHOOKS]: {
    allOf: ["ROLE_ADMIN"],
    label: "Webhook Logs",
  },

  // ── Marketing / Lead Generation ────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_LEAD_MAIL]: {
    anyOf: ["ROLE_ADMIN", "PERM_SEND_LEAD_MAIL"],
    label: "Lead Mailer",
  },

  [PATH_CONSTANTS.ADMIN_LEAD_MAIL_COMPOSE]: {
    anyOf: ["ROLE_ADMIN", "PERM_SEND_LEAD_MAIL"],
    label: "New Campaign",
  },

  // ── Tools platform admin control plane (Phase 8) ───────────────────────────
  //
  // Matching is `pathname === key || pathname.startsWith(key + "/")`, so the ADMIN_TOOL_CREDITS entry
  // also covers /tools/credits/users/{userId}. ADMIN_TOOL_CREDITS_ADJUST is listed separately and
  // AFTER it purely for readability — the matcher picks the longest match, so the ordering here does
  // not decide anything.
  //
  // ⚠ These rules gate the PAGE. They are not the authorisation: every endpoint behind these screens
  // carries its own @PreAuthorize, because §8.9 criterion 9 is that "the UI hiding a button is not the
  // control". An operator who reaches the API with curl gets a 403 regardless of what this file says.

  [PATH_CONSTANTS.ADMIN_TOOL_CREDITS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CREDITS"],
    label: "Tools — Credit Ledger",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_CREDITS_ADJUST]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CREDITS"],
    label: "Tools — Adjust Credits",
  },

  // Read access to runs, deliberately separate from credits. An on-call engineer debugging a failing
  // tool should not thereby acquire the ability to move money — and the run REFUND action on this page
  // additionally requires PERM_MANAGE_CREDITS, enforced server-side, so a reader holding only this
  // permission gets the page and a clean 403 on that one button.
  [PATH_CONSTANTS.ADMIN_TOOL_RUNS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_TOOL_RUNS"],
    label: "Tools — Run Inspector",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_SPEND]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_TOOL_RUNS"],
    label: "Tools — Spend & Cost",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_PRICING]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CREDITS"],
    label: "Tools — Packages & Pricing",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_RUBRIC]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_TOOL_RUBRIC"],
    label: "Tools — Rubric Versions",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_FRAUD]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CREDITS"],
    label: "Tools — Fraud & Abuse",
  },

  [PATH_CONSTANTS.ADMIN_TOOL_CONTENT]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_TOOL_RUBRIC"],
    label: "Tools — Content Library",
  },

  // Readable by any of the three tools-admin permissions: the trail records actions across all of
  // them, so gating it on credits alone would hide a rubric publication from the person who published
  // it.
  [PATH_CONSTANTS.ADMIN_TOOL_AUDIT]: {
    anyOf: [
      "ROLE_ADMIN",
      "PERM_MANAGE_CREDITS",
      "PERM_MANAGE_TOOL_RUNS",
      "PERM_MANAGE_TOOL_RUBRIC",
    ],
    label: "Tools — Admin Audit Trail",
  },

}

