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

  // ── Mock Interview Admin ──────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_MOCK_BOOKINGS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_MOCK_BOOKINGS"],
    label: "All Mock Bookings",
  },

  [PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTOR_APPLICATIONS", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Mentor Applications",
  },

  [PATH_CONSTANTS.ADMIN_COUPONS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_COUPONS"],
    label: "All Coupons",
  },

  [PATH_CONSTANTS.ADMIN_MENTOR_REPORTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Mentor Reports",
  },

  // ── Payments Admin ────────────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_PAYMENTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_PAYMENTS"],
    label: "All Payments",
  },

  [PATH_CONSTANTS.ADMIN_PAYOUTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Payouts",
  },

  [PATH_CONSTANTS.ADMIN_WALLETS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Mentor Wallets",
  },

  [PATH_CONSTANTS.ADMIN_WEBHOOKS]: {
    allOf: ["ROLE_ADMIN"],
    label: "Webhook Logs",
  },
}

