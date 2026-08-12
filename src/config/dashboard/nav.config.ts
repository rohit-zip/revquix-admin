/**
 * ─── ADMIN NAV CONFIGURATION ─────────────────────────────────────────────────
 *
 * Single-workspace navigation for the revquix-admin application.
 * No workspace switcher — the entire app is the admin panel.
 *
 * Permission model
 * ─────────────────
 *   Each NavItem / NavSection carries an optional `access` guard.
 *   useFilteredSections() evaluates guard against the user's `authorities` and
 *   removes items / sections the user cannot access.  This means the sidebar
 *   self-configures based on the logged-in user's exact permission set.
 *
 *   Resolution rules (both must pass when combined):
 *     allOf → user must hold EVERY listed authority (AND)
 *     anyOf → user must hold AT LEAST ONE listed authority (OR)
 */

import {
  BarChart3,
  Bell,
  Brain,
  Building2,
  Calendar,
  GraduationCap,
  Coins,
  CreditCard,
  FileText,
  FlaskConical,
  FolderTree,
  History,
  Inbox,
  Image as ImageIcon,
  Key,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  type LucideIcon,
  Newspaper,
  Package,
  PanelBottom,
  Receipt,
  Send,
  ServerCog,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  User,
  UserCheck,
  Users,
  Video,
  Wallet,
  Webhook,
} from "lucide-react"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Permission constants ──────────────────────────────────────────────────────
/**
 * Centralised list of every known permission/authority string used in this app.
 * Use these constants everywhere to avoid magic strings and enable safe refactors.
 */
export const PERMISSIONS = {
  // ── Roles ──────────────────────────────────────────────────────────────────
  ROLE_ADMIN: "ROLE_ADMIN",
  ROLE_BUSINESS_MENTOR: "ROLE_BUSINESS_MENTOR",
  ROLE_PROFESSIONAL_MENTOR: "ROLE_PROFESSIONAL_MENTOR",

  // ── Access Control ─────────────────────────────────────────────────────────
  PERM_MANAGE_ROLES: "PERM_MANAGE_ROLES",
  PERM_MANAGE_PERMISSIONS: "PERM_MANAGE_PERMISSIONS",
  PERM_MANAGE_USERS: "PERM_MANAGE_USERS",
  PERM_MANAGE_USER_ROLES: "PERM_MANAGE_USER_ROLES",

  // ── Business Mentor ────────────────────────────────────────────────────────
  PERM_MANAGE_OWN_SLOTS: "PERM_MANAGE_OWN_SLOTS",
  PERM_VIEW_OWN_BOOKINGS: "PERM_VIEW_OWN_BOOKINGS",
  PERM_VIEW_ALL_BOOKINGS: "PERM_VIEW_ALL_BOOKINGS",
  PERM_VIEW_ALL_INTAKES: "PERM_VIEW_ALL_INTAKES",

  // ── Mock Interview ─────────────────────────────────────────────────────────
  PERM_MANAGE_PROFESSIONAL_MENTORS: "PERM_MANAGE_PROFESSIONAL_MENTORS",
  PERM_APPLY_PROFESSIONAL_MENTOR: "PERM_APPLY_PROFESSIONAL_MENTOR",
  PERM_MANAGE_OWN_PROFESSIONAL_SLOTS: "PERM_MANAGE_OWN_PROFESSIONAL_SLOTS",
  PERM_VIEW_OWN_MOCK_BOOKINGS: "PERM_VIEW_OWN_MOCK_BOOKINGS",
  PERM_VIEW_ALL_MOCK_BOOKINGS: "PERM_VIEW_ALL_MOCK_BOOKINGS",
  PERM_VIEW_ALL_HOURLY_BOOKINGS: "PERM_VIEW_ALL_HOURLY_BOOKINGS",
  PERM_CREATE_MOCK_BOOKING: "PERM_CREATE_MOCK_BOOKING",
  PERM_MANAGE_OWN_COUPONS: "PERM_MANAGE_OWN_COUPONS",
  PERM_VIEW_ALL_COUPONS: "PERM_VIEW_ALL_COUPONS",
  PERM_VIEW_MENTOR_APPLICATIONS: "PERM_VIEW_MENTOR_APPLICATIONS",
  PERM_MANAGE_MENTOR_PROFILE: "PERM_MANAGE_MENTOR_PROFILE",

  // ── Payments ───────────────────────────────────────────────────────────────
  PERM_VIEW_ALL_PAYMENTS: "PERM_VIEW_ALL_PAYMENTS",
  PERM_MANAGE_PAYOUTS: "PERM_MANAGE_PAYOUTS",

  // ── Offer Services ─────────────────────────────────────────────────────
  PERM_MANAGE_OFFER_SERVICES: "PERM_MANAGE_OFFER_SERVICES",
  PERM_MANAGE_OFFER_ORDERS: "PERM_MANAGE_OFFER_ORDERS",
  PERM_REVIEW_OFFER_ORDERS: "PERM_REVIEW_OFFER_ORDERS",
  PERM_MANAGE_CUSTOM_QUOTES: "PERM_MANAGE_CUSTOM_QUOTES",
  PERM_MANAGE_PLATFORM_COUPONS: "PERM_MANAGE_PLATFORM_COUPONS",

  PERM_MANAGE_CONTACT_QUERIES: "PERM_MANAGE_CONTACT_QUERIES",

  // ── Professional Mentor V2 (internal verification tools) ───────────────────
  PERM_VIEW_MENTORSHIP_V2_INTERNALS: "PERM_VIEW_MENTORSHIP_V2_INTERNALS",

  // ── Marketing / Lead Generation ─────────────────────────────────────────────
  PERM_SEND_LEAD_MAIL: "PERM_SEND_LEAD_MAIL",
  PERM_VIEW_USER_INTERESTS: "PERM_VIEW_USER_INTERESTS",
  PERM_MANAGE_INTEREST_TAXONOMY: "PERM_MANAGE_INTEREST_TAXONOMY",
  PERM_MANAGE_SEGMENTS: "PERM_MANAGE_SEGMENTS",

  // ── Content / Assets ───────────────────────────────────────────────────────
  PERM_MANAGE_ASSETS: "PERM_MANAGE_ASSETS",

  // ── News / Editorial ───────────────────────────────────────────────────────
  PERM_WRITE_EDITORIAL: "PERM_WRITE_EDITORIAL",
  PERM_MANAGE_EDITORIAL: "PERM_MANAGE_EDITORIAL",

  // ── Skill Registry (Skill-only taxonomy migration) ──────────────────────────
  PERM_MANAGE_SKILL_REGISTRY: "PERM_MANAGE_SKILL_REGISTRY",

  // ── Announcements (docs/ANNOUNCEMENTS_MASTER_PLAN.md, seeded by V273) ───────
  /**
   * Create, edit, schedule, publish, pause and archive the site-wide announcement bar.
   *
   * One permission rather than the obvious author / publish / analytics split. At this size that
   * split is wrong: the console has a single editor screen, and anybody trusted to write copy that
   * appears above the navbar on every page of the site is trusted to publish it. Split it the day
   * there is an editorial team that is not the same people as the operators.
   */
  PERM_MANAGE_ANNOUNCEMENTS: "PERM_MANAGE_ANNOUNCEMENTS",

  // ── Tools platform (seeded by V213 — docs/tools-platform §P3) ───────────────
  // PERM_USE_TOOLS is deliberately absent: it is a USER-facing permission granted to
  // ROLE_USER by default and revoked per-user from the fraud queue. It gates nothing
  // in this console.
  /** Ledger browser, adjustments, bulk grants, free-run overrides, pricing, fraud queue. */
  PERM_MANAGE_CREDITS: "PERM_MANAGE_CREDITS",
  /** Run inspector, hold release, retry, spend dashboard. Read access to operations, not to money. */
  PERM_MANAGE_TOOL_RUNS: "PERM_MANAGE_TOOL_RUNS",
  /** Rubric versions and the content library. */
  PERM_MANAGE_TOOL_RUBRIC: "PERM_MANAGE_TOOL_RUBRIC",

} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ─── Authority guard ───────────────────────────────────────────────────────────

/**
 * Flexible authority check used by NavItem and NavSection.
 *
 * Resolution (evaluated in order, ALL provided conditions must pass):
 *   1. allOf — user must hold EVERY listed authority (AND)
 *   2. anyOf — user must hold AT LEAST ONE listed authority (OR)
 *
 * If neither field is provided the item/section is unrestricted.
 */
export interface AuthorityGuard {
  allOf?: string[]
  anyOf?: string[]
}

// ─── Nav types ─────────────────────────────────────────────────────────────────

export interface NavItem {
  Icon: LucideIcon
  label: string
  href: string
  access?: AuthorityGuard
  /**
   * Highlight this item only when the pathname matches `href` exactly.
   *
   * Needed for section-index entries whose href is a prefix of their siblings' — e.g. the
   * Professional Mentor overview at `/professional-mentor` sits above
   * `/professional-mentor/disputes`, and the default prefix match would keep "Overview" lit while
   * the operator is on any of the nine child pages.
   */
  exact?: boolean
}

export interface NavSection {
  title: string | null
  items: NavItem[]
  access?: AuthorityGuard
}

// ─── Admin navigation sections ────────────────────────────────────────────────

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    title: null,
    items: [
      { Icon: LayoutDashboard, label: "Overview", href: "/" },
    ],
  },

  // ── Access Control ────────────────────────────────────────────────────────
  {
    title: "Access Control",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_MANAGE_USERS,
        PERMISSIONS.PERM_MANAGE_ROLES,
        PERMISSIONS.PERM_MANAGE_PERMISSIONS,
        PERMISSIONS.PERM_MANAGE_USER_ROLES,
      ],
    },
    items: [
      {
        Icon: Users,
        label: "Users",
        href: PATH_CONSTANTS.ADMIN_USERS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_MANAGE_USERS,
            PERMISSIONS.PERM_MANAGE_ROLES,
            PERMISSIONS.PERM_MANAGE_USER_ROLES,
          ],
        },
      },
      {
        Icon: Key,
        label: "Roles & Permissions",
        href: PATH_CONSTANTS.ADMIN_ROLE,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_MANAGE_ROLES,
            PERMISSIONS.PERM_MANAGE_PERMISSIONS,
          ],
        },
      },
    ],
  },

  // ── Business Mentor ───────────────────────────────────────────────────────
  {
    title: "Business Mentor",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.ROLE_BUSINESS_MENTOR,
        PERMISSIONS.PERM_MANAGE_OWN_SLOTS,
        PERMISSIONS.PERM_VIEW_OWN_BOOKINGS,
        PERMISSIONS.PERM_VIEW_ALL_BOOKINGS,
        PERMISSIONS.PERM_VIEW_ALL_INTAKES,
      ],
    },
    items: [
      {
        Icon: Star,
        label: "My Slots",
        href: PATH_CONSTANTS.BUSINESS_MENTOR_SLOTS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.ROLE_BUSINESS_MENTOR,
            PERMISSIONS.PERM_MANAGE_OWN_SLOTS,
          ],
        },
      },
      {
        Icon: Calendar,
        label: "My Bookings",
        href: PATH_CONSTANTS.BUSINESS_MENTOR_BOOKINGS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.ROLE_BUSINESS_MENTOR,
            PERMISSIONS.PERM_VIEW_OWN_BOOKINGS,
          ],
        },
      },
      {
        Icon: Users,
        label: "All Bookings",
        href: PATH_CONSTANTS.BUSINESS_MENTOR_ALL_BOOKINGS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_BOOKINGS],
        },
      },
      {
        Icon: FileText,
        label: "Intakes",
        href: PATH_CONSTANTS.BUSINESS_MENTOR_INTAKES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_INTAKES],
        },
      },
    ],
  },

  // ── Professional Mentor ────────────────────────────────────────────────────
  //
  // ONE section for the whole subsystem. It replaces two: a nine-item section built for V1 (three of
  // whose entries pointed at tables holding zero rows — mock bookings, hourly sessions and
  // business.session_dispute, all superseded by the V2 schema) and a twelve-item "Professional
  // Mentor V2" section of per-phase verification consoles.
  //
  // Ordered by how often an operator opens a page, not by data model and not by build order.
  // Disputes sits directly under Overview because it is the only surface here with a live human
  // queue and an SLA clock attached to it.
  //
  // Three pages are deliberately tabbed rather than split into more rows:
  //   Orders     — orders / refunds / entitlements, all artefacts of one purchase
  //   Payouts    — queue / wallets / reports, all views of one number (what we owe mentors), which
  //                used to be three sidebar rows that lost your filters every time you switched
  //   Platform   — the eight engineering diagnostics; they are for engineers and should cost one row
  //
  // Access: every entry admits ROLE_ADMIN plus the narrowest permission that implies the page. The
  // sidebar is convenience — each endpoint behind these pages carries its own @PreAuthorize.
  {
    title: "Professional Mentor",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS,
        PERMISSIONS.PERM_VIEW_MENTOR_APPLICATIONS,
        PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS,
        PERMISSIONS.PERM_VIEW_ALL_COUPONS,
        PERMISSIONS.PERM_MANAGE_PAYOUTS,
      ],
    },
    items: [
      {
        Icon: LayoutDashboard,
        label: "Overview",
        href: PATH_CONSTANTS.ADMIN_PM_HOME,
        // Exact: every other entry in this section is a child of this path, so a prefix match would
        // keep "Overview" lit on all nine of them.
        exact: true,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
      {
        Icon: ShieldAlert,
        label: "Disputes",
        href: PATH_CONSTANTS.ADMIN_PM_DISPUTES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
      {
        Icon: Video,
        label: "Sessions",
        href: PATH_CONSTANTS.ADMIN_PM_SESSIONS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
      {
        Icon: Receipt,
        label: "Orders",
        href: PATH_CONSTANTS.ADMIN_PM_ORDERS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
      {
        Icon: ShoppingBag,
        label: "Service Catalogue",
        href: PATH_CONSTANTS.ADMIN_PM_SERVICES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
      {
        Icon: Users,
        label: "Mentors",
        href: PATH_CONSTANTS.ADMIN_PM_MENTORS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS],
        },
      },
      {
        Icon: UserCheck,
        label: "Mentor Applications",
        href: PATH_CONSTANTS.ADMIN_PM_APPLICATIONS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_VIEW_MENTOR_APPLICATIONS,
            PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS,
          ],
        },
      },
      {
        Icon: Wallet,
        label: "Payouts",
        href: PATH_CONSTANTS.ADMIN_PM_PAYOUTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PAYOUTS],
        },
      },
      {
        Icon: Tag,
        label: "Coupons",
        href: PATH_CONSTANTS.ADMIN_PM_COUPONS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_COUPONS],
        },
      },
      {
        Icon: ServerCog,
        label: "Platform Health",
        href: PATH_CONSTANTS.ADMIN_PM_PLATFORM,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_MENTORSHIP_V2_INTERNALS],
        },
      },
    ],
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    title: "Finance",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_ALL_PAYMENTS,
      ],
    },
    items: [
      {
        Icon: CreditCard,
        label: "All Payments",
        href: PATH_CONSTANTS.ADMIN_PAYMENTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_PAYMENTS],
        },
      },
      {
        Icon: Webhook,
        label: "Webhook Logs",
        href: PATH_CONSTANTS.ADMIN_WEBHOOKS,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },

  // ── Notification Management ─────────────────────────────────────────────
  {
    title: "Notifications",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: Send,
        label: "Send Notification",
        href: PATH_CONSTANTS.ADMIN_NOTIFICATION_SEND,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
      {
        Icon: History,
        label: "Delivery Log",
        href: PATH_CONSTANTS.ADMIN_NOTIFICATION_HISTORY,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
      {
        Icon: BarChart3,
        label: "Analytics",
        href: PATH_CONSTANTS.ADMIN_NOTIFICATION_ANALYTICS,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },


  // ── Platform / Content Management ────────────────────────────────────────────
  {
    title: "Platform",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: Building2,
        label: "Company Registry",
        href: PATH_CONSTANTS.ADMIN_COMPANIES,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
      {
        Icon: GraduationCap,
        label: "School Registry",
        href: PATH_CONSTANTS.ADMIN_SCHOOLS,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
      {
        Icon: Sparkles,
        label: "Skill Registry",
        href: PATH_CONSTANTS.ADMIN_SKILLS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_SKILL_REGISTRY],
        },
      },
      {
        // One row, not a section. The Professional Mentor console work deliberately collapsed
        // 21 sidebar rows to 10; adding a section for a single CRUD screen would start undoing
        // that on the day it shipped.
        Icon: Megaphone,
        label: "Announcements",
        href: PATH_CONSTANTS.ADMIN_ANNOUNCEMENTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ANNOUNCEMENTS],
        },
      },
    ],
  },

  // ── Content / Assets ──────────────────────────────────────────────────────
  {
    title: "Content",
    access: {
      anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ASSETS],
    },
    items: [
      {
        Icon: ImageIcon,
        label: "Asset Manager",
        href: PATH_CONSTANTS.ADMIN_ASSETS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ASSETS],
        },
      },
    ],
  },

  // ── News / Editorial ──────────────────────────────────────────────────────
  // Permission-driven: any editorial author or curator sees this section.
  // Curation-only surfaces (landing, categories, end-strips, analytics) are
  // gated to PERM_MANAGE_EDITORIAL; the overview also admits WRITE_EDITORIAL.
  // Permission alone decides visibility; the EDITORIAL_ENABLED env gate is gone.
  {
    title: "News / Editorial",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_WRITE_EDITORIAL,
        PERMISSIONS.PERM_MANAGE_EDITORIAL,
      ],
    },
    items: [
      {
        Icon: Newspaper,
        label: "Overview",
        href: PATH_CONSTANTS.ADMIN_NEWS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_WRITE_EDITORIAL,
            PERMISSIONS.PERM_MANAGE_EDITORIAL,
          ],
        },
      },
      {
        Icon: Star,
        label: "Landing Curation",
        href: PATH_CONSTANTS.ADMIN_NEWS_LANDING,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL],
        },
      },
      {
        Icon: FolderTree,
        label: "Categories",
        href: PATH_CONSTANTS.ADMIN_NEWS_CATEGORIES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL],
        },
      },
      {
        Icon: PanelBottom,
        label: "End Strips",
        href: PATH_CONSTANTS.ADMIN_NEWS_END_STRIPS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL],
        },
      },
      {
        Icon: BarChart3,
        label: "Analytics",
        href: PATH_CONSTANTS.ADMIN_NEWS_ANALYTICS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL],
        },
      },
    ],
  } satisfies NavSection,

  // ── Offer Services (Global Offer Service) ─────────────────────────────────
  {
    title: "Offer Services",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_MANAGE_OFFER_SERVICES,
        PERMISSIONS.PERM_MANAGE_OFFER_ORDERS,
        PERMISSIONS.PERM_REVIEW_OFFER_ORDERS,
        PERMISSIONS.PERM_MANAGE_PLATFORM_COUPONS,
        PERMISSIONS.PERM_MANAGE_CUSTOM_QUOTES,
      ],
    },
    items: [
      {
        Icon: Package,
        label: "Service Catalogue",
        href: PATH_CONSTANTS.ADMIN_OFFER_SERVICES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_OFFER_SERVICES],
        },
      },
      {
        Icon: ShoppingCart,
        label: "Orders",
        href: PATH_CONSTANTS.ADMIN_OFFER_ORDERS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_MANAGE_OFFER_ORDERS,
            PERMISSIONS.PERM_REVIEW_OFFER_ORDERS,
          ],
        },
      },
      {
        Icon: FileText,
        label: "Custom Quotes",
        href: PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CUSTOM_QUOTES],
        },
      },
      {
        Icon: Tag,
        label: "Platform Coupons",
        href: PATH_CONSTANTS.ADMIN_OFFER_COUPONS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PLATFORM_COUPONS],
        },
      },
    ],
  },

  // ── Support ───────────────────────────────────────────────────────────────
  {
    title: "Support",
    access: {
      anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CONTACT_QUERIES],
    },
    items: [
      {
        Icon: Inbox,
        label: "Contact Queries",
        href: PATH_CONSTANTS.ADMIN_CONTACT_QUERIES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CONTACT_QUERIES],
        },
      },
    ],
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    title: "Marketing",
    access: {
      anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL],
    },
    items: [
      {
        Icon: History,
        label: "Campaigns",
        href: PATH_CONSTANTS.ADMIN_LEAD_MAIL,
        // Exact match: without it the Campaigns entry would also highlight while the operator is
        // on /lead-mail/compose, since that path starts with this one.
        exact: true,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL],
        },
      },
      {
        Icon: Send,
        label: "New Campaign",
        href: PATH_CONSTANTS.ADMIN_LEAD_MAIL_COMPOSE,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL],
        },
      },
    ],
  },

  // ── Interest Graph ────────────────────────────────────────────────────────
  //
  // Hidden entirely from an admin holding neither interest permission, so a reviewer
  // who does not work on this sees no sidebar change. Hiding is a convenience, NOT the
  // control — every endpoint behind these pages carries its own @PreAuthorize.
  //
  // The two items are deliberately different jobs. Overview is read-only diagnostics.
  // Unmapped terms and auto-matches WRITE into a role registry that the profile editor
  // and the tools skill matcher also read, which is why they need the taxonomy
  // permission rather than the view one.
  {
    title: "Interest Graph",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_USER_INTERESTS,
        PERMISSIONS.PERM_MANAGE_INTEREST_TAXONOMY,
      ],
    },
    items: [
      {
        Icon: Brain,
        label: "Overview",
        href: PATH_CONSTANTS.ADMIN_INTERESTS,
        exact: true,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_USER_INTERESTS],
        },
      },
      {
        Icon: ListTodo,
        label: "Unmapped Terms",
        href: PATH_CONSTANTS.ADMIN_INTERESTS_UNMAPPED,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_USER_INTERESTS],
        },
      },
      {
        Icon: Sparkles,
        label: "Auto-matches",
        href: PATH_CONSTANTS.ADMIN_INTERESTS_AUTO_MATCHES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_USER_INTERESTS],
        },
      },
    ],
  },

  // ── Tools Platform (Phase 8 admin control plane) ──────────────────────────
  //
  // The whole section is hidden from an admin holding none of the three tools permissions, so a
  // reviewer who does not work on tools sees no change to their sidebar. Each item then carries its
  // own guard, because the three permissions are genuinely different jobs: an on-call engineer with
  // PERM_MANAGE_TOOL_RUNS can see why runs are failing and what they cost, and cannot move credits.
  //
  // Hiding an item is a convenience, NOT the control — §8.9 criterion 9. Every endpoint behind these
  // pages carries its own @PreAuthorize, asserted reflectively by AdminControlPlaneContractTest.
  {
    title: "Tools Platform",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_MANAGE_CREDITS,
        PERMISSIONS.PERM_MANAGE_TOOL_RUNS,
        PERMISSIONS.PERM_MANAGE_TOOL_RUBRIC,
      ],
    },
    items: [
      {
        Icon: Coins,
        label: "Credit Ledger",
        href: PATH_CONSTANTS.ADMIN_TOOL_CREDITS,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CREDITS] },
      },
      {
        Icon: Sparkles,
        label: "Adjust Credits",
        href: PATH_CONSTANTS.ADMIN_TOOL_CREDITS_ADJUST,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CREDITS] },
      },
      {
        Icon: FlaskConical,
        label: "Tool Runs",
        href: PATH_CONSTANTS.ADMIN_TOOL_RUNS,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_TOOL_RUNS] },
      },
      {
        Icon: BarChart3,
        label: "Spend & Cost",
        href: PATH_CONSTANTS.ADMIN_TOOL_SPEND,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_TOOL_RUNS] },
      },
      {
        Icon: Package,
        label: "Packages & Pricing",
        href: PATH_CONSTANTS.ADMIN_TOOL_PRICING,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CREDITS] },
      },
      {
        Icon: Brain,
        label: "Rubric Versions",
        href: PATH_CONSTANTS.ADMIN_TOOL_RUBRIC,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_TOOL_RUBRIC] },
      },
      {
        Icon: ShieldAlert,
        label: "Fraud & Abuse",
        href: PATH_CONSTANTS.ADMIN_TOOL_FRAUD,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CREDITS] },
      },
      {
        Icon: FolderTree,
        label: "Content Library",
        href: PATH_CONSTANTS.ADMIN_TOOL_CONTENT,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_TOOL_RUBRIC] },
      },
      {
        Icon: History,
        label: "Admin Audit Trail",
        href: PATH_CONSTANTS.ADMIN_TOOL_AUDIT,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_MANAGE_CREDITS,
            PERMISSIONS.PERM_MANAGE_TOOL_RUNS,
            PERMISSIONS.PERM_MANAGE_TOOL_RUBRIC,
          ],
        },
      },
    ],
  },

  // ── Account ───────────────────────────────────────────────────────────────
  {
    title: "Account",
    items: [
      { Icon: Bell, label: "Notifications", href: "/notifications" },
      { Icon: User, label: "Profile", href: "/profile" },
    ],
  },
]

