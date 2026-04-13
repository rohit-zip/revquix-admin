/**
 * ─── MENTOR SLOT MANAGEMENT ──────────────────────────────────────────────────
 *
 * Professional mentor slot management page with stats, open slots form,
 * DataExplorer with generic filter, sorting, and cancel actions.
 */

"use client"

import React, { useState } from "react"
import {
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableRow, TableCell } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"

import {
  useProfessionalSlotStats,
  useOpenProfessionalSlots,
  useCancelProfessionalSlot,
  useBulkCancelProfessionalSlots,
} from "./api/professional-mentor.hooks"
import { searchMyProfessionalSlots } from "./api/professional-mentor.api"
import type { OpenSlotsRequest, ProfessionalSlotResponse } from "./api/professional-mentor.types"

// ─── Filter Config ────────────────────────────────────────────────────────────

const SLOT_FILTER_CONFIG: FilterConfig = {
  entityLabel: "Slots",
  filterFields: [
    {
      field: "isBooked",
      label: "Booked",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      field: "isCancelled",
      label: "Cancelled",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "slotStartUtc", label: "Slot Date", type: "INSTANT", allowRange: true },
    { field: "createdAt", label: "Created Date", type: "INSTANT", allowRange: true },
  ],
  sortFields: [
    { field: "slotStartUtc", label: "Slot Date" },
    { field: "durationMinutes", label: "Duration" },
    { field: "priceInrPaise", label: "Price (INR)" },
    { field: "createdAt", label: "Created Date" },
  ],
  defaultSort: [{ field: "slotStartUtc", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  })
}

function getSlotBadge(slot: ProfessionalSlotResponse) {
  if (slot.isCancelled) return <Badge variant="destructive">Cancelled</Badge>
  if (slot.isBooked) return <Badge className="bg-green-600">Booked</Badge>
  if (new Date(slot.slotStartUtc) < new Date()) return <Badge variant="outline">Expired</Badge>
  return <Badge variant="secondary">Available</Badge>
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<ProfessionalSlotResponse>[] = [
  { key: "slotStartUtc", header: "Date & Time", sortable: true },
  { key: "durationMinutes", header: "Duration", sortable: true },
  { key: "priceInrPaise", header: "Price (INR)", sortable: true },
  { key: "status", header: "Status", sortable: false },
  { key: "actions", header: "", sortable: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorSlotManagement() {
  const [showOpenForm, setShowOpenForm] = useState(false)
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false)

  const { data: stats, isLoading: statsLoading } = useProfessionalSlotStats()

  const search = useGenericSearch<ProfessionalSlotResponse>({
    queryKey: "pro-mentor-slots-search",
    searchFn: searchMyProfessionalSlots,
    config: SLOT_FILTER_CONFIG,
  })

  const openMutation = useOpenProfessionalSlots(() => {
    setShowOpenForm(false)
    search.refetch()
  })
  const cancelMutation = useCancelProfessionalSlot(() => {
    search.refetch()
  })
  const bulkCancelMutation = useBulkCancelProfessionalSlots(() => {
    setBulkCancelOpen(false)
    search.refetch()
  })

  const [form, setForm] = useState<OpenSlotsRequest>({
    startDate: getTodayDate(),
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [bulkFrom, setBulkFrom] = useState("")
  const [bulkTo, setBulkTo] = useState("")

  const handleOpenSlots = () => {
    openMutation.mutate(form)
  }

  const statCards = [
    { label: "Total Opened", value: stats?.totalOpened ?? 0, icon: CalendarRange },
    { label: "Booked", value: stats?.totalBooked ?? 0, icon: CheckCircle2 },
    { label: "Available", value: stats?.totalAvailable ?? 0, icon: Clock },
    { label: "Cancelled", value: stats?.totalCancelled ?? 0, icon: XCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Open Slots Form */}
      {showOpenForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open New Slots</CardTitle>
            <CardDescription>Slots will be created in 45-minute increments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  min={getTodayDate()}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleOpenSlots} disabled={openMutation.isPending} className="w-full">
                  {openMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Explorer with slots table */}
      <DataExplorer<ProfessionalSlotResponse>
        search={search}
        columns={columns}
        headerActions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkCancelOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Bulk Cancel
            </Button>
            <Button onClick={() => setShowOpenForm(!showOpenForm)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Open Slots
            </Button>
          </div>
        }
        renderRow={(slot) => (
          <TableRow key={slot.slotId}>
            <TableCell>{formatSlot(slot.slotStartUtc)}</TableCell>
            <TableCell>{slot.durationMinutes} min</TableCell>
            <TableCell>
              {slot.priceInrPaise ? `₹${(slot.priceInrPaise / 100).toLocaleString()}` : "—"}
            </TableCell>
            <TableCell>{getSlotBadge(slot)}</TableCell>
            <TableCell>
              {!slot.isBooked && !slot.isCancelled && new Date(slot.slotStartUtc) > new Date() && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-destructive"
                  onClick={() => cancelMutation.mutate(slot.slotId)}
                  disabled={cancelMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        )}
      />

      {/* Bulk Cancel Dialog */}
      <Dialog open={bulkCancelOpen} onOpenChange={setBulkCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Cancel Slots</DialogTitle>
            <DialogDescription>Cancel all unbooked slots in the date range.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="datetime-local" value={bulkFrom} onChange={(e) => setBulkFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="datetime-local" value={bulkTo} onChange={(e) => setBulkTo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCancelOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!bulkFrom || !bulkTo || bulkCancelMutation.isPending}
              onClick={() => bulkCancelMutation.mutate({
                from: new Date(bulkFrom).toISOString(),
                to: new Date(bulkTo).toISOString(),
              })}
            >
              {bulkCancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bulk Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

