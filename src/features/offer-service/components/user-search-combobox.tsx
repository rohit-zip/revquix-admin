/**
 * ─── USER SEARCH COMBOBOX (custom quotes) ────────────────────────────────────
 *
 * The quote wizard's recipient/reviewer picker: the shared picker bound to this console's own
 * lookup endpoint.
 *
 * The component itself now lives in `@/components/user-search-picker`, shared with the credit
 * console. Only the *fetcher* differs, and it has to: this one is guarded by
 * `PERM_MANAGE_CUSTOM_QUOTES` and the credit one by `PERM_MANAGE_CREDITS`, so that neither console
 * has to require `PERM_MANAGE_USER_ROLES` to fill in a user field. Binding the endpoint here — a
 * file that already belongs to this feature — is what keeps that boundary visible.
 */

"use client"

import { UserSearchCombobox as SharedUserSearchCombobox } from "@/components/user-search-picker"
import type { AdminUserResponse } from "@/features/user/api/user-search.types"

import { lookupUsers } from "../api/quote.api"

interface UserSearchComboboxProps {
  selectedUser?: AdminUserResponse | null
  onSelect: (user: AdminUserResponse | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function UserSearchCombobox(props: UserSearchComboboxProps) {
  return <SharedUserSearchCombobox {...props} search={lookupUsers} />
}
