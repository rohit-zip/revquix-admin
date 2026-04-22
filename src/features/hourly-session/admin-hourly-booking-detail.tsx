/**
 * ─── ADMIN HOURLY BOOKING DETAIL ─────────────────────────────────────────────
 *
 * Admin detail view for a single hourly session booking.
 * Includes admin actions: Force Complete and Cancel.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  ShieldCheck,
  UserX,
  Video,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

import { useAdminHourlyBooking, useAdminCancelHourlySession } from "./api/hourly-session.hooks"
import type { MockInterviewBookingStatus } from "./api/hourly-session.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { forceCompleteMeeting } from "@/features/book-slot/api/meeting.api"
import { JoinMeetingButton } from "@/components/join-meeting-button"
import { SetMeetingUrlModal } from "@/features/mock-interview/set-meeting-url-modal"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: MockInterviewBookingStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
    PENDING_PAYMENT:     { variant: "secondary",    label: "Pending Payment",       icon: <Clock className="h-3 w-3" /> },
    CONFIRMED:           { variant: "default",      label: "Confirmed",             icon: <CheckCircle2 className="h-3 w-3" /> },
    IN_PROGRESS:         { variant: "default",      label: "In Progress",           icon: <Video className="h-3 w-3" /> },
    COMPLETED:           { variant: "outline",      label: "Completed",             icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED_BY_USER:   { variant: "destructive",  label: "Cancelled (User)",      icon: <XCircle className="h-3 w-3" /> },
    CANCELLED_BY_MENTOR: { variant: "destructive",  label: "Cancelled (Mentor)",    icon: <XCircle className="h-3 w-3" /> },
    CANCELLED_BY_SYSTEM: { variant: "destructive",  label: "Cancelled by System",   icon: <XCircle className="h-3 w-3" /> },
    NO_SHOW_USER:        { variant: "destructive",  label: "No Show (User)",        icon: <UserX className="h-3 w-3" /> },
    NO_SHOW_MENTOR:      { variant: "destructive",  label: "No Show (Mentor)",      icon: <UserX className="h-3 w-3" /> },
    PAYMENT_FAILED:      { variant: "destructive",  label: "Payment Failed",        icon: <AlertCircle className="h-3 w-3" /> },
    EXPIRED:             { variant: "outline",      label: "Expired",               icon: <Clock className="h-3 w-3" /> },
    PENDING_CONFIRMATION:{ variant: "secondary",    label: "Awaiting Confirmation", icon: <Clock className="h-3 w-3" /> },
    DISPUTED:            { variant: "destructive",  label: "Under Dispute",         icon: <AlertCircle className="h-3 w-3" /> },
  }
  const info = map[status] ?? { variant: "outline", label: status, icon: null }
  return (
    <Badge variant={info.variant} className="flex items-center gap-1">
      {info.icon}
      {info.label}
    </Badge>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminHourlyBookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [forceCompleteOpen, setForceCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [completing, setCompleting] = useState(false)

  const { data: booking, isLoading, isError } = useAdminHourlyBooking(bookingId)
  const cancelMutation = useAdminCancelHourlySession()

  const canForceComplete = !!booking?.sessionId &&
    ["CONFIRMED", "IN_PROGRESS", "PENDING_CONFIRMATION", "DISPUTED"].includes(booking?.status ?? "")
  const canAdminCancel = booking?.status
    ? ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT", "PENDING_CONFIRMATION"].includes(booking.status)
    : false

  async function handleForceComplete() {
    if (!booking?.sessionId) return
    setCompleting(true)
    try {
      await forceCompleteMeeting(booking.sessionId, adminNote || undefined)
      toast.success("Session force-completed successfully.")
      setForceCompleteOpen(false)
      window.location.reload()
    } catch {
      toast.error("Failed to force-complete session.")
    } finally {
      setCompleting(false)
    }
  }

  function handleAdminCancel() {
    cancelMutation.mutate(
      { bookingId, reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false)
          setCancelReason("")
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Booking not found or could not be loaded.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(PATH_CONSTANTS.ADMIN_HOURLY_BOOKINGS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Hourly Session</h1>
            {getStatusBadge(booking.status)}
          </div>
          <p className="text-sm text-muted-foreground font-mono">{booking.bookingId}</p>
        </div>
        {/* Admin Actions */}
        <div className="flex gap-2">
          {canForceComplete && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-400 text-blue-600 hover:bg-blue-50"
              onClick={() => setForceCompleteOpen(true)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Force Complete
            </Button>
          )}
          {canAdminCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Dispute notice */}
      {booking.status === "DISPUTED" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Session Under Dispute</AlertTitle>
          <AlertDescription>
            A dispute has been raised for this session. Review the attendance responses and use Force Complete
            or Cancel to resolve it.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader><CardTitle className="text-base">Participants</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Student" value={booking.userName} />
            <Separator />
            <InfoRow label="Mentor" value={booking.mentorName} />
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Date & Time" value={formatDate(booking.slotStartUtc)} />
            <Separator />
            <InfoRow label="Duration" value={`${booking.durationMinutes} minutes`} />
            {booking.topic && (
              <>
                <Separator />
                <InfoRow label="Topic" value={booking.topic} />
              </>
            )}
            {booking.sessionId && (
              <>
                <Separator />
                <InfoRow label="Session ID" value={<span className="font-mono text-xs">{booking.sessionId}</span>} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original</span>
              <span>{formatAmount(booking.originalAmountMinor, booking.currency)}</span>
            </div>
            {booking.discountAmountMinor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-{formatAmount(booking.discountAmountMinor, booking.currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatAmount(booking.finalAmountMinor, booking.currency)}</span>
            </div>
            {booking.couponCode && (
              <InfoRow label="Coupon" value={<span className="font-mono text-xs">{booking.couponCode}</span>} />
            )}
            {booking.refundAmountMinor && booking.refundAmountMinor > 0 && (
              <div className="flex justify-between text-sm text-green-600 mt-2">
                <span>Refunded</span>
                <span>{formatAmount(booking.refundAmountMinor, booking.currency)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Provider" value={booking.meetingProvider ?? "—"} />
            {booking.meetingUrl && (
              <>
                <Separator />
                <InfoRow
                  label="Meeting URL"
                  value={
                    <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-primary underline truncate block">
                      {booking.meetingUrl}
                    </a>
                  }
                />
              </>
            )}
            {booking.sessionId && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
              <>
                <Separator />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <JoinMeetingButton
                    sessionId={booking.sessionId}
                    allowedJoinAt={booking.allowedJoinAt}
                    meetingUrlPending={booking.meetingUrlPending}
                  />
                  {booking.meetingUrlPending && (
                    <SetMeetingUrlModal
                      sessionId={booking.sessionId}
                      onSuccess={() => window.location.reload()}
                    />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intake Details */}
      {(booking.description || booking.additionalNotes) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Session Intake</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {booking.description && (
              <InfoRow label="Description" value={<p className="leading-relaxed">{booking.description}</p>} />
            )}
            {booking.additionalNotes && (
              <>
                <Separator />
                <InfoRow label="Additional Notes" value={<p className="leading-relaxed">{booking.additionalNotes}</p>} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance responses */}
      {(booking.status === "PENDING_CONFIRMATION" || booking.status === "DISPUTED" || booking.status === "COMPLETED") && (
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Responses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="User Response"
              value={
                booking.userAttendanceResponse === null || booking.userAttendanceResponse === undefined
                  ? <span className="text-muted-foreground italic">Pending</span>
                  : booking.userAttendanceResponse
                  ? <Badge variant="default">Attended</Badge>
                  : <Badge variant="destructive">Did Not Attend</Badge>
              }
            />
            <Separator />
            <InfoRow
              label="Mentor Response"
              value={
                booking.mentorAttendanceResponse === null || booking.mentorAttendanceResponse === undefined
                  ? <span className="text-muted-foreground italic">Pending</span>
                  : booking.mentorAttendanceResponse
                  ? <Badge variant="default">Session Happened</Badge>
                  : <Badge variant="destructive">Session Did Not Happen</Badge>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Cancellation details */}
      {booking.cancellationReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Cancellation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Reason" value={booking.cancellationReason} />
            {booking.cancelledAt && (
              <>
                <Separator />
                <InfoRow label="Cancelled At" value={formatDate(booking.cancelledAt)} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Force Complete Dialog */}
      <Dialog open={forceCompleteOpen} onOpenChange={setForceCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Complete Session</DialogTitle>
            <DialogDescription>
              This will immediately mark the session as COMPLETED without requiring a screenshot.
              Use this to resolve disputes or handle edge cases.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Admin note (optional — will be stored for audit)..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceCompleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleForceComplete} disabled={completing}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Force Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              This will cancel the booking and initiate any applicable refund per policy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Cancellation reason (optional)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="destructive" onClick={handleAdminCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: MockInterviewBookingStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
    PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment", icon: <Clock className="h-3 w-3" /> },
    CONFIRMED: { variant: "default", label: "Confirmed", icon: <CheckCircle2 className="h-3 w-3" /> },
    IN_PROGRESS: { variant: "default", label: "In Progress", icon: <Video className="h-3 w-3" /> },
    COMPLETED: { variant: "outline", label: "Completed", icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled (User)", icon: <XCircle className="h-3 w-3" /> },
    CANCELLED_BY_MENTOR: { variant: "destructive", label: "Cancelled (Mentor)", icon: <XCircle className="h-3 w-3" /> },
    NO_SHOW_USER: { variant: "destructive", label: "No Show (User)", icon: <UserX className="h-3 w-3" /> },
    NO_SHOW_MENTOR: { variant: "destructive", label: "No Show (Mentor)", icon: <UserX className="h-3 w-3" /> },
    PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed", icon: <AlertCircle className="h-3 w-3" /> },
    EXPIRED: { variant: "outline", label: "Expired", icon: <Clock className="h-3 w-3" /> },
  }
  const info = map[status] ?? { variant: "outline", label: status, icon: null }
  return (
    <Badge variant={info.variant} className="flex items-center gap-1">
      {info.icon}
      {info.label}
    </Badge>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminHourlyBookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter()

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["admin-hourly-booking", bookingId],
    queryFn: () => getHourlySessionBooking(bookingId),
    enabled: !!bookingId,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Booking not found or could not be loaded.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(PATH_CONSTANTS.ADMIN_HOURLY_BOOKINGS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Hourly Session</h1>
            {getStatusBadge(booking.status)}
          </div>
          <p className="text-sm text-muted-foreground font-mono">{booking.bookingId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Student" value={booking.userName} />
            <Separator />
            <InfoRow label="Mentor" value={booking.mentorName} />
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Date & Time" value={formatDate(booking.slotStartUtc)} />
            <Separator />
            <InfoRow label="Duration" value={`${booking.durationMinutes} minutes`} />
            {booking.topic && (
              <>
                <Separator />
                <InfoRow label="Topic" value={booking.topic} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original</span>
              <span>{formatAmount(booking.originalAmountMinor, booking.currency)}</span>
            </div>
            {booking.discountAmountMinor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-{formatAmount(booking.discountAmountMinor, booking.currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatAmount(booking.finalAmountMinor, booking.currency)}</span>
            </div>
            {booking.couponCode && (
              <InfoRow label="Coupon Used" value={<span className="font-mono text-xs">{booking.couponCode}</span>} />
            )}
            {booking.refundAmountMinor && booking.refundAmountMinor > 0 && (
              <div className="flex justify-between text-sm text-green-600 mt-2">
                <span>Refunded</span>
                <span>{formatAmount(booking.refundAmountMinor, booking.currency)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Provider"
              value={booking.meetingProvider ?? "—"}
            />
            {booking.meetingUrl && (
              <>
                <Separator />
                <InfoRow
                  label="Meeting URL"
                  value={
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline truncate block"
                    >
                      {booking.meetingUrl}
                    </a>
                  }
                />
              </>
            )}
            {booking.meetingUrlPending && (
              <p className="text-sm text-muted-foreground italic">Meeting link pending</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intake Details */}
      {(booking.description || booking.additionalNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.description && (
              <InfoRow label="Description" value={<p className="leading-relaxed">{booking.description}</p>} />
            )}
            {booking.additionalNotes && (
              <>
                <Separator />
                <InfoRow label="Additional Notes" value={<p className="leading-relaxed">{booking.additionalNotes}</p>} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancellation */}
      {booking.cancellationReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Cancellation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Reason" value={booking.cancellationReason} />
            {booking.cancelledAt && (
              <>
                <Separator />
                <InfoRow label="Cancelled At" value={formatDate(booking.cancelledAt)} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
