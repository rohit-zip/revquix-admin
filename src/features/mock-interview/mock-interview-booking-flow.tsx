/**
 * ─── MOCK INTERVIEW BOOKING FLOW ─────────────────────────────────────────────
 *
 * Multi-step booking wizard:
 *   Step 1 — Intake form (details + resume upload)
 *   Step 2 — Slot selection from mentor's available slots
 *   Step 3 — Coupon + payment summary + Razorpay checkout
 */

"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Star,
  Tag,
  Upload,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-error"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useMentorDetail,
  useMentorSlots,
} from "@/features/professional-mentor/api/professional-mentor.hooks"
import { validateCoupon } from "@/features/professional-mentor/api/professional-mentor.api"
import type {
  CouponValidationResponse,
  ProfessionalSlotResponse,
} from "@/features/professional-mentor/api/professional-mentor.types"
import {
  useConfirmPayment,
  useReserveSlot,
  useSubmitIntake,
  useUploadIntakeResume,
} from "./api/mock-interview.hooks"
import type { MockInterviewIntakeRequest } from "./api/mock-interview.types"
import {
  EXPERIENCE_LEVEL_OPTIONS,
  FOCUS_AREA_OPTIONS,
} from "./api/mock-interview.types"
import { useRazorpay } from "@/features/payment/hooks/useRazorpay"
import { useAuth } from "@/hooks/useAuth"

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingFlowProps {
  mentorProfileId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function formatPrice(paise: number | null, cents: number | null) {
  if (paise) return `₹${(paise / 100).toLocaleString("en-IN")}`
  if (cents) return `$${(cents / 100).toFixed(2)}`
  return "—"
}

// ─── Calendar Helpers ─────────────────────────────────────────────────────────

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
  const lastDay = new Date(year, month + 1, 0)
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

interface GroupedSlot {
  time: string
  slotStartUtc: string
  slot: ProfessionalSlotResponse
}

interface GroupedDate {
  date: string
  slots: GroupedSlot[]
}

function groupMentorSlotsByLocalDate(
  slots: ProfessionalSlotResponse[],
): GroupedDate[] {
  const map = new Map<string, GroupedSlot[]>()

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
      slot,
    })
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }))
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MockInterviewBookingFlow({ mentorProfileId }: BookingFlowProps) {
  const router = useRouter()
  const { currentUser } = useAuth()
  const { isLoaded: razorpayLoaded, openCheckout } = useRazorpay()

  const { data: mentor, isLoading: mentorLoading } = useMentorDetail(mentorProfileId)
  const { data: slots, isLoading: slotsLoading } = useMentorSlots(mentorProfileId)

  const [step, setStep] = useState(1)
  const [intakeId, setIntakeId] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<ProfessionalSlotResponse | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [couponResult, setCouponResult] = useState<CouponValidationResponse | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [intakeForm, setIntakeForm] = useState<MockInterviewIntakeRequest>({
    mentorProfileId,
    fullName: currentUser?.name ?? "",
    description: "",
    targetCompany: "",
    targetRole: "",
    experienceLevel: undefined,
    focusAreas: [],
    additionalNotes: "",
    linkedinUrl: "",
    githubUrl: "",
  })

  const submitIntakeMutation = useSubmitIntake((id) => {
    setIntakeId(id)
    setStep(2)
  })
  const uploadResumeMutation = useUploadIntakeResume()
  const reserveSlotMutation = useReserveSlot()
  const confirmPaymentMutation = useConfirmPayment(() => {
    router.push(PATH_CONSTANTS.MOCK_INTERVIEW_MY_BOOKINGS)
  })

  // ── Step 1: Submit intake ─────────────────────────────────────────────────

  const handleIntakeSubmit = async () => {
    submitIntakeMutation.mutate(intakeForm, {
      onSuccess: async (result) => {
        if (resumeFile) {
          await uploadResumeMutation.mutateAsync({
            intakeId: result.intakeId,
            file: resumeFile,
          })
        }
      },
    })
  }

  // ── Step 3: Apply coupon ──────────────────────────────────────────────────

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !selectedSlot) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const result = await validateCoupon({
        couponCode: couponCode.trim(),
        amountMinor: selectedSlot.priceInrPaise ?? selectedSlot.priceUsdCents ?? 0,
        currency: selectedSlot.priceInrPaise ? "INR" : "USD",
        mentorProfileId,
      })
      setCouponResult(result)
    } catch (e: unknown) {
      setCouponResult(null)
      if (e instanceof ApiError) {
        setCouponError(e.messages[0] ?? "Invalid coupon code.")
      } else if (e instanceof Error) {
        setCouponError(e.message)
      } else {
        setCouponError("Invalid coupon code. Please try again.")
      }
    } finally {
      setCouponLoading(false)
    }
  }

  // ── Step 3: Reserve + Pay ─────────────────────────────────────────────────

  const handlePay = async () => {
    if (!selectedSlot || !intakeId) return
    setIsProcessing(true)

    try {
      const reservation = await reserveSlotMutation.mutateAsync({
        intakeId,
        slotId: selectedSlot.slotId,
        couponCode: couponResult?.isValid ? couponCode : undefined,
      })

      openCheckout({
        key: reservation.razorpayKeyId,
        amount: reservation.amountMinor,
        currency: reservation.currency,
        order_id: reservation.razorpayOrderId,
        name: "Revquix",
        description: `Mock Interview with ${mentor?.userName}`,
        handler: async (response) => {
          confirmPaymentMutation.mutate({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          },
        },
        prefill: {
          email: currentUser?.email,
          name: intakeForm.fullName,
        },
        theme: { color: "#6366f1" },
        config: {
          display: {
            blocks: {
              payment_methods: {
                name: "Payment Methods",
                instruments: reservation.currency === "INR"
                  ? [
                      { method: "card" },
                      { method: "upi" },
                      { method: "netbanking" },
                      { method: "wallet" },
                    ]
                  : [
                      { method: "card" },
                      { method: "netbanking" },
                      { method: "wallet" },
                    ],
              },
            },
            sequence: ["block.payment_methods"],
            preferences: { show_default_blocks: false },
          },
        },
      })
    } catch {
      setIsProcessing(false)
    }
  }

  // ── Calendar-derived data ──────────────────────────────────────────────────

  const availableSlots = useMemo(
    () => slots?.filter((s) => !s.isBooked && !s.isCancelled) ?? [],
    [slots],
  )

  const groupedSlots = useMemo(
    () => groupMentorSlotsByLocalDate(availableSlots),
    [availableSlots],
  )

  const availableDatesSet = useMemo(() => {
    const set = new Set<string>()
    for (const g of groupedSlots) set.add(g.date)
    return set
  }, [groupedSlots])

  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  )

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return groupedSlots.find((g) => g.date === selectedDate)?.slots ?? []
  }, [groupedSlots, selectedDate])

  // ── Month navigation ───────────────────────────────────────────────────────
  const today = new Date()
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoPrev = viewMonth > thisMonthStart
  const todayStr = localToday()

  const goPrevMonth = useCallback(
    () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    [],
  )
  const goNextMonth = useCallback(
    () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    [],
  )

  const handleDateSelect = useCallback(
    (date: string) => {
      setSelectedDate(date)
      if (selectedSlot) {
        const slotDate = new Date(selectedSlot.slotStartUtc).toLocaleDateString("en-CA")
        if (slotDate !== date) setSelectedSlot(null)
      }
    },
    [selectedSlot],
  )

  // ── Loading state ─────────────────────────────────────────────────────────

  if (mentorLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!mentor) {
    return <p className="text-muted-foreground">Mentor not found.</p>
  }

  return (
    <div className="space-y-6">
      {/* Mentor Info Header */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mentor.avatarUrl ?? undefined} />
            <AvatarFallback>
              {mentor.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{mentor.userName}</h2>
            <p className="text-sm text-muted-foreground">{mentor.headline}</p>
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : "New"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                60 min
              </span>
              <span className="font-semibold">
                {formatPrice(mentor.priceInrPaise, mentor.priceUsdCents)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 flex-1 ${s < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Intake Form ─────────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Interview Details
            </CardTitle>
            <CardDescription>
              Tell the mentor about yourself and what you want to focus on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  required
                  value={intakeForm.fullName}
                  onChange={(e) =>
                    setIntakeForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select
                  value={intakeForm.experienceLevel}
                  onValueChange={(v) =>
                    setIntakeForm((f) => ({ ...f, experienceLevel: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVEL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>What do you want to prepare for? *</Label>
              <Textarea
                required
                minLength={20}
                maxLength={5000}
                rows={4}
                placeholder="Describe your preparation goals..."
                value={intakeForm.description}
                onChange={(e) =>
                  setIntakeForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Company</Label>
                <Input
                  placeholder="e.g., Google"
                  value={intakeForm.targetCompany}
                  onChange={(e) =>
                    setIntakeForm((f) => ({ ...f, targetCompany: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Target Role</Label>
                <Input
                  placeholder="e.g., Senior SDE"
                  value={intakeForm.targetRole}
                  onChange={(e) =>
                    setIntakeForm((f) => ({ ...f, targetRole: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <Label>Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREA_OPTIONS.map((area) => {
                  const selected = intakeForm.focusAreas?.includes(area.value)
                  return (
                    <Badge
                      key={area.value}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        setIntakeForm((f) => ({
                          ...f,
                          focusAreas: selected
                            ? f.focusAreas?.filter((a) => a !== area.value)
                            : [...(f.focusAreas ?? []), area.value],
                        }))
                      }
                    >
                      {area.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={intakeForm.linkedinUrl}
                  onChange={(e) =>
                    setIntakeForm((f) => ({ ...f, linkedinUrl: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input
                  type="url"
                  placeholder="https://github.com/..."
                  value={intakeForm.githubUrl}
                  onChange={(e) =>
                    setIntakeForm((f) => ({ ...f, githubUrl: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resume (Optional)</Label>
              <div
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition hover:border-primary"
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                {resumeFile ? (
                  <>
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm">{resumeFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload resume (PDF)</span>
                  </>
                )}
              </div>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                rows={3}
                placeholder="Any special requests..."
                value={intakeForm.additionalNotes}
                onChange={(e) =>
                  setIntakeForm((f) => ({ ...f, additionalNotes: e.target.value }))
                }
              />
            </div>

            <Button
              className="w-full"
              onClick={handleIntakeSubmit}
              disabled={
                submitIntakeMutation.isPending ||
                !intakeForm.fullName.trim() ||
                intakeForm.description.length < 20
              }
            >
              {submitIntakeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Continue to Slot Selection <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Slot Selection ──────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Select a Time Slot
            </CardTitle>
            <CardDescription>
              Choose an available date and time for your mock interview session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {slotsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No available slots. Please check back later.
                </p>
              </div>
            ) : (
              <>
                {/* ── Calendar Picker ────────────────────────────────────── */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  {/* Month navigation header */}
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={goPrevMonth}
                      disabled={!canGoPrev}
                      aria-label="Previous month"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
                        canGoPrev
                          ? "hover:bg-muted text-foreground"
                          : "cursor-not-allowed opacity-30 text-muted-foreground",
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-sm font-bold text-foreground">
                      {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                    </span>

                    <button
                      onClick={goNextMonth}
                      aria-label="Next month"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted text-foreground"
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

                        const isPast = cell.dateStr < todayStr
                        const isToday = cell.dateStr === todayStr
                        const isSelected = cell.dateStr === selectedDate
                        const hasSlots = availableDatesSet.has(cell.dateStr)

                        return (
                          <motion.button
                            key={cell.dateStr}
                            whileHover={hasSlots && !isPast ? { scale: 1.08 } : {}}
                            whileTap={hasSlots && !isPast ? { scale: 0.95 } : {}}
                            onClick={() => hasSlots && !isPast && handleDateSelect(cell.dateStr!)}
                            disabled={!hasSlots || isPast}
                            className={cn(
                              "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : hasSlots && !isPast
                                  ? "bg-primary/8 text-foreground hover:bg-primary/15 cursor-pointer"
                                  : "cursor-not-allowed text-muted-foreground/35",
                              isToday && !isSelected
                                ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
                                : "",
                            )}
                          >
                            <span className="leading-none">{cell.day}</span>
                            {/* Green dot for available dates */}
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

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Available
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-lg bg-primary" />
                      Selected
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full ring-2 ring-primary/60" />
                      Today
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                      Unavailable
                    </div>
                  </div>
                </div>

                {/* ── Time slots for selected date ───────────────────────── */}
                <AnimatePresence mode="wait">
                  {selectedDate && (
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
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          {formatDateFull(selectedDate)}
                        </h3>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {slotsForSelectedDate.length} slot{slotsForSelectedDate.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Time slot grid */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {slotsForSelectedDate.map((gs) => {
                          const isSlotSelected = selectedSlot?.slotId === gs.slot.slotId

                          return (
                            <motion.button
                              key={gs.slot.slotId}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedSlot(gs.slot)}
                              className={cn(
                                "relative group rounded-xl border px-3 py-3 text-center transition-all duration-200",
                                isSlotSelected
                                  ? "border-primary bg-primary/15 ring-2 ring-primary/30"
                                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                              )}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Clock
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      isSlotSelected ? "text-primary" : "text-muted-foreground",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-sm font-semibold",
                                      isSlotSelected ? "text-primary" : "text-foreground",
                                    )}
                                  >
                                    {formatTime(gs.time)}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    "text-[10px] font-medium",
                                    isSlotSelected ? "text-primary" : "text-muted-foreground",
                                  )}
                                >
                                  {formatPrice(gs.slot.priceInrPaise, gs.slot.priceUsdCents)} · {gs.slot.durationMinutes}min
                                </span>
                              </div>

                              {isSlotSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                                </motion.div>
                              )}

                              {!isSlotSelected && (
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500" />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No slots for current month */}
                {groupedSlots.length === 0 && (
                  <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
                    <Calendar className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No available slots this month.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try navigating to a later month.</p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Coupon + Payment ────────────────────────────────────────── */}
      {step === 3 && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Payment
            </CardTitle>
            <CardDescription>Review your booking and complete payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium">Booking Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mentor</span>
                <span>{mentor.userName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date & Time</span>
                <span>{formatSlotTime(selectedSlot.slotStartUtc)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span>{selectedSlot.durationMinutes} minutes</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Amount</span>
                <span>{formatPrice(selectedSlot.priceInrPaise, selectedSlot.priceUsdCents)}</span>
              </div>

              {couponResult?.isValid && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({couponResult.couponCode})</span>
                    <span>-{couponResult.discountAmountDisplay}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{couponResult.finalAmountDisplay}</span>
                  </div>
                </>
              )}
            </div>

            {/* Coupon */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Tag className="h-4 w-4" /> Have a coupon code?
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponResult(null)
                    setCouponError(null)
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || couponLoading}
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {couponResult && (
                <p
                  className={`text-sm ${
                    couponResult.isValid ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {couponResult.message}
                </p>
              )}
              {couponError && (
                <p className="text-sm text-destructive">{couponError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1"
                onClick={handlePay}
                disabled={isProcessing || !razorpayLoaded}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Pay{" "}
                {couponResult?.isValid
                  ? couponResult.finalAmountDisplay
                  : formatPrice(selectedSlot.priceInrPaise, selectedSlot.priceUsdCents)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

