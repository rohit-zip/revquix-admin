/**
 * ─── MENTOR BOOKINGS VIEW ───────────────────────────────────────────────────
 *
 * View for /business-mentor/bookings page.
 * Shows the current mentor's assigned bookings with status filtering
 * and pagination.
 */

"use client"

import React, { useMemo, useState } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JoinMeetingButton } from "@/components/join-meeting-button"

import { useMyBookings } from "@/features/business-mentor/api/business-mentor.hooks"
import {
  BOOKING_STATUS_OPTIONS,
  type BookingResponse,
  type BookingStatus,
} from "@/features/business-mentor/api/business-mentor.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInstant(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function statusBadgeVariant(status: BookingStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
      return "default"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED_BY_USER":
    case "CANCELLED_BY_MENTOR":
      return "destructive"
    default:
      return "outline"
  }
}

function statusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

function categoryLabel(category: string): string {
  switch (category) {
    case "BUSINESS_STARTUP":
      return "Business Startup"
    case "PROFESSIONAL_DEVELOPER":
      return "Professional Dev"
    case "HIRING_RECRUITMENT":
      return "Hiring & Recruitment"
    default:
      return category
  }
}

// ─── Booking Row ──────────────────────────────────────────────────────────────

function BookingRow({ booking }: { booking: BookingResponse }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{booking.bookingId}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{booking.userName}</p>
          <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{categoryLabel(booking.category)}</Badge>
      </TableCell>
      <TableCell>{formatInstant(booking.scheduledAt)}</TableCell>
      <TableCell>{booking.durationMinutes} min</TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(booking.status)}>
          {statusLabel(booking.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <JoinMeetingButton sessionId={booking.sessionId} variant="icon" />
      </TableCell>
    </TableRow>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorBookingsView() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | undefined>(undefined)
  const pageSize = 10

  const { data: bookingsPage, isLoading } = useMyBookings(page, pageSize, statusFilter)

  const bookings = useMemo(() => bookingsPage?.content ?? [], [bookingsPage])
  const totalPages = bookingsPage?.totalPages ?? 0
  const totalElements = bookingsPage?.totalElements ?? 0

  function handleStatusChange(value: string) {
    setStatusFilter(value === "ALL" ? undefined : (value as BookingStatus))
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage bookings assigned to you as a mentor.
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Assigned Bookings</CardTitle>
            <CardDescription>
              {totalElements} booking{totalElements !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter ?? "ALL"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {BOOKING_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter
                  ? "No bookings match the selected filter. Try a different status."
                  : "You don't have any assigned bookings yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Scheduled At</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <BookingRow key={booking.bookingId} booking={booking} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

