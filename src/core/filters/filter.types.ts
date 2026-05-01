/**
 * ─── CENTRALIZED GENERIC FILTER TYPES ─────────────────────────────────────────
 *
 * Shared request/response types for all filter-based search APIs.
 * Any endpoint that follows the GenericFilterRequest/Response pattern
 * (like POST /api/v1/user/search) should use these types.
 *
 * @see docs/GENERIC_FILTER_INTEGRATION_GUIDE.md for integration guide
 */

// ─── Operators ────────────────────────────────────────────────────────────────

export type FilterOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LIKE"
  | "IN"
  | "IS_NULL"
  | "IS_NOT_NULL"

export type SortDirection = "ASC" | "DESC"

// ─── Request Types ────────────────────────────────────────────────────────────

export interface FilterCriteria {
  field: string
  operator: FilterOperator
  value: string | number | boolean | string[]
}

export interface RangeFilterCriteria {
  field: string
  from?: string
  to?: string
}

export interface JoinFilterCriteria {
  association: string
  field: string
  operator: "EQUALS" | "IN" | "LIKE"
  value: string | string[]
}

/**
 * Range filter on a joined field (Phase 0 — userAuth.yearsOfExperience, etc.).
 */
export interface JoinRangeFilterCriteria {
  association: string
  field: string
  from?: string
  to?: string
}

export interface SortCriteria {
  field: string
  direction: SortDirection
  /**
   * Optional join association.
   * When set, the backend sorts on `{association}.{field}` (Phase 0).
   */
  association?: string
}

/**
 * Generic filter request body — all sections are optional.
 * Omitting a section means "no restriction". All sections are AND-combined.
 */
export interface GenericFilterRequest {
  searchCriteria?: string[]
  filters?: FilterCriteria[]
  rangeFilters?: RangeFilterCriteria[]
  joinFilters?: JoinFilterCriteria[]
  /** Range filters on joined fields — e.g. userAuth.yearsOfExperience (Phase 0). */
  joinRangeFilters?: JoinRangeFilterCriteria[]
  sort?: SortCriteria[]
}

// ─── Response Types ───────────────────────────────────────────────────────────

/**
 * Paginated response envelope returned by all filter-based search APIs.
 * The generic type parameter `T` represents the shape of each item.
 */
export interface GenericFilterResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// ─── Pagination Params ────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  size: number
}

// ─── Field Metadata (for building dynamic UI) ─────────────────────────────────

export type FieldType = "STRING" | "BOOLEAN" | "INTEGER" | "INSTANT"

export interface FilterFieldMeta {
  /** The field name as sent in the API request */
  field: string
  /** Human-readable label shown in the UI */
  label: string
  /** Data type of the field */
  type: FieldType
  /** Supported filter operators for this field (optional for range-only fields) */
  operators?: FilterOperator[]
  /** Whether this field supports range filtering (from/to) */
  allowRange?: boolean
  /** Whether this field is included in global keyword search */
  isSearchable?: boolean
  /** Whether this field can be sorted */
  allowSort?: boolean
  /** Predefined options for SELECT/IN type filters (e.g. boolean, enum) */
  options?: { label: string; value: string | boolean }[]
}

export interface JoinFilterFieldMeta {
  /** Association name (e.g. "roles") */
  association: string
  /** The field within the association */
  field: string
  /** Human-readable label */
  label: string
  /** Supported operators */
  operators: ("EQUALS" | "IN" | "LIKE")[]
  /** Predefined options for this join field */
  options?: { label: string; value: string }[]
}

/**
 * Complete field configuration for a filter-based search endpoint.
 *
 * When used with DataExplorer, provide `entityLabel`, `filterFields`,
 * `rangeFields`, and `joinFields` for the full filter UI.
 *
 * When used with just the useGenericSearch hook, a minimal config
 * with `defaultSort` and `defaultPageSize` is sufficient.
 */
export interface FilterConfig {
  /** Unique key identifying this filter configuration */
  key?: string
  /** Human-readable entity label (e.g. "Users", "Mentors") — required for DataExplorer */
  entityLabel?: string
  /** Fields available for direct filtering and sorting — used by DataExplorer filter popover */
  filterFields?: FilterFieldMeta[]
  /** Fields available for range filtering — used by DataExplorer filter popover */
  rangeFields?: FilterFieldMeta[]
  /** Join associations and their filterable fields — used by DataExplorer filter popover */
  joinFields?: JoinFilterFieldMeta[]
  /** Default sort applied when no sort is specified */
  defaultSort: SortCriteria[]
  /** Default page size */
  defaultPageSize?: number

  // ── Simplified config properties (used by view-level configs) ─────────
  /** Fields included in global keyword search (metadata only) */
  searchableFields?: string[]
  /** Alias for rangeFields — accepted for convenience */
  rangeFilterFields?: FilterFieldMeta[]
  /** Sortable field definitions */
  sortFields?: { field: string; label: string }[]
  /** Alias for joinFields — accepted for convenience */
  joinFilterFields?: JoinFilterFieldMeta[]
}

