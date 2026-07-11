"use client"

/**
 * LeadMailComposeView — Admin Lead Mailer (MVP) compose screen.
 *
 * A single-page form (no wizard) covering:
 *  1. From-prefix + reply-to (name/address)
 *  2. Subject + Text/HTML content toggle
 *  3. Recipients — either an Excel upload OR manual entry (mutually exclusive)
 *  4. Preview dialog (resolves {{name}} against an editable sample name)
 *  5. Test send (throwaway, not persisted as a campaign)
 *  6. Send — creates the campaign and redirects to the live send-report view
 *
 * See docs/ADMIN_LEAD_MAILER_MVP_PLAN.md §1.3.
 */

import { useCallback, useRef, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { AlertTriangle, CloudUpload, FileSpreadsheet, Loader2, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useParseLeadMailExcel,
  usePreviewLeadMail,
  useSendLeadMail,
  useTestSendLeadMail,
} from "./api/lead-mail.hooks"
import {
  LEAD_MAIL_CONTENT_TYPE,
  LEAD_MAIL_FROM_PREFIXES,
  type LeadMailContentType,
  type LeadMailRecipientInput,
} from "./api/lead-mail.types"
import { LeadMailRecipientInput as RecipientChipsInput } from "./lead-mail-recipient-input"

/** Matches {{name}}, {{ name }}, case-insensitive — client-side mirror of the server check. */
const NAME_TOKEN = /\{\{\s*name\s*\}\}/i

type RecipientMode = "excel" | "manual"

export function LeadMailComposeView() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Sender ──────────────────────────────────────────────────────────────
  const [fromPrefix, setFromPrefix] = useState(LEAD_MAIL_FROM_PREFIXES[0]?.value ?? "")
  const [replyToAddress, setReplyToAddress] = useState("")
  const [replyToName, setReplyToName] = useState("")

  // ── Content ─────────────────────────────────────────────────────────────
  const [subject, setSubject] = useState("")
  const [contentType, setContentType] = useState<LeadMailContentType>(LEAD_MAIL_CONTENT_TYPE.TEXT)
  const [textBody, setTextBody] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const body = contentType === LEAD_MAIL_CONTENT_TYPE.HTML ? htmlBody : textBody

  // ── Recipients ──────────────────────────────────────────────────────────
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("excel")
  const [excelRecipients, setExcelRecipients] = useState<LeadMailRecipientInput[]>([])
  const [excelFileName, setExcelFileName] = useState<string | null>(null)
  const [excelSkippedCount, setExcelSkippedCount] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [manualRecipients, setManualRecipients] = useState<LeadMailRecipientInput[]>([])
  const recipients = recipientMode === "excel" ? excelRecipients : manualRecipients

  // ── Preview dialog ──────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sampleName, setSampleName] = useState("Alex")

  // ── Test send dialog ────────────────────────────────────────────────────
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const parseExcelMutation = useParseLeadMailExcel()
  const previewMutation = usePreviewLeadMail()
  const testSendMutation = useTestSendLeadMail()
  const sendMutation = useSendLeadMail()

  const usesNameToken = NAME_TOKEN.test(subject) || NAME_TOKEN.test(body)
  const recipientsMissingName = recipients.filter((r) => !r.name || !r.name.trim())
  const nameTokenBlocked = usesNameToken && recipientsMissingName.length > 0

  const canSubmit =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    replyToAddress.trim().length > 0 &&
    recipients.length > 0 &&
    !nameTokenBlocked

  // ── Excel upload ────────────────────────────────────────────────────────
  const handleExcelFile = useCallback(
    (file: File) => {
      parseExcelMutation.mutate(file, {
        onSuccess: (data) => {
          setExcelRecipients(data.recipients)
          setExcelFileName(file.name)
          setExcelSkippedCount(data.skippedRowCount)
        },
      })
    },
    [parseExcelMutation],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleExcelFile(file)
  }

  const clearExcel = () => {
    setExcelRecipients([])
    setExcelFileName(null)
    setExcelSkippedCount(null)
  }

  // ── Preview ─────────────────────────────────────────────────────────────
  const openPreview = () => {
    setPreviewOpen(true)
    previewMutation.mutate({ subject, body, contentType, sampleName: sampleName || undefined })
  }

  const refreshPreview = (name: string) => {
    setSampleName(name)
    previewMutation.mutate({ subject, body, contentType, sampleName: name || undefined })
  }

  // ── Test send ───────────────────────────────────────────────────────────
  const handleTestSend = () => {
    if (!testEmail.trim()) return
    testSendMutation.mutate(
      {
        subject,
        body,
        contentType,
        fromPrefix,
        replyToAddress,
        replyToName: replyToName || undefined,
        testEmail: testEmail.trim(),
        sampleName: sampleName || undefined,
      },
      { onSuccess: () => setTestDialogOpen(false) },
    )
  }

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!canSubmit) return
    sendMutation.mutate(
      {
        subject,
        body,
        contentType,
        fromPrefix,
        replyToAddress,
        replyToName: replyToName || undefined,
        recipients,
      },
      {
        onSuccess: (data) => {
          router.push(`${PATH_CONSTANTS.ADMIN_LEAD_MAIL}/campaigns/${data.leadMailCampaignId}`)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Sender ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Sender</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="lm-from-prefix">From</Label>
            <Select value={fromPrefix} onValueChange={setFromPrefix}>
              <SelectTrigger id="lm-from-prefix" className="w-full">
                <SelectValue placeholder="Select sender" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_MAIL_FROM_PREFIXES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lm-reply-to">Reply-To address</Label>
            <Input
              id="lm-reply-to"
              type="email"
              placeholder="you@revquix.com"
              value={replyToAddress}
              onChange={(e) => setReplyToAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lm-reply-to-name">Reply-To name (optional)</Label>
            <Input
              id="lm-reply-to-name"
              placeholder="Revquix Team"
              value={replyToName}
              onChange={(e) => setReplyToName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lm-subject">Subject</Label>
            <Input
              id="lm-subject"
              placeholder="Quick question about {{name}}'s team"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1 py-0.5">{"{{name}}"}</code> to insert each recipient&apos;s name.
            </p>
          </div>

          <Tabs value={contentType} onValueChange={(v) => setContentType(v as LeadMailContentType)}>
            <TabsList>
              <TabsTrigger value={LEAD_MAIL_CONTENT_TYPE.TEXT}>Plain Text</TabsTrigger>
              <TabsTrigger value={LEAD_MAIL_CONTENT_TYPE.HTML}>HTML</TabsTrigger>
            </TabsList>
            <TabsContent value={LEAD_MAIL_CONTENT_TYPE.TEXT} className="mt-3">
              <Textarea
                placeholder={"Hi {{name}},\n\nI wanted to reach out about…"}
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                className="min-h-[220px]"
              />
            </TabsContent>
            <TabsContent value={LEAD_MAIL_CONTENT_TYPE.HTML} className="mt-3">
              <TiptapEditor content={htmlBody} onChange={setHtmlBody} placeholder="Hi {{name}}, I wanted to reach out about…" />
            </TabsContent>
          </Tabs>

          {nameTokenBlocked && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Your subject or content uses <code>{"{{name}}"}</code>, but{" "}
                {recipientsMissingName.length} recipient{recipientsMissingName.length === 1 ? "" : "s"}{" "}
                don&apos;t have a name on file. Remove the token or ensure every recipient has a name.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recipients ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as RecipientMode)}>
            <TabsList>
              <TabsTrigger value="excel">Upload Excel</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="mt-3 space-y-3">
              {excelFileName ? (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{excelFileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {excelRecipients.length} recipient{excelRecipients.length === 1 ? "" : "s"} parsed
                        {excelSkippedCount ? ` · ${excelSkippedCount} row(s) skipped (invalid/duplicate email)` : ""}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clearExcel}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  disabled={parseExcelMutation.isPending}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/40"
                  }`}
                >
                  {parseExcelMutation.isPending ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Drag & drop or click to browse</span>
                  <span className="text-xs text-muted-foreground">
                    .xlsx only · must have an &quot;Email&quot; column, &quot;Name&quot; column optional · max 5&nbsp;MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleExcelFile(file)
                      e.target.value = ""
                    }}
                  />
                </button>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-3">
              <RecipientChipsInput
                value={manualRecipients}
                onChange={setManualRecipients}
                helperText="Search registered users by name/email, or type an email and press Enter."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={openPreview} disabled={!subject.trim() || !body.trim()}>
          Preview
        </Button>
        <Button variant="outline" onClick={() => setTestDialogOpen(true)} disabled={!subject.trim() || !body.trim()}>
          Send Test
        </Button>
        <Button onClick={handleSend} disabled={!canSubmit || sendMutation.isPending}>
          {sendMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send to {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </div>

      {/* ── Preview dialog ────────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>{"{{name}}"} is resolved against the sample name below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="lm-sample-name">Sample name</Label>
            <Input
              id="lm-sample-name"
              value={sampleName}
              onChange={(e) => refreshPreview(e.target.value)}
              placeholder="e.g. Alex"
            />
          </div>

          {previewMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : previewMutation.data ? (
            <div className="space-y-3 rounded-md border p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{previewMutation.data.resolvedSubject}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Body</p>
                <div
                  className="prose prose-sm max-w-none rounded-md bg-muted/30 p-3"
                  dangerouslySetInnerHTML={{ __html: previewMutation.data.resolvedBody }}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Test send dialog ──────────────────────────────────────────────── */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a test email</DialogTitle>
            <DialogDescription>Sends once to the address below. Not saved as a campaign.</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="lm-test-email">Test email address</Label>
            <Input
              id="lm-test-email"
              type="email"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestSend} disabled={!testEmail.trim() || testSendMutation.isPending}>
              {testSendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                "Send Test"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
