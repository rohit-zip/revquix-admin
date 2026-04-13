"use client"

import React, { useState, useCallback } from "react"
import { useGenericSearch } from "@/core/filters"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchAllIntakes, markIntakeActionTaken } from "./api/admin-intakes.api"
import { ADMIN_INTAKES_FILTER_CONFIG } from "./api/admin-intakes.config"
import type { IntakeActionRequest, IntakeResponse } from "./api/admin-intakes.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  User,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function categoryLabel(category: IntakeResponse["category"]): string {
  if (!category) return "—"
  switch (category) {
    case "BUSINESS_STARTUP":      return "Business / Startup"
    case "PROFESSIONAL_DEVELOPER": return "Professional / Developer"
    case "HIRING_RECRUITMENT":    return "Hiring / Recruitment"
    default: return category
  }
}

// ─── Mark Contacted Dialog ────────────────────────────────────────────────────

function MarkContactedDialog({
  intake,
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  intake: IntakeResponse | null
  open: boolean
  onClose: () => void
  onConfirm: (intakeId: string, note: string) => void
  isLoading: boolean
}) {
  const [note, setNote] = useState("")
  if (!intake) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Contacted</DialogTitle>
          <DialogDescription>
            Record that you have personally contacted{" "}
            <span className="font-medium">{intake.fullName}</span>{" "}
            ({intake.email}).
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <label className="text-sm font-medium mb-1.5 block">Action Note (optional)</label>
          <Textarea
            placeholder="E.g. Called on 26-Mar, scheduled a follow-up email next week."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="sm" disabled={isLoading} onClick={() => onConfirm(intake.intakeId, note)}>
            {isLoading ? (
              <><Loader2 className="size-3.5 animate-spin mr-1" /> Saving…</>
            ) : (
              <><CheckCircle2 className="size-3.5 mr-1" /> Mark Contacted</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function IntakeDetailDialog({
  intake,
  open,
  onClose,
  onMarkContacted,
}: {
  intake: IntakeResponse | null
  open: boolean
  onClose: () => void
  onMarkContacted: (intake: IntakeResponse) => void
}) {
  if (!intake) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Intake Details
            <span className="font-mono text-sm text-muted-foreground">{intake.intakeId}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{intake.fullName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{intake.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{categoryLabel(intake.category)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Submitted At</span><span>{formatDate(intake.createdAt)}</span></div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action Taken</span>
            {intake.isActionTaken
              ? <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle2 className="size-3" /> Contacted</Badge>
              : <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>}
          </div>
          {intake.actionNote && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Note</span>
              <p className="rounded-md bg-muted p-2 text-sm">{intake.actionNote}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {!intake.isActionTaken && (
            <Button size="sm" onClick={() => { onClose(); onMarkContacted(intake) }}>
              Mark as Contacted
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function buildColumns(
  onViewDetail: (intake: IntakeResponse) => void,
  onMarkContacted: (intake: IntakeResponse) => void,
): DataColumn<IntakeResponse>[] {
  return [
    {
      key: "intakeId",
      header: "Intake",
      render: (intake) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium font-mono">{intake.intakeId}</p>
          <p className="truncate text-xs text-muted-foreground">{categoryLabel(intake.category)}</p>
        </div>
      ),
    },
    {
      key: "fullName",
      header: "Lead",
      render: (intake) => (
        <div className="flex items-start gap-2">
          <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{intake.fullName}</p>
            <p className="truncate text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="size-3" /> {intake.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "isActionTaken",
      header: "Status",
      render: (intake) =>
        intake.isActionTaken ? (
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle2 className="size-3" /> Contacted
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
            Pending
          </Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      sortable: true,
      hideOnMobile: true,
      render: (intake) => (
        <span className="text-xs text-muted-foreground">{formatDate(intake.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (intake) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetail(intake) }}>
            View
          </Button>
          {!intake.isActionTaken && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={(e) => { e.stopPropagation(); onMarkContacted(intake) }}
            >
              Mark Contacted
            </Button>
          )}
        </div>
      ),
    },
  ]
}

// ─── View Component ───────────────────────────────────────────────────────────

export default function IntakeManagementView() {
  const queryClient = useQueryClient()
  const [detailIntake, setDetailIntake] = useState<IntakeResponse | null>(null)
  const [actionTarget, setActionTarget] = useState<IntakeResponse | null>(null)
  const [isMarkingAction, setIsMarkingAction] = useState(false)

  const search = useGenericSearch<IntakeResponse>({
    queryKey: "admin-intakes-search",
    searchFn: searchAllIntakes,
    config: ADMIN_INTAKES_FILTER_CONFIG,
  })

  const handleMarkContactedConfirm = useCallback(
    async (intakeId: string, note: string) => {
      setIsMarkingAction(true)
      try {
        const request: IntakeActionRequest = note ? { actionNote: note } : {}
        await markIntakeActionTaken(intakeId, request)
        toast.success("Intake marked as contacted")
        setActionTarget(null)
        setDetailIntake(null)
        await queryClient.invalidateQueries({ queryKey: ["admin-intakes-search"] })
      } catch {
        toast.error("Failed to mark intake. Please try again.")
      } finally {
        setIsMarkingAction(false)
      }
    },
    [queryClient],
  )

  const columns = buildColumns(setDetailIntake, setActionTarget)

  return (
    <>
      <DataExplorer<IntakeResponse>
        search={search}
        columns={columns}
        getRowKey={(i) => i.intakeId}
        title="Booking Intakes"
        description="Unconfirmed intake submissions — users who filled the form but did not select a slot."
        onRowClick={setDetailIntake}
        emptyState={
          <div className="py-12 text-center">
            <FileText className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No pending intakes found.</p>
          </div>
        }
      />

      <IntakeDetailDialog
        intake={detailIntake}
        open={detailIntake !== null}
        onClose={() => setDetailIntake(null)}
        onMarkContacted={setActionTarget}
      />

      <MarkContactedDialog
        intake={actionTarget}
        open={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        onConfirm={handleMarkContactedConfirm}
        isLoading={isMarkingAction}
      />
    </>
  )
}

