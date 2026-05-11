/**
 * ─── ADMIN ALL PROFESSIONAL MENTORS VIEW ─────────────────────────────────────
 *
 * Lists all active professional mentors. Each row links to the user detail page
 * (/users/{userId}) which includes the "Professional Mentor" tab added in Phase 4.
 *
 * Uses the public search endpoint (POST /public/mentors/search) via searchMentors.
 * Sort and search are handled server-side via GenericFilterRequest.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpDown,
  Briefcase,
  Clock,
  RotateCcw,
  Search,
  Star,
  Users,
  Video,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchMentors } from "@/features/professional-mentor/api/professional-mentor.api"
import type { PublicMentorCard } from "@/features/professional-mentor/api/professional-mentor.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Filter Config ────────────────────────────────────────────────────────────

const MENTOR_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["headline", "bio", "currentCompany", "currentRole"],
  filterFields: [
    {
      field: "isAcceptingBookings",
      label: "Accepting Bookings",
      type: "BOOLEAN",
      operators: ["EQUALS"],
    },
  ],
  rangeFilterFields: [
    { field: "averageRating", label: "Rating", type: "INTEGER" },
    { field: "priceInrPaise", label: "Mock Price (₹)", type: "INTEGER" },
  ],
  sortFields: [
    { field: "averageRating", label: "Rating" },
    { field: "totalSessions", label: "Sessions" },
    { field: "priceInrPaise", label: "Mock Price (INR)" },
  ],
  defaultSort: [{ field: "averageRating", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "averageRating-DESC", label: "Highest Rated", field: "averageRating", direction: "DESC" as const },
  { value: "averageRating-ASC",  label: "Lowest Rated",  field: "averageRating", direction: "ASC" as const },
  { value: "totalSessions-DESC", label: "Most Sessions", field: "totalSessions", direction: "DESC" as const },
  { value: "experience-DESC",    label: "Most Experienced", field: "yearsOfExperience", direction: "DESC" as const, association: "userAuth" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatInr(paise: number | null) {
  if (paise == null || paise === 0) return "—"
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAllMentorsView() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")

  const search = useGenericSearch<PublicMentorCard>({
    queryKey: "admin-all-professional-mentors",
    searchFn: searchMentors,
    config: MENTOR_FILTER_CONFIG,
  })

  const currentSortValue = (() => {
    if (search.sort.length === 0) return "averageRating-DESC"
    const s = search.sort[0]
    const opt = SORT_OPTIONS.find(
      (o) => o.field === s.field && o.direction === s.direction && (o.association ?? null) === (s.association ?? null),
    )
    return opt?.value ?? "averageRating-DESC"
  })()

  function handleSearch() {
    const term = searchInput.trim()
    if (term) {
      search.setSearchTerms([term])
    } else {
      search.clearSearch()
    }
  }

  function handleClear() {
    setSearchInput("")
    search.clearSearch()
  }

  function handleSortChange(value: string) {
    const opt = SORT_OPTIONS.find((o) => o.value === value)
    if (opt) {
      search.setSort([{ field: opt.field, direction: opt.direction, ...(opt.association && { association: opt.association }) }])
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="size-6" />
          All Professional Mentors
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and manage all registered professional mentors.
          Click a row to view the user's full profile.
        </p>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search headline, company, role…"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
          {searchInput && (
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
        <Select value={currentSortValue} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48">
            <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      {!search.isLoading && (
        <p className="text-sm text-muted-foreground">
          {search.totalElements} mentor{search.totalElements !== 1 ? "s" : ""} found
        </p>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead className="hidden md:table-cell">Role / Company</TableHead>
                <TableHead className="hidden sm:table-cell">Services</TableHead>
                <TableHead className="hidden lg:table-cell">Rating</TableHead>
                <TableHead className="hidden lg:table-cell">Sessions</TableHead>
                <TableHead className="hidden xl:table-cell">Mock Price</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {search.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (search.data?.content.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No mentors found.
                  </TableCell>
                </TableRow>
              ) : (
                search.data!.content.map((mentor) => (
                  <MentorRow
                    key={mentor.userId}
                    mentor={mentor}
                    onClick={() => router.push(`${PATH_CONSTANTS.ADMIN_USER_DETAIL}/${mentor.userId}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {search.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => search.setPage(search.page - 1)}
            disabled={!search.hasPrevious}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {search.page + 1} of {search.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => search.setPage(search.page + 1)}
            disabled={!search.hasNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Mentor Row ───────────────────────────────────────────────────────────────

function MentorRow({
  mentor,
  onClick,
}: {
  mentor: PublicMentorCard
  onClick: () => void
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      {/* Mentor identity */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={mentor.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {getInitials(mentor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {mentor.name ?? mentor.username}
            </p>
            {mentor.headline && (
              <p className="text-xs text-muted-foreground truncate max-w-45">
                {mentor.headline}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Role / Company */}
      <TableCell className="hidden md:table-cell">
        {mentor.currentRole || mentor.currentCompany ? (
          <div className="text-sm text-muted-foreground truncate max-w-45">
            {mentor.currentRole && <span>{mentor.currentRole}</span>}
            {mentor.currentRole && mentor.currentCompany && <span> · </span>}
            {mentor.currentCompany && <span>{mentor.currentCompany}</span>}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>

      {/* Services */}
      <TableCell className="hidden sm:table-cell">
        <div className="flex gap-1">
          {mentor.isAcceptingMockInterviews && (
            <Badge variant="outline" className="text-xs gap-1">
              <Video className="size-3" />
              Mock
            </Badge>
          )}
          {mentor.isAcceptingHourlySessions && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="size-3" />
              Hourly
            </Badge>
          )}
          {!mentor.isAcceptingMockInterviews && !mentor.isAcceptingHourlySessions && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </TableCell>

      {/* Rating */}
      <TableCell className="hidden lg:table-cell">
        {(mentor.averageRating ?? 0) > 0 ? (
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{mentor.averageRating!.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">New</span>
        )}
      </TableCell>

      {/* Sessions */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-sm">{mentor.totalSessions ?? 0}</span>
      </TableCell>

      {/* Mock Price */}
      <TableCell className="hidden xl:table-cell">
        <span className="text-sm">{formatInr(mentor.priceInrPaise ?? null)}</span>
      </TableCell>

      {/* Status */}
      <TableCell className="text-right">
        <Badge
          variant={mentor.isAcceptingBookings ? "default" : "secondary"}
          className="text-xs"
        >
          {mentor.isAcceptingBookings ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
