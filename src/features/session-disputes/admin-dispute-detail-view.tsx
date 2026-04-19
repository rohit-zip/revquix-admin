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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: DisputeStatus) {
  const map: Record<DisputeStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    OPEN: { variant: "destructive", label: "Open" },
    UNDER_REVIEW: { variant: "secondary", label: "Under Review" },
    RESOLVED_COMPLETED: { variant: "outline", label: "Resolved — Completed" },
    RESOLVED_NO_SHOW_USER: { variant: "outline", label: "Resolved — No Show (User)" },
    RESOLVED_NO_SHOW_MENTOR: { variant: "outline", label: "Resolved — No Show (Mentor)" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
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

  const handleResolve = () => {
    resolveDisputeMutation.mutate({
      disputeId,
      request: {
        resolution: selectedResolution,
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
            <p className="text-xs text-muted-foreground">Raised By</p>
            <Badge variant="outline" className="mt-1">
              <User className="h-3 w-3 mr-1" />
              {dispute.raisedByRole}
            </Badge>
          </div>
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
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            {dispute.userResponded ? (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-muted-foreground">
                {dispute.userResponded ? "Said: Session did NOT happen" : "No response yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            {dispute.mentorResponded ? (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">Mentor</p>
              <p className="text-xs text-muted-foreground">
                {dispute.mentorResponded ? "Said: Session did NOT happen" : "No response yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                value={selectedResolution}
                onValueChange={(v) => setSelectedResolution(v as DisputeResolution)}
                className="space-y-3"
              >
                {DISPUTE_RESOLUTION_OPTIONS.map((option) => (
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
