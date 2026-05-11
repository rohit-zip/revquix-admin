/**
 * ─── USER MENTOR REPORT TAB ─────────────────────────────────────────────────
 *
 * Full performance report for a professional mentor, embedded in the admin
 * user-detail page as its own "Mentor Report" tab.
 *
 * Sections:
 *   1. Session Overview  — Total / Completed / Cancelled / No-Shows
 *   2. Join Rate         — progress bar, sessions with join event
 *   3. Ratings           — average, total count, star distribution
 *   4. Google Calendar   — connected status, OAuth vs manual sessions, adoption %
 */

"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  BarChart2,
  Star,
  UserX,
  Video,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { getMentorReport } from "@/features/professional-mentor/api/admin-reports.api"

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserMentorReportTabProps {
  userId: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  iconClassName?: string
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn("size-4", iconClassName)} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-3xl font-bold tracking-tight">{value}</span>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserMentorReportTab({ userId }: UserMentorReportTabProps) {
  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["mentor-report", userId],
    queryFn: () => getMentorReport(userId),
    staleTime: 2 * 60 * 1000, // 2 min — performance data doesn't need to be real-time
    retry: 1,
  })

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionSkeleton />
        <div className="grid md:grid-cols-2 gap-4">
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-full" /></CardContent></Card>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !report) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <AlertCircle className="size-10 text-destructive mb-3" />
          <p className="font-medium">Could not load mentor report</p>
          <p className="text-sm text-muted-foreground mt-1">
            The report API may be unavailable, or this mentor has no data yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const joinRate = report.mentorJoinRatePercent ?? 0
  const avgRating = report.averageRating ?? 0
  const totalRatings = report.totalRatingsReceived ?? 0
  const distribution = report.ratingDistribution ?? {}

  return (
    <div className="space-y-6">
      {/* ── 1. Session Overview ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="size-4" />
            Session Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Calendar}
              label="Total Sessions"
              value={report.totalSessions}
              iconClassName="text-blue-500"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={report.completedSessions}
              iconClassName="text-emerald-500"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled"
              value={report.cancelledSessions}
              iconClassName="text-red-500"
            />
            <StatCard
              icon={AlertCircle}
              label="No-Shows"
              value={report.noShowSessions}
              iconClassName="text-amber-500"
            />
          </div>

          {/* Completion rate bar */}
          {report.totalSessions > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Completion rate</span>
                <span className="font-medium text-foreground">
                  {((report.completedSessions / report.totalSessions) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={(report.completedSessions / report.totalSessions) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2 & 3. Join Rate + Ratings ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Join Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="size-4" />
              Join Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {report.sessionsWithMentorJoinEvent} of {report.totalSessions} sessions joined
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    joinRate >= 90
                      ? "text-emerald-600"
                      : joinRate >= 70
                      ? "text-amber-600"
                      : "text-red-600",
                  )}
                >
                  {joinRate.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={joinRate}
                className={cn(
                  "h-3",
                  joinRate >= 90
                    ? "[&>div]:bg-emerald-500"
                    : joinRate >= 70
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-red-500",
                )}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
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
              {report.totalSessions === 0 && (
                <Badge variant="secondary" className="text-xs">No sessions yet</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ratings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="size-4" />
              Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalRatings === 0 ? (
              <p className="text-sm text-muted-foreground">No ratings received yet.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">/ 5.0</span>
                  <span className="text-sm text-muted-foreground ml-1">({totalRatings} ratings)</span>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] ?? 0
                    const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-muted-foreground shrink-0">{star} ★</span>
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="w-8 text-right text-muted-foreground shrink-0">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Google Calendar Integration ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {report.googleCalendarConnected ? (
              <Wifi className="size-4 text-emerald-500" />
            ) : (
              <WifiOff className="size-4 text-muted-foreground" />
            )}
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Connection Status</span>
            {report.googleCalendarConnected ? (
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
            <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
              <span className="text-xs text-muted-foreground">OAuth Sessions</span>
              <span className="text-xl font-semibold">{report.oauthMeetingSessions}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
              <span className="text-xs text-muted-foreground">Manual Sessions</span>
              <span className="text-xl font-semibold">{report.manualMeetingSessions}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
              <span className="text-xs text-muted-foreground">OAuth Adoption</span>
              <span className="text-xl font-semibold">{(report.oauthAdoptionPercent ?? 0).toFixed(1)}%</span>
            </div>
          </div>

          {report.oauthMeetingSessions + report.manualMeetingSessions > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>OAuth vs Manual sessions</span>
                <span className="font-medium text-foreground">
                  {(report.oauthAdoptionPercent ?? 0).toFixed(1)}% via OAuth
                </span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${report.oauthAdoptionPercent ?? 0}%` }}
                />
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${100 - (report.oauthAdoptionPercent ?? 0)}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-emerald-500" />
                  OAuth (Calendar integration)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-amber-400" />
                  Manual link
                </span>
              </div>
            </div>
          )}

          {!report.googleCalendarConnected && (
            <p className="text-xs text-muted-foreground border border-amber-500/30 bg-amber-500/5 rounded-md px-3 py-2">
              This mentor has not connected Google Calendar. Meeting links are created manually. Encourage them to connect via their dashboard settings.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 5. No-Show breakdown ─────────────────────────────────────────── */}
      {report.noShowSessions > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <UserX className="size-4" />
              No-Show Flag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This mentor has <strong>{report.noShowSessions}</strong> no-show session{report.noShowSessions > 1 ? "s" : ""}
              {report.totalSessions > 0 && (
                <> ({((report.noShowSessions / report.totalSessions) * 100).toFixed(1)}% of all sessions)</>
              )}
              . Review their booking history if this count is high.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
