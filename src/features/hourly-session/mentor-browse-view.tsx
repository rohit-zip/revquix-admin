/**
 * ─── HOURLY SESSION MENTOR BROWSE VIEW ───────────────────────────────────────
 *
 * Admin-only mentor discovery page filtered to mentors who accept hourly sessions.
 *
 * Phase C: Migrated from the deleted POST /api/v1/mentors/search to the public
 * POST /api/v1/public/mentors/search endpoint. Uses PublicMentorCard type.
 * Experience range filter now correctly uses joinRangeFilter on userAuth
 * (Phase 0 backend fix — yearsOfExperience lives on UserAuth, not MentorProfile).
 */

"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import {
  Star,
  Briefcase,
  Clock,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowRight,
  X,
  RotateCcw,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchMentors } from "@/features/professional-mentor/api/professional-mentor.api"
import type { PublicMentorCard } from "@/features/professional-mentor/api/professional-mentor.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Filter Config ────────────────────────────────────────────────────────────
// Note: yearsOfExperience is on UserAuth (not MentorProfile root) — it must be
// passed as a joinRangeFilter with association: "userAuth". The rangeFilterFields
// here only cover root MentorProfile fields.

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
    { field: "hourlySessionPriceInrPaise", label: "Hourly Price (₹)", type: "INTEGER" },
    { field: "averageRating", label: "Rating", type: "INTEGER" },
  ],
  sortFields: [
    { field: "averageRating", label: "Rating" },
    { field: "totalSessions", label: "Sessions" },
    { field: "hourlySessionPriceInrPaise", label: "Hourly Price (INR)" },
  ],
  defaultSort: [{ field: "averageRating", direction: "DESC" }],
  defaultPageSize: 12,
}

// ─── Sort options ─────────────────────────────────────────────────────────────

interface SortOption {
  value: string
  label: string
  field: string
  direction: "ASC" | "DESC"
  association?: string
}

const SORT_OPTIONS: SortOption[] = [
  { value: "averageRating-DESC", label: "Highest Rated",       field: "averageRating", direction: "DESC" },
  { value: "averageRating-ASC",  label: "Lowest Rated",        field: "averageRating", direction: "ASC" },
  { value: "price-ASC",          label: "Price: Low to High",  field: "hourlySessionPriceInrPaise", direction: "ASC" },
  { value: "price-DESC",         label: "Price: High to Low",  field: "hourlySessionPriceInrPaise", direction: "DESC" },
  { value: "experience-DESC",    label: "Most Experienced",    field: "yearsOfExperience", direction: "DESC", association: "userAuth" },
  { value: "experience-ASC",     label: "Least Experienced",   field: "yearsOfExperience", direction: "ASC",  association: "userAuth" },
  { value: "totalSessions-DESC", label: "Most Sessions",       field: "totalSessions", direction: "DESC" },
]

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatPrice(paise: number | null, cents: number | null) {
  if (paise) return `₹${(paise / 100).toLocaleString("en-IN")}`
  if (cents) return `$${(cents / 100).toFixed(2)}`
  return "Price not set"
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function rupeesToPaise(rupees: string): string {
  const num = parseFloat(rupees)
  if (isNaN(num)) return ""
  return String(Math.round(num * 100))
}

function paiseToRupees(paise: string): string {
  const num = parseInt(paise)
  if (isNaN(num)) return ""
  return String(num / 100)
}

// ─── Mentor Card ──────────────────────────────────────────────────────────────

function MentorCard({ mentor }: { mentor: PublicMentorCard }) {
  return (
    <Link
      href={`${PATH_CONSTANTS.ADMIN_HOURLY_SESSION_MENTOR_DETAIL}/${mentor.mentorProfileId}`}
      className="group block"
    >
      <Card className="h-full border border-border/60 bg-card transition-all duration-200 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98] active:shadow-md cursor-pointer">
        <CardContent className="flex h-full flex-col p-5">
          {/* Header: Avatar + Name + Company */}
          <div className="flex items-start gap-3.5">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow-sm">
              <AvatarImage src={mentor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {getInitials(mentor.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 text-left">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                {mentor.name ?? mentor.username}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground leading-snug">
                {mentor.headline}
              </p>
              {mentor.currentCompany && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {mentor.currentRole ? `${mentor.currentRole} · ` : ""}
                    {mentor.currentCompany}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">
                {(mentor.averageRating ?? 0) > 0 ? (mentor.averageRating!).toFixed(1) : "New"}
              </span>
              {(mentor.totalReviews ?? 0) > 0 && (
                <span>({mentor.totalReviews})</span>
              )}
            </div>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>60 min</span>
            </div>
            {mentor.yearsOfExperience != null && (
              <>
                <span className="h-3 w-px bg-border" />
                <span>{mentor.yearsOfExperience}+ yrs</span>
              </>
            )}
          </div>

          {/* Skills */}
          {mentor.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.skills.slice(0, 3).map((s) => (
                <Badge key={s.skillId} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                  {s.name}
                </Badge>
              ))}
              {mentor.skills.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  +{mentor.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          <Separator className="my-4" />

          {/* Hourly price + View Profile */}
          <div className="flex items-center justify-between">
            <div className="text-left space-y-0.5">
              <p className="text-sm font-bold leading-tight">
                {formatPrice(mentor.hourlySessionPriceInrPaise, mentor.hourlySessionPriceUsdCents ?? null)}
              </p>
              <p className="text-[10px] text-muted-foreground">per hour</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View Profile
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          {mentor.isAcceptingBookings === false && (
            <p className="mt-2 text-[11px] font-medium text-destructive">Currently not accepting bookings</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  search: ReturnType<typeof useGenericSearch<PublicMentorCard>>
}

function FilterPanel({ search }: FilterPanelProps) {
  const [expMin, setExpMin] = useState("")
  const [expMax, setExpMax] = useState("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [ratingMin, setRatingMin] = useState("")

  const applyExperience = useCallback(() => {
    if (!expMin && !expMax) {
      search.removeJoinRangeFilter("userAuth", "yearsOfExperience")
      return
    }
    search.addJoinRangeFilter({
      association: "userAuth",
      field: "yearsOfExperience",
      ...(expMin && { from: expMin }),
      ...(expMax && { to: expMax }),
    })
  }, [expMin, expMax, search])

  const applyPrice = useCallback(() => {
    if (!priceMin && !priceMax) {
      search.removeRangeFilter("hourlySessionPriceInrPaise")
      return
    }
    search.addRangeFilter({
      field: "hourlySessionPriceInrPaise",
      ...(priceMin && { from: rupeesToPaise(priceMin) }),
      ...(priceMax && { to: rupeesToPaise(priceMax) }),
    })
  }, [priceMin, priceMax, search])

  const clearAllFilters = useCallback(() => {
    setExpMin(""); setExpMax(""); setPriceMin(""); setPriceMax(""); setRatingMin("")
    search.clearRangeFilters()
    search.clearJoinRangeFilters()
    search.clearFilters()
  }, [search])

  const hasActiveFilters =
    search.rangeFilters.length > 0 ||
    search.joinRangeFilters.length > 0 ||
    search.filters.length > 0

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 pr-3">

        {/* ── Experience Range ─────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Experience (years)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number" placeholder="Min" value={expMin}
              onChange={(e) => setExpMin(e.target.value)}
              onBlur={applyExperience}
              onKeyDown={(e) => e.key === "Enter" && applyExperience()}
              className="h-8 text-xs" min={0}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number" placeholder="Max" value={expMax}
              onChange={(e) => setExpMax(e.target.value)}
              onBlur={applyExperience}
              onKeyDown={(e) => e.key === "Enter" && applyExperience()}
              className="h-8 text-xs" min={0}
            />
          </div>
        </div>

        <Separator />

        {/* ── Hourly Price Range ───────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Hourly Price (₹)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number" placeholder="Min" value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="h-8 text-xs" min={0}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number" placeholder="Max" value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="h-8 text-xs" min={0}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Values in rupees (e.g. 500 for ₹500)</p>
        </div>

        <Separator />

        {/* ── Rating ──────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Minimum Rating</Label>
          <Select
            value={ratingMin}
            onValueChange={(val) => {
              setRatingMin(val)
              if (val) {
                search.addRangeFilter({ field: "averageRating", from: val })
              } else {
                search.removeRangeFilter("averageRating")
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="2">2+ Stars</SelectItem>
              <SelectItem value="1">1+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <>
            <Separator />
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={clearAllFilters}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Clear All Filters
            </Button>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

// ─── Active Filters Display ───────────────────────────────────────────────────

function ActiveFilters({
  search,
}: {
  search: ReturnType<typeof useGenericSearch<PublicMentorCard>>
}) {
  const rangeLabels = search.rangeFilters.map((rf) => {
    if (rf.field === "hourlySessionPriceInrPaise") {
      const from = rf.from ? `₹${paiseToRupees(rf.from)}` : ""
      const to = rf.to ? `₹${paiseToRupees(rf.to)}` : ""
      const rangeStr = from && to ? `${from}–${to}` : from ? `≥${from}` : `≤${to}`
      return { label: `Hourly Price: ${rangeStr}`, field: rf.field }
    }
    const from = rf.from ?? ""; const to = rf.to ?? ""
    const rangeStr = from && to ? `${from}–${to}` : from ? `≥${from}` : `≤${to}`
    const meta = MENTOR_FILTER_CONFIG.rangeFilterFields?.find((f) => f.field === rf.field)
    return { label: `${meta?.label ?? rf.field}: ${rangeStr}`, field: rf.field }
  })

  const joinRangeLabels = search.joinRangeFilters.map((rf) => {
    const from = rf.from ?? ""; const to = rf.to ?? ""
    const rangeStr = from && to ? `${from}–${to}` : from ? `≥${from}` : `≤${to}`
    return { label: `Experience: ${rangeStr} yrs`, association: rf.association, field: rf.field }
  })

  const hasAny = rangeLabels.length > 0 || joinRangeLabels.length > 0
  if (!hasAny) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {rangeLabels.map((item) => (
        <Badge key={item.field} variant="secondary" className="gap-1 text-xs">
          {item.label}
          <button className="ml-0.5 hover:text-destructive" onClick={() => search.removeRangeFilter(item.field)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {joinRangeLabels.map((item) => (
        <Badge key={`${item.association}-${item.field}`} variant="secondary" className="gap-1 text-xs">
          {item.label}
          <button
            className="ml-0.5 hover:text-destructive"
            onClick={() => search.removeJoinRangeFilter(item.association, item.field)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function HourlySessionMentorBrowseView() {
  const search = useGenericSearch<PublicMentorCard>({
    queryKey: "hourly-session-mentor-discovery",
    searchFn: searchMentors,
    config: MENTOR_FILTER_CONFIG,
    permanentFilters: [
      { field: "isAcceptingBookings",     operator: "EQUALS", value: true },
      { field: "isAcceptingHourlySessions", operator: "EQUALS", value: true },
      { field: "hourlySessionPriceInrPaise", operator: "IS_NOT_NULL", value: "" },
    ],
  })

  const currentSortValue = (() => {
    if (search.sort.length === 0) return "averageRating-DESC"
    const s = search.sort[0]
    const opt = SORT_OPTIONS.find(
      (o) => o.field === s.field && o.direction === s.direction && (o.association ?? null) === (s.association ?? null),
    )
    return opt?.value ?? "averageRating-DESC"
  })()

  const filterCount = search.activeFilterCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hourly Session Mentors</h1>
        <p className="text-muted-foreground">
          Browse mentors who accept hourly session bookings.
        </p>
      </div>

      {/* Search + Sort + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, role, headline..."
            className="pl-10"
            value={search.searchInput}
            onChange={(e) => search.setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.searchInput.trim()) {
                search.addSearchTerm(search.searchInput.trim())
                search.setSearchInput("")
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={currentSortValue}
            onValueChange={(val) => {
              const opt = SORT_OPTIONS.find((o) => o.value === val)
              if (!opt) return
              search.setSort([{
                field: opt.field,
                direction: opt.direction,
                ...(opt.association ? { association: opt.association } : {}),
              }])
            }}
          >
            <SelectTrigger className="h-9 w-48">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {filterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Mentors</SheetTitle>
                <SheetDescription>
                  Narrow down by experience, hourly price, and rating.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-hidden px-4 pb-4">
                <FilterPanel search={search} />
              </div>
            </SheetContent>
          </Sheet>

          {(search.activeFilterCount > 0 || search.searchTerms.length > 0) && (
            <Button variant="ghost" size="sm" className="h-9" onClick={search.resetAll}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Search tags */}
      {search.searchTerms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {search.searchTerms.map((term) => (
            <Badge key={term} variant="secondary" className="gap-1">
              {term}
              <button className="ml-1 hover:text-destructive" onClick={() => search.removeSearchTerm(term)}>×</button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={search.clearSearch}>Clear all</Button>
        </div>
      )}

      <ActiveFilters search={search} />

      {!search.isLoading && search.data && (
        <p className="text-sm text-muted-foreground">
          {search.data.totalElements} mentor{search.data.totalElements !== 1 ? "s" : ""} found
        </p>
      )}

      {search.isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : search.data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No mentors found. Try different filters.</p>
          {search.activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={search.resetAll}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {search.data?.content.map((mentor) => (
              <MentorCard key={mentor.mentorProfileId} mentor={mentor} />
            ))}
          </div>

          {search.data && search.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={!search.hasPrevious} onClick={() => search.setPage(search.page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {search.page + 1} of {search.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={!search.hasNext} onClick={() => search.setPage(search.page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
