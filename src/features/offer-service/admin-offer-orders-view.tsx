/**
 * ─── ADMIN OFFER ORDERS VIEW ─────────────────────────────────────────────────
 *
 * Paginated, filterable list of all offer orders across all users.
 * Route: /offer-orders
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { ShoppingCart } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { adminSearchOfferOrders } from "./api/offer-order.api"
import type { OfferOrderSummaryResponse } from "./api/offer-service.types"
import {
  OFFER_ORDER_STATUS_OPTIONS,
  OFFER_PLAN_TIER_OPTIONS,
} from "./api/offer-service.types"
import { OfferStatusBadge } from "./components/offer-status-badge"

// ─── Filter Config ─────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig = {
  searchableFields: ["serviceId"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: OFFER_ORDER_STATUS_OPTIONS,
    },
    {
      field: "planTier",
      label: "Plan Tier",
      type: "STRING",
      operators: ["EQUALS"],
      options: OFFER_PLAN_TIER_OPTIONS,
    },
    {
      field: "currency",
      label: "Currency",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "INR", value: "INR" },
        { label: "USD", value: "USD" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Order Date", type: "INSTANT" },
    { field: "slaDeadline", label: "SLA Deadline", type: "INSTANT" },
    { field: "confirmedAt", label: "Confirmed Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Order Date" },
    { field: "status", label: "Status" },
    { field: "slaDeadline", label: "SLA Deadline" },
    { field: "finalAmountCharged", label: "Amount" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<OfferOrderSummaryResponse>[] = [
  { key: "orderId", header: "Order ID", sortable: false },
  { key: "serviceName", header: "Service", sortable: true },
  { key: "planDisplayName", header: "Plan", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "finalAmountCharged", header: "Amount", sortable: true },
  { key: "slaDeadline", header: "SLA Deadline", sortable: true },
  { key: "createdAt", header: "Created", sortable: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function isSlaWarning(slaDeadline: string | null | undefined) {
  if (!slaDeadline) return false
  const diff = new Date(slaDeadline).getTime() - Date.now()
  return diff > 0 && diff < 1000 * 60 * 60 * 12 // within 12 hours
}

function isSlaBreached(slaDeadline: string | null | undefined, status: string) {
  if (!slaDeadline) return false
  if (status === "COMPLETED" || status === "CANCELLED_BY_USER" || status === "CANCELLED_BY_REVQUIX") return false
  return new Date(slaDeadline).getTime() < Date.now()
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AdminOfferOrdersView() {
  const router = useRouter()

  const search = useGenericSearch<OfferOrderSummaryResponse>({
    queryKey: "admin-offer-orders",
    searchFn: adminSearchOfferOrders,
    config: FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Offer Orders
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all Global Offer Service orders — assign reviewers, track SLAs, upload deliverables.
        </p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(order) => (
          <TableRow
            key={order.orderId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              router.push(`${PATH_CONSTANTS.ADMIN_OFFER_ORDER_DETAIL}/${order.orderId}`)
            }
          >
            <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-sm">{order.serviceName}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{order.planDisplayName}</Badge>
            </TableCell>
            <TableCell>
              <OfferStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="font-medium text-sm">
              {formatAmount(order.finalAmountCharged, order.currency)}
            </TableCell>
            <TableCell className="text-xs">
              {order.slaDeadline ? (
                <span
                  className={
                    isSlaBreached(order.slaDeadline, order.status)
                      ? "text-red-600 font-medium"
                      : isSlaWarning(order.slaDeadline)
                        ? "text-amber-600 font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {formatDate(order.slaDeadline)}
                  {isSlaBreached(order.slaDeadline, order.status) && " ⚠ Breached"}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
