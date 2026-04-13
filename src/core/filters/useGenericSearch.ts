/**
 * ─── CENTRALIZED FILTER HOOK ──────────────────────────────────────────────────
 *
 * A reusable React Query hook for any filter-based search endpoint.
 * Manages pagination, search, filters, range filters, join filters, and sorting.
 *
 * Usage:
 *   const result = useGenericSearch({
 *     queryKey: "user-search",
 *     searchFn: (request, params) => searchUsers(request, params),
 *     config: USER_FILTER_CONFIG,
 *   })
 *
 * @see docs/GENERIC_FILTER_INTEGRATION_GUIDE.md
 */

"use client"

import { useCallback, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type {
  FilterConfig,
  FilterCriteria,
  GenericFilterRequest,
  GenericFilterResponse,
  JoinFilterCriteria,
  PaginationParams,
  RangeFilterCriteria,
  SortCriteria,
} from "./filter.types"

// ─── Hook options ─────────────────────────────────────────────────────────────

export interface UseGenericSearchOptions<T> {
  /** Unique query key prefix for React Query cache */
  queryKey: string
  /** The API function to call — receives the filter request and pagination */
  searchFn: (
    request: GenericFilterRequest,
    params: PaginationParams,
  ) => Promise<GenericFilterResponse<T>>
  /** Field configuration for building the request */
  config: FilterConfig
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
  /**
   * Filters that are always merged into every request regardless of user state.
   * These are NOT exposed in the `filters` state and cannot be cleared by the user.
   */
  permanentFilters?: FilterCriteria[]
  /**
   * Range filters that are always merged into every request regardless of user state.
   * These are NOT exposed in the `rangeFilters` state and cannot be cleared by the user.
   */
  permanentRangeFilters?: RangeFilterCriteria[]
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseGenericSearchReturn<T> {
  // ── Data ────────────────────────────────────────────────────────────────
  data: GenericFilterResponse<T> | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null

  // ── Search ──────────────────────────────────────────────────────────────
  searchTerms: string[]
  setSearchTerms: (terms: string[]) => void
  searchInput: string
  setSearchInput: (input: string) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  clearSearch: () => void

  // ── Filters ─────────────────────────────────────────────────────────────
  filters: FilterCriteria[]
  addFilter: (filter: FilterCriteria) => void
  removeFilter: (field: string) => void
  clearFilters: () => void

  // ── Range Filters ───────────────────────────────────────────────────────
  rangeFilters: RangeFilterCriteria[]
  addRangeFilter: (filter: RangeFilterCriteria) => void
  removeRangeFilter: (field: string) => void
  clearRangeFilters: () => void

  // ── Join Filters ────────────────────────────────────────────────────────
  joinFilters: JoinFilterCriteria[]
  setJoinFilters: (filters: JoinFilterCriteria[]) => void
  addJoinFilter: (filter: JoinFilterCriteria) => void
  removeJoinFilter: (association: string, field: string) => void
  clearJoinFilters: () => void

  // ── Sort ────────────────────────────────────────────────────────────────
  sort: SortCriteria[]
  setSort: (sort: SortCriteria[]) => void
  toggleSort: (field: string) => void

  // ── Pagination ──────────────────────────────────────────────────────────
  page: number
  size: number
  setPage: (page: number) => void
  setSize: (size: number) => void
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean

  // ── Utilities ───────────────────────────────────────────────────────
  resetAll: () => void
  activeFilterCount: number
  request: GenericFilterRequest
  config: FilterConfig
  /** Manually refetch the current query */
  refetch: () => void
}

// ─── Hook implementation ──────────────────────────────────────────────────────

export function useGenericSearch<T>({
  queryKey,
  searchFn,
  config,
  enabled = true,
  permanentFilters = [],
  permanentRangeFilters = [],
}: UseGenericSearchOptions<T>): UseGenericSearchReturn<T> {
  const defaultSize = config.defaultPageSize ?? 20

  // ── State ─────────────────────────────────────────────────────────────────
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [filters, setFilters] = useState<FilterCriteria[]>([])
  const [rangeFilters, setRangeFilters] = useState<RangeFilterCriteria[]>([])
  const [joinFilters, setJoinFilters] = useState<JoinFilterCriteria[]>([])
  const [sort, setSort] = useState<SortCriteria[]>(config.defaultSort)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(defaultSize)

  // ── Build request ─────────────────────────────────────────────────────────
  const request = useMemo<GenericFilterRequest>(() => {
    const req: GenericFilterRequest = {}
    if (searchTerms.length > 0) req.searchCriteria = searchTerms
    const allFilters = [...permanentFilters, ...filters]
    if (allFilters.length > 0) req.filters = allFilters
    const allRangeFilters = [...permanentRangeFilters, ...rangeFilters]
    if (allRangeFilters.length > 0) req.rangeFilters = allRangeFilters
    if (joinFilters.length > 0) req.joinFilters = joinFilters
    if (sort.length > 0) req.sort = sort
    return req
  }, [searchTerms, permanentFilters, filters, permanentRangeFilters, rangeFilters, joinFilters, sort])

  // ── React Query ───────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: [queryKey, request, page, size],
    queryFn: () => searchFn(request, { page, size }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  })

  // ── Search helpers ────────────────────────────────────────────────────────
  const addSearchTerm = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setSearchTerms((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setSearchInput("")
    setPage(0)
  }, [])

  const removeSearchTerm = useCallback((term: string) => {
    setSearchTerms((prev) => prev.filter((t) => t !== term))
    setPage(0)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerms([])
    setSearchInput("")
    setPage(0)
  }, [])

  // ── Filter helpers ────────────────────────────────────────────────────────
  const addFilter = useCallback((filter: FilterCriteria) => {
    setFilters((prev) => {
      const without = prev.filter((f) => f.field !== filter.field)
      return [...without, filter]
    })
    setPage(0)
  }, [])

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field))
    setPage(0)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters([])
    setPage(0)
  }, [])

  // ── Range filter helpers ──────────────────────────────────────────────────
  const addRangeFilter = useCallback((filter: RangeFilterCriteria) => {
    setRangeFilters((prev) => {
      const without = prev.filter((f) => f.field !== filter.field)
      return [...without, filter]
    })
    setPage(0)
  }, [])

  const removeRangeFilter = useCallback((field: string) => {
    setRangeFilters((prev) => prev.filter((f) => f.field !== field))
    setPage(0)
  }, [])

  const clearRangeFilters = useCallback(() => {
    setRangeFilters([])
    setPage(0)
  }, [])

  // ── Join filter helpers ───────────────────────────────────────────────────
  const addJoinFilter = useCallback((filter: JoinFilterCriteria) => {
    setJoinFilters((prev) => {
      const without = prev.filter(
        (f) => !(f.association === filter.association && f.field === filter.field),
      )
      return [...without, filter]
    })
    setPage(0)
  }, [])

  const replaceJoinFilters = useCallback((filters: JoinFilterCriteria[]) => {
    setJoinFilters(filters)
    setPage(0)
  }, [])

  const removeJoinFilter = useCallback((association: string, field: string) => {
    setJoinFilters((prev) =>
      prev.filter((f) => !(f.association === association && f.field === field)),
    )
    setPage(0)
  }, [])

  const clearJoinFilters = useCallback(() => {
    setJoinFilters([])
    setPage(0)
  }, [])

  // ── Sort helpers ──────────────────────────────────────────────────────────
  const toggleSort = useCallback(
    (field: string) => {
      setSort((prev) => {
        const existing = prev.find((s) => s.field === field)
        if (!existing) return [{ field, direction: "ASC" }]
        if (existing.direction === "ASC") return [{ field, direction: "DESC" }]
        // remove — cycle back to default
        return config.defaultSort
      })
    },
    [config.defaultSort],
  )

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setSearchTerms([])
    setSearchInput("")
    setFilters([])
    setRangeFilters([])
    setJoinFilters([])
    setSort(config.defaultSort)
    setPage(0)
    setSize(defaultSize)
  }, [config.defaultSort, defaultSize])

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilterCount =
    searchTerms.length + filters.length + rangeFilters.length + joinFilters.length

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    searchTerms,
    setSearchTerms,
    searchInput,
    setSearchInput,
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
    clearRangeFilters,

    joinFilters,
    setJoinFilters: replaceJoinFilters,
    addJoinFilter,
    removeJoinFilter,
    clearJoinFilters,

    sort,
    setSort,
    toggleSort,

    page,
    size,
    setPage,
    setSize,
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    hasNext: query.data?.hasNext ?? false,
    hasPrevious: query.data?.hasPrevious ?? false,

    resetAll,
    activeFilterCount,
    request,
    config,
    refetch: () => { query.refetch() },
  }
}

