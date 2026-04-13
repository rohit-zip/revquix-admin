/**
 * ─── MENTOR BROWSE VIEW ──────────────────────────────────────────────────────
 *
 * Mentor discovery page with search, filters, and card grid.
 */

"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
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
  ChevronDown,
  Check,
  Tag,
  Layers,
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
import { cn } from "@/lib/utils"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchMentors } from "@/features/professional-mentor/api/professional-mentor.api"
import type { MentorProfileResponse } from "@/features/professional-mentor/api/professional-mentor.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { getAllCategoriesWithSkills } from "@/features/user/api/category.api"
import type { CategoryWithSkills } from "@/features/user/api/user.types"

// ─── Filter Config ────────────────────────────────────────────────────────────

const MENTOR_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["headline", "bio", "currentCompany", "currentRole", "userName"],
  filterFields: [
    {
      field: "isAcceptingBookings",
      label: "Accepting Bookings",
      type: "BOOLEAN",
      operators: ["EQUALS"],
    },
  ],
  rangeFilterFields: [
    { field: "yearsOfExperience", label: "Experience (years)", type: "INTEGER" },
    { field: "priceInrPaise", label: "Price (₹)", type: "INTEGER" },
    { field: "averageRating", label: "Rating", type: "INTEGER" },
  ],
  sortFields: [
    { field: "averageRating", label: "Rating" },
    { field: "totalSessions", label: "Sessions" },
    { field: "priceInrPaise", label: "Price (INR)" },
    { field: "yearsOfExperience", label: "Experience" },
  ],
  joinFilterFields: [
    {
      association: "userAuth",
      field: "name",
      label: "Mentor Name",
      operators: ["LIKE"],
    },
    {
      association: "categories",
      field: "name",
      label: "Categories",
      operators: ["IN"],
    },
    {
      association: "skills",
      field: "name",
      label: "Skills",
      operators: ["IN"],
    },
  ],
  defaultSort: [{ field: "averageRating", direction: "DESC" }],
  defaultPageSize: 12,
}

// ─── Sort options for the dropdown ────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "averageRating-DESC", label: "Highest Rated" },
  { value: "averageRating-ASC", label: "Lowest Rated" },
  { value: "priceInrPaise-ASC", label: "Price: Low to High" },
  { value: "priceInrPaise-DESC", label: "Price: High to Low" },
  { value: "yearsOfExperience-DESC", label: "Most Experienced" },
  { value: "yearsOfExperience-ASC", label: "Least Experienced" },
  { value: "totalSessions-DESC", label: "Most Sessions" },
]

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatPrice(paise: number | null, cents: number | null) {
  if (paise) return `₹${(paise / 100).toLocaleString("en-IN")}`
  if (cents) return `$${(cents / 100).toFixed(2)}`
  return "Price not set"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Convert rupees to paise for the API */
function rupeesToPaise(rupees: string): string {
  const num = parseFloat(rupees)
  if (isNaN(num)) return ""
  return String(Math.round(num * 100))
}

/** Convert paise to rupees for display */
function paiseToRupees(paise: string): string {
  const num = parseInt(paise)
  if (isNaN(num)) return ""
  return String(num / 100)
}

// ─── Mentor Card ──────────────────────────────────────────────────────────────

function MentorCard({ mentor }: { mentor: MentorProfileResponse }) {
  return (
    <Link
      href={`${PATH_CONSTANTS.MOCK_INTERVIEW_MENTOR_DETAIL}/${mentor.mentorProfileId}`}
      className="group block"
    >
      <Card className="h-full border border-border/60 bg-card transition-all duration-200 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98] active:shadow-md cursor-pointer">
        <CardContent className="flex h-full flex-col p-5">
          {/* Header: Avatar + Name + Company */}
          <div className="flex items-start gap-3.5">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow-sm">
              <AvatarImage src={mentor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {getInitials(mentor.userName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 text-left">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                {mentor.userName}
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
                {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : "New"}
              </span>
              {mentor.totalReviews > 0 && (
                <span>({mentor.totalReviews})</span>
              )}
            </div>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{mentor.sessionDurationMinutes} min</span>
            </div>
            <span className="h-3 w-px bg-border" />
            <span>{mentor.yearsOfExperience}+ yrs</span>
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

          {/* Spacer to push bottom section down */}
          <div className="flex-1" />

          {/* Divider */}
          <Separator className="my-4" />

          {/* Price + View Profile */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-base font-bold leading-tight">
                {formatPrice(mentor.priceInrPaise, mentor.priceUsdCents)}
              </p>
              <p className="text-[10px] text-muted-foreground">per session</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View Profile
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          {!mentor.isAcceptingBookings && (
            <p className="mt-2 text-[11px] font-medium text-destructive">Currently not accepting bookings</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Filter Sheet (Side Panel) ────────────────────────────────────────────────

interface FilterPanelProps {
  search: ReturnType<typeof useGenericSearch<MentorProfileResponse>>
  catalogue: CategoryWithSkills[]
  selectedCategoryNames: string[]
  setSelectedCategoryNames: React.Dispatch<React.SetStateAction<string[]>>
  selectedSkillNames: string[]
  setSelectedSkillNames: React.Dispatch<React.SetStateAction<string[]>>
}

function FilterPanel({
  search,
  catalogue,
  selectedCategoryNames,
  setSelectedCategoryNames,
  selectedSkillNames,
  setSelectedSkillNames,
}: FilterPanelProps) {
  // Local state for range inputs (so we don't fire API on every keystroke)
  const [expMin, setExpMin] = useState("")
  const [expMax, setExpMax] = useState("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [ratingMin, setRatingMin] = useState("")

  // Expanded category in skills section
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)

  // Skill search
  const [skillSearch, setSkillSearch] = useState("")

  // Apply experience range
  const applyExperience = useCallback(() => {
    if (!expMin && !expMax) {
      search.removeRangeFilter("yearsOfExperience")
      return
    }
    search.addRangeFilter({
      field: "yearsOfExperience",
      ...(expMin && { from: expMin }),
      ...(expMax && { to: expMax }),
    })
  }, [expMin, expMax, search])

  // Apply price range (convert ₹ to paise)
  const applyPrice = useCallback(() => {
    if (!priceMin && !priceMax) {
      search.removeRangeFilter("priceInrPaise")
      return
    }
    search.addRangeFilter({
      field: "priceInrPaise",
      ...(priceMin && { from: rupeesToPaise(priceMin) }),
      ...(priceMax && { to: rupeesToPaise(priceMax) }),
    })
  }, [priceMin, priceMax, search])

  /**
   * Build the full joinFilters array from category + skill selections
   * and set it on the search hook in one shot.
   *
   * Categories use IN (OR) — "show mentors in any of these categories".
   * Skills use one EQUALS per skill (AND) — "mentor must have ALL selected skills".
   */
  const syncJoinFilters = useCallback(
    (catNames: string[], skillNames: string[]) => {
      const jf: import("@/core/filters/filter.types").JoinFilterCriteria[] = []

      // Categories → single IN filter (OR)
      if (catNames.length > 0) {
        jf.push({
          association: "categories",
          field: "name",
          operator: "IN",
          value: catNames,
        })
      }

      // Skills → one EQUALS filter per skill (AND)
      for (const name of skillNames) {
        jf.push({
          association: "skills",
          field: "name",
          operator: "EQUALS",
          value: name,
        })
      }

      search.setJoinFilters(jf)
    },
    [search],
  )

  // Toggle category selection
  const toggleCategory = useCallback(
    (catName: string) => {
      setSelectedCategoryNames((prev) => {
        const next = prev.includes(catName)
          ? prev.filter((n) => n !== catName)
          : [...prev, catName]

        // When a category is deselected, remove skills under it
        if (!next.includes(catName)) {
          const cat = catalogue.find((c) => c.name === catName)
          if (cat) {
            const catSkillNames = cat.skills.map((s) => s.name)
            setSelectedSkillNames((ps) => {
              const nextSkills = ps.filter((n) => !catSkillNames.includes(n))
              syncJoinFilters(next, nextSkills)
              return nextSkills
            })
            return next
          }
        }

        // Re-sync with current skills
        setSelectedSkillNames((ps) => {
          syncJoinFilters(next, ps)
          return ps
        })
        return next
      })
    },
    [catalogue, syncJoinFilters, setSelectedCategoryNames, setSelectedSkillNames],
  )

  // Toggle skill selection
  const toggleSkill = useCallback(
    (skillName: string) => {
      setSelectedSkillNames((prev) => {
        const next = prev.includes(skillName)
          ? prev.filter((n) => n !== skillName)
          : [...prev, skillName]

        setSelectedCategoryNames((cats) => {
          syncJoinFilters(cats, next)
          return cats
        })
        return next
      })
    },
    [syncJoinFilters, setSelectedSkillNames, setSelectedCategoryNames],
  )

  const clearAllFilters = useCallback(() => {
    setExpMin("")
    setExpMax("")
    setPriceMin("")
    setPriceMax("")
    setRatingMin("")
    setSkillSearch("")
    setSelectedCategoryNames([])
    setSelectedSkillNames([])
    search.clearRangeFilters()
    search.clearFilters()
    search.clearJoinFilters()
  }, [search, setSelectedCategoryNames, setSelectedSkillNames])

  const hasActiveFilters =
    search.rangeFilters.length > 0 ||
    search.filters.length > 0 ||
    search.joinFilters.length > 0

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 pr-3">

        {/* ── Categories ─────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Categories
          </Label>
          <div className="space-y-1">
            {catalogue.map((cat) => {
              const isSelected = selectedCategoryNames.includes(cat.name)
              return (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                    isSelected
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-transparent hover:bg-accent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 truncate">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {cat.skills.length}
                  </span>
                </button>
              )
            })}
            {catalogue.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Loading categories…
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Skills ─────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            Skills
            {selectedSkillNames.length > 0 && (
              <Badge variant="secondary" className="ml-auto h-5 rounded-full px-1.5 text-[10px]">
                {selectedSkillNames.length}
              </Badge>
            )}
          </Label>
          {selectedSkillNames.length >= 2 && (
            <p className="text-[10px] text-muted-foreground">
              Mentor must have <span className="font-semibold">all</span> selected skills
            </p>
          )}

          {/* Search box for skills */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills…"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Selected skill badges */}
          {selectedSkillNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedSkillNames.map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="gap-1 py-0.5 text-[10px]"
                >
                  {name}
                  <button
                    onClick={() => toggleSkill(name)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Grouped by category */}
          <div className="space-y-1">
            {(selectedCategoryNames.length > 0
              ? catalogue.filter((c) => selectedCategoryNames.includes(c.name))
              : catalogue
            ).map((cat) => {
              const filteredSkills = cat.skills.filter(
                (s) =>
                  !skillSearch ||
                  s.name.toLowerCase().includes(skillSearch.toLowerCase()),
              )
              if (filteredSkills.length === 0) return null
              const isExpanded = expandedCatId === cat.categoryId

              return (
                <div key={cat.categoryId} className="rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCatId(isExpanded ? null : cat.categoryId)
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border/40 px-2 pb-2 pt-1 space-y-0.5">
                      {filteredSkills.map((skill) => {
                        const isSelected = selectedSkillNames.includes(skill.name)
                        return (
                          <button
                            key={skill.skillId}
                            type="button"
                            onClick={() => toggleSkill(skill.name)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                              isSelected
                                ? "bg-primary/5 text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30",
                              )}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <span className="truncate">{skill.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* ── Experience Range ────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Experience (years)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={expMin}
              onChange={(e) => setExpMin(e.target.value)}
              onBlur={applyExperience}
              onKeyDown={(e) => e.key === "Enter" && applyExperience()}
              className="h-8 text-xs"
              min={0}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={expMax}
              onChange={(e) => setExpMax(e.target.value)}
              onBlur={applyExperience}
              onKeyDown={(e) => e.key === "Enter" && applyExperience()}
              className="h-8 text-xs"
              min={0}
            />
          </div>
        </div>

        <Separator />

        {/* ── Price Range ─────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Price (₹)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="h-8 text-xs"
              min={0}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="h-8 text-xs"
              min={0}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Values in rupees (e.g. 500 for ₹500)
          </p>
        </div>

        <Separator />

        {/* ── Rating ──────────────────────────────────────────────────── */}
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

        {/* ── Clear All ───────────────────────────────────────────────── */}
        {hasActiveFilters && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={clearAllFilters}
            >
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

interface ActiveFiltersProps {
  search: ReturnType<typeof useGenericSearch<MentorProfileResponse>>
  selectedCategoryNames: string[]
  selectedSkillNames: string[]
  onRemoveCategory: (name: string) => void
  onRemoveSkill: (name: string) => void
}

function ActiveFilters({
  search,
  selectedCategoryNames,
  selectedSkillNames,
  onRemoveCategory,
  onRemoveSkill,
}: ActiveFiltersProps) {
  const activeRangeLabels: { label: string; field: string }[] = search.rangeFilters.map((rf) => {
    const meta = MENTOR_FILTER_CONFIG.rangeFilterFields?.find((f) => f.field === rf.field)
    const label = meta?.label ?? rf.field

    if (rf.field === "priceInrPaise") {
      const from = rf.from ? `₹${paiseToRupees(rf.from)}` : ""
      const to = rf.to ? `₹${paiseToRupees(rf.to)}` : ""
      const rangeStr = from && to ? `${from} – ${to}` : from ? `≥ ${from}` : `≤ ${to}`
      return { label: `${label}: ${rangeStr}`, field: rf.field }
    }

    const from = rf.from ?? ""
    const to = rf.to ?? ""
    const rangeStr = from && to ? `${from} – ${to}` : from ? `≥ ${from}` : `≤ ${to}`
    return { label: `${label}: ${rangeStr}`, field: rf.field }
  })

  const hasAnything =
    activeRangeLabels.length > 0 ||
    selectedCategoryNames.length > 0 ||
    selectedSkillNames.length > 0

  if (!hasAnything) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Category badges */}
      {selectedCategoryNames.map((name) => (
        <Badge key={`cat-${name}`} variant="secondary" className="gap-1 text-xs">
          <Layers className="h-3 w-3" />
          {name}
          <button
            className="ml-0.5 hover:text-destructive"
            onClick={() => onRemoveCategory(name)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Skill badges */}
      {selectedSkillNames.map((name) => (
        <Badge key={`skill-${name}`} variant="outline" className="gap-1 text-xs">
          <Tag className="h-3 w-3" />
          {name}
          <button
            className="ml-0.5 hover:text-destructive"
            onClick={() => onRemoveSkill(name)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Range filter badges */}
      {activeRangeLabels.map((item) => (
        <Badge key={item.field} variant="secondary" className="gap-1 text-xs">
          {item.label}
          <button
            className="ml-0.5 hover:text-destructive"
            onClick={() => search.removeRangeFilter(item.field)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function MentorBrowseView() {
  const search = useGenericSearch<MentorProfileResponse>({
    queryKey: "mentor-discovery",
    searchFn: searchMentors,
    config: MENTOR_FILTER_CONFIG,
    // Only show mentors who are accepting bookings and have a price configured
    permanentFilters: [
      { field: "isAcceptingBookings", operator: "EQUALS", value: true },
      { field: "priceInrPaise", operator: "IS_NOT_NULL", value: "" },
    ],
  })

  // ── Fetch categories + skills catalogue ──────────────────────────────────
  const { data: catalogue = [] } = useQuery({
    queryKey: ["categories-with-skills"],
    queryFn: getAllCategoriesWithSkills,
    staleTime: 1000 * 60 * 10, // 10 min
  })

  // ── Category / skill selection state (lifted so ActiveFilters can read it)
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([])
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([])

  /**
   * Build the full joinFilters array — reused by both the filter panel and
   * the active-filter badge removals.
   */
  const buildJoinFilters = useCallback(
    (catNames: string[], skillNames: string[]) => {
      const jf: import("@/core/filters/filter.types").JoinFilterCriteria[] = []
      if (catNames.length > 0) {
        jf.push({ association: "categories", field: "name", operator: "IN", value: catNames })
      }
      for (const name of skillNames) {
        jf.push({ association: "skills", field: "name", operator: "EQUALS", value: name })
      }
      search.setJoinFilters(jf)
    },
    [search],
  )

  // Helpers used by ActiveFilters to remove a single item
  const handleRemoveCategory = useCallback(
    (name: string) => {
      setSelectedCategoryNames((prev) => {
        const nextCats = prev.filter((n) => n !== name)
        const cat = catalogue.find((c) => c.name === name)
        if (cat) {
          const catSkillNames = cat.skills.map((s) => s.name)
          setSelectedSkillNames((ps) => {
            const nextSkills = ps.filter((n) => !catSkillNames.includes(n))
            buildJoinFilters(nextCats, nextSkills)
            return nextSkills
          })
        } else {
          setSelectedSkillNames((ps) => {
            buildJoinFilters(nextCats, ps)
            return ps
          })
        }
        return nextCats
      })
    },
    [catalogue, buildJoinFilters],
  )

  const handleRemoveSkill = useCallback(
    (name: string) => {
      setSelectedSkillNames((prev) => {
        const nextSkills = prev.filter((n) => n !== name)
        setSelectedCategoryNames((cats) => {
          buildJoinFilters(cats, nextSkills)
          return cats
        })
        return nextSkills
      })
    },
    [buildJoinFilters],
  )

  const currentSortValue = search.sort.length > 0
    ? `${search.sort[0].field}-${search.sort[0].direction}`
    : "averageRating-DESC"

  const filterCount =
    search.rangeFilters.length +
    search.filters.length +
    selectedCategoryNames.length +
    selectedSkillNames.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse Professional Mentors</h1>
        <p className="text-muted-foreground">
          Find the perfect mentor for your mock interview preparation.
        </p>
      </div>

      {/* Search + Sort + Filter controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
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

        {/* Sort + Filter buttons */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <Select
            value={currentSortValue}
            onValueChange={(val) => {
              const [field, direction] = val.split("-") as [string, "ASC" | "DESC"]
              search.setSort([{ field, direction }])
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter sheet trigger */}
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
                  Narrow down mentors by category, skills, experience, price, and rating.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-hidden px-4 pb-4">
                <FilterPanel
                  search={search}
                  catalogue={catalogue}
                  selectedCategoryNames={selectedCategoryNames}
                  setSelectedCategoryNames={setSelectedCategoryNames}
                  selectedSkillNames={selectedSkillNames}
                  setSelectedSkillNames={setSelectedSkillNames}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Reset all button */}
          {(search.activeFilterCount > 0 || search.searchTerms.length > 0 || selectedCategoryNames.length > 0 || selectedSkillNames.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                setSelectedCategoryNames([])
                setSelectedSkillNames([])
                search.resetAll()
              }}
            >
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
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => search.removeSearchTerm(term)}
              >
                ×
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={search.clearSearch}>
            Clear all
          </Button>
        </div>
      )}

      {/* Active filter badges */}
      <ActiveFilters
        search={search}
        selectedCategoryNames={selectedCategoryNames}
        selectedSkillNames={selectedSkillNames}
        onRemoveCategory={handleRemoveCategory}
        onRemoveSkill={handleRemoveSkill}
      />

      {/* Results count */}
      {!search.isLoading && search.data && (
        <p className="text-sm text-muted-foreground">
          {search.data.totalElements} mentor{search.data.totalElements !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Grid */}
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

          {/* Pagination */}
          {search.data && search.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!search.hasPrevious}
                onClick={() => search.setPage(search.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {search.page + 1} of {search.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!search.hasNext}
                onClick={() => search.setPage(search.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

