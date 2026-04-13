/**
 * ─── MENTOR DETAIL VIEW ──────────────────────────────────────────────────────
 *
 * Full detail page for a professional mentor on the mock interview browse flow.
 * Shows mentor profile, bio, skills, and an interactive availability calendar.
 *
 * Route: /mock-interview/browse/[mentorProfileId]
 */

"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Star,
  Tag,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useMentorDetail,
  useMentorSlots,
} from "@/features/professional-mentor/api/professional-mentor.hooks"
import type { ProfessionalSlotResponse } from "@/features/professional-mentor/api/professional-mentor.types"

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function localToday(): string {
  return new Date().toLocaleDateString("en-CA")
}

function buildCalendarDays(
  year: number,
  month: number,
): Array<{ dateStr: string | null; day: number | null }> {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const totalDays = lastDay.getDate()
  const cells: Array<{ dateStr: string | null; day: number | null }> = []
  for (let i = 0; i < startDow; i++) cells.push({ dateStr: null, day: null })
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({ dateStr, day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ dateStr: null, day: null })
  return cells
}

// ─── Price / slot helpers ─────────────────────────────────────────────────────

function formatPrice(paise: number | null, cents: number | null) {
  if (paise) return `₹${(paise / 100).toLocaleString("en-IN")}`
  if (cents) return `$${(cents / 100).toFixed(2)}`
  return "—"
}

function formatSlotTime(utc: string) {
  return new Date(utc).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// Group available (not booked, not cancelled) slots by local date
function groupAvailableSlotsByDate(
  slots: ProfessionalSlotResponse[],
): Map<string, ProfessionalSlotResponse[]> {
  const map = new Map<string, ProfessionalSlotResponse[]>()
  for (const slot of slots) {
    if (slot.isBooked || slot.isCancelled) continue
    const dateStr = new Date(slot.slotStartUtc).toLocaleDateString("en-CA")
    if (!map.has(dateStr)) map.set(dateStr, [])
    map.get(dateStr)!.push(slot)
  }
  return map
}

// ─── Slot Card ────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  isSelected,
  onClick,
}: {
  slot: ProfessionalSlotResponse
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-sm">{formatSlotTime(slot.slotStartUtc)}</span>
          <span className="text-xs text-muted-foreground">· {slot.durationMinutes} min</span>
        </div>
        <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>
          {formatPrice(slot.priceInrPaise, slot.priceUsdCents)}
        </span>
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorDetailView({
  mentorProfileId,
}: {
  mentorProfileId: string
}) {
  const router = useRouter()
  const { data: mentor, isLoading: mentorLoading, isError } = useMentorDetail(mentorProfileId)
  const { data: allSlots = [], isLoading: slotsLoading, refetch: refetchSlots } = useMentorSlots(mentorProfileId)

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<ProfessionalSlotResponse | null>(null)

  // ── Derived slot data ──────────────────────────────────────────────────────
  const slotsByDate = useMemo(() => groupAvailableSlotsByDate(allSlots), [allSlots])
  const availableDatesSet = useMemo(() => new Set(slotsByDate.keys()), [slotsByDate])

  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  )

  const slotsForSelectedDate = useMemo(
    () => (selectedDate ? (slotsByDate.get(selectedDate) ?? []) : []),
    [slotsByDate, selectedDate],
  )

  const today = new Date()
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoPrev = viewMonth > thisMonthStart
  const todayStr = localToday()

  const goPrev = () => {
    setSelectedDate(null)
    setSelectedSlot(null)
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  const goNext = () => {
    setSelectedDate(null)
    setSelectedSlot(null)
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (mentorLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !mentor) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Mentor not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => router.push(PATH_CONSTANTS.MOCK_INTERVIEW_BROWSE)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Mock Interview / Browse</p>
          <h1 className="truncate text-lg font-bold">{mentor.userName}</h1>
        </div>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0 ring-2 ring-border">
              <AvatarImage src={mentor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{getInitials(mentor.userName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{mentor.userName}</h2>
                  <p className="text-sm text-muted-foreground">{mentor.headline}</p>
                  {(mentor.currentRole || mentor.currentCompany) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {mentor.currentRole && <span>{mentor.currentRole}</span>}
                      {mentor.currentRole && mentor.currentCompany && <span>at</span>}
                      {mentor.currentCompany && <span>{mentor.currentCompany}</span>}
                    </p>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-2xl font-bold">
                    {formatPrice(mentor.priceInrPaise, mentor.priceUsdCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">per session</p>
                  {!mentor.isAcceptingBookings && (
                    <Badge variant="secondary" className="text-xs">
                      Not accepting bookings
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : "New"}
                  </span>
                  {mentor.totalReviews > 0 && (
                    <span className="text-muted-foreground">({mentor.totalReviews} reviews)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{mentor.sessionDurationMinutes} min sessions</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{mentor.yearsOfExperience}+ years experience</span>
                </div>
                {mentor.totalSessions > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{mentor.totalSessions} sessions conducted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Bio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {mentor.bio}
              </p>
            </CardContent>
          </Card>

          {/* Categories & Skills */}
          {(mentor.categories.length > 0 || mentor.skills.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentor.categories.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.categories.map((cat) => (
                        <Badge key={cat.categoryId} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {mentor.skills.length > 0 && (
                  <>
                    {mentor.categories.length > 0 && <Separator />}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.skills.map((skill) => (
                          <Badge key={skill.skillId} variant="outline">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Slot Calendar ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Availability
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => refetchSlots()}
                  disabled={slotsLoading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", slotsLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev || slotsLoading}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
                    canGoPrev && !slotsLoading
                      ? "hover:bg-muted text-foreground"
                      : "cursor-not-allowed opacity-30 text-muted-foreground",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold">
                  {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  onClick={goNext}
                  disabled={slotsLoading}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
                    !slotsLoading
                      ? "hover:bg-muted text-foreground"
                      : "cursor-not-allowed opacity-30 text-muted-foreground",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {DAY_HEADERS.map((d) => (
                  <div
                    key={d}
                    className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-7 gap-1"
                  >
                    {calendarDays.map((cell, idx) => {
                      if (!cell.dateStr || !cell.day) {
                        return <div key={`empty-${idx}`} className="aspect-square" />
                      }
                      const isPast      = cell.dateStr < todayStr
                      const isToday     = cell.dateStr === todayStr
                      const isSelected  = cell.dateStr === selectedDate
                      const hasSlots    = availableDatesSet.has(cell.dateStr)
                      const slotCount   = slotsByDate.get(cell.dateStr)?.length ?? 0

                      return (
                        <motion.button
                          key={cell.dateStr}
                          whileHover={hasSlots && !isPast ? { scale: 1.08 } : {}}
                          whileTap={hasSlots && !isPast ? { scale: 0.95 } : {}}
                          onClick={() => {
                            if (!hasSlots || isPast) return
                            setSelectedDate(cell.dateStr!)
                            setSelectedSlot(null)
                          }}
                          disabled={!hasSlots || isPast}
                          title={
                            isPast
                              ? "Past date"
                              : hasSlots
                                ? `${slotCount} slot${slotCount !== 1 ? "s" : ""} available`
                                : "No slots available"
                          }
                          className={cn(
                            "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : hasSlots && !isPast
                                ? "bg-primary/8 text-foreground hover:bg-primary/15 cursor-pointer dark:bg-primary/10"
                                : "cursor-not-allowed text-muted-foreground/35",
                            isToday && !isSelected
                              ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                              : "",
                          )}
                        >
                          <span className="leading-none">{cell.day}</span>
                          {hasSlots && !isPast && (
                            <span
                              className={cn(
                                "mt-0.5 h-1.5 w-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground/80" : "bg-green-500",
                              )}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Legend */}
              {!slotsLoading && (
                <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />Available
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-lg bg-primary" />Selected
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full ring-2 ring-primary" />Today
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />Unavailable
                  </div>
                </div>
              )}

              {/* Slots for selected date */}
              <AnimatePresence>
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDateLong(selectedDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slotsForSelectedDate.length} slot{slotsForSelectedDate.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {slotsForSelectedDate.map((slot) => (
                        <SlotCard
                          key={slot.slotId}
                          slot={slot}
                          isSelected={selectedSlot?.slotId === slot.slotId}
                          onClick={() => setSelectedSlot(slot)}
                        />
                      ))}
                    </div>

                    {selectedSlot && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pt-2"
                      >
                        <Button className="w-full gap-2" size="lg" asChild>
                          <Link
                            href={`${PATH_CONSTANTS.MOCK_INTERVIEW_BOOK}/${mentorProfileId}`}
                          >
                            <Calendar className="h-4 w-4" />
                            Book {formatSlotTime(selectedSlot.slotStartUtc)} · {formatPrice(selectedSlot.priceInrPaise, selectedSlot.priceUsdCents)}
                          </Link>
                        </Button>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          You&apos;ll complete the interview details on the next page.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No slots at all */}
              {!slotsLoading && availableDatesSet.size === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">No available slots</p>
                  <p className="text-xs text-muted-foreground">
                    This mentor currently has no open slots. Check back later.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Book CTA card (always visible) */}
          {mentor.isAcceptingBookings && (
            <Card className="border-primary/30 bg-primary/3">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatPrice(mentor.priceInrPaise, mentor.priceUsdCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">per {mentor.sessionDurationMinutes}-min session</p>
                </div>
                {!slotsLoading && availableDatesSet.size === 0 ? (
                  <>
                    <Button className="w-full" size="lg" disabled>
                      No Slots Available
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      This mentor has no open slots right now. Please check back later.
                    </p>
                  </>
                ) : (
                  <>
                    <Button className="w-full" size="lg" asChild>
                      <Link href={`${PATH_CONSTANTS.MOCK_INTERVIEW_BOOK}/${mentorProfileId}`}>
                        Book a Session
                      </Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Select your slot from the calendar
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mentor.linkedinUrl ? (
                <a
                  href={mentor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/30">
                    <ExternalLink className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <span className="flex-1 truncate">LinkedIn Profile</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  No LinkedIn provided
                </div>
              )}

              {mentor.portfolioUrl ? (
                <a
                  href={mentor.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Globe className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="flex-1 truncate">Portfolio</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  No portfolio provided
                </div>
              )}

              {mentor.resumeUrl && (
                <a
                  href={mentor.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="flex-1 truncate">View Resume</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </a>
              )}
            </CardContent>
          </Card>

          {/* Upcoming slots summary */}
          {!slotsLoading && availableDatesSet.size > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Next Available
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(slotsByDate.entries())
                  .filter(([dateStr]) => dateStr >= todayStr)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(0, 5)
                  .map(([dateStr, slots]) => (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        // scroll to calendar section and select the date
                        setSelectedDate(dateStr)
                        setSelectedSlot(null)
                        const viewYear = parseInt(dateStr.split("-")[0])
                        const viewMon  = parseInt(dateStr.split("-")[1]) - 1
                        setViewMonth(new Date(viewYear, viewMon, 1))
                      }}
                      className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <p className="font-medium text-foreground">
                        {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slots.length} slot{slots.length !== 1 ? "s" : ""} available
                      </p>
                    </button>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


