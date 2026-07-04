/**
 * ─── ADMIN CUSTOM QUOTES VIEW ────────────────────────────────────────────────
 *
 * Paginated, filterable list of all admin-initiated custom quotes.
 * Route: /custom-quotes
 */

"use client"

import { useRouter } from "nextjs-toploader/app"
import { FileText, Plus } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { adminSearchQuotes } from "./api/quote.api"
import type { OfferOrderSummaryResponse } from "./api/offer-service.types"
import { QUOTE_STATUS_OPTIONS } from "./api/offer-service.types"
import { OfferStatusBadge } from "./components/offer-status-badge"

const FILTER_CONFIG: FilterConfig = {
  searchableFields: ["quoteNumber", "quoteTitle"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: QUOTE_STATUS_OPTIONS,
    },
    {
      field: "source",
      label: "Source",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Custom Quote", value: "CUSTOM_QUOTE" },
        { label: "Catalog Order", value: "CATALOG_ORDER" },
      ],
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
    { field: "createdAt", label: "Created", type: "INSTANT" },
    { field: "quoteValidUntil", label: "Valid Until", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Created" },
    { field: "finalAmountCharged", label: "Amount" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

const columns: DataColumn<OfferOrderSummaryResponse>[] = [
  { key: "quoteNumber", header: "Quote #", sortable: false },
  { key: "quoteTitle", header: "Title", sortable: false },
  { key: "recipient", header: "Recipient", sortable: false },
  { key: "status", header: "Status", sortable: false },
  { key: "finalAmountCharged", header: "Amount", sortable: true },
  { key: "quoteValidUntil", header: "Valid Until", sortable: false },
  { key: "createdBy", header: "Created By", sortable: false },
  { key: "createdAt", header: "Created", sortable: true },
]

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

export default function AdminQuotesView() {
  const router = useRouter()

  const search = useGenericSearch<OfferOrderSummaryResponse>({
    queryKey: "admin-custom-quotes",
    searchFn: adminSearchQuotes,
    config: FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Custom Quotes
          </h1>
          <p className="text-muted-foreground mt-1">
            Create bespoke quotes for clients and track them through to payment.
          </p>
        </div>
        <Button onClick={() => router.push(PATH_CONSTANTS.ADMIN_CUSTOM_QUOTE_NEW)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quote
        </Button>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(quote) => (
          <TableRow
            key={quote.orderId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`${PATH_CONSTANTS.ADMIN_CUSTOM_QUOTE_DETAIL}/${quote.orderId}`)}
          >
            <TableCell className="font-mono text-xs">{quote.quoteNumber ?? "—"}</TableCell>
            <TableCell className="font-medium text-sm">{quote.quoteTitle ?? "Custom quote"}</TableCell>
            <TableCell className="text-xs">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{quote.userName ?? "—"}</span>
                <span className="text-muted-foreground">{quote.targetEmail ?? ""}</span>
              </div>
            </TableCell>
            <TableCell>
              <OfferStatusBadge status={quote.status} />
            </TableCell>
            <TableCell className="font-medium text-sm">
              {formatAmount(quote.finalAmountCharged, quote.currency)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(quote.quoteValidUntil)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {quote.quoteCreatedByName ?? "—"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(quote.createdAt)}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
