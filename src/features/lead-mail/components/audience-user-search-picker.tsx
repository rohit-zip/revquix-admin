"use client"

/**
 * AudienceUserSearchPicker — paginated Revquix-user search-and-select behind the compose wizard's
 * "Search users" audience tab (Phase 3, requirement 4).
 *
 * Distinct from the existing 8-result autocomplete (<LeadMailRecipientInput>, used for quick single
 * adds on the legacy single-page compose form): this is a full paginated, checkbox-multi-select
 * table backed by GET /audience/users, for building a real audience out of many matched accounts
 * at once rather than adding one address at a time.
 */

import { useState } from "react"
import { Loader2, Search, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDebouncedValue } from "../use-debounced-value"
import { useLeadMailAudienceUsers } from "../api/lead-mail.hooks"
import type { LeadMailAudienceUserResponse } from "../api/lead-mail.types"
import { newLocalRowId, RECIPIENT_SOURCE, type RecipientRow } from "./recipient-row"
import { TablePagination } from "./table-pagination"

const PAGE_SIZE = 20

interface AudienceUserSearchPickerProps {
  existingRows: RecipientRow[]
  onAddSelected: (rows: RecipientRow[]) => void
  disabled?: boolean
}

export function AudienceUserSearchPicker({ existingRows, onAddSelected, disabled }: AudienceUserSearchPickerProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Map<string, LeadMailAudienceUserResponse>>(new Map())
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isFetching, isLoading } = useLeadMailAudienceUsers(page, PAGE_SIZE, { q: debouncedSearch })

  const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase()))
  const users = data?.content ?? []

  const toggleUser = (user: LeadMailAudienceUserResponse, checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (checked) next.set(user.userId, user)
      else next.delete(user.userId)
      return next
    })
  }

  const handleAddSelected = () => {
    const rows: RecipientRow[] = Array.from(selected.values())
      .filter((user) => !existingEmails.has(user.email.toLowerCase()))
      .map((user) => ({
        id: newLocalRowId(),
        email: user.email.toLowerCase(),
        name: user.name,
        source: RECIPIENT_SOURCE.USER_SEARCH,
        annotation: {
          email: user.email.toLowerCase(),
          unsubscribed: user.unsubscribed,
          unsubscribedAt: null,
          isRevquixUser: true,
          userId: user.userId,
          name: user.name,
        },
      }))
    onAddSelected(rows)
    setSelected(new Map())
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search by name, username, or email…"
          className="pl-8"
          disabled={disabled}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9" />
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto size-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {debouncedSearch.trim() ? "No matching users." : "Start typing to search Revquix users."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const alreadyAdded = existingEmails.has(user.email.toLowerCase())
                return (
                  <TableRow key={user.userId} className={alreadyAdded ? "opacity-50" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(user.userId)}
                        onCheckedChange={(checked) => toggleUser(user, checked === true)}
                        disabled={disabled || alreadyAdded}
                        aria-label={`Select ${user.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
                          <AvatarFallback className="text-[10px]">
                            {(user.name || user.username || "?").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{user.name ?? "—"}</p>
                          <p className="truncate text-[10px] text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">{user.email}</TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
        <TablePagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isFetching}
          itemLabel="users"
        />
      )}

      <div className="flex items-center justify-end">
        <Button type="button" onClick={handleAddSelected} disabled={disabled || selected.size === 0} className="gap-1.5">
          <UserPlus className="size-4" /> Add {selected.size > 0 ? selected.size : ""} selected
        </Button>
      </div>
    </div>
  )
}
