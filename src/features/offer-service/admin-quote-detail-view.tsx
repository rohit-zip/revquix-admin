/**
 * ─── ADMIN QUOTE DETAIL VIEW ─────────────────────────────────────────────────
 *
 * View and manage a single custom quote: send, cancel, and (once paid) jump to
 * the standard order-fulfilment screen.
 * Route: /custom-quotes/[orderId]
 */

"use client"

import { useState } from "react"
import type { ElementType } from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  Send,
  XCircle,
  ExternalLink,
  Loader2,
  Mail,
  Clock,
  CheckCircle2,
  User,
  Pencil,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useAuth } from "@/hooks/useAuth"
import { OfferStatusBadge } from "./components/offer-status-badge"
import {
  useAdminQuoteDetail,
  useAdminSendQuote,
  useAdminCancelQuote,
  useAdminUpdateQuote,
} from "./api/quote.hooks"
import {
  useAdminOrderComments,
  useAdminOrderCommentWindow,
  useAdminAddOrderComment,
} from "./api/offer-order.hooks"
import type { QuoteLineItemDto } from "./api/offer-service.types"

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "USD") return `$${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  return `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

const QUOTE_PHASE = ["QUOTE_DRAFT", "QUOTE_SENT", "QUOTE_DECLINED", "QUOTE_EXPIRED", "QUOTE_CANCELLED"]

// ─── Edit / Revise Dialog ───────────────────────────────────────────────────

interface EditableLineItem extends QuoteLineItemDto {
  key: number
}

let lineKeySeq = 0
function toEditable(items: { title: string; description?: string | null; quantity: number; unitPriceMinor: number }[]): EditableLineItem[] {
  return items.map((li) => ({
    key: lineKeySeq++,
    title: li.title,
    description: li.description ?? undefined,
    quantity: li.quantity,
    unitPriceMinor: li.unitPriceMinor,
  }))
}

function EditQuoteDialog({
  open,
  onOpenChange,
  quote,
  orderId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: {
    quoteTitle?: string | null
    quoteSummary?: string | null
    quoteValidUntil?: string | null
    quoteSlaHours?: number | null
    quoteAllowCoupon?: boolean | null
    lineItems?: { title: string; description?: string | null; quantity: number; unitPriceMinor: number }[]
  }
  orderId: string
}) {
  const [title, setTitle] = useState(quote.quoteTitle ?? "")
  const [summary, setSummary] = useState(quote.quoteSummary ?? "")
  const [validUntil, setValidUntil] = useState(
    quote.quoteValidUntil ? quote.quoteValidUntil.slice(0, 10) : "",
  )
  const [slaHours, setSlaHours] = useState(quote.quoteSlaHours ? String(quote.quoteSlaHours) : "")
  const [lines, setLines] = useState<EditableLineItem[]>(() => toEditable(quote.lineItems ?? []))

  const updateMutation = useAdminUpdateQuote(orderId, () => onOpenChange(false))

  const updateLine = (key: number, patch: Partial<EditableLineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const addLine = () =>
    setLines((prev) => [...prev, { key: lineKeySeq++, title: "", description: "", quantity: 1, unitPriceMinor: 0 }])
  const removeLine = (key: number) => setLines((prev) => prev.filter((l) => l.key !== key))

  const handleSave = () => {
    const validLines = lines.filter((l) => l.title.trim())
    if (!title.trim() || validLines.length === 0) return
    updateMutation.mutate({
      title: title.trim(),
      summary: summary.trim() || undefined,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      slaHours: slaHours ? parseInt(slaHours, 10) : undefined,
      allowCoupon: quote.quoteAllowCoupon ?? undefined,
      lineItems: validLines.map((l) => ({
        title: l.title.trim(),
        description: l.description?.trim() || undefined,
        quantity: Math.max(1, Math.floor(l.quantity || 1)),
        unitPriceMinor: Math.max(0, Math.round(l.unitPriceMinor || 0)),
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revise quote</DialogTitle>
          <DialogDescription>
            Saving will bump the revision number. If the quote was already sent, the recipient is re-notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Scope of Work</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SLA (hours)</Label>
              <Input type="number" min={1} value={slaHours} onChange={(e) => setSlaHours(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            {lines.map((line) => (
              <div key={line.key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={line.title}
                    onChange={(e) => updateLine(line.key, { title: e.target.value })}
                    placeholder="Item title"
                    className="flex-1"
                  />
                  {lines.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeLine(line.key)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: parseInt(e.target.value, 10) || 1 })}
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPriceMinor ? (line.unitPriceMinor / 100).toString() : ""}
                    onChange={(e) =>
                      updateLine(line.key, { unitPriceMinor: Math.round((parseFloat(e.target.value) || 0) * 100) })
                    }
                    placeholder="Unit price"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !title.trim()}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Comment Thread (reuses OFFER_ORDER comment context, keyed by orderId) ──

function QuoteCommentsSection({ orderId }: { orderId: string }) {
  const [body, setBody] = useState("")
  const { user } = useAuth()
  const { data: windowState } = useAdminOrderCommentWindow(orderId)
  const { data: comments, isLoading } = useAdminOrderComments(orderId)
  const addMutation = useAdminAddOrderComment(orderId, () => setBody(""))
  const currentUserId = user?.userId
  const isOpen = windowState?.isOpen ?? false

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-4/5 rounded-2xl ml-auto" />
        </div>
      )}

      {!isLoading && (!comments || comments.length === 0) && (
        <div className="flex flex-col items-center py-6 rounded-2xl border border-dashed">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      )}

      {comments?.map((msg) => {
        const mine = msg.authorUserId === currentUserId
        return (
          <div key={msg.commentId} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
            <div className={`flex items-center gap-1.5 ${mine ? "mr-1 flex-row-reverse" : "ml-1"}`}>
              <Avatar size="sm" className="h-5 w-5 shrink-0">
                {mine ? (
                  <>
                    <AvatarImage src="/svg/revquix.svg" alt="Revquix Support" />
                    <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">R</AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src={msg.authorAvatarUrl ?? undefined} alt={msg.authorName} />
                    <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">
                      {msg.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <span className="text-xs font-medium text-muted-foreground">{mine ? "Revquix Support" : msg.authorName}</span>
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                mine ? "bg-primary text-primary-foreground" : "border bg-muted/50 text-foreground"
              }`}
            >
              {msg.body}
            </div>
            <span className="text-[10px] text-muted-foreground/60 mx-1">
              {new Date(msg.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )
      })}

      {isOpen ? (
        <div className="mt-1 rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
          <div className="flex items-start gap-2.5 px-3.5 pt-3">
            <Avatar size="sm" className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarImage src="/svg/revquix.svg" alt="Revquix Support" />
              <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">R</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Send a message to the recipient…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && body.trim()) {
                  addMutation.mutate({ contextType: "OFFER_ORDER", contextEntityId: orderId, body })
                }
              }}
              rows={2}
              className="flex-1 resize-none border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent dark:bg-transparent text-sm placeholder:text-muted-foreground/50 min-h-13"
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
            {windowState ? "Messaging window is closed." : "No comment window open for this quote yet."}
          </p>
        )
      )}
    </div>
  )
}

export default function AdminQuoteDetailView({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { data: quote, isLoading, isError } = useAdminQuoteDetail(orderId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [editOpen, setEditOpen] = useState(false)

  const sendMutation = useAdminSendQuote(orderId)
  const cancelMutation = useAdminCancelQuote(orderId, () => {
    setCancelOpen(false)
    setCancelReason("")
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (isError || !quote) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Quote not found.</p>
        <Button variant="outline" asChild>
          <Link href={PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES}>← Back to Custom Quotes</Link>
        </Button>
      </div>
    )
  }

  const currency = quote.currency || "INR"
  const isDraft = quote.status === "QUOTE_DRAFT"
  const isSent = quote.status === "QUOTE_SENT"
  const isQuotePhase = QUOTE_PHASE.includes(quote.status)
  const isPaid = !isQuotePhase && quote.status !== "PENDING_PAYMENT"
  const lineItems = quote.lineItems ?? []
  const subtotal = lineItems.reduce((s, li) => s + li.lineTotalMinor, 0)
  const discount = quote.couponDiscountSnapshot ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quote.quoteTitle ?? "Custom quote"}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {quote.quoteNumber ?? quote.orderId}
              </span>
              <OfferStatusBadge status={quote.status} />
              {quote.quoteRevisionNo ? (
                <span className="text-xs text-muted-foreground">rev. {quote.quoteRevisionNo}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <Button
              className="gap-2"
              disabled={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Quote
            </Button>
          )}
          {(isDraft || isSent) && (
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Revise
            </Button>
          )}
          {(isDraft || isSent) && (
            <Button
              variant="outline"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
          {(isPaid || quote.status === "PENDING_PAYMENT") && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PATH_CONSTANTS.ADMIN_OFFER_ORDER_DETAIL}/${quote.orderId}`}>
                <ExternalLink className="h-4 w-4" />
                Manage fulfilment
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {quote.quoteSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope of Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {quote.quoteSummary}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((li, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{li.title}</p>
                    {li.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{li.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {li.quantity} × {formatAmount(li.unitPriceMinor, currency)}
                    </p>
                  </div>
                  <div className="shrink-0 font-semibold text-sm">
                    {formatAmount(li.lineTotalMinor, currency)}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount{quote.appliedCouponCode ? ` (${quote.appliedCouponCode})` : ""}</span>
                    <span>−{formatAmount(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{formatAmount(quote.finalAmountCharged, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteCommentsSection orderId={orderId} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{quote.userName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{quote.targetEmail ?? quote.userEmail}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Total" value={formatAmount(quote.finalAmountCharged, currency)} strong />
              <Row label="Valid until" value={formatDate(quote.quoteValidUntil)} />
              <Row label="Coupon allowed" value={quote.quoteAllowCoupon ? "Yes" : "No"} />
              <Separator />
              <FunnelRow icon={Send} label="Sent" value={formatDate(quote.quoteSentAt, true)} />
              <FunnelRow icon={Clock} label="Viewed" value={formatDate(quote.quoteViewedAt, true)} />
              <FunnelRow icon={CheckCircle2} label="Accepted" value={formatDate(quote.quoteAcceptedAt, true)} />
              {quote.quoteDeclinedAt && (
                <FunnelRow icon={XCircle} label="Declined" value={formatDate(quote.quoteDeclinedAt, true)} />
              )}
              {quote.quoteCreatedByName && <Row label="Created by" value={quote.quoteCreatedByName} />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this quote?</DialogTitle>
            <DialogDescription>
              The recipient will no longer be able to accept it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep quote
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason.trim() || undefined)}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / revise dialog */}
      <EditQuoteDialog open={editOpen} onOpenChange={setEditOpen} quote={quote} orderId={orderId} />
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold" : ""}>{value}</span>
    </div>
  )
}

function FunnelRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-xs">{value}</span>
    </div>
  )
}
