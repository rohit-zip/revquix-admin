/**
 * ─── ADMIN DISPUTE DETAIL VIEW ────────────────────────────────────────────────
 *
 * Shows full detail of a single session dispute, including participant responses
 * and admin resolution form.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image,
  Loader2,
  Shield,
  User,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import {
  useDisputeDetail,
  useMarkUnderReview,
  useResolveDispute,
} from "./api/session-disputes.hooks"
import type { DisputeResolution, DisputeStatus } from "./api/session-disputes.types"
import {
  DISPUTE_RESOLUTION_OPTIONS,
  DISPUTE_STATUS,
} from "./api/session-disputes.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { getMeetingScreenshot } from "@/features/book-slot/api/meeting.api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: DisputeStatus) {
  const map: Record<DisputeStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    OPEN: { variant: "destructive", label: "Open" },
    UNDER_REVIEW: { variant: "secondary", label: "Under Review" },
    RESOLVED_COMPLETED: { variant: "outline", label: "Resolved — Completed" },
    RESOLVED_NO_SHOW_USER: { variant: "outline", label: "Resolved — No Show (User)" },
    RESOLVED_NO_SHOW_MENTOR: { variant: "outline", label: "Resolved — No Show (Mentor)" },
    RESOLVED_FEEDBACK_LATE: { variant: "outline", label: "Resolved — Late Feedback Accepted" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

/**
 * Renders the attendance response for a single party.
 *
 * | responded value | meaning                    | icon + label                    |
 * |-----------------|----------------------------|---------------------------------|
 * | null            | no response received yet   | ⏰ "No response yet"            |
 * | true            | party said session DID happen | ✓ "Said: Session DID happen"  |
 * | false           | party said session did NOT happen | ✗ "Said: Session did NOT happen" |
 */
function AttendanceResponseCell({
  label,
  responded,
}: {
  label: string
  responded: boolean | null
}) {
  const isNull = responded === null
  const isYes = responded === true
  // responded === false means "did NOT happen"

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      {isNull ? (
        <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
      ) : isYes ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {isNull
            ? "No response yet"
            : isYes
            ? "Said: Session DID happen"
            : "Said: Session did NOT happen"}
        </p>
      </div>
    </div>
  )
}

/**
 * Fetches and shows the mentor's completion screenshot (if any).
 */
function ScreenshotSection({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = React.useState(false)
  const [url, setUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)

  async function handleView() {
    setLoading(true)
    setError(false)
    try {
      const screenshotUrl = await getMeetingScreenshot(sessionId)
      window.open(screenshotUrl, "_blank", "noopener,noreferrer")
      setUrl(screenshotUrl)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Evidence Screenshot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Image className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            If the mentor uploaded a screenshot (either when completing or as dispute evidence), it can be viewed here.
          </p>
          {error && (
            <p className="text-xs text-destructive mt-1">No screenshot available for this session.</p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleView} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          View Screenshot
        </Button>
      </CardContent>
    </Card>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const RESOLVED_STATUSES: DisputeStatus[] = [
  DISPUTE_STATUS.RESOLVED_COMPLETED,
  DISPUTE_STATUS.RESOLVED_NO_SHOW_USER,
  DISPUTE_STATUS.RESOLVED_NO_SHOW_MENTOR,
  DISPUTE_STATUS.RESOLVED_FEEDBACK_LATE,
]

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminDisputeDetailViewProps {
  disputeId: string
}

export function AdminDisputeDetailView({ disputeId }: AdminDisputeDetailViewProps) {
  const router = useRouter()
  const { data: dispute, isLoading, isError } = useDisputeDetail(disputeId)
  const markUnderReviewMutation = useMarkUnderReview()
  const resolveDisputeMutation = useResolveDispute()

  const [selectedResolution, setSelectedResolution] = useState<DisputeResolution>("MARK_COMPLETED")
  const [adminNote, setAdminNote] = useState("")

  // Auto-select the appropriate default resolution when dispute data loads
  const defaultResolution = dispute?.disputeType === "FEEDBACK_NOT_SUBMITTED"
    ? "ACCEPT_LATE_FEEDBACK"
    : "MARK_COMPLETED"

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !dispute) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not load dispute details. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const isResolved = RESOLVED_STATUSES.includes(dispute.disputeStatus)
  // Use user-selected or the dispute-appropriate default
  const effectiveResolution = selectedResolution === "MARK_COMPLETED" && dispute.disputeType === "FEEDBACK_NOT_SUBMITTED"
    ? defaultResolution
    : selectedResolution

  const handleResolve = () => {
    resolveDisputeMutation.mutate({
      disputeId,
      request: {
        resolution: effectiveResolution,
        adminNote: adminNote.trim() || undefined,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_SESSION_DISPUTES)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Dispute {dispute.disputeId}</h1>
            {getStatusBadge(dispute.disputeStatus)}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Raised on {formatDate(dispute.createdAt)}
          </p>
        </div>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">User</p>
            <p className="font-medium text-sm">{dispute.userName ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{dispute.userEmail ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mentor</p>
            <p className="font-medium text-sm">{dispute.mentorName ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{dispute.mentorEmail ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Session Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Session ID</p>
            <p className="font-mono text-sm">{dispute.sessionId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booking ID</p>
            <p className="font-mono text-sm">{dispute.bookingId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booking Type</p>
            <p className="text-sm capitalize">{dispute.bookingType.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dispute Type</p>
            <Badge variant="outline" className="mt-1">
              {dispute.disputeType === "FEEDBACK_NOT_SUBMITTED" ? "Feedback Not Submitted" : "Attendance Dispute"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Raised By</p>
            <Badge variant="outline" className="mt-1">
              <User className="h-3 w-3 mr-1" />
              {dispute.raisedByRole ?? "System"}
            </Badge>
          </div>
          {dispute.disputeType === "FEEDBACK_NOT_SUBMITTED" && (
            <div>
              <p className="text-xs text-muted-foreground">Feedback Status</p>
              {dispute.feedbackSubmitted ? (
                <Badge className="mt-1 bg-green-100 text-green-700 border-green-200">
                  Submitted (late)
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-700 border-amber-200">
                  Not yet submitted
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participant Responses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Attendance Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <AttendanceResponseCell label="User" responded={dispute.userResponded} />
          <AttendanceResponseCell label="Mentor" responded={dispute.mentorResponded} />
        </CardContent>
      </Card>

      {/* Evidence Screenshot */}
      <ScreenshotSection sessionId={dispute.sessionId} />

      {/* Admin Note (if exists) */}
      {dispute.adminNote && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Admin Note</AlertTitle>
          <AlertDescription>{dispute.adminNote}</AlertDescription>
        </Alert>
      )}

      {/* Resolution Info */}
      {isResolved && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Resolved</AlertTitle>
          <AlertDescription>
            {dispute.resolvedAt ? `Resolved on ${formatDate(dispute.resolvedAt)}` : "This dispute has been resolved."}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      {!isResolved && (
        <>
          <Separator />

          {/* Mark Under Review */}
          {dispute.disputeStatus === DISPUTE_STATUS.OPEN && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => markUnderReviewMutation.mutate(disputeId)}
                disabled={markUnderReviewMutation.isPending}
              >
                {markUnderReviewMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Shield className="h-4 w-4 mr-2" />
                Mark as Under Review
              </Button>
              <p className="text-sm text-muted-foreground">
                Signals to participants that an admin is investigating.
              </p>
            </div>
          )}

          {/* Resolve Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resolve Dispute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Resolution choice */}
              <RadioGroup
                value={effectiveResolution}
                onValueChange={(v) => setSelectedResolution(v as DisputeResolution)}
                className="space-y-3"
              >
                {DISPUTE_RESOLUTION_OPTIONS
                  .filter((option) => {
                    // ACCEPT_LATE_FEEDBACK is only valid when:
                    // 1. The dispute type is FEEDBACK_NOT_SUBMITTED
                    // 2. The mentor has already submitted feedback (possibly late)
                    if (option.value === "ACCEPT_LATE_FEEDBACK") {
                      return dispute.disputeType === "FEEDBACK_NOT_SUBMITTED" && dispute.feedbackSubmitted === true
                    }
                    // For FEEDBACK_NOT_SUBMITTED disputes hide attendance options
                    if (dispute.disputeType === "FEEDBACK_NOT_SUBMITTED") {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      return (option.value as any) === "ACCEPT_LATE_FEEDBACK"
                    }
                    return true
                  })
                  .map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelectedResolution(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Admin note */}
              <div className="space-y-2">
                <Label htmlFor="admin-note">Admin Note (optional)</Label>
                <Textarea
                  id="admin-note"
                  placeholder="Add an internal note explaining your decision…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleResolve}
                disabled={resolveDisputeMutation.isPending}
                className="w-full"
              >
                {resolveDisputeMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Resolve Dispute
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
