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
  Loader2,
  MessageSquare,
  Send,
  ShoppingCart,
  Trash2,
  Upload,
  UserCheck,
  XCircle,
  CheckCircle,
  PlayCircle,
  Clock,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth } from "@/hooks/useAuth"
import {
  useAdminOfferOrderDetail,
  useAdminOrderDeliverables,
  useAdminStartOfferOrderProgress,
  useAdminCompleteOfferOrder,
  useAdminAssignOfferReviewer,
  useAdminCancelOfferOrder,
  useAdminUploadDeliverable,
  useAdminDeleteDeliverable,
  useAdminOrderComments,
  useAdminOrderCommentWindow,
  useAdminAddOrderComment,
} from "./api/offer-order.hooks"
import type { CommentResponse, OfferDeliverableResponse, OfferOrderDetailResponse } from "./api/offer-service.types"
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

function isSlaBreached(order: OfferOrderDetailResponse) {
  if (!order.slaDeadline) return false
  if (["COMPLETED", "CANCELLED_BY_USER", "CANCELLED_BY_REVQUIX"].includes(order.status)) return false
  return new Date(order.slaDeadline).getTime() < Date.now()
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

interface OrderActionsProps {
  order: OfferOrderDetailResponse
  orderId: string
}

function OrderActions({ order, orderId }: OrderActionsProps) {
  const { user } = useAuth()
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
    order.status !== "CANCELLED_BY_REVQUIX" &&
    order.reviewerUserId !== user?.userId
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

// ─── Comments Section ─────────────────────────────────────────────────────────

function groupByAuthor(list: CommentResponse[]): { authorId: string; messages: CommentResponse[] }[] {
  const groups: { authorId: string; messages: CommentResponse[] }[] = []
  for (const msg of list) {
    const last = groups[groups.length - 1]
    if (last && last.authorId === msg.authorUserId) {
      last.messages.push(msg)
    } else {
      groups.push({ authorId: msg.authorUserId, messages: [msg] })
    }
  }
  return groups
}

function CommentsSection({ orderId }: { orderId: string }) {
  const [body, setBody] = useState("")
  const { user } = useAuth()
  const { data: window_ } = useAdminOrderCommentWindow(orderId)
  const { data: comments, isLoading } = useAdminOrderComments(orderId)
  const addMutation = useAdminAddOrderComment(orderId, () => setBody(""))
  const currentUserId = user?.userId

  const isOpen = window_?.isOpen ?? false

  function bubbleShape(mine: boolean, idx: number, total: number) {
    const base = "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm"
    const mine_bg = "bg-primary text-primary-foreground"
    const other_bg = "bg-muted/50 text-foreground border"
    if (total === 1) return mine ? `${base} rounded-2xl rounded-br-sm ${mine_bg}` : `${base} rounded-2xl rounded-bl-sm ${other_bg}`
    if (idx === 0)           return mine ? `${base} rounded-2xl rounded-br-[6px] ${mine_bg}` : `${base} rounded-2xl rounded-bl-[6px] ${other_bg}`
    if (idx === total - 1)   return mine ? `${base} rounded-2xl rounded-br-sm ${mine_bg}` : `${base} rounded-2xl rounded-bl-sm ${other_bg}`
    return mine ? `${base} rounded-2xl rounded-r-[6px] ${mine_bg}` : `${base} rounded-2xl rounded-l-[6px] ${other_bg}`
  }

  const groups = groupByAuthor(comments ?? [])

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-4/5 rounded-2xl ml-auto" />
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="flex flex-col items-center py-6 rounded-2xl border border-dashed">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      )}

      {groups.map((group) => {
        const mine = group.authorId === currentUserId
        const firstName = group.messages[0].authorName
        return (
          <div key={group.messages[0].commentId} className={`flex flex-col gap-0.75 ${mine ? "items-end" : "items-start"}`}>
            {/* Header shown once per group */}
            <div className={`flex items-center gap-1.5 mb-0.5 ${mine ? "mr-1 flex-row-reverse" : "ml-1"}`}>
              <Avatar size="sm" className="h-5 w-5 shrink-0">
                {mine
                  ? <><AvatarImage src="/svg/revquix.svg" alt="Revquix Support" /><AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">R</AvatarFallback></>
                  : <><AvatarImage src={group.messages[0].authorAvatarUrl ?? undefined} alt={firstName} /><AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">{firstName.charAt(0).toUpperCase()}</AvatarFallback></>
                }
              </Avatar>
              <span className="text-xs font-medium text-muted-foreground">{mine ? "Revquix Support" : firstName}</span>
            </div>
            {/* Bubbles */}
            {group.messages.map((msg, idx) => (
              <div key={msg.commentId} className={`flex flex-col ${mine ? "items-end" : "items-start"} gap-0.5`}>
                <div className={bubbleShape(mine, idx, group.messages.length)}>
                  {msg.body}
                </div>
                {idx === group.messages.length - 1 && (
                  <span className="text-[10px] text-muted-foreground/60 mx-1 mt-0.5">
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* Composer */}
      {isOpen ? (
        <div className="mt-1 rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
          <div className="flex items-start gap-2.5 px-3.5 pt-3">
            <Avatar size="sm" className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarImage src="/svg/revquix.svg" alt="Revquix Support" />
              <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">R</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Send a message to the customer…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && body.trim()) {
                  addMutation.mutate({ contextType: "OFFER_ORDER", contextEntityId: orderId, body })
                }
              }}
              rows={2}
              className="flex-1 resize-none border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent text-sm placeholder:text-muted-foreground/50 min-h-13"
            />
          </div>
          <div className="flex items-center justify-between px-3.5 pb-3 pt-1.5">
            <span className="text-[11px] text-muted-foreground/50 select-none">Ctrl+↵ to send</span>
            <Button
              size="sm"
              className="h-8 rounded-xl gap-1.5 px-3"
              onClick={() => addMutation.mutate({ contextType: "OFFER_ORDER", contextEntityId: orderId, body })}
              disabled={!body.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </div>
      ) : (
        !isLoading && (
          <p className="text-xs text-center text-muted-foreground py-2">
            {window_
              ? `Messaging window is closed.`
              : "No comment window found. Move order to In Progress to open one."}
          </p>
        )
      )}
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

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <InfoField label="Name" value={
            <div className="flex items-center gap-2">
              <Avatar size="sm" className="h-6 w-6 shrink-0">
                <AvatarImage src={order.userAvatarUrl ?? undefined} alt={order.userName} />
                <AvatarFallback className="text-[10px] font-bold">{order.userName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{order.userName}</span>
            </div>
          } />
          <InfoField label="Email" value={order.userEmail} />
          <InfoField label="Reviewer" value={
            order.reviewerName ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm" className="h-6 w-6 shrink-0">
                  <AvatarImage src="/svg/revquix.svg" alt={order.reviewerName} />
                  <AvatarFallback className="text-[10px] font-bold">{order.reviewerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{order.reviewerName}</span>
              </div>
            ) : <span className="text-muted-foreground">Unassigned</span>
          } />
        </CardContent>
      </Card>

      <Separator />

      {/* Form Responses */}
      {order.formResponses && order.formResponses.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer&apos;s Submitted Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-5">
              {order.formResponses.map((item) => (
                <div key={item.fieldKey} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{item.fieldLabel}</span>
                  {item.fileOriginalName ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">{item.fileOriginalName}</span>
                      {item.fileDownloadUrl ? (
                        <a
                          href={item.fileDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.fileOriginalName}
                        >
                          <Button variant="outline" size="sm" className="h-7 gap-1.5">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">(URL unavailable)</span>
                      )}
                    </div>
                  ) : item.textValue ? (
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{item.textValue}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">—</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <Separator />
        </>
      )}

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

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentsSection orderId={orderId} />
        </CardContent>
      </Card>
    </div>
  )
}
