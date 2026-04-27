/**
 * ─── BOOKING DETAIL VIEW ─────────────────────────────────────────────────────
 *
 * Full detail view for a single mock interview booking.
 * Shows all booking info, intake details, payment details, cancellation info,
 * refund status, feedback, and no-show alerts.
 */

"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingDown,
  Upload,
  User,
  UserX,
  Video,
  Wallet,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { useMockBookingDetail, useCancelMockBooking, useRefundPolicy, useCancellationPreview } from "./api/mock-interview.hooks"
import type { MockInterviewBookingResponse, MockInterviewBookingStatus } from "./api/mock-interview.types"
import { EXPERIENCE_LEVEL_OPTIONS, FOCUS_AREA_OPTIONS } from "./api/mock-interview.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { JoinMeetingButton } from "@/components/join-meeting-button"
import { submitFeedback, getFeedback } from "@/features/book-slot/api/booking-search.api"
import type { FeedbackResponse } from "@/features/book-slot/api/booking-search.types"
import { forceCompleteMeeting, completeMeeting } from "@/features/book-slot/api/meeting.api"
import { useAuthorization } from "@/hooks/useAuthorization"
import { usePayoutByBooking } from "@/features/professional-mentor/api/professional-mentor.hooks"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: MockInterviewBookingStatus, isMentorView = false) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
    PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment", icon: <Clock className="h-3 w-3" /> },
    CONFIRMED: { variant: "default", label: "Confirmed", icon: <CheckCircle2 className="h-3 w-3" /> },
    IN_PROGRESS: { variant: "default", label: "In Progress", icon: <Video className="h-3 w-3" /> },
    COMPLETED: { variant: "outline", label: "Completed", icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED_BY_USER: {
      variant: "destructive",
      label: isMentorView ? "Cancelled by User" : "Cancelled by You",
      icon: <XCircle className="h-3 w-3" />,
    },
    CANCELLED_BY_MENTOR: {
      variant: "destructive",
      label: isMentorView ? "Cancelled by You" : "Cancelled by Mentor",
      icon: <XCircle className="h-3 w-3" />,
    },
    NO_SHOW_USER: {
      variant: "destructive",
      label: isMentorView ? "User No Show" : "No Show (You)",
      icon: <UserX className="h-3 w-3" />,
    },
    NO_SHOW_MENTOR: {
      variant: "destructive",
      label: isMentorView ? "You Did Not Show" : "Mentor No Show",
      icon: <UserX className="h-3 w-3" />,
    },
    PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed", icon: <AlertCircle className="h-3 w-3" /> },
    EXPIRED: { variant: "outline", label: "Expired", icon: <Clock className="h-3 w-3" /> },
  }
  const info = map[status] ?? { variant: "outline" as const, label: status, icon: null }
  return (
    <Badge variant={info.variant} className="flex items-center gap-1">
      {info.icon}
      {info.label}
    </Badge>
  )
}

function getPaymentStatusBadge(status: string | null) {
  if (!status) return null
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    CREATED: { variant: "secondary", label: "Order Created" },
    AUTHORIZED: { variant: "secondary", label: "Authorized" },
    CAPTURED: { variant: "default", label: "Paid" },
    FAILED: { variant: "destructive", label: "Payment Failed" },
    REFUND_INITIATED: { variant: "outline", label: "Refund Initiated" },
    REFUNDED: { variant: "outline", label: "Refunded" },
    PARTIALLY_REFUNDED: { variant: "outline", label: "Partially Refunded" },
  }
  const info = map[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function formatShortDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}


// ─── Star Rating Component ───────────────────────────────────────────────────

function StarRating({ value, onChange, readOnly = false }: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            className={`size-5 ${(hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Feedback Section (User only) ────────────────────────────────────────────

function FeedbackSection({
  booking,
  isMentorView = false,
}: {
  booking: MockInterviewBookingResponse
  isMentorView?: boolean
}) {
  // This section is exclusively for the user (booking owner).
  // Mentors have their own detailed feedback flow — never show this to them.
  if (isMentorView) return null
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<FeedbackResponse | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(true)

  useEffect(() => {
    if (!booking.sessionId) {
      setLoadingFeedback(false)
      return
    }
    getFeedback(booking.sessionId)
      .then(setExistingFeedback)
      .catch(() => { /* 404 — no feedback yet */ })
      .finally(() => setLoadingFeedback(false))
  }, [booking.sessionId])

  if (booking.status !== "COMPLETED") return null

  if (loadingFeedback) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Loading feedback…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (existingFeedback) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/30 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Your Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StarRating value={existingFeedback.rating} readOnly />
          {existingFeedback.comment && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingFeedback.comment}</p>
          )}
          <Badge variant="secondary" className="text-xs gap-1">
            <CheckCircle2 className="size-3" /> Submitted on {formatShortDate(existingFeedback.submittedAt)}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit() {
    if (!booking.sessionId || rating === 0) return
    setSubmitting(true)
    try {
      const fb = await submitFeedback(booking.sessionId, { rating, comment: comment || undefined })
      setExistingFeedback(fb)
      toast.success("Thank you for your feedback!")
    } catch {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          How was your session?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your feedback helps improve the quality of mock interviews for everyone.
        </p>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Rating</Label>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Comment (optional)</Label>
          <Textarea
            placeholder="Share your experience, what went well, and what could be improved…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? <><Loader2 className="size-3 animate-spin mr-1" /> Submitting…</> : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Admin / Mentor Complete Meeting Section ─────────────────────────────────

function CompleteMeetingSection({ booking }: { booking: MockInterviewBookingResponse }) {
  const { hasAnyAuthority } = useAuthorization()
  const isAdmin = hasAnyAuthority(["ROLE_ADMIN"])
  const isMentor = hasAnyAuthority(["ROLE_PROFESSIONAL_MENTOR"])
  const [adminNote, setAdminNote] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [completing, setCompleting] = useState(false)
  const [forceCompleteDialogOpen, setForceCompleteDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

  if (!["CONFIRMED", "IN_PROGRESS"].includes(booking.status) || !booking.sessionId) return null
  if (!isAdmin && !isMentor) return null

  async function handleForceComplete() {
    if (!booking.sessionId) return
    setCompleting(true)
    try {
      await forceCompleteMeeting(booking.sessionId, adminNote || undefined)
      toast.success("Meeting force-completed successfully.")
      setForceCompleteDialogOpen(false)
      window.location.reload()
    } catch {
      toast.error("Failed to force-complete meeting.")
    } finally {
      setCompleting(false)
    }
  }

  async function handleComplete() {
    if (!booking.sessionId) return
    setCompleting(true)
    try {
      await completeMeeting(booking.sessionId, screenshot ?? undefined, note || undefined)
      toast.success("Meeting marked as completed.")
      setCompleteDialogOpen(false)
      window.location.reload()
    } catch {
      toast.error("Failed to complete meeting. A screenshot may be required.")
    } finally {
      setCompleting(false)
    }
  }

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Complete Meeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isMentor && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Mark this session as completed. A screenshot of the meeting interface is required as proof.
                </p>
              </div>
              <Button size="sm" onClick={() => setCompleteDialogOpen(true)}>
                <Upload className="mr-2 h-3 w-3" />
                Complete with Screenshot
              </Button>
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin: Force-complete without screenshot.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setForceCompleteDialogOpen(true)}>
                Force Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mentor Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Meeting</DialogTitle>
            <DialogDescription>
              Upload a screenshot of the meeting interface as proof of completion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Screenshot (required)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any notes about this session…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={completing || !screenshot}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Force Complete Dialog */}
      <Dialog open={forceCompleteDialogOpen} onOpenChange={setForceCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Complete Meeting</DialogTitle>
            <DialogDescription>
              This will mark the meeting as completed without requiring a screenshot.
              Use this when the scheduler failed or the mentor cannot complete it manually.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Admin Note (optional)</Label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Reason for force-completing…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleForceComplete} disabled={completing}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Force Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Mentor Earnings Section ─────────────────────────────────────────────────

function MentorEarningsSection({
  bookingId,
}: {
  bookingId: string
}) {
  const { data: payout, isLoading, isError } = usePayoutByBooking(bookingId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Loading earnings…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError || !payout) {
    // No payout exists yet (e.g. booking cancelled before payment, or pending)
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No payout record found for this booking. This typically means the session was not paid for or was cancelled before payment was captured.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/30 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Your Earnings for this Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {/* Gross (booking amount) */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booking Amount</span>
            <span>{formatAmount(payout.grossAmountMinor, payout.currency)}</span>
          </div>

          {/* Platform fee */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              Platform Fee ({payout.commissionPercentage}%)
            </span>
            <span className="text-destructive">
              -{formatAmount(payout.platformFeeMinor, payout.currency)}
            </span>
          </div>

          {/* GST on platform fee */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST on Platform Fee</span>
            <span className="text-muted-foreground">
              {payout.gstAmountMinor != null && payout.gstAmountMinor > 0
                ? `-${formatAmount(payout.gstAmountMinor, payout.currency)}`
                : `${payout.currency === "INR" ? "₹" : "$"}0 (0%)`}
            </span>
          </div>

          <Separator />

          {/* Net payout */}
          <div className="flex justify-between font-semibold">
            <span>You Receive</span>
            <span className="text-green-600 dark:text-green-400">
              {formatAmount(payout.payoutAmountMinor, payout.currency)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Payout status */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payout Status</span>
          <Badge
            variant={
              payout.status === "COMPLETED"
                ? "default"
                : payout.status === "FAILED"
                  ? "destructive"
                  : "secondary"
            }
            className="text-xs"
          >
            {payout.status === "PENDING" && "Pending"}
            {payout.status === "PROCESSING" && "Processing"}
            {payout.status === "COMPLETED" && "Paid Out"}
            {payout.status === "FAILED" && "Failed"}
            {payout.status === "ON_HOLD" && "On Hold"}
          </Badge>
        </div>
        {payout.paidAt && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid On</span>
            <span className="text-xs">{formatShortDate(payout.paidAt)}</span>
          </div>
        )}
        {payout.adminNote && (
          <p className="text-xs text-muted-foreground italic">{payout.adminNote}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Payouts are processed after the session is completed and verified.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BookingDetailViewProps {
  bookingId: string
  /** Path to navigate back to. Defaults to mock interview my bookings. */
  backPath?: string
  /** Label for the back button. Defaults to "My Bookings". */
  backLabel?: string
  /** If true, hide the cancel button (e.g. for mentor view). */
  hideCancelAction?: boolean
  /** If true, show mentor-specific actions (submit feedback CTA). */
  isMentorView?: boolean
}

export default function BookingDetailView({
  bookingId,
  backPath = PATH_CONSTANTS.MOCK_INTERVIEW_MY_BOOKINGS,
  backLabel = "My Bookings",
  hideCancelAction = false,
  isMentorView = false,
}: BookingDetailViewProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [reasonError, setReasonError] = useState(false)

  const { data: booking, isLoading, isError } = useMockBookingDetail(bookingId)

  const cancelMutation = useCancelMockBooking(() => {
    setCancelDialogOpen(false)
    setCancelReason("")
    setReasonError(false)
  })

  // ── Refund data fetched from backend ─────────────────────────────────────
  // Policy tiers: long-lived cache (1 hr), used for the sidebar card + policy table
  const { data: refundPolicy, isLoading: isLoadingPolicy } = useRefundPolicy()

  // Real-time cancellation preview: fetched only when the dialog is open
  const {
    data: cancellationPreview,
    isLoading: isLoadingPreview,
  } = useCancellationPreview(bookingId, cancelDialogOpen)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Booking Not Found</AlertTitle>
        <AlertDescription>
          This booking does not exist or you do not have permission to view it.
          <br />
          <Button variant="link" className="p-0 h-auto mt-2" asChild>
            <Link href={backPath}>← Back to {backLabel}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const isCancelled = booking.status === "CANCELLED_BY_USER" || booking.status === "CANCELLED_BY_MENTOR"
  const isNoShow = booking.status === "NO_SHOW_USER" || booking.status === "NO_SHOW_MENTOR"
  const isRefunded = booking.paymentStatus === "REFUNDED"
  const isRefundInitiated = booking.paymentStatus === "REFUND_INITIATED"
  const isPartiallyRefunded = booking.paymentStatus === "PARTIALLY_REFUNDED"
  const hasRefund = isRefunded || isRefundInitiated || isPartiallyRefunded
  const canCancel = !hideCancelAction && ["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)

  // Helper to resolve experience level label
  const experienceLevelLabel = booking.experienceLevel
    ? EXPERIENCE_LEVEL_OPTIONS.find((o) => o.value === booking.experienceLevel)?.label ?? booking.experienceLevel
    : null

  // Helper to resolve focus area labels
  const focusAreaLabels = booking.focusAreas
    ? booking.focusAreas.map(
        (area) => FOCUS_AREA_OPTIONS.find((o) => o.value === area)?.label ?? area.replace(/_/g, " ")
      )
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">{booking.bookingId}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(booking.status, isMentorView)}
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Alert */}
      {isCancelled && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Booking Cancelled</AlertTitle>
          <AlertDescription>
            {booking.status === "CANCELLED_BY_USER"
              ? isMentorView
                ? "The user cancelled this booking."
                : "You cancelled this booking."
              : isMentorView
                ? "You cancelled this booking."
                : "The mentor cancelled this booking."}
            {booking.cancelledAt && (
              <span className="ml-1">({formatShortDate(booking.cancelledAt)})</span>
            )}
            {booking.cancellationReason && (
              <p className="mt-1">Reason: {booking.cancellationReason}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* No-Show Alert */}
      {isNoShow && (
        <Alert variant="destructive" className={
          booking.status === "NO_SHOW_MENTOR"
            ? "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-100"
            : ""
        }>
          <UserX className="h-4 w-4" />
          <AlertTitle>
            {booking.status === "NO_SHOW_USER"
              ? isMentorView ? "User Did Not Show Up" : "You Missed This Session"
              : isMentorView ? "You Did Not Show Up" : "Mentor Did Not Show Up"}
          </AlertTitle>
          <AlertDescription>
            {booking.status === "NO_SHOW_USER" ? (
              isMentorView ? (
                <>
                  The user did not join this session within 30 minutes of the scheduled start time.
                  The session was scheduled for <strong>{formatDate(booking.slotStartUtc)}</strong>.
                  <p className="mt-2 text-xs">
                    Contact support if you believe this is incorrect: <span className="font-mono">{booking.bookingId}</span>
                  </p>
                </>
              ) : (
                <>
                  This session was marked as a no-show because you did not join the meeting within 30 minutes of the
                  scheduled start time. The session was scheduled for <strong>{formatDate(booking.slotStartUtc)}</strong>.
                  <p className="mt-2 text-xs">
                    If you believe this is an error, please contact support with your booking ID: <span className="font-mono">{booking.bookingId}</span>
                  </p>
                </>
              )
            ) : (
              isMentorView ? (
                <>
                  This session was marked as a no-show because you did not join within the expected time.
                  The session was scheduled for <strong>{formatDate(booking.slotStartUtc)}</strong>.
                  <p className="mt-2 text-xs">
                    Please contact support if you believe this is an error: <span className="font-mono">{booking.bookingId}</span>
                  </p>
                </>
              ) : (
                <>
                  The mentor did not join this session within the expected time.
                  The session was scheduled for <strong>{formatDate(booking.slotStartUtc)}</strong>.
                  <p className="mt-2 text-xs">
                    A full refund has been initiated for this booking. If you haven&apos;t received it,
                    please contact support with your booking ID: <span className="font-mono">{booking.bookingId}</span>
                  </p>
                </>
              )
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Refund Alert — only shown to the user (not mentor) */}
      {!isMentorView && hasRefund && (
        <Alert className={isRefunded ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : ""}>
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>
            {isRefunded ? "Refund Processed" : isPartiallyRefunded ? "Partial Refund Processed" : "Refund Initiated"}
          </AlertTitle>
          <AlertDescription>
            {isRefunded || isPartiallyRefunded ? (
              <>
                Your refund of <strong>{formatAmount(booking.refundAmountMinor, booking.currency)}</strong> has been
                processed{booking.refundedAt && ` on ${formatShortDate(booking.refundedAt)}`}.
                {booking.refundAmountMinor != null && booking.finalAmountMinor > 0 && booking.refundAmountMinor < booking.finalAmountMinor && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    This is a partial refund ({Math.round((booking.refundAmountMinor / booking.finalAmountMinor) * 100)}% of {formatAmount(booking.finalAmountMinor, booking.currency)}) based on cancellation timing.
                  </span>
                )}
                {booking.razorpayRefundId && (
                  <span className="block mt-1 font-mono text-xs">Refund ID: {booking.razorpayRefundId}</span>
                )}
                <p className="mt-1 text-xs">Refunds typically appear in your account within 5-7 business days.</p>
              </>
            ) : (
              <>
                A refund of <strong>{formatAmount(booking.refundAmountMinor, booking.currency)}</strong> has been
                initiated and is being processed by Razorpay.
                {booking.refundAmountMinor != null && booking.finalAmountMinor > 0 && booking.refundAmountMinor < booking.finalAmountMinor && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    This is a partial refund ({Math.round((booking.refundAmountMinor / booking.finalAmountMinor) * 100)}% of {formatAmount(booking.finalAmountMinor, booking.currency)}) based on cancellation timing.
                  </span>
                )}
                {booking.razorpayRefundId && (
                  <span className="block mt-1 font-mono text-xs">Refund ID: {booking.razorpayRefundId}</span>
                )}
                <p className="mt-1 text-xs">It typically takes 5-7 business days to process.</p>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cancelled with no refund alert — only for user */}
      {!isMentorView && isCancelled && !hasRefund && booking.paymentStatus === "CAPTURED" && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Refund</AlertTitle>
          <AlertDescription>
            This booking was cancelled less than 6 hours before the session.
            As per our refund policy, no refund is applicable for cancellations within 6 hours of the session.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Mentor</p>
                  <p className="font-medium">{booking.mentorName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{booking.durationMinutes} minutes</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Scheduled Date & Time</p>
                  <p className="font-medium">{formatDate(booking.slotStartUtc)}</p>
                </div>
              </div>

              {booking.sessionId && booking.status === "CONFIRMED" && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <JoinMeetingButton
                    sessionId={booking.sessionId}
                    allowedJoinAt={booking.allowedJoinAt}
                    meetingUrlPending={booking.meetingUrlPending}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Meeting Section (mentor/admin) */}
          <CompleteMeetingSection booking={booking} />

          {/* Mentor Earnings Section — shown instead of payment details */}
          {isMentorView && (
            <MentorEarningsSection bookingId={booking.bookingId} />
          )}

          {/* Feedback Section — user-only (hidden from mentor view) */}
          <FeedbackSection booking={booking} isMentorView={isMentorView} />

          {/* Mentor Feedback Actions (shown for COMPLETED bookings) */}
          {booking.status === "COMPLETED" && (
            <>
              {/* Mentor: Submit / View Detailed Feedback CTA */}
              {isMentorView && !booking.feedbackSubmitted && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Submit Detailed Feedback
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Provide comprehensive feedback for <strong>{booking.userName}</strong> including scores, section-wise analysis, strengths, and improvement plan.
                        </p>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link href={`${PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS}/${booking.bookingId}/feedback`}>
                          Submit Feedback →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mentor: Already submitted → view link */}
              {isMentorView && booking.feedbackSubmitted && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2 text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Detailed Feedback Submitted
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          You have submitted detailed feedback for this session.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`${PATH_CONSTANTS.MOCK_INTERVIEW_MY_BOOKINGS}/${booking.bookingId}/feedback`}>
                          View Feedback Report →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User: View mentor feedback (if submitted) */}
              {!isMentorView && booking.feedbackSubmitted && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-blue-400" />
                          Mentor Feedback Available
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your mentor has submitted a detailed feedback report for this session. View your scores, strengths, improvement areas, and more.
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`${PATH_CONSTANTS.MOCK_INTERVIEW_MY_BOOKINGS}/${booking.bookingId}/feedback`}>
                          View Full Report →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Intake Details */}
          {(booking.description || booking.targetCompany || booking.targetRole || booking.experienceLevel || (booking.focusAreas && booking.focusAreas.length > 0) || booking.additionalNotes || booking.linkedinUrl || booking.githubUrl || booking.resumeUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Interview Preparation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{booking.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {booking.targetCompany && (
                    <div>
                      <p className="text-xs text-muted-foreground">Target Company</p>
                      <p className="text-sm font-medium">{booking.targetCompany}</p>
                    </div>
                  )}
                  {booking.targetRole && (
                    <div>
                      <p className="text-xs text-muted-foreground">Target Role</p>
                      <p className="text-sm font-medium">{booking.targetRole}</p>
                    </div>
                  )}
                  {experienceLevelLabel && (
                    <div>
                      <p className="text-xs text-muted-foreground">Experience Level</p>
                      <p className="text-sm font-medium">{experienceLevelLabel}</p>
                    </div>
                  )}
                </div>

                {focusAreaLabels.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusAreaLabels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {booking.additionalNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{booking.additionalNotes}</p>
                  </div>
                )}

                {(booking.linkedinUrl || booking.githubUrl || booking.resumeUrl) && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-3">
                      {booking.resumeUrl && (
                        <Button size="sm" variant="outline" className="gap-2" asChild>
                          <a href={booking.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3.5 w-3.5" />
                            View Resume
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {booking.linkedinUrl && (
                        <Button size="sm" variant="outline" className="gap-2" asChild>
                          <a href={booking.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            LinkedIn Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {booking.githubUrl && (
                        <Button size="sm" variant="outline" className="gap-2" asChild>
                          <a href={booking.githubUrl} target="_blank" rel="noopener noreferrer">
                            GitHub Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Details — hidden from mentor (they see earnings section instead) */}
          {!isMentorView && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount</span>
                  <span>{formatAmount(booking.originalAmountMinor, booking.currency)}</span>
                </div>
                {booking.discountAmountMinor > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount{booking.couponCode ? ` (${booking.couponCode})` : ""}
                    </span>
                    <span className="text-green-600">
                      -{formatAmount(booking.discountAmountMinor, booking.currency)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Amount Paid</span>
                  <span>{formatAmount(booking.finalAmountMinor, booking.currency)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  {getPaymentStatusBadge(booking.paymentStatus)}
                </div>
                {booking.paymentOrderId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono text-xs">{booking.paymentOrderId}</span>
                  </div>
                )}
                {booking.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Razorpay Order</span>
                    <span className="font-mono text-xs">{booking.razorpayOrderId}</span>
                  </div>
                )}
                {booking.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs">{booking.razorpayPaymentId}</span>
                  </div>
                )}
                {booking.paymentOrderId && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                      <Link href={`/payments/history/${booking.paymentOrderId}`}>
                        <CreditCard className="h-3.5 w-3.5" />
                        View Payment Details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Refund section */}
              {hasRefund && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-sm flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Refund Information
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refund Status</span>
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refund Amount</span>
                      <span className="font-semibold text-green-600">
                        {formatAmount(booking.refundAmountMinor, booking.currency)}
                      </span>
                    </div>
                    {booking.refundAmountMinor != null && booking.finalAmountMinor > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Refund Percentage</span>
                        <span className="text-xs">
                          {Math.round((booking.refundAmountMinor / booking.finalAmountMinor) * 100)}% of paid amount
                        </span>
                      </div>
                    )}
                    {booking.razorpayRefundId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Refund ID</span>
                        <span className="font-mono text-xs">{booking.razorpayRefundId}</span>
                      </div>
                    )}
                    {booking.refundedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Refunded On</span>
                        <span className="text-xs">{formatShortDate(booking.refundedAt)}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Booking Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Booking Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Booking ID</p>
                <p className="font-mono text-xs">{booking.bookingId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium">{booking.userName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booked On</p>
                <p>{formatShortDate(booking.createdAt)}</p>
              </div>
              {booking.sessionId && (
                <div>
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="font-mono text-xs">{booking.sessionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refund Policy Info — sidebar card, only for user */}
          {!isMentorView && !hideCancelAction && (booking.status === "CONFIRMED" || booking.status === "PENDING_PAYMENT") && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold mb-2">Cancellation &amp; Refund Policy</p>
                {isLoadingPolicy ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                ) : refundPolicy ? (
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {refundPolicy.tiers.map((tier) => (
                      <li key={tier.hoursBefore}>
                        {"• "}
                        {tier.refundPercentage === 0 ? (
                          <>{tier.label.split(":")[0]}: <strong className="text-destructive">No refund</strong></>
                        ) : (
                          <>{tier.label.split(":")[0]}: <strong>{tier.refundPercentage}% refund</strong></>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• 24+ hours before: <strong>90% refund</strong></li>
                    <li>• 12–24 hours before: <strong>70% refund</strong></li>
                    <li>• 6–12 hours before: <strong>50% refund</strong></li>
                    <li>• Less than 6 hours: <strong className="text-destructive">No refund</strong></li>
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReasonError(false)
            setCancelReason("")
          }
          setCancelDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Mock Interview</DialogTitle>
            <DialogDescription>
              {isMentorView
                ? "Are you sure you want to cancel this session? The student will be notified and a full refund will be initiated automatically."
                : "Are you sure you want to cancel this booking?"}
            </DialogDescription>
          </DialogHeader>

          {/* Real-time Refund Estimate — from backend (user view only) */}
          {!isMentorView && (isLoadingPreview ? (
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-5 w-full" />
              </div>
              <Skeleton className="h-3 w-5/6" />
            </div>
          ) : cancellationPreview ? (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Refund Estimate</p>
              {cancellationPreview.sessionAlreadyStarted ? (
                <p className="text-sm text-destructive">
                  This session has already started. No refund is applicable.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium">{cancellationPreview.paidAmountDisplay}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refund Percentage</span>
                    <span className="font-medium">{cancellationPreview.refundPercentage}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Estimated Refund</span>
                    <span className={cancellationPreview.refundEligible ? "text-green-600" : "text-destructive"}>
                      {cancellationPreview.refundAmountDisplay}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{cancellationPreview.applicableTierLabel}</p>
            </div>
          ) : null)}

          {/* Full Policy Table — shown only for user cancellations */}
          {!isMentorView && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3">
              <p className="text-xs font-semibold mb-2">Cancellation Policy</p>
              {isLoadingPolicy ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ) : refundPolicy ? (
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  {refundPolicy.tiers.map((tier) => {
                    const [timePart] = tier.label.split(":")
                    return (
                      <React.Fragment key={tier.hoursBefore}>
                        <span>{timePart}:</span>
                        {tier.refundPercentage === 0 ? (
                          <span className="font-medium text-destructive">No refund</span>
                        ) : (
                          <span className="font-medium text-foreground">{tier.refundPercentage}% refund</span>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>24+ hours before:</span><span className="font-medium text-foreground">90% refund</span>
                  <span>12–24 hours before:</span><span className="font-medium text-foreground">70% refund</span>
                  <span>6–12 hours before:</span><span className="font-medium text-foreground">50% refund</span>
                  <span>Less than 6 hours:</span><span className="font-medium text-destructive">No refund</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Reason {isMentorView ? <span className="text-destructive">*</span> : "(optional)"}
            </Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value)
                if (isMentorView && e.target.value.trim()) setReasonError(false)
              }}
              placeholder={
                isMentorView
                  ? "Please provide a reason for cancelling. This will be shared with the student."
                  : "Why are you cancelling?"
              }
              rows={3}
              className={reasonError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {reasonError && (
              <p className="text-xs text-destructive">
                A reason is required when cancelling as a mentor.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReasonError(false)
                setCancelReason("")
                setCancelDialogOpen(false)
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (isMentorView && !cancelReason.trim()) {
                  setReasonError(true)
                  return
                }
                cancelMutation.mutate({
                  bookingId: booking.bookingId,
                  reason: cancelReason.trim() || undefined,
                })
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

