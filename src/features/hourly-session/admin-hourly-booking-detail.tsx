/**
 * ─── ADMIN HOURLY BOOKING DETAIL ─────────────────────────────────────────────
 *
 * Admin detail view for a single hourly session booking.
 */

"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
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

import { getHourlySessionBooking } from "./api/hourly-session.api"
import type { HourlySessionBookingResponse, MockInterviewBookingStatus } from "./api/hourly-session.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

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
