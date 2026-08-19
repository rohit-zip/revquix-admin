/**
 * ─── USER SEARCH PICKER ───────────────────────────────────────────────────────
 *
 * Search-as-you-type pickers for choosing registered users by **name, username or email** — one for
 * a single user, one for a cohort. Every admin console that acts on a user takes a `USR…` id, which
 * is the one field an operator cannot type from memory; these replace the raw-id boxes that used to
 * stand in for it.
 *
 * ── The search function is injected, and that is the point ───────────────────
 * These components deliberately do NOT know which endpoint they call. Each console has its own
 * least-privilege lookup guarded by that console's own permission — credits has one under
 * `PERM_MANAGE_CREDITS`, custom quotes has one under `PERM_MANAGE_CUSTOM_QUOTES` — precisely so that
 * neither has to require `PERM_MANAGE_USER_ROLES`, which is what the general `POST /user/search`
 * demands. Hard-coding one fetcher in here would quietly re-couple them and hand whichever console
 * lost the argument a 403 on its own form. So: pass `search`.
 *
 * ── Stale-response guard ────────────────────────────────────────────────────
 * Debouncing narrows the window but does not close it: type "ro", pause past the debounce, then type
 * "rohit", and if the first request is slower than the second its results land last and the list
 * shows matches for a query the operator has already moved on from. Each run takes a sequence number
 * and only the newest is allowed to write state.
 */

"use client"

import * as React from "react"
import { Check, Loader2, Search, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { getInitials } from "@/components/user-avatar"
import { cn } from "@/lib/utils"

/**
 * The shape every console's lookup returns. Structural, so a richer payload (the user-admin
 * `AdminUserResponse`, say) satisfies it without a cast or a mapping step.
 */
export interface UserSearchOption {
  userId: string
  name: string | null
  username: string | null
  email: string
  avatarUrl?: string | null
}

export type UserSearchFn<T extends UserSearchOption = UserSearchOption> = (
  query: string,
) => Promise<T[]>

/** Below this the backend returns nothing anyway; saying so beats an empty dropdown. */
const MIN_QUERY = 2
const DEBOUNCE_MS = 300

// ─── Shared search state ──────────────────────────────────────────────────────

function useUserSearch<T extends UserSearchOption>(search: UserSearchFn<T>, query: string) {
  const [results, setResults] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  // Monotonic, so a response that resolves out of order can be recognised and dropped.
  const runRef = React.useRef(0)

  React.useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY) {
      runRef.current += 1 // invalidate anything in flight
      setResults([])
      setLoading(false)
      setFailed(false)
      return
    }

    const run = ++runRef.current
    setLoading(true)
    setFailed(false)

    const timer = setTimeout(async () => {
      try {
        const users = await search(trimmed)
        if (run !== runRef.current) return
        setResults(users)
      } catch {
        if (run !== runRef.current) return
        // Surfaced rather than swallowed: a 403 here means this console's operator lacks the
        // lookup permission, and "No matching users found" would send them hunting for a user
        // that exists.
        setResults([])
        setFailed(true)
      } finally {
        if (run === runRef.current) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, search])

  return { results, loading, failed }
}

function displayName(user: UserSearchOption): string {
  return user.name ?? user.username ?? user.userId
}

function UserGlyph({ user, className }: { user: UserSearchOption; className?: string }) {
  return (
    <Avatar className={cn("size-7 shrink-0 border border-primary-200 dark:border-primary-800", className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary-100 text-[10px] font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * The dropdown body. Split out because the single and multi pickers differ only in what a row click
 * does and whether the input survives selection.
 */
function ResultRows<T extends UserSearchOption>({
  query,
  results,
  loading,
  failed,
  disabledIds,
  onPick,
}: {
  query: string
  results: T[]
  loading: boolean
  failed: boolean
  disabledIds?: Set<string>
  onPick: (user: T) => void
}) {
  const trimmed = query.trim()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Searching…
      </div>
    )
  }
  if (trimmed.length < MIN_QUERY) {
    return <p className="px-2 py-3 text-xs text-muted-foreground">Type at least {MIN_QUERY} characters…</p>
  }
  if (failed) {
    return (
      <p className="px-2 py-3 text-sm text-destructive">
        Could not search users. You may not have permission to look users up on this console.
      </p>
    )
  }
  if (results.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-muted-foreground">
        No user matches “{trimmed}”. Try an email, a username, or paste the user id.
      </p>
    )
  }

  return (
    <>
      {results.map((user) => {
        const alreadyPicked = disabledIds?.has(user.userId) ?? false
        return (
          <button
            key={user.userId}
            type="button"
            disabled={alreadyPicked}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm",
              alreadyPicked ? "opacity-60" : "hover:bg-muted",
            )}
            onClick={() => onPick(user)}
          >
            <UserGlyph user={user} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{displayName(user)}</p>
              {/*
                Username and email on one line, because the whole reason an operator is here is that
                two accounts can share a display name and only these tell them apart.
              */}
              <p className="truncate text-xs text-muted-foreground">
                {user.username ? `@${user.username} · ` : ""}
                {user.email}
              </p>
            </div>
            {alreadyPicked && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
          </button>
        )
      })}
    </>
  )
}

// ─── Single ───────────────────────────────────────────────────────────────────

interface UserSearchComboboxProps<T extends UserSearchOption> {
  search: UserSearchFn<T>
  /** The resolved selection, rendered as a chip in place of the input. */
  selectedUser?: T | null
  onSelect: (user: T | null) => void
  placeholder?: string
  disabled?: boolean
  /** Forwarded to the input so a `<Label htmlFor>` can point at it. */
  id?: string
}

export function UserSearchCombobox<T extends UserSearchOption>({
  search,
  selectedUser,
  onSelect,
  placeholder = "Search by name, username or email…",
  disabled,
  id,
}: UserSearchComboboxProps<T>) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const { results, loading, failed } = useUserSearch(search, query)

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserGlyph user={selectedUser} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName(selectedUser)}</p>
            {/*
              The id is shown even though it is no longer typed. It is what every endpoint behind
              this form actually receives, and an operator about to move credits should be able to
              read back the exact account without opening another screen.
            */}
            <p className="truncate font-mono text-xs text-muted-foreground">{selectedUser.userId}</p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Clear selected user ${displayName(selectedUser)}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={id}
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            className="pl-8"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => query.trim().length >= MIN_QUERY && setOpen(true)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-h-64 overflow-y-auto p-1"
        // Without this the popover steals focus from the input on every keystroke-triggered open.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <ResultRows
          query={query}
          results={results}
          loading={loading}
          failed={failed}
          onPick={(user) => {
            onSelect(user)
            setOpen(false)
            setQuery("")
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── Multi ────────────────────────────────────────────────────────────────────

interface UserSearchMultiPickerProps<T extends UserSearchOption> {
  search: UserSearchFn<T>
  selected: T[]
  onChange: (users: T[]) => void
  /** Soft cap, mirroring whatever the endpoint enforces. Over it, the input stops accepting. */
  max?: number
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function UserSearchMultiPicker<T extends UserSearchOption>({
  search,
  selected,
  onChange,
  max,
  placeholder = "Search by name, username or email…",
  disabled,
  id,
}: UserSearchMultiPickerProps<T>) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const { results, loading, failed } = useUserSearch(search, query)

  const selectedIds = React.useMemo(
    () => new Set(selected.map((user) => user.userId)),
    [selected],
  )
  const full = max !== undefined && selected.length >= max

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={id}
              value={query}
              disabled={disabled || full}
              placeholder={full ? `Limit of ${max} reached` : placeholder}
              className="pl-8"
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onFocus={() => query.trim().length >= MIN_QUERY && setOpen(true)}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) max-h-64 overflow-y-auto p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <ResultRows
            query={query}
            results={results}
            loading={loading}
            failed={failed}
            disabledIds={selectedIds}
            onPick={(user) => {
              if (selectedIds.has(user.userId)) return
              onChange([...selected, user])
              // The input is NOT closed or cleared: adding people to a cohort is a repeated action,
              // and "priya" then "prakash" usually share a prefix worth keeping.
              setQuery("")
            }}
          />
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <li key={user.userId}>
              <Badge variant="secondary" className="gap-1.5 py-1 pl-1.5 pr-1 font-normal">
                <UserGlyph user={user} className="size-5" />
                <span className="max-w-40 truncate">{displayName(user)}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(selected.filter((u) => u.userId !== user.userId))}
                    className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label={`Remove ${displayName(user)}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
