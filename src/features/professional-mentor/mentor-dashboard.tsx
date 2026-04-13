/**
 * ─── MENTOR DASHBOARD ────────────────────────────────────────────────────────
 *
 * Overview dashboard for professional mentors showing stats, earnings, and quick actions.
 */

"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Calendar,
  CreditCard,
  Package,
  Star,
  User,
  Video,
  Wallet,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useMentorProfile, useProfessionalSlotStats } from "./api/professional-mentor.hooks"
import { CentralizedBanner, BannerItem } from "@/components/centralized-banner"
import { getCalendarStatus, GoogleCalendarStatus } from "./api/google-calendar.api"
import { GoogleCalendarCard } from "./google-calendar-card"

export default function MentorDashboard() {
  const { data: profile, isLoading: profileLoading } = useMentorProfile()
  const { data: stats, isLoading: statsLoading } = useProfessionalSlotStats()
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus | null>(null)
  const searchParams = useSearchParams()

  const isLoading = profileLoading || statsLoading

  // Fetch Google Calendar connection status
  useEffect(() => {
    getCalendarStatus()
      .then(setCalendarStatus)
      .catch(() => {}) // Silently fail if not a mentor
  }, [])

  // Build dynamic banners
  const banners: BannerItem[] = []

  // Banner: Google Calendar not connected
  if (calendarStatus && !calendarStatus.connected) {
    banners.push({
      id: "google-calendar-connect",
      type: "info",
      message: "Connect your Google Calendar to automatically generate Google Meet links for new bookings.",
      action: {
        label: "Connect",
        onClick: () => {
          const settingsSection = document.getElementById("google-calendar-section")
          settingsSection?.scrollIntoView({ behavior: "smooth" })
        },
      },
    })
  }

  // Banner: Google Calendar requires re-auth
  if (calendarStatus?.requiresReauth) {
    banners.push({
      id: "google-calendar-reauth",
      type: "warning",
      message: "Your Google Calendar connection needs to be re-authorized. Please reconnect.",
      dismissible: false,
      action: {
        label: "Reconnect",
        onClick: () => {
          const settingsSection = document.getElementById("google-calendar-section")
          settingsSection?.scrollIntoView({ behavior: "smooth" })
        },
      },
    })
  }

  // Banner: Calendar just connected (from callback redirect)
  const calendarParam = searchParams.get("google_calendar")
  if (calendarParam === "connected") {
    banners.push({
      id: "google-calendar-success",
      type: "success",
      message: "Google Calendar connected successfully! Future bookings will automatically include Google Meet links.",
    })
  } else if (calendarParam === "error") {
    banners.push({
      id: "google-calendar-error",
      type: "error",
      message: "Failed to connect Google Calendar. Please try again.",
    })
  }

  const quickActions = [
    { icon: Calendar, label: "Open Slots", href: PATH_CONSTANTS.PROFESSIONAL_MENTOR_SLOTS },
    { icon: Video, label: "My Bookings", href: PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS },
    { icon: Package, label: "Coupons", href: PATH_CONSTANTS.PROFESSIONAL_MENTOR_COUPONS },
    { icon: User, label: "Edit Profile", href: PATH_CONSTANTS.PROFESSIONAL_MENTOR_PROFILE },
    { icon: Wallet, label: "Payouts", href: PATH_CONSTANTS.PROFESSIONAL_MENTOR_PAYOUTS },
  ]

  return (
    <div className="space-y-6">
      {/* Centralized Banners */}
      <CentralizedBanner banners={banners} />

      <div>
        <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
        <p className="text-muted-foreground">
          {profile ? `Welcome back, ${profile.userName}!` : "Loading your dashboard..."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Rating",
            value: profile ? (profile.averageRating > 0 ? profile.averageRating.toFixed(1) : "New") : "—",
            icon: Star,
            subtitle: `${profile?.totalReviews ?? 0} reviews`,
          },
          {
            label: "Sessions",
            value: profile?.totalSessions ?? 0,
            icon: Video,
            subtitle: "total completed",
          },
          {
            label: "Available Slots",
            value: stats?.totalAvailable ?? 0,
            icon: Calendar,
            subtitle: `${stats?.totalBooked ?? 0} booked`,
          },
          {
            label: "Pricing",
            value: profile?.priceInrPaise ? `₹${(profile.priceInrPaise / 100).toLocaleString()}` : "Not set",
            icon: CreditCard,
            subtitle: profile?.priceUsdCents ? `$${(profile.priceUsdCents / 100).toFixed(2)}` : "",
          },
        ].map(({ label, value, icon: Icon, subtitle }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <p className="text-xl font-bold">{value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profile Status</CardTitle>
              <Badge variant={profile.isAcceptingBookings ? "default" : "secondary"}>
                {profile.isAcceptingBookings ? "Accepting Bookings" : "Not Accepting"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Headline</p>
                <p className="text-sm font-medium">{profile.headline}</p>
              </div>
              {profile.currentCompany && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="text-sm font-medium">
                    {profile.currentRole ? `${profile.currentRole} at ` : ""}
                    {profile.currentCompany}
                  </p>
                </div>
              )}
            </div>

            {/* Onboarding checklist */}
            {(!profile.priceInrPaise || !profile.resumeUrl || stats?.totalOpened === 0) && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <p className="mb-2 text-sm font-medium">Complete your setup:</p>
                <ul className="space-y-1 text-sm">
                  <li className={profile.priceInrPaise ? "line-through text-muted-foreground" : ""}>
                    {profile.priceInrPaise ? "✅" : "☐"} Set your pricing
                  </li>
                  <li className={profile.resumeUrl ? "line-through text-muted-foreground" : ""}>
                    {profile.resumeUrl ? "✅" : "☐"} Upload your resume
                  </li>
                  <li className={stats?.totalOpened ? "line-through text-muted-foreground" : ""}>
                    {stats?.totalOpened ? "✅" : "☐"} Open your first slot
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {quickActions.map(({ icon: Icon, label, href }) => (
              <Button key={href} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link href={href}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <div id="google-calendar-section">
        <GoogleCalendarCard />
      </div>
    </div>
  )
}

