/**
 * ─── FILTER CONFIGS FOR THE CONSOLE TABLES ────────────────────────────────────
 *
 * One `FilterConfig` per table. These drive the DataExplorer filter popover, the sort menu and the
 * default ordering — they are the client-side mirror of the `@FilterField` whitelist on each entity,
 * and the server rejects anything not on its own list, so a stale entry here fails loudly with a 400
 * rather than silently returning unfiltered rows.
 *
 * **Every `defaultSort` is newest-first.** That is the ordering an operator expects from a table, and
 * it is deliberately different from the dispute *work queue*, which stays urgent-then-oldest behind
 * its own endpoint. Both are reachable; see `searchDisputes` for why they coexist.
 */

import type { FilterConfig } from "@/core/filters"

const NEWEST_FIRST = [{ field: "createdAt", direction: "DESC" as const }]

// ─── Sessions ────────────────────────────────────────────────────────────────

export const SESSIONS_FILTER_CONFIG: FilterConfig = {
  key: "pm-sessions",
  entityLabel: "Sessions",
  defaultSort: NEWEST_FIRST,
  defaultPageSize: 20,
  searchableFields: ["bookingId", "orderId"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Rescheduled", value: "RESCHEDULED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Awaiting confirmation", value: "PENDING_CONFIRMATION" },
        { label: "Awaiting feedback", value: "FEEDBACK_PENDING" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Disputed", value: "DISPUTED" },
        { label: "No-show (mentor)", value: "NO_SHOW_MENTOR" },
        { label: "No-show (user)", value: "NO_SHOW_USER" },
        { label: "No-show (neither attended)", value: "NO_SHOW_BOTH" },
        { label: "Cancelled by user", value: "CANCELLED_BY_USER" },
        { label: "Cancelled by mentor", value: "CANCELLED_BY_MENTOR" },
        { label: "Cancelled by system", value: "CANCELLED_BY_SYSTEM" },
        { label: "Awaiting payment", value: "PENDING_PAYMENT" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
    { field: "mentorUserId", label: "Mentor user id", type: "STRING", operators: ["EQUALS"] },
    { field: "buyerUserId", label: "Buyer user id", type: "STRING", operators: ["EQUALS"] },
    { field: "serviceId", label: "Service id", type: "STRING", operators: ["EQUALS"] },
    { field: "orderId", label: "Order id", type: "STRING", operators: ["EQUALS"] },
    {
      field: "meetingLinkSource",
      label: "Meeting link source",
      type: "STRING",
      operators: ["EQUALS", "IS_NULL"],
      allowSort: true,
      options: [
        { label: "Google Meet", value: "GOOGLE_MEET" },
        { label: "Manual", value: "MANUAL" },
      ],
    },
    {
      field: "feedbackRequired",
      label: "Feedback required",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      field: "cancelledBy",
      label: "Cancelled by",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "User", value: "USER" },
        { label: "Mentor", value: "MENTOR" },
        { label: "System", value: "SYSTEM" },
        { label: "Admin", value: "ADMIN" },
      ],
    },
  ],
  rangeFields: [
    { field: "startsAt", label: "Session start", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "createdAt", label: "Booked at", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "completedAt", label: "Completed at", type: "INSTANT", allowRange: true, allowSort: true },
    {
      field: "feedbackDeadlineAt",
      label: "Feedback deadline",
      type: "INSTANT",
      allowRange: true,
      allowSort: true,
    },
  ],
  sortFields: [
    { field: "createdAt", label: "Booked at" },
    { field: "startsAt", label: "Session start" },
    { field: "status", label: "Status" },
    { field: "completedAt", label: "Completed at" },
  ],
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export const ORDERS_FILTER_CONFIG: FilterConfig = {
  key: "pm-orders",
  entityLabel: "Orders",
  defaultSort: NEWEST_FIRST,
  defaultPageSize: 20,
  searchableFields: ["orderId", "orderNumber", "couponCode"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Awaiting payment", value: "PENDING_PAYMENT" },
        { label: "Paid", value: "PAID" },
        { label: "Payment failed", value: "PAYMENT_FAILED" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Refunded", value: "REFUNDED" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
    { field: "mentorUserId", label: "Mentor user id", type: "STRING", operators: ["EQUALS"] },
    { field: "buyerUserId", label: "Buyer user id", type: "STRING", operators: ["EQUALS"] },
    { field: "serviceId", label: "Service id", type: "STRING", operators: ["EQUALS"] },
    {
      field: "chargeCurrency",
      label: "Buyer currency",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "INR", value: "INR" },
        { label: "USD", value: "USD" },
      ],
    },
    { field: "pricingZone", label: "Pricing zone", type: "STRING", operators: ["EQUALS"] },
    { field: "buyerCountry", label: "Buyer country", type: "STRING", operators: ["EQUALS"] },
    { field: "couponCode", label: "Coupon", type: "STRING", operators: ["EQUALS", "IS_NOT_NULL"] },
  ],
  rangeFields: [
    { field: "createdAt", label: "Created", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "paidAt", label: "Paid at", type: "INSTANT", allowRange: true, allowSort: true },
    {
      field: "grossAmountMinor",
      label: "Buyer total (minor)",
      type: "INTEGER",
      allowRange: true,
      allowSort: true,
    },
    {
      field: "mentorNetMinor",
      label: "Mentor net (minor)",
      type: "INTEGER",
      allowRange: true,
      allowSort: true,
    },
  ],
  sortFields: [
    { field: "createdAt", label: "Created" },
    { field: "paidAt", label: "Paid at" },
    { field: "grossAmountMinor", label: "Buyer total" },
    { field: "mentorNetMinor", label: "Mentor net" },
    { field: "status", label: "Status" },
  ],
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

/** Sorted by `initiatedAt` — `PaymentRefund` has no `createdAt`, so the usual default would 400. */
export const REFUNDS_FILTER_CONFIG: FilterConfig = {
  key: "pm-refunds",
  entityLabel: "Refunds",
  defaultSort: [{ field: "initiatedAt", direction: "DESC" }],
  defaultPageSize: 20,
  searchableFields: ["refundId", "orderId", "gatewayRefundId"],
  filterFields: [
    { field: "status", label: "Status", type: "STRING", operators: ["EQUALS"], allowSort: true },
    { field: "refundType", label: "Type", type: "STRING", operators: ["EQUALS"], allowSort: true },
    { field: "orderId", label: "Order id", type: "STRING", operators: ["EQUALS"] },
  ],
  rangeFields: [
    { field: "initiatedAt", label: "Initiated", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "settledAt", label: "Settled", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "amountMinor", label: "Amount (minor)", type: "INTEGER", allowRange: true, allowSort: true },
  ],
  sortFields: [
    { field: "initiatedAt", label: "Initiated" },
    { field: "settledAt", label: "Settled" },
    { field: "amountMinor", label: "Amount" },
  ],
}

// ─── Service catalogue ───────────────────────────────────────────────────────

export const SERVICES_FILTER_CONFIG: FilterConfig = {
  key: "pm-services",
  entityLabel: "Services",
  defaultSort: NEWEST_FIRST,
  defaultPageSize: 20,
  searchableFields: ["serviceId", "slug", "title"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Active", value: "ACTIVE" },
        { label: "Paused", value: "PAUSED" },
        { label: "Archived", value: "ARCHIVED" },
        { label: "Suspended", value: "SUSPENDED" },
      ],
    },
    {
      field: "visibility",
      label: "Visibility",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Public", value: "PUBLIC" },
        { label: "Unlisted", value: "UNLISTED" },
        { label: "Private", value: "PRIVATE" },
      ],
    },
    { field: "mentorUserId", label: "Mentor user id", type: "STRING", operators: ["EQUALS"] },
    { field: "serviceType", label: "Type", type: "STRING", operators: ["EQUALS"], allowSort: true },
    {
      field: "countryPricingEnabled",
      label: "Country pricing",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "On", value: true },
        { label: "Off", value: false },
      ],
    },
  ],
  rangeFields: [
    { field: "createdAt", label: "Created", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "publishedAt", label: "Published", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "orderCount", label: "Orders", type: "INTEGER", allowRange: true, allowSort: true },
    {
      field: "basePriceMinor",
      label: "Base price (minor)",
      type: "INTEGER",
      allowRange: true,
      allowSort: true,
    },
  ],
  sortFields: [
    { field: "createdAt", label: "Created" },
    { field: "publishedAt", label: "Published" },
    { field: "orderCount", label: "Orders" },
    { field: "basePriceMinor", label: "Price" },
    { field: "status", label: "Status" },
  ],
}

// ─── Entitlements ────────────────────────────────────────────────────────────

export const ENTITLEMENTS_FILTER_CONFIG: FilterConfig = {
  key: "pm-entitlements",
  entityLabel: "Entitlements",
  defaultSort: NEWEST_FIRST,
  defaultPageSize: 20,
  searchableFields: ["entitlementId", "parentOrderId", "childServiceTitle"],
  filterFields: [
    { field: "status", label: "Status", type: "STRING", operators: ["EQUALS"], allowSort: true },
    { field: "mentorUserId", label: "Mentor user id", type: "STRING", operators: ["EQUALS"] },
    { field: "buyerUserId", label: "Buyer user id", type: "STRING", operators: ["EQUALS"] },
  ],
  rangeFields: [
    { field: "createdAt", label: "Purchased", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "expiresAt", label: "Expires", type: "INSTANT", allowRange: true, allowSort: true },
  ],
  sortFields: [
    { field: "createdAt", label: "Purchased" },
    { field: "expiresAt", label: "Expires" },
    { field: "status", label: "Status" },
  ],
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export const DISPUTES_FILTER_CONFIG: FilterConfig = {
  key: "pm-disputes",
  entityLabel: "Disputes",
  defaultSort: NEWEST_FIRST,
  defaultPageSize: 20,
  searchableFields: ["disputeId", "orderId", "bookingId"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Open", value: "OPEN" },
        { label: "Under review", value: "UNDER_REVIEW" },
        { label: "Awaiting buyer", value: "AWAITING_BUYER" },
        { label: "Awaiting mentor", value: "AWAITING_MENTOR" },
        { label: "Escalated", value: "ESCALATED" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Withdrawn", value: "WITHDRAWN" },
      ],
    },
    {
      field: "priority",
      label: "Priority",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Urgent", value: "URGENT" },
        { label: "High", value: "HIGH" },
        { label: "Normal", value: "NORMAL" },
        { label: "Low", value: "LOW" },
      ],
    },
    {
      field: "disputeType",
      label: "Type",
      type: "STRING",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Mentor no-show", value: "NO_SHOW_MENTOR" },
        { label: "Buyer no-show", value: "NO_SHOW_USER" },
        { label: "Feedback not submitted", value: "FEEDBACK_NOT_SUBMITTED" },
        { label: "Quality complaint", value: "QUALITY" },
        { label: "Technical failure", value: "TECHNICAL" },
        { label: "Billing", value: "BILLING" },
        { label: "Other", value: "OTHER" },
      ],
    },
    { field: "mentorUserId", label: "Mentor user id", type: "STRING", operators: ["EQUALS"] },
    { field: "buyerUserId", label: "Buyer user id", type: "STRING", operators: ["EQUALS"] },
    {
      field: "assignedAdminId",
      label: "Assigned",
      type: "STRING",
      operators: ["EQUALS", "IS_NULL", "IS_NOT_NULL"],
      allowSort: true,
    },
    {
      field: "payoutHold",
      label: "Payout held",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      allowSort: true,
      options: [
        { label: "Held", value: true },
        { label: "Released", value: false },
      ],
    },
    {
      field: "autoResolved",
      label: "Auto-resolved",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  ],
  rangeFields: [
    { field: "createdAt", label: "Raised", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "slaDueAt", label: "First response due", type: "INSTANT", allowRange: true, allowSort: true },
    { field: "resolvedAt", label: "Resolved", type: "INSTANT", allowRange: true, allowSort: true },
    {
      field: "amountInQuestionMinor",
      label: "Amount (minor)",
      type: "INTEGER",
      allowRange: true,
      allowSort: true,
    },
  ],
  sortFields: [
    { field: "createdAt", label: "Raised" },
    { field: "slaDueAt", label: "SLA due" },
    { field: "priority", label: "Priority" },
    { field: "status", label: "Status" },
    { field: "amountInQuestionMinor", label: "Amount" },
  ],
}
