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
  Building2,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderTree,
  History,
  Inbox,
  Image as ImageIcon,
  Key,
  LayoutDashboard,
  type LucideIcon,
  Newspaper,
  Package,
  PanelBottom,
  Send,
  Settings,
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
import { EDITORIAL_ENABLED } from "@/core/constants/feature-flags"

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

  // ── Marketing / Lead Generation ─────────────────────────────────────────────
  PERM_SEND_LEAD_MAIL: "PERM_SEND_LEAD_MAIL",

  // ── Content / Assets ───────────────────────────────────────────────────────
  PERM_MANAGE_ASSETS: "PERM_MANAGE_ASSETS",

  // ── News / Editorial ───────────────────────────────────────────────────────
  PERM_WRITE_EDITORIAL: "PERM_WRITE_EDITORIAL",
  PERM_MANAGE_EDITORIAL: "PERM_MANAGE_EDITORIAL",

  // ── Skill Registry (Skill-only taxonomy migration) ──────────────────────────
  PERM_MANAGE_SKILL_REGISTRY: "PERM_MANAGE_SKILL_REGISTRY",

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
        PERMISSIONS.PERM_MANAGE_PAYOUTS,
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
        Icon: Tag,
        label: "All Coupons",
        href: PATH_CONSTANTS.ADMIN_COUPONS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_COUPONS],
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
      {
        Icon: Users,
        label: "All Mentors",
        href: PATH_CONSTANTS.ADMIN_PROFESSIONAL_MENTORS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS],
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
        Icon: BarChart3,
        label: "Payout Reports",
        href: PATH_CONSTANTS.ADMIN_PAYOUT_REPORTS,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_PAYOUTS],
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
  // The whole section is env-gated by EDITORIAL_ENABLED.
  ...(EDITORIAL_ENABLED
    ? [
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
      ]
    : []),

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
        Icon: Send,
        label: "Lead Mailer",
        href: PATH_CONSTANTS.ADMIN_LEAD_MAIL,
        access: {
          anyOf: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL],
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

