/**
 * ─── USER SEARCH COMBOBOX ─────────────────────────────────────────────────────
 *
 * Lightweight search-as-you-type picker for selecting an existing registered
 * user by email / username / name. Backed by POST /user/search (reused as-is —
 * see src/features/user/api/user-search.api.ts).
 *
 * Used by the Custom Quote wizard to let admins pick a recipient or reviewer
 * from existing users instead of only typing a raw user ID / email.
 */

"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2, Search, User as UserIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { lookupUsers } from "../api/quote.api"
import type { AdminUserResponse } from "@/features/user/api/user-search.types"

interface UserSearchComboboxProps {
  /** Currently selected user (if resolved), used to render the "selected" chip. */
  selectedUser?: AdminUserResponse | null
  onSelect: (user: AdminUserResponse | null) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSearchCombobox({
  selectedUser,
  onSelect,
  placeholder = "Search by name, email or username…",
  disabled,
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<AdminUserResponse[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await lookupUsers(trimmed)
        setResults(users)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{selectedUser.name ?? selectedUser.username}</p>
            <p className="truncate text-xs text-muted-foreground">{selectedUser.email}</p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear selected user"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            className="pl-8"
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-h-64 overflow-y-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching…
          </div>
        )}
        {!loading && query.trim().length < 2 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Type at least 2 characters…</p>
        )}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">No matching users found.</p>
        )}
        {!loading &&
          results.map((u) => (
            <button
              key={u.userId}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(u)
                setOpen(false)
                setQuery("")
              }}
            >
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name ?? u.username ?? u.userId}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Check className="h-3.5 w-3.5 shrink-0 opacity-0" />
            </button>
          ))}
      </PopoverContent>
    </Popover>
  )
}
