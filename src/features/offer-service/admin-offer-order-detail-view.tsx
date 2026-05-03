/**
 * ─── ADMIN OFFER ORDER DETAIL VIEW ───────────────────────────────────────────
 *
 * Full admin management view for a single offer order.
 * Actions: start progress, complete, assign reviewer, cancel, manage deliverables.
 * Route: /offer-orders/[orderId]
 */

"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  ChevronRight,
  Download,
  ShoppingCart,
  Trash2,
  Upload,
  UserCheck,
  XCircle,
  CheckCircle,
  PlayCircle,
  Clock,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useAdminOfferOrderDetail,
  useAdminOrderDeliverables,
  useAdminStartOfferOrderProgress,
  useAdminCompleteOfferOrder,
  useAdminAssignOfferReviewer,
  useAdminCancelOfferOrder,
  useAdminUploadDeliverable,
  useAdminDeleteDeliverable,
} from "./api/offer-order.hooks"
import type { OfferDeliverableResponse, OfferOrderSummaryResponse } from "./api/offer-service.types"
import { OfferStatusBadge } from "./components/offer-status-badge"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isSlaBreached(order: OfferOrderSummaryResponse) {
  if (!order.slaDeadline) return false
  if (["COMPLETED", "CANCELLED_BY_USER", "CANCELLED_BY_REVQUIX"].includes(order.status)) return false
  return new Date(order.slaDeadline).getTime() < Date.now()
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

interface OrderActionsProps {
  order: OfferOrderSummaryResponse
  orderId: string
}

function OrderActions({ order, orderId }: OrderActionsProps) {
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeNotes, setCompleteNotes] = useState("")
  const [reviewerOpen, setReviewerOpen] = useState(false)
  const [reviewerUserId, setReviewerUserId] = useState("")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const { mutate: startProgress, isPending: starting } = useAdminStartOfferOrderProgress(orderId)
  const { mutate: complete, isPending: completing } = useAdminCompleteOfferOrder(orderId, () => {
    setCompleteOpen(false)
    setCompleteNotes("")
  })
  const { mutate: assignReviewer, isPending: assigning } = useAdminAssignOfferReviewer(orderId, () => {
    setReviewerOpen(false)
    setReviewerUserId("")
  })
  const { mutate: cancel, isPending: cancelling } = useAdminCancelOfferOrder(orderId, () => {
    setCancelOpen(false)
    setCancelReason("")
  })

  const canStart = order.status === "CONFIRMED" || order.status === "PENDING_PAYMENT"
  const canComplete = order.status === "IN_PROGRESS"
  const canAssignReviewer = order.status !== "COMPLETED" &&
    order.status !== "CANCELLED_BY_USER" &&
    order.status !== "CANCELLED_BY_REVQUIX"
  const canCancel = order.status !== "COMPLETED" &&
    order.status !== "CANCELLED_BY_USER" &&
    order.status !== "CANCELLED_BY_REVQUIX"

  return (
    <div className="flex flex-wrap gap-2">
      {canStart && (
        <Button
          variant="default"
          size="sm"
          onClick={() => startProgress(undefined)}
          disabled={starting}
        >
          <PlayCircle className="h-4 w-4 mr-1.5" />
          {starting ? "Starting…" : "Start Progress"}
        </Button>
      )}

      {canAssignReviewer && (
        <Button variant="outline" size="sm" onClick={() => setReviewerOpen(true)}>
          <UserCheck className="h-4 w-4 mr-1.5" />
          Assign Reviewer
        </Button>
      )}

      {canComplete && (
        <Button
          variant="outline"
          size="sm"
          className="border-green-500 text-green-700 hover:bg-green-50"
          onClick={() => setCompleteOpen(true)}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Mark Complete
        </Button>
      )}

      {canCancel && (
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/5"
          onClick={() => setCancelOpen(true)}
        >
          <XCircle className="h-4 w-4 mr-1.5" />
          Cancel Order
        </Button>
      )}

      {/* Complete Dialog */}
      <Dialog open={completeOpen} onOpenChange={(v) => !v && setCompleteOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Order as Completed</DialogTitle>
            <DialogDescription>
              Optionally add internal notes before completing this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Internal Notes (optional)</Label>
              <Textarea
                placeholder="Notes for internal records..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => complete(completeNotes ? { internalNotes: completeNotes } : undefined)}
              disabled={completing}
            >
              {completing ? "Completing…" : "Complete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Reviewer Dialog */}
      <Dialog open={reviewerOpen} onOpenChange={(v) => !v && setReviewerOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Reviewer</DialogTitle>
            <DialogDescription>Enter the user ID of the reviewer to assign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Reviewer User ID *</Label>
              <Input
                value={reviewerUserId}
                onChange={(e) => setReviewerUserId(e.target.value)}
                placeholder="usr_..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewerOpen(false)}>Cancel</Button>
            <Button
              onClick={() => assignReviewer({ reviewerUserId })}
              disabled={assigning || !reviewerUserId.trim()}
            >
              {assigning ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Alert Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={(v) => !v && setCancelOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order. The customer may be eligible for a refund.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 px-1">
            <Label>Reason (optional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancel(cancelReason ? { reason: cancelReason } : undefined)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Deliverables Panel ───────────────────────────────────────────────────────

interface DeliverablesPanelProps {
  orderId: string
  deliverables: OfferDeliverableResponse[]
}

function DeliverablesPanel({ orderId, deliverables }: DeliverablesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { mutate: upload, isPending: uploading } = useAdminUploadDeliverable(orderId, () => {
    setUploadOpen(false)
    setSelectedFile(null)
    setDescription("")
  })

  const { mutate: del, isPending: deleting } = useAdminDeleteDeliverable(orderId, () => {
    setDeleteTarget(null)
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    upload({
      file: selectedFile,
      description: description.trim() || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Deliverables ({deliverables.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" />
          Upload Deliverable
        </Button>
      </div>

      {deliverables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deliverables uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => (
            <div
              key={d.deliverableId}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.originalFilename}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d.mimeType} · {formatFileSize(d.fileSizeBytes)} · {formatDate(d.createdAt)}
                </p>
                {d.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 ml-3">
                {d.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={d.downloadUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(d.deliverableId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => !v && setUploadOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Deliverable</DialogTitle>
            <DialogDescription>
              Upload a file to deliver to the customer for this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={selectedFile?.name ?? ""}
                  placeholder="No file selected"
                  className="flex-1"
                />
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                  Browse
                </Button>
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this deliverable..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              <Upload className="h-4 w-4 mr-1.5" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be permanently deleted and the customer will no longer be able to access it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && del(deleteTarget)}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Info Field ───────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface AdminOfferOrderDetailViewProps {
  orderId: string
}

export default function AdminOfferOrderDetailView({ orderId }: AdminOfferOrderDetailViewProps) {
  const router = useRouter()

  const { data: order, isLoading: loadingOrder, isError } = useAdminOfferOrderDetail(orderId)
  const { data: deliverables, isLoading: loadingDeliverables } = useAdminOrderDeliverables(orderId)

  if (loadingOrder) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Order not found or failed to load.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_OFFER_ORDERS)}
        >
          Back to Orders
        </Button>
      </div>
    )
  }

  const breached = isSlaBreached(order)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_OFFER_ORDERS)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Orders
        </Button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-mono text-xs text-foreground">{orderId}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.serviceName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <OfferStatusBadge status={order.status} />
            <Badge variant="outline" className="text-xs">{order.planDisplayName}</Badge>
            {breached && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                SLA Breached
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {formatAmount(order.finalAmountCharged, order.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{order.currency}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <OrderActions order={order} orderId={orderId} />

      <Separator />

      {/* Order Info Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <InfoField label="Order ID" value={<span className="font-mono text-xs">{order.orderId}</span>} />
          <InfoField label="Service ID" value={<span className="font-mono text-xs">{order.serviceId}</span>} />
          <InfoField label="Plan Tier" value={order.planTier} />
          <InfoField label="Created" value={formatDate(order.createdAt)} />
          <InfoField label="Confirmed" value={formatDate(order.confirmedAt)} />
          <InfoField label="Completed" value={formatDate(order.completedAt)} />
          <InfoField
            label="SLA Deadline"
            value={
              order.slaDeadline ? (
                <span className={breached ? "text-red-600" : undefined}>
                  {formatDate(order.slaDeadline)}
                </span>
              ) : "—"
            }
          />
          <InfoField
            label="Rating Eligible"
            value={order.ratingEligible ? "Yes" : "No"}
          />
          {order.cancellationReason && (
            <InfoField
              label="Cancellation Reason"
              value={order.cancellationReason}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Deliverables */}
      <Card>
        <CardContent className="pt-5">
          {loadingDeliverables ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <DeliverablesPanel
              orderId={orderId}
              deliverables={deliverables ?? []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
