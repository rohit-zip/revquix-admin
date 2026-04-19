/**
 * ─── MENTOR APPLICATION STATUS ───────────────────────────────────────────────
 *
 * Displays current application status with appropriate badges, timeline,
 * and action buttons (apply/withdraw/reapply).
 */

"use client"

import React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  XCircle,
  Ban,
  AlertTriangle,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useMyApplication,
  useMyApplicationHistory,
  useWithdrawApplication,
} from "./api/mentor-application.hooks"
import type {
  MentorApplicationResponse,
  MentorApplicationStatus,
} from "./api/mentor-application.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: MentorApplicationStatus) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending Review
        </Badge>
      )
    case "APPROVED":
      return (
        <Badge className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      )
    case "PERMANENTLY_REJECTED":
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" /> Permanently Rejected
        </Badge>
      )
    case "WITHDRAWN":
      return (
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Withdrawn
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function canReapply(app: MentorApplicationResponse): boolean {
  if (app.status === "PERMANENTLY_REJECTED") return false
  if (app.status !== "REJECTED") return false
  return true
}

function getCooldownRemaining(_app: MentorApplicationResponse): string | null {
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorApplicationStatus() {
  const { data: app, isLoading } = useMyApplication()
  const { data: history } = useMyApplicationHistory()
  const withdrawMutation = useWithdrawApplication()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  // No application yet
  if (!app) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Become a Professional Mentor</CardTitle>
          <CardDescription>
            Share your interview expertise and earn by conducting paid mock interviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              You haven&apos;t applied yet. Start your journey as a professional mentor!
            </p>
            <Button asChild>
              <Link href={PATH_CONSTANTS.MENTOR_APPLICATION_APPLY}>Apply Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cooldown = getCooldownRemaining(app)

  return (
    <div className="space-y-6">
      {/* Current Application */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Application Status</CardTitle>
            {getStatusBadge(app.status)}
          </div>
          <CardDescription>
            Application #{app.attemptNumber} — Submitted {formatDate(app.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Headline</p>
              <p>{app.headline}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Experience</p>
              <p>{app.yearsOfExperience} years</p>
            </div>
            {app.currentCompany && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p>{app.currentCompany}</p>
              </div>
            )}
            {app.currentRole && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p>{app.currentRole}</p>
              </div>
            )}
          </div>

          {app.rejectionReason && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Rejection Reason</p>
              <p className="mt-1 text-sm">{app.rejectionReason}</p>
              {app.reviewedByName && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reviewed by {app.reviewedByName}
                  {app.reviewedAt && ` on ${formatDate(app.reviewedAt)}`}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {app.status === "PENDING" && (
              <Button
                variant="destructive"
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Withdraw Application
              </Button>
            )}

            {app.status === "REJECTED" && canReapply(app) && (
              <Button asChild>
                <Link href={PATH_CONSTANTS.MENTOR_APPLICATION_APPLY}>Reapply</Link>
              </Button>
            )}

            {app.status === "REJECTED" && cooldown && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Cooldown: {cooldown}
              </p>
            )}

            {app.status === "APPROVED" && (
              <Button asChild>
                <Link href={PATH_CONSTANTS.PROFESSIONAL_MENTOR}>Go to Mentor Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application History */}
      {history && history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.applicationId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">Attempt #{h.attemptNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                  </div>
                  {getStatusBadge(h.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

