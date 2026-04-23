/**
 * ─── ALL BOOKINGS SEARCH FILTER CONFIG ───────────────────────────────────────
 *
 * Declares every filterable, sortable, and searchable field that the
 * POST /api/v1/business-mentor/bookings/all/search endpoint accepts.
 *
 * This config drives the DataExplorer filter panel automatically —
 * no hardcoded field references exist in the UI layer.
 *
 * Backend-declared whitelist:
 *   Flat fields  → bookingId, status, cancellationReason
 *   Range fields → createdAt, updatedAt, cancelledAt
 *   Join fields  → userAuth.{userId,email,name,username}
 *                  assignedMentor.{userId,email,name,username}
 */

import type { FilterConfig } from "@/core/filters/filter.types"

export const ALL_BOOKINGS_FILTER_CONFIG: FilterConfig = {
  key: "all-bookings-search",
  entityLabel: "Bookings",
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,

  // ── Flat field filters ─────────────────────────────────────────────────────
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS", "NOT_EQUALS", "IN"],
      allowSort: true,
      options: [
        { label: "Confirmed",          value: "CONFIRMED" },
        { label: "Completed",          value: "COMPLETED" },
        { label: "Cancelled by User",  value: "CANCELLED_BY_USER" },
        { label: "Cancelled by Mentor",value: "CANCELLED_BY_MENTOR" },
      ],
    },
    {
      field: "bookingId",
      label: "Booking ID",
      type: "STRING",
      operators: ["EQUALS", "IN"],
    },
    {
      field: "cancellationReason",
      label: "Cancellation Reason",
      type: "STRING",
      operators: ["LIKE", "IS_NULL", "IS_NOT_NULL"],
    },
  ],

  // ── Range (date / number) filters ─────────────────────────────────────────
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
      allowSort: true,
    },
  ],

  // ── Join filters (related entities) ───────────────────────────────────────
  // Each entry is a distinct {association, field} combination.
  // The DataExplorer renders a separate filter control per entry.
  joinFields: [
    {
      association: "userAuth",
      field: "email",
      label: "User Email",
      operators: ["EQUALS", "LIKE"],
      options: [],
    },
    {
      association: "userAuth",
      field: "name",
      label: "User Name",
      operators: ["EQUALS", "LIKE"],
      options: [],
    },
    {
      association: "assignedMentor",
      field: "email",
      label: "Mentor Email",
      operators: ["EQUALS", "LIKE"],
      options: [],
    },
    {
      association: "assignedMentor",
      field: "name",
      label: "Mentor Name",
      operators: ["EQUALS", "LIKE"],
      options: [],
    },
  ],
}

