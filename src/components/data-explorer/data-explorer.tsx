/**
 * ─── DATA EXPLORER ────────────────────────────────────────────────────────────
 *
 * A fully reusable, responsive component for searching, filtering, and
 * paginating data from any GenericFilterRequest-compatible API.
 *
 * Features:
 *   • Global keyword search with tag-style terms
 *   • Quick boolean/option filters
 *   • Join filters (e.g. by role)
 *   • Range filters for dates and numbers
 *   • Column sorting
 *   • Pagination with page size control
 *   • Responsive — collapses gracefully on mobile
 *   • Fully driven by FilterConfig — zero hardcoded fields
 *
 * Usage:
 *   <DataExplorer
 *     search={useGenericSearchReturn}
 *     columns={columns}
 *     renderRow={(item) => <TableRow>...</TableRow>}
 *   />
 */

"use client"

import React, { type ReactNode, type KeyboardEvent } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UseGenericSearchReturn } from "@/core/filters"
import type {
  FilterConfig,
  FilterCriteria,
  FilterFieldMeta,
  JoinFilterCriteria,
  JoinFilterFieldMeta,
  RangeFilterCriteria,
  SortCriteria,
} from "@/core/filters"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// ─── Column definition ───────────────────────────────────────────────────────

export interface DataColumn<T> {
  /** Unique key — matches the API field name when sortable */
  key: string
  /** Header label */
  header: string
  /** Whether this column is sortable */
  sortable?: boolean
  /** Whether to hide this column on mobile screens */
  hideOnMobile?: boolean
  /** Custom cell renderer — optional when using renderRow on DataExplorer */
  render?: (item: T) => ReactNode
}

// ─── Component props ─────────────────────────────────────────────────────────

interface DataExplorerProps<T> {
  /** The search hook return object */
  search: UseGenericSearchReturn<T>
  /** Column definitions */
  columns: DataColumn<T>[]
  /** Unique key extractor for each row — optional when using renderRow */
  getRowKey?: (item: T) => string
  /** Optional: render a full TableRow per item (alternative to column.render) */
  renderRow?: (item: T) => ReactNode
  /** Optional: custom empty state */
  emptyState?: ReactNode
  /** Optional: header actions (e.g. "Create User" button) */
  headerActions?: ReactNode
  /** Optional: title override */
  title?: string
  /** Optional: description override */
  description?: string
  /** Optional: callback when a row is clicked */
  onRowClick?: (item: T) => void
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DataExplorer<T>({
  search,
  columns,
  getRowKey,
  renderRow,
  emptyState,
  headerActions,
  title,
  description,
  onRowClick,
}: DataExplorerProps<T>) {
  const {
    config,
    data,
    isLoading,
    isFetching,

    searchInput,
    setSearchInput,
    searchTerms,
    addSearchTerm,
    removeSearchTerm,
    clearSearch,

    filters,
    addFilter,
    removeFilter,
    clearFilters,

    rangeFilters,
    addRangeFilter,
    removeRangeFilter,

    joinFilters,
    addJoinFilter,
    removeJoinFilter,

    sort,
    toggleSort,

    page,
    size,
    setPage,
    setSize,
    totalElements,
    totalPages,
    hasNext,
    hasPrevious,

    resetAll,
    activeFilterCount,
  } = search

  // ── Search input handler ──────────────────────────────────────────────────
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      addSearchTerm(searchInput.trim())
    }
  }

  // ── Sort icon ─────────────────────────────────────────────────────────────
  const getSortIcon = (field: string) => {
    const s = sort.find((item: SortCriteria) => item.field === field)
    if (!s) return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
    if (s.direction === "ASC") return <ArrowUp className="size-3.5" />
    return <ArrowDown className="size-3.5" />
  }

  // ── Pagination range ──────────────────────────────────────────────────────
  const startItem = totalElements === 0 ? 0 : page * size + 1
  const endItem = Math.min((page + 1) * size, totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title ?? config.entityLabel ?? "Results"}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${(config.entityLabel ?? "results").toLowerCase()}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter popover */}
            <FilterPopover
              config={config}
              filters={filters}
              addFilter={addFilter}
              removeFilter={removeFilter}
              rangeFilters={rangeFilters}
              addRangeFilter={addRangeFilter}
              removeRangeFilter={removeRangeFilter}
              joinFilters={joinFilters}
              addJoinFilter={addJoinFilter}
              removeJoinFilter={removeJoinFilter}
              activeFilterCount={activeFilterCount - searchTerms.length}
            />

            {/* Reset button */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active search terms */}
        {searchTerms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Search:</span>
            {searchTerms.map((term: string) => (
              <Badge key={term} variant="secondary" className="gap-1 pr-1">
                {term}
                <button
                  onClick={() => removeSearchTerm(term)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearSearch}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Active filters display */}
        <ActiveFiltersDisplay
          config={config}
          filters={filters}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
          rangeFilters={rangeFilters}
          removeRangeFilter={removeRangeFilter}
          joinFilters={joinFilters}
          removeJoinFilter={removeJoinFilter}
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.sortable && "cursor-pointer select-none hover:bg-muted/50",
                      col.hideOnMobile && "hidden md:table-cell",
                    )}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: size > 5 ? 5 : size }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(col.hideOnMobile && "hidden md:table-cell")}
                      >
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.content?.length ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    {emptyState ?? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="size-8 opacity-50" />
                        <p className="text-sm">No {(config.entityLabel ?? "results").toLowerCase()} found</p>
                        {activeFilterCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={resetAll}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : renderRow ? (
                // Custom row renderer
                data.content.map((item: T) => renderRow(item))
              ) : (
                // Column-based rendering
                data.content.map((item: T, idx: number) => (
                  <TableRow
                    key={getRowKey ? getRowKey(item) : String((item as Record<string, unknown>)?.["id"] ?? idx)}
                    className={cn(
                      isFetching && "opacity-60",
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                    )}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(col.hideOnMobile && "hidden md:table-cell")}
                      >
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)?.[col.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalElements > 0
            ? `Showing ${startItem}–${endItem} of ${totalElements}`
            : "No results"}
        </p>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="hidden text-xs text-muted-foreground sm:inline">Rows:</span>
            <Select
              value={String(size)}
              onValueChange={(v) => {
                setSize(Number(v))
                setPage(0)
              }}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!hasPrevious}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="min-w-20 text-center text-sm text-muted-foreground">
              {totalPages > 0 ? `${page + 1} / ${totalPages}` : "—"}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={!hasNext}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Popover ───────────────────────────────────────────────────────────

interface FilterPopoverProps {
  config: FilterConfig
  filters: FilterCriteria[]
  addFilter: (filter: FilterCriteria) => void
  removeFilter: (field: string) => void
  rangeFilters: RangeFilterCriteria[]
  addRangeFilter: (filter: RangeFilterCriteria) => void
  removeRangeFilter: (field: string) => void
  joinFilters: JoinFilterCriteria[]
  addJoinFilter: (filter: JoinFilterCriteria) => void
  removeJoinFilter: (association: string, field: string) => void
  activeFilterCount: number
}

// ─── Join text-input filter (for join fields with no predefined options) ──────

interface JoinTextFilterInputProps {
  jf: JoinFilterFieldMeta
  currentValue: string
  addJoinFilter: (filter: JoinFilterCriteria) => void
  removeJoinFilter: (association: string, field: string) => void
}

/**
 * Renders a text-input for join filter fields that support EQUALS/LIKE but have
 * no predefined option list (e.g. "User Email", "Mentor Name").
 *
 * Local state is used so the API is NOT called on every keystroke — the filter
 * is only applied when the user presses Enter or tabs/clicks away (onBlur).
 * An ×-button clears the field immediately.
 */
function JoinTextFilterInput({
  jf,
  currentValue,
  addJoinFilter,
  removeJoinFilter,
}: JoinTextFilterInputProps) {
  const [local, setLocal] = React.useState(currentValue)
  const supportsLike = jf.operators.includes("LIKE")

  // Sync local input when the filter is cleared externally (e.g. "Reset all")
  React.useEffect(() => {
    setLocal(currentValue)
  }, [currentValue])

  const apply = React.useCallback(() => {
    const trimmed = local.trim()
    if (!trimmed) {
      removeJoinFilter(jf.association, jf.field)
    } else {
      addJoinFilter({
        association: jf.association,
        field: jf.field,
        operator: supportsLike ? "LIKE" : "EQUALS",
        value: trimmed,
      })
    }
  }, [local, jf, supportsLike, addJoinFilter, removeJoinFilter])

  const handleClear = React.useCallback(() => {
    setLocal("")
    removeJoinFilter(jf.association, jf.field)
  }, [jf, removeJoinFilter])

  return (
    <div className="flex gap-1.5">
      <Input
        placeholder={supportsLike ? "Type and press Enter…" : "Exact value…"}
        className="h-8 flex-1 text-xs"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            apply()
          }
        }}
        onBlur={apply}
      />
      {local && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleClear}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function FilterPopover({
  config,
  filters,
  addFilter,
  removeFilter,
  rangeFilters,
  addRangeFilter,
  removeRangeFilter,
  joinFilters,
  addJoinFilter,
  removeJoinFilter,
  activeFilterCount,
}: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-85 max-h-[70vh] overflow-y-auto p-4 sm:w-95"
      >
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold">Filters</h4>

          {/* ── Boolean / Option filters ───────────────────────────────────── */}
          {(config.filterFields ?? [])
            .filter((f: FilterFieldMeta) => f.options && f.options.length > 0)
            .map((field: FilterFieldMeta) => {
              const current = filters.find(
                (fc: FilterCriteria) => fc.field === field.field,
              )
              return (
                <div key={field.field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <Select
                    value={current ? String(current.value) : "__all__"}
                    onValueChange={(v: string) => {
                      if (v === "__all__") {
                        removeFilter(field.field)
                      } else {
                        const opt = field.options!.find(
                          (o: { label: string; value: string | boolean }) =>
                            String(o.value) === v,
                        )
                        addFilter({
                          field: field.field,
                          operator: "EQUALS",
                          value: opt ? opt.value : v,
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {field.options!.map((opt: { label: string; value: string | boolean }) => (
                        <SelectItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}

          {/* ── Join filters (e.g. roles, user/mentor email) ───────────────── */}
          {(config.joinFields ?? []).map((jf: JoinFilterFieldMeta) => {
            const currentJoin = joinFilters.find(
              (f: JoinFilterCriteria) =>
                f.association === jf.association && f.field === jf.field,
            )

            // ── Text input: no predefined options → EQUALS / LIKE ─────────
            if (!jf.options || jf.options.length === 0) {
              const currentValue = currentJoin
                ? Array.isArray(currentJoin.value)
                  ? (currentJoin.value[0] ?? "")
                  : String(currentJoin.value)
                : ""
              return (
                <div key={`${jf.association}.${jf.field}`} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {jf.label}
                  </label>
                  {/*
                   * Key includes currentValue so the input re-mounts (and resets
                   * local state) whenever the filter is cleared externally.
                   */}
                  <JoinTextFilterInput
                    key={`${jf.association}.${jf.field}.${currentValue}`}
                    jf={jf}
                    currentValue={currentValue}
                    addJoinFilter={addJoinFilter}
                    removeJoinFilter={removeJoinFilter}
                  />
                </div>
              )
            }

            // ── Checkbox list: has predefined options → IN ─────────────────
            const selectedValues: string[] = currentJoin
              ? Array.isArray(currentJoin.value)
                ? currentJoin.value
                : [String(currentJoin.value)]
              : []

            return (
              <div key={`${jf.association}.${jf.field}`} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {jf.label}
                </label>
                <div className="flex flex-col gap-1">
                  {jf.options.map((opt: { label: string; value: string }) => {
                    const isChecked = selectedValues.includes(opt.value)
                    return (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked: boolean | "indeterminate") => {
                            let next: string[]
                            if (checked === true) {
                              next = [...selectedValues, opt.value]
                            } else {
                              next = selectedValues.filter((v: string) => v !== opt.value)
                            }
                            if (next.length === 0) {
                              removeJoinFilter(jf.association, jf.field)
                            } else {
                              addJoinFilter({
                                association: jf.association,
                                field: jf.field,
                                operator: "IN",
                                value: next,
                              })
                            }
                          }}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── Range filters ──────────────────────────────────────────────── */}
          {(config.rangeFields ?? config.rangeFilterFields ?? [])
            .filter((f: FilterFieldMeta) => f.type === "INSTANT")
            .map((field: FilterFieldMeta) => {
              const current = rangeFilters.find(
                (rf: RangeFilterCriteria) => rf.field === field.field,
              )
              return (
                <div key={field.field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      className="h-8 text-xs"
                      value={current?.from ? current.from.slice(0, 10) : ""}
                      onChange={(e) => {
                        const from = e.target.value
                          ? `${e.target.value}T00:00:00Z`
                          : undefined
                        if (!from && !current?.to) {
                          removeRangeFilter(field.field)
                        } else {
                          addRangeFilter({
                            field: field.field,
                            from,
                            to: current?.to,
                          })
                        }
                      }}
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      className="h-8 text-xs"
                      value={current?.to ? current.to.slice(0, 10) : ""}
                      onChange={(e) => {
                        const to = e.target.value
                          ? `${e.target.value}T23:59:59Z`
                          : undefined
                        if (!to && !current?.from) {
                          removeRangeFilter(field.field)
                        } else {
                          addRangeFilter({
                            field: field.field,
                            from: current?.from,
                            to,
                          })
                        }
                      }}
                    />
                  </div>
                </div>
              )
            })}

          {/* ── Numeric range filters ──────────────────────────────────────── */}
          {(config.rangeFields ?? config.rangeFilterFields ?? [])
            .filter((f: FilterFieldMeta) => f.type === "INTEGER")
            .map((field: FilterFieldMeta) => {
              const current = rangeFilters.find(
                (rf: RangeFilterCriteria) => rf.field === field.field,
              )
              return (
                <div key={field.field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="h-8 text-xs"
                      value={current?.from ?? ""}
                      onChange={(e) => {
                        const from = e.target.value || undefined
                        if (!from && !current?.to) {
                          removeRangeFilter(field.field)
                        } else {
                          addRangeFilter({
                            field: field.field,
                            from,
                            to: current?.to,
                          })
                        }
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      className="h-8 text-xs"
                      value={current?.to ?? ""}
                      onChange={(e) => {
                        const to = e.target.value || undefined
                        if (!to && !current?.from) {
                          removeRangeFilter(field.field)
                        } else {
                          addRangeFilter({
                            field: field.field,
                            from: current?.from,
                            to,
                          })
                        }
                      }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Active Filters Display ───────────────────────────────────────────────────

interface ActiveFiltersDisplayProps {
  config: FilterConfig
  filters: FilterCriteria[]
  removeFilter: (field: string) => void
  clearFilters: () => void
  rangeFilters: RangeFilterCriteria[]
  removeRangeFilter: (field: string) => void
  joinFilters: JoinFilterCriteria[]
  removeJoinFilter: (association: string, field: string) => void
}

function ActiveFiltersDisplay({
  config,
  filters,
  removeFilter,
  clearFilters,
  rangeFilters,
  removeRangeFilter,
  joinFilters,
  removeJoinFilter,
}: ActiveFiltersDisplayProps) {
  const hasAny = filters.length > 0 || rangeFilters.length > 0 || joinFilters.length > 0
  if (!hasAny) return null

  const getFieldLabel = (field: string): string => {
    const f =
      (config.filterFields ?? []).find((ff: FilterFieldMeta) => ff.field === field) ??
      (config.rangeFields ?? config.rangeFilterFields ?? []).find((ff: FilterFieldMeta) => ff.field === field)
    return f?.label ?? field
  }

  const getOptionLabel = (field: string, value: unknown): string => {
    const f = (config.filterFields ?? []).find((ff: FilterFieldMeta) => ff.field === field)
    if (f?.options) {
      const opt = f.options.find(
        (o: { label: string; value: string | boolean }) => String(o.value) === String(value),
      )
      if (opt) return opt.label
    }
    return String(value)
  }

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return iso
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Active:</span>

      {/* Direct filters */}
      {filters.map((f: FilterCriteria) => (
        <Badge key={f.field} variant="outline" className="gap-1 pr-1">
          <span className="font-medium">{getFieldLabel(f.field)}:</span>{" "}
          {getOptionLabel(f.field, f.value)}
          <button
            onClick={() => removeFilter(f.field)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {/* Range filters */}
      {rangeFilters.map((f: RangeFilterCriteria) => (
        <Badge key={f.field} variant="outline" className="gap-1 pr-1">
          <span className="font-medium">{getFieldLabel(f.field)}:</span>{" "}
          {f.from && f.to
            ? `${formatDate(f.from)} – ${formatDate(f.to)}`
            : f.from
              ? `from ${formatDate(f.from)}`
              : `to ${formatDate(f.to!)}`}
          <button
            onClick={() => removeRangeFilter(f.field)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {/* Join filters */}
      {joinFilters.map((f: JoinFilterCriteria) => {
        const jfMeta = (config.joinFields ?? config.joinFilterFields ?? []).find(
          (jf: JoinFilterFieldMeta) =>
            jf.association === f.association && jf.field === f.field,
        )
        const values: string[] = Array.isArray(f.value) ? f.value : [f.value]
        const labels = values.map((v: string) => {
          const opt = jfMeta?.options?.find(
            (o: { label: string; value: string }) => o.value === v,
          )
          return opt?.label ?? v
        })
        return (
          <Badge
            key={`${f.association}.${f.field}`}
            variant="outline"
            className="gap-1 pr-1"
          >
            <span className="font-medium">{jfMeta?.label ?? f.field}:</span>{" "}
            {labels.join(", ")}
            <button
              onClick={() => removeJoinFilter(f.association, f.field)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="size-3" />
            </button>
          </Badge>
        )
      })}

      <button
        onClick={() => {
          clearFilters()
          rangeFilters.forEach((f: RangeFilterCriteria) => removeRangeFilter(f.field))
          joinFilters.forEach((f: JoinFilterCriteria) =>
            removeJoinFilter(f.association, f.field),
          )
        }}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}

