/**
 * ─── MENTOR BOOKINGS VIEW ────────────────────────────────────────────────────
 *
 * Professional mentor's received mock interview bookings.
 * Uses the mentor-specific search endpoint to show bookings made with this mentor.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MousePointerClick } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TableRow, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MeetingLinkStatus } from "@/features/mock-interview/meeting-link-status"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchMentorBookings } from "@/features/mock-interview/api/mock-interview.api"
import { useCancelMockBooking } from "@/features/mock-interview/api/mock-interview.hooks"
import type {
  MockInterviewBookingResponse,
  MockInterviewBookingStatus,
} from "@/features/mock-interview/api/mock-interview.types"

// ─── Config ───────────────────────────────────────────────────────────────────

const BOOKING_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["userName"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled (User)", value: "CANCELLED_BY_USER" },
        { label: "Cancelled (Mentor)", value: "CANCELLED_BY_MENTOR" },
        { label: "Cancelled (System)", value: "CANCELLED_BY_SYSTEM" },
        { label: "No Show (User)", value: "NO_SHOW_USER" },
        { label: "No Show (Mentor)", value: "NO_SHOW_MENTOR" },
        { label: "Pending Payment", value: "PENDING_PAYMENT" },
        { label: "Payment Failed", value: "PAYMENT_FAILED" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Booked Date", type: "INSTANT" },
    { field: "updatedAt", label: "Updated Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Booked Date" },
    { field: "status", label: "Status" },
    { field: "updatedAt", label: "Updated Date" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 10,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: MockInterviewBookingStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment" },
    CONFIRMED: { variant: "default", label: "Confirmed" },
    IN_PROGRESS: { variant: "default", label: "In Progress" },
    COMPLETED: { variant: "outline", label: "Completed" },
    CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled (User)" },
    CANCELLED_BY_MENTOR: { variant: "destructive", label: "Cancelled (You)" },
    CANCELLED_BY_SYSTEM: { variant: "destructive", label: "Cancelled (System)" },
    NO_SHOW_USER: { variant: "destructive", label: "No Show (User)" },
    NO_SHOW_MENTOR: { variant: "destructive", label: "No Show (You)" },
    PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed" },
    EXPIRED: { variant: "outline", label: "Expired" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<MockInterviewBookingResponse>[] = [
  { key: "userName", header: "Student", sortable: false },
  { key: "slotStartUtc", header: "Session", sortable: false },
  { key: "finalAmountMinor", header: "Amount", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "meetingProvider", header: "Meeting", sortable: false },
  { key: "actions", header: "", sortable: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorBookingsView() {
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  const search = useGenericSearch<MockInterviewBookingResponse>({
    queryKey: "mentor-received-bookings",
    searchFn: searchMentorBookings,
    config: BOOKING_FILTER_CONFIG,
  })

  const cancelMutation = useCancelMockBooking(() => {
    setCancelDialogOpen(false)
    setCancelReason("")
    search.refetch()
  })

  const canCancel = (status: MockInterviewBookingStatus) =>
    ["CONFIRMED"].includes(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">
          Mock interview sessions booked with you.
        </p>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border">
        <MousePointerClick className="size-3.5 shrink-0" />
        <span>Click on any row to view booking details</span>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(booking) => (
          <TableRow
            key={booking.bookingId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/professional-mentor/bookings/${booking.bookingId}`)}
          >
            <TableCell>
              <p className="font-medium">{booking.userName}</p>
              <p className="text-xs text-muted-foreground">
                {booking.durationMinutes} min session
              </p>
            </TableCell>
            <TableCell>{formatDate(booking.slotStartUtc)}</TableCell>
            <TableCell className="font-medium">
              {formatAmount(booking.finalAmountMinor, booking.currency)}
            </TableCell>
            <TableCell>{getStatusBadge(booking.status)}</TableCell>
            <TableCell>
              <MeetingLinkStatus
                meetingProvider={booking.meetingProvider}
                meetingUrlPending={booking.meetingUrlPending}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {booking.sessionId && booking.meetingUrlPending && booking.status === "CONFIRMED" && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-xs border-amber-400 text-amber-600 hover:bg-amber-50"
                    onClick={() => router.push(`/professional-mentor/bookings/${booking.bookingId}`)}
                  >
                    Set Meeting Link
                  </Badge>
                )}
                {canCancel(booking.status) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7"
                    onClick={() => {
                      setCancelBookingId(booking.bookingId)
                      setCancelReason("")
                      setCancelDialogOpen(true)
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Mock Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? The student will be
              notified and a full refund will be initiated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why are you cancelling?"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelMutation.mutate({
                  bookingId: cancelBookingId,
                  reason: cancelReason || undefined,
                })
              }
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
