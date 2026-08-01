"use client"

/**
 * TablePagination — minimal page controls for the lead-mail tables.
 *
 * Built here rather than added to `src/components/ui` or pulled from a dependency: the shadcn kit in
 * this project has no pagination primitive, and the two tables that need one (campaign history and
 * the send report) need exactly prev/next plus a position readout. A shared primitive or a new
 * package would both be more surface than the requirement.
 */

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TablePaginationProps {
  /** Zero-based, matching Spring's `Page.number`. */
  page: number
  totalPages: number
  totalElements: number
  /** Rows on the current page, used for the "showing X–Y" readout. */
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  /** Plural noun for the readout, e.g. "campaigns" or "recipients". */
  itemLabel?: string
}

export function TablePagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  isLoading = false,
  itemLabel = "items",
}: TablePaginationProps) {
  if (totalElements === 0) {
    return null
  }

  const first = page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, totalElements)
  const canGoBack = page > 0
  const canGoForward = page + 1 < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" /> Loading…
          </span>
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{first}</span>–
            <span className="font-medium text-foreground">{last}</span> of{" "}
            <span className="font-medium text-foreground">{totalElements}</span> {itemLabel}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack || isLoading}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        {/* Page numbers are announced rather than only implied by the disabled state, so the
            control is usable with a screen reader. */}
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {Math.max(1, totalPages)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward || isLoading}
          aria-label="Next page"
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
