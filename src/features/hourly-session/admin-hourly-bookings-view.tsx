/**
 * ─── ADMIN HOURLY BOOKINGS VIEW ──────────────────────────────────────────────
 *
 * Admin panel to search and view all hourly session bookings.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchAllHourlySessions } from "./api/hourly-session.api"
import type { HourlySessionBookingResponse, MockInterviewBookingStatus } from "./api/hourly-session.types"

const FILTER_CONFIG: FilterConfig = {
  searchableFields: ["mentorName", "userName"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Pending Payment", value: "PENDING_PAYMENT" },
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled by User", value: "CANCELLED_BY_USER" },
        { label: "Cancelled by Mentor", value: "CANCELLED_BY_MENTOR" },
        { label: "No Show (User)", value: "NO_SHOW_USER" },
        { label: "No Show (Mentor)", value: "NO_SHOW_MENTOR" },
        { label: "Payment Failed", value: "PAYMENT_FAILED" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Booked Date", type: "INSTANT" },
    { field: "slotStartUtc", label: "Session Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Booked Date" },
    { field: "slotStartUtc", label: "Session Date" },
    { field: "status", label: "Status" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

function getStatusBadge(status: MockInterviewBookingStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment" },
    CONFIRMED: { variant: "default", label: "Confirmed" },
    IN_PROGRESS: { variant: "default", label: "In Progress" },
    COMPLETED: { variant: "outline", label: "Completed" },
    CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled (User)" },
    CANCELLED_BY_MENTOR: { variant: "destructive", label: "Cancelled (Mentor)" },
    NO_SHOW_USER: { variant: "destructive", label: "No Show (User)" },
    NO_SHOW_MENTOR: { variant: "destructive", label: "No Show (Mentor)" },
    PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed" },
    EXPIRED: { variant: "outline", label: "Expired" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

const COLUMNS: DataColumn<HourlySessionBookingResponse>[] = [
  { key: "bookingId", header: "Booking ID", sortable: false },
  { key: "userName", header: "Student", sortable: false },
  { key: "mentorName", header: "Mentor", sortable: false },
  { key: "slotStartUtc", header: "Session", sortable: true },
  { key: "finalAmountMinor", header: "Amount", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "createdAt", header: "Booked", sortable: true },
]

export default function AdminHourlyBookingsView() {
  const router = useRouter()
  const search = useGenericSearch<HourlySessionBookingResponse>({
    queryKey: "admin-hourly-bookings",
    searchFn: searchAllHourlySessions,
    config: FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Hourly Sessions</h1>
        <p className="text-muted-foreground">View and manage all hourly session bookings across the platform.</p>
      </div>

      <DataExplorer
        search={search}
        columns={COLUMNS}
        renderRow={(booking) => (
          <TableRow
            key={booking.bookingId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`${PATH_CONSTANTS.ADMIN_HOURLY_BOOKINGS}/${booking.bookingId}`)}
          >
            <TableCell className="font-mono text-xs">{booking.bookingId}</TableCell>
            <TableCell>{booking.userName}</TableCell>
            <TableCell>{booking.mentorName}</TableCell>
            <TableCell>{formatDate(booking.slotStartUtc)}</TableCell>
            <TableCell>{formatAmount(booking.finalAmountMinor, booking.currency)}</TableCell>
            <TableCell>{getStatusBadge(booking.status)}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{formatDate(booking.createdAt)}</TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
