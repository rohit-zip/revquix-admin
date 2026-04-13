/**
 * ─── BOOKING SEARCH FILTER CONFIG ─────────────────────────────────────────────
 *
 * Declares the filter fields, operators, and metadata for the booking search
 * endpoint (POST /api/v1/bookings/search). This config drives the DataExplorer
 * UI automatically.
 *
 * Filterable fields (from backend):
 *   bookingId       — STRING  → EQUALS, IN
 *   status          — STRING  → EQUALS, NOT_EQUALS, IN
 *   cancellationReason — STRING → LIKE, IS_NULL, IS_NOT_NULL
 *   cancelledAt     — INSTANT → range (from/to)
 *   createdAt       — INSTANT → range (from/to), sort
 *   updatedAt       — INSTANT → range (from/to), sort
 */

import type { FilterConfig } from "@/core/filters/filter.types"

export const BOOKING_FILTER_CONFIG: FilterConfig = {
  key: "booking-search",
  entityLabel: "Bookings",
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 10,

  filterFields: [
    {
      field: "bookingId",
      label: "Booking ID",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      isSearchable: true,
      allowSort: false,
    },
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS", "NOT_EQUALS", "IN"],
      options: [
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled by User", value: "CANCELLED_BY_USER" },
        { label: "Cancelled by Mentor", value: "CANCELLED_BY_MENTOR" },
        { label: "No Show", value: "NO_SHOW" },
      ],
    },
    {
      field: "cancellationReason",
      label: "Cancellation Reason",
      type: "STRING",
      operators: ["LIKE", "IS_NULL", "IS_NOT_NULL"],
      isSearchable: false,
      allowSort: false,
    },
  ],

  rangeFields: [
    {
      field: "createdAt",
      label: "Created At",
      type: "INSTANT",
      operators: [],
      allowRange: true,
      allowSort: true,
    },
    {
      field: "updatedAt",
      label: "Updated At",
      type: "INSTANT",
      operators: [],
      allowRange: true,
      allowSort: true,
    },
    {
      field: "cancelledAt",
      label: "Cancelled At",
      type: "INSTANT",
      operators: [],
      allowRange: true,
    },
  ],

  joinFields: [],
}

