/**
 * ─── USER PROFESSIONAL MENTOR TAB (MERGED) ────────────────────────────────────
 *
 * Single consolidated tab shown on the admin user-detail page when the user has
 * ROLE_PROFESSIONAL_MENTOR.  Replaces the old split between "Professional Mentor"
 * and "Mentor Report" tabs.
 *
 * Sections:
 *   1. Profile & Services   — headline, bio, company, role, experience, categories,
 *                             skills, active/accepting toggles, pricing
 *   2. Session Analytics    — volume (mock vs hourly split), performance rates
 *                             (completion / repeat-booking / slot-utilisation),
 *                             cancellations breakdown, disputes & no-shows
 *   3. Feedback & Join Rate — avg turnaround (profile), join-rate bar (report)
 *   4. Ratings              — combined summary + per-type (mock / hourly)
 *   5. Revenue              — mock, hourly, total gross revenue
 *   6. Google Calendar      — connection status, OAuth vs manual session split
 *   7. Payout & Commission  — wallet balances, commission rate, link to wallet
 *   8. Payout Accounts      — registered bank / UPI with verify button
 *
 * Data sources
 *   • useMentorProfileByUserId → profile + denormalised analytics counters
 *   • getMentorReport           → join rate, Google Calendar, rating distributions
 *   • useMentorWallet           → wallet balances / commission
 *   • usePayoutAccountsForMentor → payout accounts
 */

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  BarChart2,
  ShieldCheck,
  Star,
  Tag,
  Timer,
  User,
  Video,
  Wallet,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { useMentorProfileByUserId } from "@/features/professional-mentor/api/professional-mentor.hooks"
import { useMentorWallet, usePayoutAccountsForMentor, useVerifyPayoutAccount } from "@/features/payment/api/payment.hooks"
import { getMentorReport } from "@/features/professional-mentor/api/admin-reports.api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0 w-44">{label}</span>
      <div className="text-sm font-medium text-right flex-1">{children}</div>
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: "green" | "red" | "amber" | "blue" | "default"
}) {
  const accentClass =
    accent === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "red"
      ? "text-red-600 dark:text-red-400"
      : accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : ""
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-semibold", accentClass)}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

function RatingBlock({
  label,
  avg,
  total,
  distribution,
}: {
  label: string
  avg: number
  total: number
  distribution: Record<number, number>
}) {
  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ratings yet.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{avg.toFixed(1)}</span>
          <span className="text-muted-foreground text-sm">/ 5.0</span>
          <span className="text-xs text-muted-foreground ml-1">({total})</span>
        </div>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0
            const p = (count / total) * 100
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-7 text-muted-foreground shrink-0">{star} ★</span>
                <Progress value={p} className="h-1.5 flex-1" />
                <span className="w-6 text-right text-muted-foreground shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfessionalMentorTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfessionalMentorTab({ userId }: UserProfessionalMentorTabProps) {
  const router = useRouter()

  const { data: profile, isLoading: profileLoading } = useMentorProfileByUserId(userId)
  const { data: wallet, isLoading: walletLoading } = useMentorWallet(userId)
  const { data: accounts, isLoading: accountsLoading } = usePayoutAccountsForMentor(userId)
  const { mutate: verifyAccount, isPending: verifying } = useVerifyPayoutAccount()

  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
  } = useQuery({
    queryKey: ["mentor-report", userId],
    queryFn: () => getMentorReport(userId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  // ── Loading (profile is the primary data source) ─────────────────────────
  if (profileLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // ── No profile ────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <User className="size-10 text-muted-foreground mb-3" />
          <p className="font-medium">No mentor profile found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This user has not created a professional mentor profile yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const joinRate = report?.mentorJoinRatePercent ?? 0
  const combinedAvg = report?.averageRating ?? profile.averageRating
  const combinedTotal = report?.totalRatingsReceived ?? profile.totalReviews
  const combinedDist = report?.ratingDistribution ?? {}
  const totalCancellations =
    (profile.totalMentorCancellations ?? 0) + (profile.totalUserCancellations ?? 0)

  return (
    <div className="space-y-6">

      {/* ── 1. Profile & Services ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Profile & Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 divide-y divide-border">
          <DetailRow label="Headline">{profile.headline || "—"}</DetailRow>
          <DetailRow label="Company">
            <span className="flex items-center gap-1.5 justify-end">
              <Building2 className="size-3.5 text-muted-foreground" />
              {profile.currentCompany || "—"}
            </span>
          </DetailRow>
          <DetailRow label="Role">{profile.currentRole || "—"}</DetailRow>
          <DetailRow label="Experience">
            {profile.yearsOfExperience != null ? `${profile.yearsOfExperience} yrs` : "—"}
          </DetailRow>
          <DetailRow label="Bio">
            <span className="text-left block text-muted-foreground">{profile.bio || "—"}</span>
          </DetailRow>
          <DetailRow label="Status">
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Badge variant={profile.isActive ? "default" : "secondary"} className="text-xs">
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={profile.isAcceptingBookings ? "default" : "secondary"} className="text-xs">
                {profile.isAcceptingBookings ? "Accepting Bookings" : "Not Accepting"}
              </Badge>
            </div>
          </DetailRow>
          <DetailRow label="Services">
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Badge variant={profile.isAcceptingMockInterviews ? "outline" : "secondary"} className="text-xs">
                <Video className="size-3 mr-1" />
                Mock {profile.isAcceptingMockInterviews ? "On" : "Off"}
              </Badge>
              <Badge variant={profile.isAcceptingHourlySessions ? "outline" : "secondary"} className="text-xs">
                <Briefcase className="size-3 mr-1" />
                Hourly {profile.isAcceptingHourlySessions ? "On" : "Off"}
              </Badge>
            </div>
          </DetailRow>
          <DetailRow label="Pricing">
            <div className="flex gap-3 flex-wrap justify-end text-xs">
              {profile.priceInrPaise != null && (
                <span>Mock: {formatInr(profile.priceInrPaise)}</span>
              )}
              {profile.hourlySessionPriceInrPaise != null && (
                <span>Hourly: {formatInr(profile.hourlySessionPriceInrPaise)}</span>
              )}
            </div>
          </DetailRow>
          {profile.categories.length > 0 && (
            <DetailRow label="Categories">
              <div className="flex flex-wrap gap-1 justify-end">
                {profile.categories.map((c) => (
                  <Badge key={c.categoryId} variant="secondary" className="text-xs">
                    <Tag className="size-3 mr-1" />
                    {c.name}
                  </Badge>
                ))}
              </div>
            </DetailRow>
          )}
          {profile.skills.length > 0 && (
            <DetailRow label="Skills">
              <div className="flex flex-wrap gap-1 justify-end">
                {profile.skills.map((s) => (
                  <Badge key={s.skillId} variant="outline" className="text-xs">{s.name}</Badge>
                ))}
              </div>
            </DetailRow>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Session Analytics ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="size-4" />
            Session Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Volume */}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Volume</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile label="Total Sessions" value={profile.totalSessions} accent="blue" />
              <StatTile label="Mock Interviews" value={profile.totalMockInterviews ?? 0} />
              <StatTile label="Hourly Sessions" value={profile.totalHourlySessions ?? 0} />
            </div>
          </div>

          <Separator />

          {/* Performance Rates */}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Performance Rates</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                <span className="text-xs text-muted-foreground">Completion Rate</span>
                <span className={cn(
                  "text-xl font-semibold",
                  (profile.completionRate ?? 0) >= 0.85 ? "text-emerald-600 dark:text-emerald-400"
                    : (profile.completionRate ?? 0) >= 0.65 ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
                )}>
                  {pct(profile.completionRate ?? 0)}
                </span>
                <Progress value={(profile.completionRate ?? 0) * 100} className="h-1.5" />
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                <span className="text-xs text-muted-foreground">Repeat Booking Rate</span>
                <span className="text-xl font-semibold">{pct(profile.repeatBookingRate ?? 0)}</span>
                <Progress value={(profile.repeatBookingRate ?? 0) * 100} className="h-1.5" />
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                <span className="text-xs text-muted-foreground">Slot Utilisation</span>
                <span className="text-xl font-semibold">{pct(profile.slotUtilizationRate ?? 0)}</span>
                <Progress value={(profile.slotUtilizationRate ?? 0) * 100} className="h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {profile.totalSlotsBooked ?? 0} / {profile.totalSlotsOpened ?? 0} slots
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cancellations */}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Cancellations</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Mentor Cancelled"
                value={profile.totalMentorCancellations ?? 0}
                accent={(profile.totalMentorCancellations ?? 0) > 5 ? "red" : "default"}
              />
              <StatTile label="User Cancelled" value={profile.totalUserCancellations ?? 0} />
              <StatTile
                label="Late Cancellations"
                value={profile.totalLateCancellations ?? 0}
                accent={(profile.totalLateCancellations ?? 0) > 3 ? "amber" : "default"}
              />
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                <span className="text-xs text-muted-foreground">Late Cancel Rate</span>
                <span className={cn(
                  "text-xl font-semibold",
                  (profile.lateCancellationRate ?? 0) > 0.2 ? "text-red-600 dark:text-red-400"
                    : (profile.lateCancellationRate ?? 0) > 0.1 ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}>
                  {pct(profile.lateCancellationRate ?? 0)}
                </span>
                {totalCancellations > 0 && (
                  <Progress
                    value={(profile.lateCancellationRate ?? 0) * 100}
                    className={cn(
                      "h-1.5",
                      (profile.lateCancellationRate ?? 0) > 0.2 ? "[&>div]:bg-red-500"
                        : (profile.lateCancellationRate ?? 0) > 0.1 ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-emerald-500",
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Disputes & No-Shows */}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Disputes & No-Shows</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile
                label="Total Disputes"
                value={profile.totalDisputesRaised ?? 0}
                accent={(profile.totalDisputesRaised ?? 0) > 3 ? "red" : "default"}
              />
              <StatTile
                label="Mentor No-Show"
                value={profile.totalNoShowMentor ?? 0}
                accent={(profile.totalNoShowMentor ?? 0) > 2 ? "red" : "default"}
              />
              <StatTile label="User No-Show" value={profile.totalNoShowUser ?? 0} />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── 3. Feedback & Join Rate ───────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Feedback Turnaround */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="size-4" />
              Feedback Turnaround
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.avgFeedbackTurnaroundHours != null ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {profile.avgFeedbackTurnaroundHours < 1
                      ? `${Math.round(profile.avgFeedbackTurnaroundHours * 60)} min`
                      : `${profile.avgFeedbackTurnaroundHours.toFixed(1)} h`}
                  </span>
                  <span className="text-sm text-muted-foreground">avg</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    profile.avgFeedbackTurnaroundHours <= 6
                      ? "border-emerald-500/50 text-emerald-600"
                      : profile.avgFeedbackTurnaroundHours <= 24
                      ? "border-amber-500/50 text-amber-600"
                      : "border-red-500/50 text-red-600",
                  )}
                >
                  {profile.avgFeedbackTurnaroundHours <= 6
                    ? "Excellent (≤ 6 h)"
                    : profile.avgFeedbackTurnaroundHours <= 24
                    ? "Good (≤ 24 h)"
                    : "Slow (> 24 h)"}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Join Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4" />
              Join Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : reportError ? (
              <p className="text-sm text-muted-foreground">Unavailable.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {report!.sessionsWithMentorJoinEvent} of {report!.totalSessions} sessions joined
                  </span>
                  <span className={cn(
                    "font-semibold",
                    joinRate >= 90 ? "text-emerald-600"
                      : joinRate >= 70 ? "text-amber-600"
                      : "text-red-600",
                  )}>
                    {joinRate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={joinRate}
                  className={cn(
                    "h-3",
                    joinRate >= 90 ? "[&>div]:bg-emerald-500"
                      : joinRate >= 70 ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-500",
                  )}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    joinRate >= 90 && "border-emerald-500/50 text-emerald-600",
                    joinRate >= 70 && joinRate < 90 && "border-amber-500/50 text-amber-600",
                    joinRate < 70 && "border-red-500/50 text-red-600",
                  )}
                >
                  {joinRate >= 90 ? "Excellent" : joinRate >= 70 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── 4. Ratings ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4" />
            Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {combinedTotal > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{combinedAvg.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">/ 5.0</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    ({combinedTotal} total ratings)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No ratings received yet.</p>
              )}
              {report && (
                <>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <RatingBlock
                      label="Mock Interview Ratings"
                      avg={report.mockAverageRating ?? 0}
                      total={report.mockTotalRatings ?? 0}
                      distribution={report.mockRatingDistribution ?? {}}
                    />
                    <RatingBlock
                      label="Hourly Session Ratings"
                      avg={report.hourlyAverageRating ?? 0}
                      total={report.hourlyTotalRatings ?? 0}
                      distribution={report.hourlyRatingDistribution ?? {}}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 5. Revenue ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="size-4" />
            Revenue (Gross)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile label="Mock Interview Revenue" value={formatInr(profile.totalMockRevenuePaise ?? 0)} />
            <StatTile label="Hourly Session Revenue" value={formatInr(profile.totalHourlyRevenuePaise ?? 0)} />
            <StatTile label="Total Revenue" value={formatInr(profile.totalRevenuePaise ?? 0)} accent="blue" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Gross booking amounts before platform commission. See{" "}
            <button
              className="underline underline-offset-2"
              onClick={() => router.push(`/wallets/${userId}`)}
            >
              wallet
            </button>{" "}
            for net earnings.
          </p>
        </CardContent>
      </Card>

      {/* ── 6. Google Calendar Integration ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {report?.googleCalendarConnected ? (
              <Wifi className="size-4 text-emerald-500" />
            ) : (
              <WifiOff className="size-4 text-muted-foreground" />
            )}
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : reportError ? (
            <p className="text-sm text-muted-foreground">Unavailable.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Connection Status</span>
                {report!.googleCalendarConnected ? (
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="size-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StatTile label="OAuth Sessions" value={report!.oauthMeetingSessions} accent="green" />
                <StatTile label="Manual Sessions" value={report!.manualMeetingSessions} />
                <StatTile label="OAuth Adoption" value={`${(report!.oauthAdoptionPercent ?? 0).toFixed(1)}%`} />
              </div>
              {report!.oauthMeetingSessions + report!.manualMeetingSessions > 0 && (
                <div className="space-y-1.5">
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${report!.oauthAdoptionPercent ?? 0}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${100 - (report!.oauthAdoptionPercent ?? 0)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full bg-emerald-500" />
                      OAuth (Calendar)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full bg-amber-400" />
                      Manual link
                    </span>
                  </div>
                </div>
              )}
              {!report!.googleCalendarConnected && (
                <p className="text-xs text-muted-foreground border border-amber-500/30 bg-amber-500/5 rounded-md px-3 py-2">
                  This mentor has not connected Google Calendar. Meeting links are created manually.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 7. Payout & Commission ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4" />
            Payout & Commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : wallet ? (
            <div className="space-y-1 divide-y divide-border">
              <DetailRow label="Commission Rate">
                {wallet.customCommissionPercentage != null
                  ? `${wallet.customCommissionPercentage}% (custom)`
                  : "Platform default"}
              </DetailRow>
              <DetailRow label="Pending Balance">
                {formatInr(wallet.pendingPayoutMinor + wallet.processingPayoutMinor)}
              </DetailRow>
              <DetailRow label="On Hold">{formatInr(wallet.onHoldPayoutMinor)}</DetailRow>
              <DetailRow label="Total Paid Out">{formatInr(wallet.totalPaidOutMinor)}</DetailRow>
              <DetailRow label="Total Earnings">{formatInr(wallet.totalEarningsMinor)}</DetailRow>
              <div className="pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => router.push(`/wallets/${userId}`)}
                >
                  <ExternalLink className="size-3.5" />
                  View Full Wallet
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No wallet found for this mentor.</p>
          )}
        </CardContent>
      </Card>

      {/* ── 8. Payout Accounts ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="size-4" />
            Payout Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.payoutAccountId}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {account.accountType === "UPI"
                          ? account.upiId
                          : account.displayName || account.bankName || "Bank Account"}
                      </span>
                      {account.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                      {account.isVerified ? (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/50 gap-1">
                          <CheckCircle2 className="size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <XCircle className="size-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    {account.accountType === "BANK_ACCOUNT" && (
                      <p className="text-xs text-muted-foreground">
                        {account.bankName} · ****{account.maskedAccountNumber} · {account.ifscCode}
                      </p>
                    )}
                    {account.accountType === "UPI" && (
                      <p className="text-xs text-muted-foreground">UPI ID: {account.upiId}</p>
                    )}
                  </div>
                  {!account.isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={verifying}
                      onClick={() => verifyAccount(account.payoutAccountId)}
                    >
                      <ShieldCheck className="size-3.5" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payout accounts registered.</p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
