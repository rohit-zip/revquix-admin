"use client"

/**
 * RecipientReviewTable — the shared, reviewable recipient list behind every audience mode in the
 * compose wizard's Audience step (Phase 3, requirements 2, 3, 4, 11; plan §9.3).
 *
 * Excel/CSV upload, manual entry, and the user-search picker all feed rows into the same
 * `RecipientRow[]` (see ./recipient-row.ts) and hand it to this one component, which is what lets
 * a single implementation cover "reviewable parsed-Excel/CSV table with per-row delete"
 * (requirement 2) and "real manual entry" (requirement 3) without duplicating the table, the
 * badges, or the bulk actions per audience mode.
 *
 * Client-side paginated at 50 rows — no `pagination`/`data-table` primitive exists in the UI kit,
 * and the already-built <TablePagination> (Phase 2) is reused rather than adding a dependency.
 */

import { useMemo, useState } from "react"
import { AlertCircle, Copy, Loader2, Search, Trash2, UserCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TablePagination } from "./table-pagination"
import { isNamelessRow, isSendableRow, type RecipientRow, type RecipientSource } from "./recipient-row"

const PAGE_SIZE = 50

const SOURCE_LABELS: Record<RecipientSource, string> = {
  MANUAL: "Manual",
  EXCEL: "Excel",
  CSV: "CSV",
  USER_SEARCH: "Search",
}

interface RecipientReviewTableProps {
  rows: RecipientRow[]
  onChange: (rows: RecipientRow[]) => void
  /** Shown next to the row count while a batch of /recipients/annotate is in flight. */
  isAnnotating?: boolean
  disabled?: boolean
}

export function RecipientReviewTable({ rows, onChange, isAnnotating, disabled }: RecipientReviewTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "unsubscribed" | "nameless" | "duplicate" | "invalid">(
    "all",
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (needle && !row.email.toLowerCase().includes(needle) && !row.name?.toLowerCase().includes(needle)) {
        return false
      }
      switch (statusFilter) {
        case "unsubscribed":
          return row.annotation?.unsubscribed === true
        case "nameless":
          return isNamelessRow(row)
        case "duplicate":
          return row.isDuplicate === true
        case "invalid":
          return !!row.invalidReason
        default:
          return true
      }
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE)

  const sendableCount = useMemo(() => rows.filter(isSendableRow).length, [rows])
  const namelessCount = useMemo(() => rows.filter(isNamelessRow).length, [rows])
  const unsubscribedCount = useMemo(() => rows.filter((r) => r.annotation?.unsubscribed).length, [rows])
  const duplicateCount = useMemo(() => rows.filter((r) => r.isDuplicate).length, [rows])
  const invalidCount = useMemo(() => rows.filter((r) => r.invalidReason).length, [rows])

  const pageRowIds = new Set(pageRows.map((r) => r.id))
  const selectedOnPage = pageRows.filter((r) => selectedIds.has(r.id)).length
  const allOnPageSelected = pageRows.length > 0 && selectedOnPage === pageRows.length

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of pageRowIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const removeRows = (ids: Set<string>) => {
    onChange(rows.filter((r) => !ids.has(r.id)))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.delete(id)
      return next
    })
  }

  const removeSelected = () => removeRows(selectedIds)
  const removeUnsubscribed = () => removeRows(new Set(rows.filter((r) => r.annotation?.unsubscribed).map((r) => r.id)))
  const removeNameless = () => removeRows(new Set(rows.filter(isNamelessRow).map((r) => r.id)))
  const removeDuplicates = () => removeRows(new Set(rows.filter((r) => r.isDuplicate).map((r) => r.id)))

  const updateName = (id: string, name: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, name: name.trim() || null } : r)))
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Search email or name…"
            className="pl-8"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "All"],
              ["unsubscribed", `Unsubscribed (${unsubscribedCount})`],
              ["nameless", `No name (${namelessCount})`],
              ["duplicate", `Duplicates (${duplicateCount})`],
              ["invalid", `Invalid (${invalidCount})`],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => {
                setStatusFilter(value)
                setPage(0)
              }}
              disabled={disabled}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground" aria-live="polite">
          {isAnnotating ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" /> Checking recipients…
            </span>
          ) : (
            <>
              <span className="font-medium text-foreground">{sendableCount}</span> will be sent of{" "}
              <span className="font-medium text-foreground">{rows.length}</span> total
            </>
          )}
        </span>
        {selectedIds.size > 0 && (
          <Button type="button" size="sm" variant="destructive" className="h-7 gap-1 px-2" onClick={removeSelected} disabled={disabled}>
            <Trash2 className="size-3" /> Remove {selectedIds.size} selected
          </Button>
        )}
        {unsubscribedCount > 0 && (
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={removeUnsubscribed} disabled={disabled}>
            <X className="size-3" /> Remove all unsubscribed
          </Button>
        )}
        {namelessCount > 0 && (
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={removeNameless} disabled={disabled}>
            <X className="size-3" /> Remove all without a name
          </Button>
        )}
        {duplicateCount > 0 && (
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={removeDuplicates} disabled={disabled}>
            <X className="size-3" /> Remove all duplicates
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={(checked) => toggleAllOnPage(checked === true)}
                  disabled={disabled || pageRows.length === 0}
                  aria-label="Select all rows on this page"
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-9" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No recipients yet." : "No rows match this filter."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id} className={cn(!isSendableRow(row) && "bg-muted/30")}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={(checked) => toggleRow(row.id, checked === true)}
                      disabled={disabled}
                      aria-label={`Select ${row.email}`}
                    />
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate font-mono text-xs" title={row.email}>
                    {row.email}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        autoFocus
                        defaultValue={row.name ?? ""}
                        className="h-7 w-40 text-xs"
                        disabled={disabled}
                        onBlur={(e) => {
                          updateName(row.id, e.target.value)
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur()
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => !disabled && setEditingId(row.id)}
                        className={cn(
                          "rounded px-1 py-0.5 text-left text-xs hover:bg-muted",
                          !row.name && "italic text-muted-foreground",
                        )}
                        disabled={disabled}
                      >
                        {row.name || "Click to add a name"}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {SOURCE_LABELS[row.source]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RowStatusBadges row={row} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      onClick={() => removeRows(new Set([row.id]))}
                      disabled={disabled}
                      aria-label={`Remove ${row.email}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={clampedPage}
        totalPages={totalPages}
        totalElements={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="recipients"
      />
    </div>
  )
}

/** One row's status badges — a row can carry more than one at once (e.g. duplicate AND nameless). */
function RowStatusBadges({ row }: { row: RecipientRow }) {
  const badges: React.ReactNode[] = []

  if (row.invalidReason) {
    badges.push(
      <Badge key="invalid" variant="destructive" className="gap-1 text-[10px]">
        <AlertCircle className="size-3" /> Invalid
      </Badge>,
    )
  }
  if (row.isDuplicate) {
    badges.push(
      <Badge key="duplicate" variant="outline" className="gap-1 border-muted-foreground/30 text-[10px] text-muted-foreground">
        <Copy className="size-3" /> Duplicate
      </Badge>,
    )
  }
  if (row.annotation?.unsubscribed) {
    badges.push(
      <Badge key="unsubscribed" variant="destructive" className="gap-1 text-[10px]">
        <X className="size-3" /> Unsubscribed
      </Badge>,
    )
  }
  if (isNamelessRow(row) && !row.invalidReason) {
    badges.push(
      <Badge
        key="nameless"
        variant="outline"
        className="gap-1 border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-400"
      >
        No name
      </Badge>,
    )
  }
  if (row.annotation?.isRevquixUser) {
    badges.push(
      <Badge
        key="revquix-user"
        variant="outline"
        className="gap-1 border-blue-500/30 text-[10px] text-blue-600 dark:text-blue-400"
      >
        <UserCheck className="size-3" /> Revquix user
      </Badge>,
    )
  }

  if (badges.length === 0) {
    return <span className="text-[10px] text-muted-foreground">—</span>
  }
  return <div className="flex flex-wrap gap-1">{badges}</div>
}
