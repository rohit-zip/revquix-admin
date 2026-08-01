/**
 * RecipientRow — the shared row model behind the Phase 3 audience builder.
 *
 * Excel/CSV upload, manual entry, and the user-search picker all populate the same array of these
 * rows into <RecipientReviewTable>, which is what lets one component do the reviewing, editing,
 * badging, and per-row deletion regardless of where a row came from (plan §9.3). The final
 * `recipients: LeadMailRecipientInput[]` sent to the backend is derived from this array by
 * `toRecipientInputs` below — only rows that are not removed, not a duplicate, and carry a
 * syntactically valid email make it into the payload.
 *
 * `id` is a client-only key. For parsed rows it is the backend's `rowId` (already unique and
 * stable within one parse response); for manually-added or user-search rows it is generated
 * locally, since those never went through a parse response that assigned one.
 */

import type { LeadMailAnnotatedEmail, LeadMailRecipientInput } from "../api/lead-mail.types"

export const RECIPIENT_SOURCE = {
  MANUAL: "MANUAL",
  EXCEL: "EXCEL",
  CSV: "CSV",
  USER_SEARCH: "USER_SEARCH",
} as const

export type RecipientSource = (typeof RECIPIENT_SOURCE)[keyof typeof RECIPIENT_SOURCE]

export interface RecipientRow {
  id: string
  email: string
  name: string | null
  source: RecipientSource
  /** Set once /recipients/annotate has answered for this row's email. Undefined = not yet checked. */
  annotation?: LeadMailAnnotatedEmail
  /** Set for a row that failed parse-time validation (e.g. malformed email in an uploaded sheet). */
  invalidReason?: string
  /** True if this row's email repeated an earlier row's within the same upload. */
  isDuplicate?: boolean
}

/** Deliberately permissive — mirrors the backend's own SIMPLE_EMAIL guard, not full RFC 5322. */
const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let localIdCounter = 0

/** Generates a client-only id for a row that did not arrive with a backend-assigned rowId. */
export function newLocalRowId(): string {
  localIdCounter += 1
  return `local-${Date.now()}-${localIdCounter}`
}

/**
 * @returns true if this row would actually be sent — has a syntactically valid email, is not
 * flagged invalid by the parser, and is not a detected duplicate. A row already known to be
 * unsubscribed is deliberately still "sendable" by this definition: exclusion for suppression is
 * enforced server-side (and does not exist at all until Phase 4), and the review table's job is to
 * surface the badge, not to silently filter rows the backend will make its own decision about.
 */
export function isSendableRow(row: RecipientRow): boolean {
  return !row.invalidReason && !row.isDuplicate && SIMPLE_EMAIL.test(row.email.trim())
}

/** Rows with no name on file — used for the "N recipients have no name" summary and bulk-remove action. */
export function isNamelessRow(row: RecipientRow): boolean {
  return !row.name || !row.name.trim()
}

/** Derives the final payload for POST /send or /campaigns/{id}/send from the review table's rows. */
export function toRecipientInputs(rows: RecipientRow[]): LeadMailRecipientInput[] {
  return rows.filter(isSendableRow).map((row) => ({
    email: row.email.trim().toLowerCase(),
    name: row.name?.trim() || null,
  }))
}

/**
 * Merges a batch of /recipients/annotate results into the existing rows, matched by lower-cased
 * email. Rows whose email is not present in `annotations` (e.g. a row added after the batch was
 * sent) are left with their previous annotation state untouched.
 */
export function applyAnnotations(rows: RecipientRow[], annotations: LeadMailAnnotatedEmail[]): RecipientRow[] {
  const byEmail = new Map(annotations.map((a) => [a.email.toLowerCase(), a]))
  return rows.map((row) => {
    const match = byEmail.get(row.email.trim().toLowerCase())
    return match ? { ...row, annotation: match } : row
  })
}
