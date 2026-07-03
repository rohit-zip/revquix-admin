/**
 * ─── ADMIN CREATE QUOTE VIEW ─────────────────────────────────────────────────
 *
 * Wizard-style form for composing a bespoke custom quote.
 * Route: /custom-quotes/new
 */

"use client"

import { useMemo, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { ArrowLeft, Plus, Send, Trash2, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { showErrorToast } from "@/lib/show-toast"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { adminSendQuote } from "./api/quote.api"
import { useAdminCreateQuote } from "./api/quote.hooks"
import type { CreateQuoteRequest, QuoteLineItemDto } from "./api/offer-service.types"

interface LineItemDraft {
  title: string
  description: string
  quantity: number
  unitPrice: string // major units (rupees / dollars), as entered
}

const emptyLine = (): LineItemDraft => ({ title: "", description: "", quantity: 1, unitPrice: "" })

export default function AdminCreateQuoteView() {
  const router = useRouter()

  const [targetEmail, setTargetEmail] = useState("")
  const [targetName, setTargetName] = useState("")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [validUntil, setValidUntil] = useState("")
  const [slaHours, setSlaHours] = useState("")
  const [allowCoupon, setAllowCoupon] = useState(false)
  const [internalNotes, setInternalNotes] = useState("")
  const [lines, setLines] = useState<LineItemDraft[]>([emptyLine()])
  const [submitting, setSubmitting] = useState(false)

  const createMutation = useAdminCreateQuote()

  const sym = currency === "USD" ? "$" : "₹"

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const unit = parseFloat(l.unitPrice) || 0
        const qty = l.quantity || 0
        return sum + unit * qty
      }, 0),
    [lines],
  )

  const updateLine = (idx: number, patch: Partial<LineItemDraft>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  const addLine = () => setLines((prev) => [...prev, emptyLine()])
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const buildRequest = (): CreateQuoteRequest | null => {
    if (!targetEmail.trim()) {
      showErrorToast(new Error("Recipient email is required") as never)
      return null
    }
    if (!title.trim()) {
      showErrorToast(new Error("Quote title is required") as never)
      return null
    }
    const validLines = lines.filter((l) => l.title.trim() && l.unitPrice.trim() !== "")
    if (validLines.length === 0) {
      showErrorToast(new Error("Add at least one line item with a price") as never)
      return null
    }
    const lineItems: QuoteLineItemDto[] = validLines.map((l) => ({
      title: l.title.trim(),
      description: l.description.trim() || undefined,
      quantity: Math.max(1, Math.floor(l.quantity || 1)),
      unitPriceMinor: Math.round((parseFloat(l.unitPrice) || 0) * 100),
    }))

    return {
      targetEmail: targetEmail.trim(),
      targetName: targetName.trim() || undefined,
      title: title.trim(),
      summary: summary.trim() || undefined,
      currency,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      slaHours: slaHours ? parseInt(slaHours, 10) : undefined,
      allowCoupon,
      internalNotes: internalNotes.trim() || undefined,
      lineItems,
    }
  }

  const handleSaveDraft = () => {
    const req = buildRequest()
    if (!req) return
    createMutation.mutate(req, {
      onSuccess: (res) => {
        router.push(`${PATH_CONSTANTS.ADMIN_CUSTOM_QUOTE_DETAIL}/${res.orderId}`)
      },
    })
  }

  const handleCreateAndSend = () => {
    const req = buildRequest()
    if (!req) return
    setSubmitting(true)
    createMutation.mutate(req, {
      onSuccess: async (res) => {
        try {
          await adminSendQuote(res.orderId)
        } catch (e) {
          showErrorToast(e as never)
        } finally {
          setSubmitting(false)
          router.push(`${PATH_CONSTANTS.ADMIN_CUSTOM_QUOTE_DETAIL}/${res.orderId}`)
        }
      },
      onError: () => setSubmitting(false),
    })
  }

  const busy = createMutation.isPending || submitting

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Custom Quote</h1>
          <p className="text-sm text-muted-foreground">
            Compose a bespoke quote and send it to a client.
          </p>
        </div>
      </div>

      {/* Recipient */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipient</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="client@example.com"
            />
            <p className="text-xs text-muted-foreground">
              If the email isn&apos;t registered yet, a lead account is created — the quote appears
              once they sign up.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Name (optional)</Label>
            <Input value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="Full name" />
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website Development" />
          </div>
          <div className="space-y-1.5">
            <Label>Scope of Work</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe what's included…"
              rows={5}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SLA (hours)</Label>
              <Input
                type="number"
                min={1}
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
                placeholder="72"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Allow coupon at checkout</Label>
              <p className="text-xs text-muted-foreground">
                Let the recipient apply a platform coupon when they pay.
              </p>
            </div>
            <Switch checked={allowCoupon} onCheckedChange={setAllowCoupon} />
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-start gap-2">
                <Input
                  value={line.title}
                  onChange={(e) => updateLine(idx, { title: e.target.value })}
                  placeholder="Item title"
                  className="flex-1"
                />
                {lines.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <Textarea
                value={line.description}
                onChange={(e) => updateLine(idx, { description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit price ({sym})</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}

          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{sym}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Internal notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Admin-only notes (not shown to the client)"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={busy} onClick={handleSaveDraft} className="gap-2">
          {createMutation.isPending && !submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save as draft
        </Button>
        <Button disabled={busy} onClick={handleCreateAndSend} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Create &amp; Send
        </Button>
      </div>
    </div>
  )
}
