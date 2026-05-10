"use client"

import {
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  Gavel,
  Lock,
  Mail,
  Megaphone,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useNotificationPreferencesSchema,
  useSaveNotificationPreference,
} from "../api/notifications.hooks"
import type { NotificationCategory, NotificationCategorySchema } from "../api/notifications.types"

// ─── Category icon + colour config ───────────────────────────────────────────

type CategoryVisual = {
  Icon: React.ElementType
  bg: string
  text: string
}

const CATEGORY_VISUAL: Record<NotificationCategory, CategoryVisual> = {
  BOOKINGS:           { Icon: Calendar,   bg: "bg-blue-100 dark:bg-blue-950",       text: "text-blue-600 dark:text-blue-400" },
  PAYMENTS:           { Icon: CreditCard, bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400" },
  MOCK_INTERVIEWS:    { Icon: Video,      bg: "bg-violet-100 dark:bg-violet-950",   text: "text-violet-600 dark:text-violet-400" },
  HOURLY_SESSIONS:    { Icon: Calendar,   bg: "bg-sky-100 dark:bg-sky-950",         text: "text-sky-600 dark:text-sky-400" },
  DISPUTES:           { Icon: Gavel,      bg: "bg-red-100 dark:bg-red-950",         text: "text-red-600 dark:text-red-400" },
  MENTOR_APPLICATION: { Icon: UserCheck,  bg: "bg-indigo-100 dark:bg-indigo-950",   text: "text-indigo-600 dark:text-indigo-400" },
  MENTOR_EARNINGS:    { Icon: Wallet,     bg: "bg-teal-100 dark:bg-teal-950",       text: "text-teal-600 dark:text-teal-400" },
  MENTOR_STATUS:      { Icon: TrendingUp, bg: "bg-orange-100 dark:bg-orange-950",   text: "text-orange-600 dark:text-orange-400" },
  PLATFORM:           { Icon: Megaphone,   bg: "bg-pink-100 dark:bg-pink-950",       text: "text-pink-600 dark:text-pink-400" },
  SOCIAL:             { Icon: Users,        bg: "bg-purple-100 dark:bg-purple-950",   text: "text-purple-600 dark:text-purple-400" },
  OFFER_ORDERS:       { Icon: ShoppingBag,  bg: "bg-amber-100 dark:bg-amber-950",     text: "text-amber-600 dark:text-amber-400" },
}

const DEFAULT_VISUAL: CategoryVisual = {
  Icon: Sparkles,
  bg: "bg-muted",
  text: "text-muted-foreground",
}

// ─── Required badge ───────────────────────────────────────────────────────────

function RequiredBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Lock className="h-2.5 w-2.5" />
      Required
    </span>
  )
}

// ─── Single preference row ────────────────────────────────────────────────────

interface PreferenceRowProps {
  schema: NotificationCategorySchema
  onToggle: (inApp: boolean, email: boolean) => void
  isSaving: boolean
}

function PreferenceRow({ schema, onToggle, isSaving }: PreferenceRowProps) {
  const { category, label, description, canDisableInApp, canDisableEmail, currentPreference } =
    schema

  const visual = CATEGORY_VISUAL[category] ?? DEFAULT_VISUAL
  const { Icon } = visual

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40">
      {/* Category icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          visual.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", visual.text)} />
      </div>

      {/* Label + description */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {/* In-app column */}
      <div className="flex w-24 shrink-0 justify-center">
        {canDisableInApp ? (
          <Switch
            checked={currentPreference.inApp}
            onCheckedChange={(checked) => onToggle(checked, currentPreference.email)}
            disabled={isSaving}
            size="sm"
            aria-label={`${label} in-app notifications`}
          />
        ) : (
          <RequiredBadge />
        )}
      </div>

      {/* Email column */}
      <div className="flex w-24 shrink-0 justify-center">
        {canDisableEmail ? (
          <Switch
            checked={currentPreference.email}
            onCheckedChange={(checked) => onToggle(currentPreference.inApp, checked)}
            disabled={isSaving}
            size="sm"
            aria-label={`${label} email notifications`}
          />
        ) : (
          <RequiredBadge />
        )}
      </div>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function PreferenceSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-60" />
      </div>
      <div className="flex w-24 justify-center">
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
      <div className="flex w-24 justify-center">
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationPreferences() {
  const { data: schema, isLoading, isError } = useNotificationPreferencesSchema()
  const { mutate: save, isPending: isSaving } = useSaveNotificationPreference()

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BellOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Failed to load preferences</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          We couldn&apos;t fetch your notification settings. Please refresh the page and try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Choose how you&apos;d like to be notified for each category.{" "}
          <span className="font-medium text-foreground">In-app</span> shows alerts in the bell
          icon. <span className="font-medium text-foreground">Email</span> delivers updates to
          your inbox. Categories marked{" "}
          <span className="inline-flex items-center gap-1 align-middle font-medium text-foreground">
            <Lock className="h-3 w-3" />
            Required
          </span>{" "}
          cannot be turned off.
        </p>
      </div>

      {/* Preferences card */}
      <div className="overflow-hidden rounded-lg border">
        {/* Column header row */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-2.5">
          <div className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </div>
          <div className="flex w-24 shrink-0 items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" />
            In-app
          </div>
          <div className="flex w-24 shrink-0 items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Email
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <PreferenceSkeleton key={i} />)}

          {!isLoading &&
            schema?.map((entry) => (
              <PreferenceRow
                key={entry.category}
                schema={entry}
                isSaving={isSaving}
                onToggle={(inApp, email) =>
                  save({ category: entry.category, inApp, email })
                }
              />
            ))}
        </div>
      </div>
    </div>
  )
}
