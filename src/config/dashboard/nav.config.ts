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
  Briefcase,
  Building2,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe,
  Key,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Package,
  Settings,
  Star,
  Tag,
  User,
  UserCheck,
  UserPlus,
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
  ROLE_MENTOR: "ROLE_MENTOR",
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

  // ── Resume Review ───────────────────────────────────────────────────────
  PERM_VIEW_ALL_RESUME_REVIEWS: "PERM_VIEW_ALL_RESUME_REVIEWS",
  PERM_MANAGE_RESUME_PLANS: "PERM_MANAGE_RESUME_PLANS",
  PERM_VIEW_RESUME_ANALYTICS: "PERM_VIEW_RESUME_ANALYTICS",

  // ── Website Builder ────────────────────────────────────────────────────────
  PERM_MANAGE_TEMPLATES: "PERM_MANAGE_TEMPLATES",
  PERM_MANAGE_COMPONENTS: "PERM_MANAGE_COMPONENTS",
  PERM_MANAGE_PLATFORM_PRICING: "PERM_MANAGE_PLATFORM_PRICING",
  PERM_MANAGE_WATERMARK_CONFIG: "PERM_MANAGE_WATERMARK_CONFIG",
  PERM_VIEW_ALL_WEBSITES: "PERM_VIEW_ALL_WEBSITES",
  PERM_MANAGE_ALL_WEBSITES: "PERM_MANAGE_ALL_WEBSITES",
  PERM_VIEW_ALL_SUBSCRIPTIONS: "PERM_VIEW_ALL_SUBSCRIPTIONS",
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

  // ── Professional Mentor Admin ──────────────────────────────────────────────
  {
    title: "Professional Mentor",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_ALL_MOCK_BOOKINGS,
        PERMISSIONS.PERM_VIEW_MENTOR_APPLICATIONS,
        PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS,
        PERMISSIONS.PERM_VIEW_ALL_COUPONS,
      ],
    },
    items: [
      {
        Icon: UserCheck,
        label: "Mentor Applications",
        href: PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS,
        access: {
          anyOf: [
            PERMISSIONS.ROLE_ADMIN,
            PERMISSIONS.PERM_VIEW_MENTOR_APPLICATIONS,
            PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS,
          ],
        },
      },
      {
        Icon: Video,
        label: "All Bookings",
        href: PATH_CONSTANTS.ADMIN_MOCK_BOOKINGS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_MOCK_BOOKINGS],
        },
      },
      {
        Icon: Calendar,
        label: "Hourly Sessions",
        href: PATH_CONSTANTS.ADMIN_HOURLY_BOOKINGS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_HOURLY_BOOKINGS],
        },
      },
      {
        Icon: Users,
        label: "Hourly Mentors",
        href: PATH_CONSTANTS.ADMIN_HOURLY_SESSION_MENTORS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS],
        },
      },
      {
        Icon: Tag,
        label: "All Coupons",
        href: PATH_CONSTANTS.ADMIN_COUPONS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_COUPONS],
        },
      },
      {
        Icon: BarChart3,
        label: "Mentor Reports",
        href: PATH_CONSTANTS.ADMIN_MENTOR_REPORTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS],
        },
      },
      {
        Icon: Bell,
        label: "Session Disputes",
        href: PATH_CONSTANTS.ADMIN_SESSION_DISPUTES,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN],
        },
      },
    ],
  },

  // ── Resume Review ───────────────────────────────────────────────────────
  {
    title: "Resume Review",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_ALL_RESUME_REVIEWS,
        PERMISSIONS.PERM_MANAGE_RESUME_PLANS,
        PERMISSIONS.PERM_VIEW_RESUME_ANALYTICS,
      ],
    },
    items: [
      {
        Icon: ClipboardCheck,
        label: "All Reviews",
        href: PATH_CONSTANTS.ADMIN_RESUME_REVIEWS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_RESUME_REVIEWS],
        },
      },
      {
        Icon: Tag,
        label: "Plans",
        href: PATH_CONSTANTS.ADMIN_RESUME_REVIEW_PLANS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_RESUME_PLANS],
        },
      },
      {
        Icon: BarChart3,
        label: "Analytics",
        href: PATH_CONSTANTS.ADMIN_RESUME_REVIEW_ANALYTICS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_RESUME_ANALYTICS],
        },
      },
    ],
  },

  // ── Website Builder ───────────────────────────────────────────────────────
  {
    title: "Website Builder",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_MANAGE_TEMPLATES,
        PERMISSIONS.PERM_MANAGE_COMPONENTS,
        PERMISSIONS.PERM_VIEW_ALL_WEBSITES,
        PERMISSIONS.PERM_MANAGE_ALL_WEBSITES,
        PERMISSIONS.PERM_VIEW_ALL_SUBSCRIPTIONS,
        PERMISSIONS.PERM_MANAGE_PLATFORM_PRICING,
        PERMISSIONS.PERM_MANAGE_WATERMARK_CONFIG,
      ],
    },
    items: [
      {
        Icon: Globe,
        label: "Templates",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_TEMPLATES,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_TEMPLATES] },
      },
      {
        Icon: Package,
        label: "Components",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_COMPONENTS,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_COMPONENTS] },
      },
      {
        Icon: Tag,
        label: "Pricing",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_PRICING,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PLATFORM_PRICING] },
      },
      {
        Icon: Settings,
        label: "Watermark",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_WATERMARK,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_WATERMARK_CONFIG] },
      },
      {
        Icon: Link2,
        label: "All Websites",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_WEBSITES,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_WEBSITES] },
      },
      {
        Icon: CreditCard,
        label: "Subscriptions",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_SUBSCRIPTIONS,
        access: { anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_SUBSCRIPTIONS] },
      },
      {
        Icon: BarChart3,
        label: "Platform Stats",
        href: PATH_CONSTANTS.ADMIN_WEBSITE_STATS,
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },

  // ── Payments Admin ────────────────────────────────────────────────────────
  {
    title: "Payments",
    access: {
      anyOf: [
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_VIEW_ALL_PAYMENTS,
        PERMISSIONS.PERM_MANAGE_PAYOUTS,
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
        Icon: Wallet,
        label: "Payouts",
        href: PATH_CONSTANTS.ADMIN_PAYOUTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PAYOUTS],
        },
      },
      {
        Icon: Wallet,
        label: "Mentor Wallets",
        href: PATH_CONSTANTS.ADMIN_WALLETS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PAYOUTS],
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

  // ── Hiring Management (future) ────────────────────────────────────────────
  {
    title: "Hiring",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: Briefcase,
        label: "Job Listings",
        href: "/hiring/listings",
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
      {
        Icon: UserPlus,
        label: "Candidate Pipeline",
        href: "/hiring/pipeline",
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },

  // ── Content (future) ──────────────────────────────────────────────────────
  {
    title: "Content",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: FileText,
        label: "Pages & Posts",
        href: "/content/pages",
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },

  // ── Analytics (future) ────────────────────────────────────────────────────
  {
    title: "Analytics",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: BarChart3,
        label: "Platform Analytics",
        href: "/analytics",
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
      },
    ],
  },

  // ── System (future) ───────────────────────────────────────────────────────
  {
    title: "System",
    access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
    items: [
      {
        Icon: Settings,
        label: "Configuration",
        href: "/system/config",
        access: { allOf: [PERMISSIONS.ROLE_ADMIN] },
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

