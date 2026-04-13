"use client"

import { ShieldCheck, Users, Video, CreditCard, Activity } from "lucide-react"
import { useAuthorization } from "@/hooks/useAuthorization"
import { useAuth } from "@/hooks/useAuth"
import { PERMISSIONS } from "@/config/dashboard/nav.config"

/**
 * ─── ADMIN DASHBOARD OVERVIEW ────────────────────────────────────────────────
 *
 * Landing page for the revquix-admin application.
 * Displays a personalised welcome message and a quick-access card grid.
 * Cards are authority-filtered — each user only sees the sections they can access.
 */

interface QuickAccessCard {
  title: string
  description: string
  href: string
  Icon: React.ElementType
  requiredAny: string[]
}

const QUICK_ACCESS_CARDS: QuickAccessCard[] = [
  {
    title: "Users",
    description: "Manage platform users, roles, and permissions",
    href: "/users",
    Icon: Users,
    requiredAny: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_USERS],
  },
  {
    title: "Roles & Permissions",
    description: "Define and assign roles with fine-grained permissions",
    href: "/roles",
    Icon: ShieldCheck,
    requiredAny: [
      PERMISSIONS.ROLE_ADMIN,
      PERMISSIONS.PERM_MANAGE_ROLES,
      PERMISSIONS.PERM_MANAGE_PERMISSIONS,
    ],
  },
  {
    title: "Mock Interview Bookings",
    description: "Review and manage all mock interview sessions",
    href: "/mock-bookings",
    Icon: Video,
    requiredAny: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_MOCK_BOOKINGS],
  },
  {
    title: "All Payments",
    description: "Track platform-wide transactions and revenue",
    href: "/payments",
    Icon: CreditCard,
    requiredAny: [PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_VIEW_ALL_PAYMENTS],
  },
  {
    title: "Mentor Applications",
    description: "Review and approve professional mentor applications",
    href: "/mentor-applications",
    Icon: Activity,
    requiredAny: [
      PERMISSIONS.ROLE_ADMIN,
      PERMISSIONS.PERM_VIEW_MENTOR_APPLICATIONS,
      PERMISSIONS.PERM_MANAGE_PROFESSIONAL_MENTORS,
    ],
  },
]

export default function AdminDashboardPage() {
  const { user, currentUser } = useAuth()
  const { hasAnyAuthority } = useAuthorization()

  const displayName = currentUser?.name ?? user?.username ?? user?.email ?? "Admin"

  const visibleCards = QUICK_ACCESS_CARDS.filter((card) =>
    hasAnyAuthority(card.requiredAny),
  )

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{displayName}</span>.
          You have access to {visibleCards.length} admin section{visibleCards.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* ── Quick access cards ── */}
      {visibleCards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => {
            const CardIcon = card.Icon
            return (
              <a
                key={card.href}
                href={card.href}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <CardIcon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              </a>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 py-20 text-center">
          <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No sections available</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
            Your account does not have permissions to access any admin sections.
            Contact your system administrator.
          </p>
        </div>
      )}
    </div>
  )
}

