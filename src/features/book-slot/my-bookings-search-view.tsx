/**
 * ─── MY BOOKINGS SEARCH VIEW ─────────────────────────────────────────────────
 *
 * Renders the booking search DataExplorer with column definitions,
 * status badges, and booking-specific formatting. Also includes
 * booking detail drawer and cancel booking functionality.
 */

"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useGenericSearch } from "@/core/filters"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import {
  searchMyBookings,
  cancelBooking,
  getBookingById,
  getCallCredits,
  submitFeedback,
  getFeedback,
} from "@/features/book-slot/api/booking-search.api"
import { BOOKING_FILTER_CONFIG } from "@/features/book-slot/api/booking-search.config"
import type {
  BookingCategory,
  BookingStatus,
  CallCreditsResponse,
  FeedbackResponse,
  MyBookingResponse,
} from "@/features/book-slot/api/booking-search.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  UserCircle,
  XCircle,
  AlertTriangle,
  Ban,
  Star,
  FileText,
  PhoneCall,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { JoinMeetingButton } from "@/components/join-meeting-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function categoryLabel(category: BookingCategory | null): string {
  if (!category) return "—"
  switch (category) {
    case "BUSINESS_STARTUP": return "Business Startup"
    case "PROFESSIONAL_DEVELOPER": return "Professional Developer"
    case "HIRING_RECRUITMENT": return "Hiring & Recruitment"
    default: return category
  }
}

function isWithin2Hours(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false
  return Date.now() > new Date(scheduledAt).getTime() - 2 * 60 * 60 * 1000
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" /> Confirmed
        </Badge>
      )
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <CheckCircle2 className="size-3" /> Completed
        </Badge>
      )
    case "CANCELLED_BY_USER":
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="size-3" /> Cancelled
        </Badge>
      )
    case "CANCELLED_BY_MENTOR":
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <Ban className="size-3" /> Cancelled by Mentor
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function isCancellable(status: BookingStatus): boolean {
  return status === "CONFIRMED"
}

// ─── Credit Counter Banner ────────────────────────────────────────────────────

function CreditCounterBanner({ credits }: { credits: CallCreditsResponse }) {
  const pct = Math.round((credits.used / credits.limit) * 100)
  const isLow = credits.remaining <= 1
  const isExhausted = credits.remaining === 0

  return (
    <Alert className={isExhausted ? "border-red-500/30 bg-red-50/40 dark:bg-red-900/10" : isLow ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10" : "border-border"}>
      <PhoneCall className="size-4" />
      <AlertDescription className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            <strong>{credits.used}</strong> of <strong>{credits.limit}</strong> free strategy calls used
            {credits.remaining > 0 && (
              <span className="text-muted-foreground"> · {credits.remaining} remaining</span>
            )}
          </span>
          {isExhausted && (
            <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
          )}
          {isLow && !isExhausted && (
            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">Last Credit</Badge>
          )}
        </div>
        <Progress value={pct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          Cancelling a booking <strong>more than 2 hours</strong> before start: no credit used.
          Cancelling <strong>within 2 hours</strong>: 1 credit consumed.
          {isExhausted && " Contact us to book additional sessions."}
        </p>
      </AlertDescription>
    </Alert>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange, readOnly = false }: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
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

// ─── Feedback Section ─────────────────────────────────────────────────────────

function FeedbackSection({
  booking,
  onFeedbackSubmitted,
}: {
  booking: MyBookingResponse
  onFeedbackSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<FeedbackResponse | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(true)

  useEffect(() => {
    if (!booking.sessionId || !booking.hasFeedback) {
      setLoadingFeedback(false)
      return
    }
    getFeedback(booking.sessionId)
      .then(setExistingFeedback)
      .catch(() => {/* 404 — no feedback yet */})
      .finally(() => setLoadingFeedback(false))
  }, [booking.sessionId, booking.hasFeedback])

  if (booking.status !== "COMPLETED") return null
  if (loadingFeedback) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading feedback…</div>

  if (existingFeedback) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Your Feedback</p>
        <StarRating value={existingFeedback.rating} readOnly />
        {existingFeedback.comment && (
          <p className="mt-2 text-sm text-muted-foreground">{existingFeedback.comment}</p>
        )}
        <Badge variant="secondary" className="mt-2 text-xs gap-1">
          <CheckCircle2 className="size-3" /> Submitted
        </Badge>
      </div>
    )
  }

  async function handleSubmit() {
    if (!booking.sessionId || rating === 0) return
    setSubmitting(true)
    try {
      const fb = await submitFeedback(booking.sessionId, { rating, comment: comment || undefined })
      setExistingFeedback(fb)
      toast.success("Thank you for your feedback!")
      onFeedbackSubmitted()
    } catch {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <p className="text-sm font-semibold">How was your session?</p>
      <StarRating value={rating} onChange={setRating} />
      <Textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
        {submitting ? <><Loader2 className="size-3 animate-spin mr-1" /> Submitting…</> : "Submit Feedback"}
      </Button>
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function buildColumns(
  onViewDetail: (booking: MyBookingResponse) => void,
  onCancelClick: (booking: MyBookingResponse) => void,
): DataColumn<MyBookingResponse>[] {
  return [
    {
      key: "bookingId",
      header: "Booking",
      render: (booking) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium font-mono">{booking.bookingId}</p>
          <p className="truncate text-xs text-muted-foreground">{categoryLabel(booking.category)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (booking) => <BookingStatusBadge status={booking.status} />,
    },
    {
      key: "mentorName",
      header: "Mentor",
      hideOnMobile: true,
      render: (booking) => (
        <div className="flex items-center gap-2">
          <UserCircle className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm">{booking.mentorName}</p>
            <p className="truncate text-xs text-muted-foreground">{booking.mentorEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled",
      hideOnMobile: true,
      render: (booking) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          <div>
            <p className="text-sm">{formatDateTime(booking.scheduledAt)}</p>
            {booking.durationMinutes > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> {booking.durationMinutes} min
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Booked On",
      sortable: true,
      hideOnMobile: true,
      render: (booking) => (
        <span className="text-xs text-muted-foreground">{formatDate(booking.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (booking) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetail(booking) }}>View</Button>
          {isCancellable(booking.status) && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onCancelClick(booking) }}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]
}

// ─── Booking Detail Dialog ────────────────────────────────────────────────────

function BookingDetailDialog({
  booking,
  open,
  onClose,
  onCancelClick,
  onRefresh,
}: {
  booking: MyBookingResponse | null
  open: boolean
  onClose: () => void
  onCancelClick: (booking: MyBookingResponse) => void
  onRefresh: () => void
}) {
  if (!booking) return null

  const showJoin = booking.sessionId && booking.status === "CONFIRMED"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking Details
            <span className="font-mono text-sm text-muted-foreground">{booking.bookingId}</span>
          </DialogTitle>
          <DialogDescription>Full details for this booking</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Category</span>
            <span className="text-sm text-muted-foreground">{categoryLabel(booking.category)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mentor</span>
            <div className="text-right">
              <p className="text-sm">{booking.mentorName}</p>
              <p className="text-xs text-muted-foreground">{booking.mentorEmail}</p>
            </div>
          </div>
          {booking.scheduledAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scheduled At</span>
              <div className="text-right">
                <p className="text-sm">{formatDateTime(booking.scheduledAt)}</p>
                {booking.durationMinutes > 0 && (
                  <p className="text-xs text-muted-foreground">{booking.durationMinutes} minutes</p>
                )}
              </div>
            </div>
          )}
          {booking.allowedJoinAt && showJoin && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Join Opens At</span>
              <span className="text-sm text-muted-foreground">{formatDateTime(booking.allowedJoinAt)}</span>
            </div>
          )}
          {showJoin && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Meeting</span>
              <JoinMeetingButton sessionId={booking.sessionId} allowedJoinAt={booking.allowedJoinAt} variant="icon" />
            </div>
          )}
          {booking.cancelledAt && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancelled At</span>
                <span className="text-sm text-muted-foreground">{formatDateTime(booking.cancelledAt)}</span>
              </div>
              {booking.cancellationReason && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Cancellation Reason</span>
                  <p className="text-sm text-muted-foreground rounded-md bg-muted p-2">{booking.cancellationReason}</p>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Booked On</span>
            <span className="text-sm text-muted-foreground">{formatDateTime(booking.createdAt)}</span>
          </div>

          {/* Meeting Outcome (MOM) — read-only for users */}
          {booking.status === "COMPLETED" && booking.meetingOutcome && (
            <div className="flex flex-col gap-1 border-t pt-3">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="size-3.5" /> Meeting Notes (MOM)
              </span>
              <p className="text-sm text-muted-foreground rounded-md bg-muted p-2 whitespace-pre-wrap">
                {booking.meetingOutcome}
              </p>
            </div>
          )}

          {/* Feedback Section */}
          {booking.status === "COMPLETED" && (
            <div className="border-t pt-3">
              <FeedbackSection booking={booking} onFeedbackSubmitted={onRefresh} />
            </div>
          )}
        </div>

        <DialogFooter>
          {isCancellable(booking.status) && (
            <Button variant="destructive" size="sm" onClick={() => { onClose(); onCancelClick(booking) }}>
              Cancel Booking
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cancel Booking Dialog ────────────────────────────────────────────────────

function CancelBookingDialog({
  booking,
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  booking: MyBookingResponse | null
  open: boolean
  onClose: () => void
  onConfirm: (bookingId: string, reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState("")
  if (!booking) return null

  const isLate = isWithin2Hours(booking.scheduledAt)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel booking{" "}
            <span className="font-mono font-medium">{booking.bookingId}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {isLate && (
          <Alert className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10">
            <AlertTriangle className="size-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <strong>Credit Notice:</strong> This meeting starts in less than 2 hours.
              Cancelling now will consume <strong>1 free call credit</strong>.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <label htmlFor="cancel-reason" className="text-sm font-medium mb-1.5 block">
            Reason (optional)
          </label>
          <Textarea
            id="cancel-reason"
            placeholder="Why are you cancelling this booking?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Keep Booking</Button>
          <Button variant="destructive" size="sm" disabled={isLoading} onClick={() => onConfirm(booking.bookingId, reason)}>
            {isLoading ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Cancelling…</> : "Cancel Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Component ───────────────────────────────────────────────────────────

export default function MyBookingsSearchView() {
  const queryClient = useQueryClient()
  const [detailBooking, setDetailBooking] = useState<MyBookingResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<MyBookingResponse | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [credits, setCredits] = useState<CallCreditsResponse | null>(null)

  // Load credits on mount
  useEffect(() => {
    getCallCredits().then(setCredits).catch(() => {/* ignore */})
  }, [])

  const search = useGenericSearch<MyBookingResponse>({
    queryKey: "my-booking-search",
    searchFn: searchMyBookings,
    config: BOOKING_FILTER_CONFIG,
  })

  const handleViewDetail = useCallback(async (booking: MyBookingResponse) => {
    try {
      const detail = await getBookingById(booking.bookingId)
      setDetailBooking(detail)
    } catch {
      setDetailBooking(booking)
    }
  }, [])

  const handleRefreshDetail = useCallback(async () => {
    if (detailBooking?.bookingId) {
      try {
        const detail = await getBookingById(detailBooking.bookingId)
        setDetailBooking(detail)
      } catch {/* ignore */}
    }
    await queryClient.invalidateQueries({ queryKey: ["my-booking-search"] })
  }, [detailBooking, queryClient])

  const handleCancelConfirm = useCallback(
    async (bookingId: string, reason: string) => {
      setIsCancelling(true)
      try {
        await cancelBooking(bookingId, reason ? { reason } : undefined)
        toast.success("Booking cancelled successfully")
        setCancelTarget(null)
        setDetailBooking(null)
        // Refresh credits
        getCallCredits().then(setCredits).catch(() => {/* ignore */})
        await queryClient.invalidateQueries({ queryKey: ["my-booking-search"] })
      } catch {
        toast.error("Failed to cancel booking. Please try again.")
      } finally {
        setIsCancelling(false)
      }
    },
    [queryClient],
  )

  const columns = buildColumns(handleViewDetail, setCancelTarget)

  return (
    <>
      {credits && (
        <div className="mb-4">
          <CreditCounterBanner credits={credits} />
        </div>
      )}

      <DataExplorer<MyBookingResponse>
        search={search}
        columns={columns}
        getRowKey={(b) => b.bookingId}
        title="My Bookings"
        description="Search, filter, and manage your consultation bookings."
        onRowClick={handleViewDetail}
        emptyState={
          <div className="py-12 text-center">
            <Calendar className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No bookings found. Book a consultation to get started!
            </p>
          </div>
        }
      />

      <BookingDetailDialog
        booking={detailBooking}
        open={detailBooking !== null}
        onClose={() => setDetailBooking(null)}
        onCancelClick={setCancelTarget}
        onRefresh={handleRefreshDetail}
      />

      <CancelBookingDialog
        booking={cancelTarget}
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />
    </>
  )
}

