/**
 * ─── MY MOCK BOOKINGS VIEW ──────────────────────────────────────────────────
 *
 * User's mock interview bookings with search/filter and booking detail display.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  MousePointerClick,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { MeetingLinkStatus } from "@/features/mock-interview/meeting-link-status"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchMyBookings } from "./api/mock-interview.api"
import { useCancelMockBooking } from "./api/mock-interview.hooks"
import type {
  MockInterviewBookingResponse,
  MockInterviewBookingStatus,
} from "./api/mock-interview.types"

// ─── Config ───────────────────────────────────────────────────────────────────

const BOOKING_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["mentorName"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Pending Payment", value: "PENDING_PAYMENT" },
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED_BY_USER" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Booked Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Booked Date" },
    { field: "slotStartUtc", label: "Session Date" },
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
    CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled" },
    CANCELLED_BY_MENTOR: { variant: "destructive", label: "Cancelled by Mentor" },
    NO_SHOW_USER: { variant: "destructive", label: "No Show" },
    NO_SHOW_MENTOR: { variant: "destructive", label: "Mentor No Show" },
    PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed" },
    EXPIRED: { variant: "outline", label: "Expired" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
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

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<MockInterviewBookingResponse>[] = [
  { key: "mentorName", header: "Mentor", sortable: false },
  { key: "slotStartUtc", header: "Session Date", sortable: true },
  { key: "finalAmountMinor", header: "Amount", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "meetingProvider", header: "Meeting", sortable: false },
  { key: "actions", header: "", sortable: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyMockBookingsView() {
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  const search = useGenericSearch<MockInterviewBookingResponse>({
    queryKey: "my-mock-bookings",
    searchFn: searchMyBookings,
    config: BOOKING_FILTER_CONFIG,
  })

  const cancelMutation = useCancelMockBooking(() => {
    setCancelDialogOpen(false)
    setCancelReason("")
    search.refetch()
  })

  const canCancel = (status: MockInterviewBookingStatus) =>
    ["CONFIRMED", "PENDING_PAYMENT"].includes(status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Mock Interviews</h1>
          <p className="text-muted-foreground">
            View and manage your mock interview bookings.
          </p>
        </div>
        <Button asChild>
          <Link href="/mock-interview/browse">Browse Mentors</Link>
        </Button>
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
            onClick={() => router.push(`/mock-interview/my-bookings/${booking.bookingId}`)}
          >
            <TableCell>
              <p className="font-medium">{booking.mentorName}</p>
              <p className="text-xs text-muted-foreground">
                {booking.durationMinutes} min session
              </p>
            </TableCell>
            <TableCell>{formatDate(booking.slotStartUtc)}</TableCell>
            <TableCell>{formatAmount(booking.finalAmountMinor, booking.currency)}</TableCell>
            <TableCell>{getStatusBadge(booking.status)}</TableCell>
            <TableCell>
              <MeetingLinkStatus
                meetingProvider={booking.meetingProvider}
                meetingUrlPending={booking.meetingUrlPending}
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
              Are you sure you want to cancel this booking?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3">
            <p className="text-xs font-semibold mb-2">Cancellation & Refund Policy</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>24+ hours before:</span><span className="font-medium text-foreground">100% refund</span>
              <span>12–24 hours before:</span><span className="font-medium text-foreground">70% refund</span>
              <span>6–12 hours before:</span><span className="font-medium text-foreground">50% refund</span>
              <span>Less than 6 hours:</span><span className="font-medium text-destructive">No refund</span>
            </div>
          </div>
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

