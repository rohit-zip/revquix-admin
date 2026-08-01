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

  // ── Offer Services Admin ──────────────────────────────────────────────────

  [PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_CUSTOM_QUOTES"],
    label: "Custom Quotes",
  },

  // ── Professional Mentor V2 (admin consoles) ───────────────────────────────
  //
  // Labels are feature-first, matching the sidebar: the phase number is kept as a suffix because it
  // is how the implementation strategy doc is indexed, but it is no longer the primary name.
  //
  // ⚠ Key ORDER matters here. PageGuard resolves with `Object.keys(...).find(...)`, i.e. the FIRST
  // key that matches, not the longest one. `/mentorship-v2` is a prefix of all eleven consoles below,
  // so its rule is registered AFTER them — otherwise every child page would resolve to the hub's
  // rule and report the hub's label in the permission-denied watermark.

  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_VERIFICATION]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Foundations & Rollout Flag (Phase 0)",
  },

  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_AVAILABILITY]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Availability Engine (Phase 1)",
  },

  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SERVICES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Service Catalogue (Phase 2)",
  },

  // Read access only. The sweep and refund actions on this page additionally require
  // PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced server-side — granting read access to
  // debug a checkout must not also hand out the ability to move money.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_COMMERCE]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Orders & Checkout (Phase 3)",
  },

  // Read access only. The sweep, force-complete and review-moderation actions on this page
  // additionally require PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced server-side — same
  // split as Phase 3's commerce panel, for the same reason: completing a booking releases a
  // payout and hiding a review changes a public rating.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_CALLS]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Sessions & Feedback (Phase 4/5)",
  },

  // Read access only. Running the lifecycle sweep additionally requires
  // PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced server-side — same split as every prior
  // phase's write action, because the sweep can auto-pause a mentor's service, apply a
  // reliability penalty, and unlock a buyer's self-serve refund.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_PACKAGES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Packages & Entitlements (Phase 6)",
  },

  // Read access only. Every write on the dispute console — assign, reply, ask a side, run the
  // sweep, and above all resolve — additionally requires PERM_MANAGE_MENTORSHIP_DISPUTES (V190),
  // enforced server-side.
  //
  // That is a NEW permission rather than a reuse of PERM_MANAGE_MENTORSHIP_V2_COMMERCE, and the
  // distinction is the point: resolving a dispute is a discretionary judgement between two named
  // parties that can also suspend a mentor's services, whereas the commerce permission permits
  // refunding any order with no dispute at all. Collapsing them would mean granting every support
  // agent blanket refund rights, and making every finance admin a judge of conduct complaints.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_DISPUTES]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Disputes & Reliability (Phase 7)",
  },

  // Read access only. Every write on the pricing console — retuning a multiplier, remapping a country,
  // forcing an FX fetch — additionally requires PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced
  // server-side. NO new permission was added for Phase 8: changing a multiplier is a
  // commerce-configuration action of exactly the kind that permission already covers, unlike Phase 7's
  // dispute resolution, which is a discretionary judgement between two named parties.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_PRICING]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Pricing Zones & FX (Phase 8)",
  },

  // Read access only. The write actions on the search console — running the projection sweep, rebuilding
  // the index, saving a synonym — additionally require PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced
  // server-side. NO new permission was added for Phase 9: rebuilding derived data and curating a synonym
  // list are index maintenance, not a discretionary judgement about a named party, so they belong with
  // the commerce-configuration permission rather than with Phase 7's dispute rights.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SEARCH]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Marketplace & Search (Phase 9)",
  },

  // Read access only. The write actions on the semantic console — re-probing for pgvector, running an
  // embedding pass, clearing the index, running the offline jobs, accepting a skill suggestion — additionally
  // require PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced server-side. NO new permission for Phase 10: almost
  // everything there is index maintenance, and the one catalogue-editing action (accepting a suggested skill
  // tag) is the same class of change that permission already covers.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SEMANTIC]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Semantic Search (Phase 10)",
  },

  // Read access only. The write actions on the cutover console — running or rolling back the backfill, and
  // archiving the legacy tables — additionally require PERM_MANAGE_MENTORSHIP_V2_COMMERCE, enforced
  // server-side, plus a config switch that defaults to off. NO new permission for Phase 11: operating the
  // migration machinery is the same KIND of authority the sweeps and force-completes that permission
  // already covers, held by the same people. Phase 7's test for a new permission was "a different kind of
  // authority, held by different people", and this fails it.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_CUTOVER]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Migration & Cutover (Phase 11)",
  },

  // The console index. Registered LAST in this block on purpose — see the ordering note above: its
  // path is a prefix of every console's, and PageGuard takes the first matching key. Same permission
  // as the consoles it links to, so the directory can never advertise a page the viewer is refused.
  [PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_HOME]: {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTORSHIP_V2_INTERNALS"],
    label: "Mentorship V2 — Console Home",
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

  [PATH_CONSTANTS.ADMIN_PAYOUT_REPORTS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Payout Reports",
  },

  [PATH_CONSTANTS.ADMIN_WALLETS]: {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Mentor Wallets",
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

