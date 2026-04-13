"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  PhoneCall,
  RefreshCw,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import { bookingApi } from "./api"
import type { BookingConfirmedResponse, GroupedDateSlots } from "./types"
import { JoinMeetingButton } from "@/components/join-meeting-button"
import { getActiveBooking, cancelBooking } from "@/features/book-slot/api/booking-search.api"
import type { MyBookingResponse } from "@/features/book-slot/api/booking-search.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface BookingSlotSelectorProps {
  intakeId: string
  message?: string
  onReset: () => void
}

// ─── Grouping helper ──────────────────────────────────────────────────────────

function groupSlotsByLocalDate(
  slots: { slotStartUtc: string; availableCount: number }[],
): GroupedDateSlots[] {
  const map = new Map<string, GroupedDateSlots["slots"]>()

  for (const slot of slots) {
    const dt = new Date(slot.slotStartUtc)
    const localDate = dt.toLocaleDateString("en-CA") // yyyy-MM-dd
    const localTime = dt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (!map.has(localDate)) map.set(localDate, [])
    map.get(localDate)!.push({
      time: localTime,
      slotStartUtc: slot.slotStartUtc,
      availableCount: slot.availableCount,
    })
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }))
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Returns yyyy-MM-dd for today in local time */
function localToday(): string {
  return new Date().toLocaleDateString("en-CA")
}

/** Builds the grid cells for a calendar month view (Monday-first, padded to full weeks). */
function buildCalendarDays(
  year: number,
  month: number,
): Array<{ dateStr: string | null; day: number | null }> {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0 … Sun=6
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

// ─── Date-formatting helpers ──────────────────────────────────────────────────

function formatDateFull(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function formatUtcToLocal(utcString: string): string {
  const dt = new Date(utcString)
  return dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const BookingSlotSelector = ({ intakeId, message, onReset }: BookingSlotSelectorProps) => {
  // ─── Month view state ─────────────────────────────────────────────────────
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // ─── Slot loading state ───────────────────────────────────────────────────
  const [groupedSlots, setGroupedSlots] = useState<GroupedDateSlots[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    time: string
    slotStartUtc: string
  } | null>(null)

  // ─── Confirm state ────────────────────────────────────────────────────────
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState<BookingConfirmedResponse | null>(null)

  // ─── Active booking conflict dialog ───────────────────────────────────────
  const [conflictBooking, setConflictBooking] = useState<MyBookingResponse | null>(null)
  const [cancellingConflict, setCancellingConflict] = useState(false)

  // ─── Derived: set of dates that have ≥1 available slot ───────────────────
  const availableDatesSet = useMemo(() => {
    const set = new Set<string>()
    for (const g of groupedSlots) {
      if (g.slots.some((s) => s.availableCount > 0)) set.add(g.date)
    }
    return set
  }, [groupedSlots])

  // ─── Fetch slots for viewMonth ────────────────────────────────────────────
  const fetchSlots = useCallback(
    async (month: Date = viewMonth) => {
      const now = new Date()
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
      const from = monthStart < now ? now : monthStart
      const to   = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)

      setLoading(true)
      setError(false)
      try {
        const response = await bookingApi.getAvailableSlots(
          from.toISOString(),
          to.toISOString(),
        )
        setGroupedSlots(groupSlotsByLocalDate(response.slots ?? []))
      } catch (err) {
        console.error("[Slot Fetch Error]", err)
        setError(true)
        showErrorToast(err instanceof Error ? err : new Error("Failed to load available slots"))
      } finally {
        setLoading(false)
      }
    },
    [viewMonth],
  )

  // Re-fetch whenever the displayed month changes; also clear selection
  useEffect(() => {
    setSelectedDate(null)
    setSelectedSlot(null)
    fetchSlots(viewMonth)
  }, [viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Calendar grid ────────────────────────────────────────────────────────
  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  )

  // ─── Derived: slots for selected date ─────────────────────────────────────
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return groupedSlots.find((g) => g.date === selectedDate)?.slots ?? []
  }, [groupedSlots, selectedDate])

  const availableSlotsCount = useMemo(
    () => slotsForSelectedDate.filter((s) => s.availableCount > 0).length,
    [slotsForSelectedDate],
  )

  // ─── Month navigation ─────────────────────────────────────────────────────
  const today      = new Date()
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoPrev  = viewMonth > thisMonthStart
  const todayStr   = localToday()

  const goPrevMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const goNextMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    if (selectedSlot?.date !== date) setSelectedSlot(null)
  }

  const handleSlotSelect = (date: string, time: string, slotStartUtc: string) => {
    setSelectedSlot({ date, time, slotStartUtc })
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return
    setConfirming(true)
    try {
      // ── Check for existing active booking before confirming ────────────────
      const active = await getActiveBooking()
      if (active) {
        setConflictBooking(active)
        setConfirming(false)
        return
      }

      const response = await bookingApi.confirmBooking({
        intakeId,
        slotStartUtc: selectedSlot.slotStartUtc,
      })
      setConfirmed(response)
      showSuccessToast("Booking confirmed! Check your email for details.")
    } catch (err: unknown) {
      console.error("[Confirm Booking Error]", err)
      const apiError = err as { response?: { data?: { code?: string; details?: Record<string, unknown> } } }
      if (apiError?.response?.data?.code === "RQ-DE-52") {
        // BOOKING_ALREADY_ACTIVE — fetch the active booking details for the dialog
        try {
          const active = await getActiveBooking()
          if (active) { setConflictBooking(active); return }
        } catch {/* ignore */}
      }
      if (apiError?.response?.data?.code === "RQ-DE-53") {
        // FREE_CALL_LIMIT_EXCEEDED
        showErrorToast(new Error("You have used all 5 free strategy call credits. Please contact us to book additional sessions."))
        return
      }
      showErrorToast(err instanceof Error ? err : new Error("Failed to confirm booking"))
    } finally {
      setConfirming(false)
    }
  }

  // ─── Cancel existing booking and then re-confirm ──────────────────────────
  const handleCancelAndRebook = async () => {
    if (!conflictBooking) return
    setCancellingConflict(true)
    try {
      await cancelBooking(conflictBooking.bookingId, { reason: "Cancelled to create a new booking" })
      setConflictBooking(null)
      // Now try to confirm the new slot
      await handleConfirmBooking()
    } catch (err) {
      console.error("[Cancel-And-Rebook Error]", err)
      showErrorToast(err instanceof Error ? err : new Error("Failed to cancel existing booking"))
    } finally {
      setCancellingConflict(false)
    }
  }

  // ─── Confirmed state render ───────────────────────────────────────────────
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6"
      >
        {/* Success header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
          >
            <CalendarCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <h3 className="text-lg font-bold text-foreground">Booking Confirmed!</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {confirmed.message || "Your consultation has been scheduled. Check your email for the meeting details."}
          </p>
        </div>

        {/* Booking details card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-green-200/60 bg-green-50/40 p-5 dark:border-green-800/40 dark:bg-green-900/10"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">Scheduled At</p>
                  <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">
                    {formatUtcToLocal(confirmed.scheduledAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">Duration</p>
                  <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">
                    {confirmed.durationMinutes} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">Mentor</p>
                  <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">{confirmed.mentorName}</p>
                  <p className="text-xs text-green-500 dark:text-green-500">{confirmed.mentorEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">Booking ID</p>
                  <p className="mt-0.5 text-xs font-mono text-green-600 dark:text-green-400">
                    {confirmed.bookingId}
                  </p>
                </div>
              </div>
            </div>

            {confirmed.sessionId && (
              <div className="border-t border-green-200/60 pt-3 dark:border-green-800/40">
                <JoinMeetingButton sessionId={confirmed.sessionId} />
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            Book Another Consultation
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          A confirmation email has been sent with the meeting details and calendar invite.
        </p>
      </motion.div>
    )
  }

  // ─── Slot selection render ────────────────────────────────────────────────
  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 3 — Select Your Slot
        </p>
        <div className="h-px w-full bg-border" />
        <p className="text-sm text-muted-foreground">
          {message || "Choose an available date and time slot for your consultation."}
        </p>
      </div>

      {/* Intake success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-green-200/60 bg-green-50/60 p-4 dark:border-green-800/40 dark:bg-green-900/10"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Intake Received! (ID: {intakeId})
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              Now select a date and time slot below. We&apos;ll send you a confirmation email.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Calendar picker ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Month navigation header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            disabled={!canGoPrev || loading}
            aria-label="Previous month"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
              canGoPrev && !loading
                ? "hover:bg-muted text-foreground"
                : "cursor-not-allowed opacity-30 text-muted-foreground",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              onClick={() => fetchSlots(viewMonth)}
              disabled={loading}
              aria-label="Refresh slots"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>

          <button
            onClick={goNextMonth}
            disabled={loading}
            aria-label="Next month"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
              !loading
                ? "hover:bg-muted text-foreground"
                : "cursor-not-allowed opacity-30 text-muted-foreground",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-rose-500">Failed to load slots.</p>
            <button
              onClick={() => fetchSlots(viewMonth)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
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

                const isPast     = cell.dateStr < todayStr
                const isToday    = cell.dateStr === todayStr
                const isSelected = cell.dateStr === selectedDate
                const hasSlots   = availableDatesSet.has(cell.dateStr)
                const slotCount  =
                  groupedSlots
                    .find((g) => g.date === cell.dateStr)
                    ?.slots.filter((s) => s.availableCount > 0).length ?? 0

                return (
                  <motion.button
                    key={cell.dateStr}
                    whileHover={hasSlots && !isPast ? { scale: 1.08 } : {}}
                    whileTap={hasSlots && !isPast ? { scale: 0.95 } : {}}
                    onClick={() => hasSlots && !isPast && handleDateSelect(cell.dateStr!)}
                    disabled={!hasSlots || isPast}
                    title={
                      isPast
                        ? "Past date"
                        : hasSlots
                          ? `${slotCount} slot${slotCount !== 1 ? "s" : ""} available`
                          : "No slots available"
                    }
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      isSelected
                        ? "bg-primary-500 text-white shadow-md shadow-primary-500/30"
                        : hasSlots && !isPast
                          ? "bg-primary-500/8 text-foreground hover:bg-primary-500/15 cursor-pointer dark:bg-primary-500/10"
                          : "cursor-not-allowed text-muted-foreground/35",
                      isToday && !isSelected
                        ? "ring-2 ring-primary-400 ring-offset-1 ring-offset-background"
                        : "",
                    )}
                  >
                    <span className="leading-none">{cell.day}</span>
                    {/* Availability indicator dot */}
                    {hasSlots && !isPast && (
                      <span
                        className={cn(
                          "mt-0.5 h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-white/80" : "bg-green-500",
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
        {!loading && !error && (
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Available
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-lg bg-primary-500" />
              Selected
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-primary-400" />
              Today
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
              Unavailable
            </div>
          </div>
        )}
      </div>

      {/* ── Time slots for selected date ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedDate && !loading && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Selected date header */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-foreground">
                {formatDateFull(selectedDate)}
              </h3>
              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                {availableSlotsCount} available
              </span>
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {slotsForSelectedDate.map((slot) => {
                const isSelected =
                  selectedSlot?.date === selectedDate && selectedSlot?.time === slot.time
                const isAvailable = slot.availableCount > 0

                return (
                  <motion.button
                    key={`${selectedDate}-${slot.time}`}
                    whileHover={isAvailable ? { scale: 1.04 } : {}}
                    whileTap={isAvailable ? { scale: 0.97 } : {}}
                    onClick={() => {
                      if (isAvailable) handleSlotSelect(selectedDate, slot.time, slot.slotStartUtc)
                    }}
                    disabled={!isAvailable}
                    className={cn(
                      "relative group rounded-xl border px-3 py-3 text-center transition-all duration-200",
                      isSelected
                        ? "border-primary-400 bg-primary-500/15 ring-2 ring-primary-500/30 dark:border-primary-500"
                        : isAvailable
                          ? "border-border bg-background hover:border-primary-300 hover:bg-primary-500/5"
                          : "border-border bg-muted/40 cursor-not-allowed opacity-40",
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <Clock
                          className={cn(
                            "h-3.5 w-3.5",
                            isSelected
                              ? "text-primary-500"
                              : isAvailable
                                ? "text-muted-foreground"
                                : "text-muted-foreground/50",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isSelected
                              ? "text-primary-600 dark:text-primary-300"
                              : isAvailable
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatTime(slot.time)}
                        </span>
                      </div>
                      {isAvailable ? (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isSelected
                              ? "text-primary-500 dark:text-primary-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {slot.availableCount} {slot.availableCount === 1 ? "mentor" : "mentors"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Fully booked
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}

                    {isAvailable && !isSelected && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No slots message (when calendar is loaded but empty month) ─── */}
      {!loading && !error && groupedSlots.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
          <Calendar className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No available slots this month.</p>
          <p className="mt-1 text-xs text-muted-foreground">Try navigating to a later month.</p>
        </div>
      )}

      {/* ── Selected slot summary + CTA ───────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-primary-200/50 bg-primary-50/60 p-4 dark:border-primary-800/40 dark:bg-primary-900/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                    Selected Slot
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                    {formatDateFull(selectedSlot.date)} at {formatTime(selectedSlot.time)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="rounded-lg p-1 text-primary-400 transition-colors hover:bg-primary-500/10 hover:text-primary-600"
                  aria-label="Clear selection"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm button */}
        <button
          disabled={!selectedSlot || confirming}
          onClick={handleConfirmBooking}
          className={cn(
            "group flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200",
            selectedSlot && !confirming
              ? "bg-primary-600 text-white hover:bg-primary-500 active:scale-[0.98] shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
          )}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : selectedSlot ? (
            <>
              Confirm Booking
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            "Select a date and time to continue"
          )}
        </button>

        {/* Start over */}
        <button
          onClick={onReset}
          disabled={confirming}
          className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Over
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll receive a confirmation email with the meeting details and calendar invite.
      </p>
    </motion.div>

    {/* ─── Active Booking Conflict Dialog ───────────────────────────────── */}
    {conflictBooking && (
      <Dialog open={!!conflictBooking} onOpenChange={(v) => !v && setConflictBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Active Meeting Already Scheduled
            </DialogTitle>
            <DialogDescription>
              You already have a confirmed meeting scheduled. Only one active meeting is allowed at a time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-medium">{conflictBooking.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled At</span>
                <span className="font-medium">
                  {conflictBooking.scheduledAt
                    ? new Date(conflictBooking.scheduledAt).toLocaleString(undefined, {
                        weekday: "short", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mentor</span>
                <span>{conflictBooking.mentorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">{conflictBooking.status}</Badge>
              </div>
            </div>

            {/* Late-cancel credit warning */}
            {conflictBooking.scheduledAt &&
              Date.now() > new Date(conflictBooking.scheduledAt).getTime() - 2 * 60 * 60 * 1000 && (
              <Alert className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10">
                <PhoneCall className="size-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  <strong>Credit Notice:</strong> Your existing meeting starts in less than 2 hours.
                  Cancelling it to create a new booking will consume <strong>1 free call credit</strong>.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConflictBooking(null)}>
              Keep My Existing Meeting
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancellingConflict}
              onClick={handleCancelAndRebook}
            >
              {cancellingConflict ? (
                <><Loader2 className="size-3.5 animate-spin mr-1" /> Cancelling…</>
              ) : (
                "Cancel & Book New"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}

export default BookingSlotSelector
