/**
 * ─── MENTOR SLOTS VIEW ──────────────────────────────────────────────────────
 *
 * Main view for /business-mentor/slots page.
 * Provides:
 *  - Slot statistics cards (total, booked, available, cancelled)
 *  - "Open Slots" form (date range, time range, timezone)
 *  - Paginated table of existing slots with cancel actions
 *  - Bulk cancel dialog
 */

"use client"

import React, { useMemo, useState } from "react"
import {
  CalendarPlus,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  CheckCircle2,
  XCircle,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  useMySlots,
  useSlotStats,
  useOpenSlots,
  useCancelSlot,
  useBulkCancelSlots,
} from "@/features/business-mentor/api/business-mentor.hooks"
import type { MentorSlotResponse, OpenSlotsRequest } from "@/features/business-mentor/api/business-mentor.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUtcInstant(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function getSlotStatusBadge(slot: MentorSlotResponse) {
  if (slot.isCancelled)
    return <Badge variant="destructive">Cancelled</Badge>
  if (slot.isBooked)
    return <Badge variant="default" className="bg-green-600">Booked</Badge>
  return <Badge variant="secondary">Available</Badge>
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards({ isLoading }: { isLoading: boolean }) {
  const { data: stats } = useSlotStats()

  const cards = [
    { label: "Total Opened", value: stats?.totalOpened ?? 0, Icon: BarChart3, color: "text-blue-600" },
    { label: "Booked", value: stats?.totalBooked ?? 0, Icon: CheckCircle2, color: "text-green-600" },
    { label: "Available", value: stats?.totalAvailable ?? 0, Icon: Clock, color: "text-amber-600" },
    { label: "Cancelled", value: stats?.totalCancelled ?? 0, Icon: XCircle, color: "text-red-600" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, Icon, color }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Open Slots Form ──────────────────────────────────────────────────────────

function OpenSlotsForm() {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const [startDate, setStartDate] = useState(getTodayDate())
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [timezone] = useState(detectedTimezone)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openSlotsMutation = useOpenSlots(() => {
    setDialogOpen(false)
    setStartDate(getTodayDate())
    setEndDate("")
    setStartTime("09:00")
    setEndTime("17:00")
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: OpenSlotsRequest = {
      startDate,
      startTime,
      endTime,
      timezone,
      ...(endDate && { endDate }),
    }
    openSlotsMutation.mutate(payload)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Open Slots
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Availability Slots</DialogTitle>
          <DialogDescription>
            Define a date range and time window. The system will generate 30-minute slots automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                min={getTodayDate()}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || getTodayDate()}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={timezone} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Automatically detected from your browser.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={openSlotsMutation.isPending}>
              {openSlotsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Slots
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bulk Cancel Dialog ───────────────────────────────────────────────────────

function BulkCancelDialog() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const bulkCancelMutation = useBulkCancelSlots(() => {
    setDialogOpen(false)
    setFrom("")
    setTo("")
  })

  function handleBulkCancel(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to) return
    bulkCancelMutation.mutate({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    })
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <CalendarRange className="mr-2 h-4 w-4" />
          Bulk Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Cancel Slots</DialogTitle>
          <DialogDescription>
            Cancel all unbooked slots within the specified UTC date/time range.
            Booked slots will not be affected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleBulkCancel} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulkFrom">From (UTC)</Label>
            <Input
              id="bulkFrom"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulkTo">To (UTC)</Label>
            <Input
              id="bulkTo"
              type="datetime-local"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={bulkCancelMutation.isPending}
            >
              {bulkCancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Slots
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorSlotsView() {
  const [page, setPage] = useState(0)
  const [showCancelled, setShowCancelled] = useState(false)
  const pageSize = 10

  const { data: slotsPage, isLoading } = useMySlots(page, pageSize)
  const cancelSlotMutation = useCancelSlot()

  const slots = useMemo(() => {
    const all = slotsPage?.content ?? []
    return showCancelled ? all : all.filter((s) => !s.isCancelled)
  }, [slotsPage, showCancelled])

  const totalPages = slotsPage?.totalPages ?? 0
  const totalElements = slotsPage?.totalElements ?? 0
  const cancelledCount = useMemo(
    () => (slotsPage?.content ?? []).filter((s) => s.isCancelled).length,
    [slotsPage],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Slot Management</h1>
        <p className="text-muted-foreground">
          Manage your availability slots. Open new time windows for bookings or cancel existing ones.
        </p>
      </div>

      {/* Stats */}
      <StatsCards isLoading={isLoading} />

      {/* Slots Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My Slots</CardTitle>
            <CardDescription>
              {totalElements} slot{totalElements !== 1 ? "s" : ""} total
              {cancelledCount > 0 && !showCancelled && (
                <span className="ml-1 text-muted-foreground">
                  ({cancelledCount} cancelled hidden)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {cancelledCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelled((v) => !v)}
              >
                {showCancelled ? (
                  <><EyeOff className="mr-2 h-4 w-4" />Hide Cancelled</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" />Show Cancelled ({cancelledCount})</>
                )}
              </Button>
            )}
            <BulkCancelDialog />
            <OpenSlotsForm />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">
                {totalElements > 0 ? "All slots are cancelled" : "No slots yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalElements > 0
                  ? `${cancelledCount} cancelled slot${cancelledCount !== 1 ? "s" : ""} are hidden. Click "Show Cancelled" to view them.`
                  : "Open your first availability slots to start receiving bookings."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slot ID</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Timezone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.slotId}>
                        <TableCell className="font-mono text-xs">
                          {slot.slotId}
                        </TableCell>
                        <TableCell>{formatUtcInstant(slot.slotStartUtc)}</TableCell>
                        <TableCell>{slot.durationMinutes} min</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {slot.mentorTimezone}
                        </TableCell>
                        <TableCell>{getSlotStatusBadge(slot)}</TableCell>
                        <TableCell className="text-right">
                          {!slot.isBooked && !slot.isCancelled && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    disabled={cancelSlotMutation.isPending}
                                    onClick={() => cancelSlotMutation.mutate(slot.slotId)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel slot</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

