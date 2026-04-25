"use client"

import {
  BarChart3,
  Bell,
  CheckCheck,
  Mail,
  Send,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminNotificationHistory } from "../api/notifications.hooks"
import { NOTIFICATION_CATEGORY, type NotificationCategory } from "../api/notifications.types"

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: string
}

function StatCard({ icon: Icon, label, value, sub, accent = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────

interface HBarProps {
  label: string
  count: number
  total: number
  color: string
}

function HBar({ label, count, total, color }: HBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {count.toLocaleString()} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  BOOKINGS: "Bookings & Sessions",
  PAYMENTS: "Payments & Refunds",
  RESUME_REVIEW: "Resume Reviews",
  MOCK_INTERVIEWS: "Mock Interviews",
  HOURLY_SESSIONS: "Hourly Sessions",
  DISPUTES: "Disputes",
  MENTOR_APPLICATION: "Mentor Applications",
  MENTOR_EARNINGS: "Mentor Earnings",
  MENTOR_STATUS: "Mentor Status",
  PLATFORM: "Platform Announcements",
}

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  BOOKINGS:           "bg-blue-500",
  PAYMENTS:           "bg-emerald-500",
  RESUME_REVIEW:      "bg-amber-500",
  MOCK_INTERVIEWS:    "bg-violet-500",
  HOURLY_SESSIONS:    "bg-sky-500",
  DISPUTES:           "bg-red-500",
  MENTOR_APPLICATION: "bg-indigo-500",
  MENTOR_EARNINGS:    "bg-teal-500",
  MENTOR_STATUS:      "bg-orange-500",
  PLATFORM:           "bg-pink-500",
}

// ─── Skeleton sections ────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationAnalytics() {
  // Fetch a large page to get representative stats
  const { data, isLoading, isError } = useAdminNotificationHistory(0, 500)

  if (isLoading) return <StatsSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Failed to load analytics</p>
        <p className="text-xs text-muted-foreground">Please refresh the page.</p>
      </div>
    )
  }

  const notifications = data?.content ?? []
  const total = data?.totalElements ?? 0
  const sample = notifications.length

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const readCount = notifications.filter((n) => n.read).length
  const emailCount = notifications.filter((n) => n.email).length
  const broadcastCount = notifications.filter((n) => !n.targetUserId).length
  const targetedCount = notifications.filter((n) => !!n.targetUserId).length

  const readRate = sample > 0 ? Math.round((readCount / sample) * 100) : 0
  const emailRate = sample > 0 ? Math.round((emailCount / sample) * 100) : 0

  // ── By category ────────────────────────────────────────────────────────────
  const byCategory = Object.values(NOTIFICATION_CATEGORY).map((cat) => ({
    cat,
    count: notifications.filter((n) => n.category === cat).length,
  })).sort((a, b) => b.count - a.count)

  // ── By type (top 8) ────────────────────────────────────────────────────────
  const typeMap = new Map<string, number>()
  for (const n of notifications) {
    typeMap.set(n.type, (typeMap.get(n.type) ?? 0) + 1)
  }
  const topTypes = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Sample note */}
      {sample < total && (
        <div className="flex items-center gap-2 rounded-lg border bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <Bell className="h-4 w-4 shrink-0" />
          Stats are computed from the most recent {sample.toLocaleString()} notifications out of{" "}
          {total.toLocaleString()} total.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Send}
          label="Total Sent"
          value={total.toLocaleString()}
          sub={`${sample.toLocaleString()} sampled`}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CheckCheck}
          label="Read Rate"
          value={`${readRate}%`}
          sub={`${readCount.toLocaleString()} of ${sample.toLocaleString()}`}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <StatCard
          icon={Mail}
          label="Email Delivered"
          value={`${emailRate}%`}
          sub={`${emailCount.toLocaleString()} of ${sample.toLocaleString()}`}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
        />
        <StatCard
          icon={Users}
          label="Broadcast"
          value={broadcastCount.toLocaleString()}
          sub={`${targetedCount.toLocaleString()} targeted`}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
        />
      </div>

      {/* Breakdown charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              By Category
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution across notification categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {byCategory.map(({ cat, count }) => (
              <HBar
                key={cat}
                label={CATEGORY_LABEL[cat]}
                count={count}
                total={sample}
                color={CATEGORY_COLORS[cat]}
              />
            ))}
          </CardContent>
        </Card>

        {/* By type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Top Notification Types
            </CardTitle>
            <CardDescription className="text-xs">
              Most frequently sent notification types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {topTypes.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
            )}
            {topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {type.replace(/_/g, " ")}
                </Badge>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${sample > 0 ? Math.round((count / (topTypes[0]?.[1] ?? 1)) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
