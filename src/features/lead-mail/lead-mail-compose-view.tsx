"use client"

/**
 * LeadMailComposeView — Admin Lead Mailer compose screen.
 *
 * A single-page form (no wizard) covering:
 *  1. Sending method (ZeptoMail vs ad-hoc SMTP — Phase 2, Option A) + sender fields
 *  2. Subject + Text/HTML content toggle
 *  3. Recipients — four audience-building modes (Phase 3, requirements 2/3/4/5): Excel/CSV
 *     upload, manual entry, Revquix-user search, or every eligible Revquix user. The first three
 *     feed a shared, reviewable <RecipientReviewTable>; the fourth resolves its own audience
 *     server-side and shows a dry-run count + typed confirmation instead.
 *  4. Preview dialog (resolves {{name}} against an editable sample name)
 *  5. Test send (throwaway, not persisted as a campaign)
 *  6. Send — creates the campaign and redirects to the live send-report view
 *
 * See docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md §9.2, which replaces this single-page form
 * with a four-step wizard backed by a persisted DRAFT.
 *
 * Phase 2 SMTP fields (host/port/username/password/encryption/from) are
 * component-local state only — never persisted, cleared on unmount, and only
 * ever sent as part of a test-connection / test-send / send request body.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useAnnotateLeadMailRecipients,
  useDownloadLeadMailRecipientTemplate,
  useParseLeadMailRecipients,
  usePreviewLeadMail,
  useSendLeadMail,
  useTestSendLeadMail,
  useTestSmtpConnection,
} from "./api/lead-mail.hooks"
import {
  LEAD_MAIL_AUDIENCE_TYPE,
  LEAD_MAIL_CONTENT_TYPE,
  LEAD_MAIL_DEFAULT_FROM_PREFIX,
  LEAD_MAIL_SENDER_DOMAIN,
  LEAD_MAIL_SEND_METHOD,
  LEAD_MAIL_SMTP_ENCRYPTION_MODE,
  type LeadMailAudienceType,
  type LeadMailContentType,
  type LeadMailSendMethod,
  type LeadMailSmtpEncryptionMode,
  type SmtpCredentialsInput,
} from "./api/lead-mail.types"
import { AllUsersAudiencePanel, useAllUsersSendReady } from "./components/all-users-audience-panel"
import { AudienceUserSearchPicker } from "./components/audience-user-search-picker"
import { ManualRecipientAddRow } from "./components/manual-recipient-add-row"
import { RecipientReviewTable } from "./components/recipient-review-table"
import { applyAnnotations, RECIPIENT_SOURCE, toRecipientInputs, type RecipientRow } from "./components/recipient-row"

/** Matches {{name}}, {{ name }}, case-insensitive — client-side mirror of the server check. */
const NAME_TOKEN = /\{\{\s*name\s*\}\}/i

/** Four audience-building modes (Phase 3, requirements 2/3/4/5). */
type RecipientTab = "excel" | "manual" | "search" | "all-users"

/** Chunk size for /recipients/annotate calls — a 2000-row upload becomes 4 requests, not 2000. */
const ANNOTATE_BATCH_SIZE = 500

/** Maps a compose-screen recipient tab to the audienceType persisted on the campaign row. There is
 * no CSV variant in LeadMailAudienceType — a .csv upload is recorded as EXCEL, same as .xlsx,
 * since both are "a sheet the admin uploaded" from the backend's point of view. */
const AUDIENCE_TYPE_BY_TAB: Record<RecipientTab, LeadMailAudienceType> = {
  excel: LEAD_MAIL_AUDIENCE_TYPE.EXCEL,
  manual: LEAD_MAIL_AUDIENCE_TYPE.MANUAL,
  search: LEAD_MAIL_AUDIENCE_TYPE.USER_SEARCH,
  "all-users": LEAD_MAIL_AUDIENCE_TYPE.ALL_USERS,
}

/**
 * Generates an idempotency key for one composition.
 *
 * Defined outside the component and only ever called from an event handler, so the impure calls
 * inside never run during render — React's purity rule forbids that, and it is a real hazard here:
 * a re-render producing a different key would silently disable the duplicate-send guard.
 *
 * `crypto.randomUUID` is unavailable on non-secure origins in some browsers, hence the fallback. It
 * does not need to be cryptographically strong, only unique per composition for one admin.
 */
function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `lm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const SMTP_ENCRYPTION_OPTIONS: { label: string; value: LeadMailSmtpEncryptionMode }[] = [
  { label: "SSL", value: LEAD_MAIL_SMTP_ENCRYPTION_MODE.SSL },
  { label: "STARTTLS", value: LEAD_MAIL_SMTP_ENCRYPTION_MODE.STARTTLS },
  { label: "None", value: LEAD_MAIL_SMTP_ENCRYPTION_MODE.NONE },
]

const EMPTY_SMTP_FORM = {
  host: "",
  port: "587",
  username: "",
  password: "",
  encryptionMode: LEAD_MAIL_SMTP_ENCRYPTION_MODE.STARTTLS as LeadMailSmtpEncryptionMode,
  fromAddress: "",
  fromName: "",
}

export function LeadMailComposeView() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Sending method + sender ─────────────────────────────────────────────
  const [sendMethod, setSendMethod] = useState<LeadMailSendMethod>(LEAD_MAIL_SEND_METHOD.ZEPTO_MAIL)
  const [fromPrefix, setFromPrefix] = useState(LEAD_MAIL_DEFAULT_FROM_PREFIX)
  const [replyToAddress, setReplyToAddress] = useState("")
  const [replyToName, setReplyToName] = useState("")

  // SMTP fields — component-local, session-only (Phase 2, Option A). Never persisted.
  const [smtpForm, setSmtpForm] = useState(EMPTY_SMTP_FORM)
  const [smtpTestPassed, setSmtpTestPassed] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const smtpCredentials: SmtpCredentialsInput = {
    host: smtpForm.host.trim(),
    port: Number(smtpForm.port) || 0,
    username: smtpForm.username.trim(),
    password: smtpForm.password,
    encryptionMode: smtpForm.encryptionMode,
    fromAddress: smtpForm.fromAddress.trim(),
    fromName: smtpForm.fromName.trim() || undefined,
  }
  const smtpFormComplete =
    smtpCredentials.host.length > 0 &&
    smtpCredentials.port > 0 &&
    smtpCredentials.username.length > 0 &&
    smtpCredentials.password.length > 0 &&
    smtpCredentials.fromAddress.length > 0

  /** Any edit to an SMTP field invalidates a prior successful test — re-testing is required. */
  const updateSmtpField = <K extends keyof typeof smtpForm>(key: K, value: (typeof smtpForm)[K]) => {
    setSmtpForm((prev) => ({ ...prev, [key]: value }))
    setSmtpTestPassed(false)
    setSmtpTestResult(null)
  }

  // ── Content ─────────────────────────────────────────────────────────────
  const [campaignName, setCampaignName] = useState("")
  const [subject, setSubject] = useState("")
  const [contentType, setContentType] = useState<LeadMailContentType>(LEAD_MAIL_CONTENT_TYPE.TEXT)
  const [textBody, setTextBody] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  /** Nested HTML editing mode: WYSIWYG, raw source, or rendered preview. */
  const [htmlMode, setHtmlMode] = useState<"rich" | "source" | "preview">("rich")
  const body = contentType === LEAD_MAIL_CONTENT_TYPE.HTML ? htmlBody : textBody

  // ── Recipients (Phase 3 audience builder) ────────────────────────────────
  const [recipientTab, setRecipientTab] = useState<RecipientTab>("excel")
  const [rows, setRows] = useState<RecipientRow[]>([])
  const [allUsersConfirmationInput, setAllUsersConfirmationInput] = useState("")
  const [excelFileName, setExcelFileName] = useState<string | null>(null)
  const [excelInvalidCount, setExcelInvalidCount] = useState<number | null>(null)
  const [excelDuplicateCount, setExcelDuplicateCount] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const sendableRecipients = toRecipientInputs(rows)

  // ── Preview dialog ──────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sampleName, setSampleName] = useState("Alex")

  // ── Test send dialog ────────────────────────────────────────────────────
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const parseRecipientsMutation = useParseLeadMailRecipients()
  const downloadTemplateMutation = useDownloadLeadMailRecipientTemplate()
  const annotateMutation = useAnnotateLeadMailRecipients()
  const previewMutation = usePreviewLeadMail()
  const testSendMutation = useTestSendLeadMail()
  const sendMutation = useSendLeadMail()
  const testSmtpMutation = useTestSmtpConnection()

  const usesNameToken = NAME_TOKEN.test(subject) || NAME_TOKEN.test(body)
  const recipientsMissingName = sendableRecipients.filter((r) => !r.name || !r.name.trim())
  const nameTokenBlocked =
    recipientTab !== "all-users" && usesNameToken && recipientsMissingName.length > 0

  const isSmtp = sendMethod === LEAD_MAIL_SEND_METHOD.SMTP
  /** SMTP mode must have passed a connection test THIS session; ZeptoMail needs a from-prefix. */
  const senderReady = isSmtp ? smtpTestPassed : fromPrefix.trim().length > 0

  const allUsersReady = useAllUsersSendReady(recipientTab === "all-users", allUsersConfirmationInput)

  const canSubmit =
    campaignName.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    replyToAddress.trim().length > 0 &&
    (recipientTab === "all-users" ? allUsersReady : sendableRecipients.length > 0) &&
    !nameTokenBlocked &&
    senderReady

  // ── Annotate rows lacking a suppression/Revquix-user check yet ─────────
  // Runs whenever `rows` grows. Chunks a large upload into batches of 500 so a 2000-row sheet
  // never becomes 2000 individual requests (plan §9.3).
  useEffect(() => {
    const unannotated = rows.filter((r) => !r.annotation)
    if (unannotated.length === 0) return

    const batch = unannotated.slice(0, ANNOTATE_BATCH_SIZE).map((r) => r.email)
    annotateMutation.mutate(batch, {
      onSuccess: (results) => setRows((prev) => applyAnnotations(prev, results)),
    })
    // annotateMutation is intentionally omitted — it is a stable mutation object from
    // useMutation and including it would re-run this effect on every render, not just when the
    // set of rows needing annotation actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  // ── Excel/CSV upload (Phase 3: supersedes .xlsx-only /parse-excel) ─────
  const handleRecipientsFile = useCallback(
    (file: File) => {
      const isCsv = file.name.toLowerCase().endsWith(".csv")
      parseRecipientsMutation.mutate(file, {
        onSuccess: (data) => {
          const existingEmails = new Set(rows.map((r) => r.email.toLowerCase()))
          const newRows: RecipientRow[] = data.recipients
            .filter((parsed) => !existingEmails.has(parsed.email.toLowerCase()))
            .map((parsed) => ({
              id: parsed.rowId,
              email: parsed.email,
              name: parsed.name,
              source: isCsv ? RECIPIENT_SOURCE.CSV : RECIPIENT_SOURCE.EXCEL,
            }))
          setRows((prev) => [...prev, ...newRows])
          setExcelFileName(file.name)
          setExcelInvalidCount(data.invalidRows.length)
          setExcelDuplicateCount(data.duplicateRows.length)
        },
      })
    },
    [parseRecipientsMutation, rows],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleRecipientsFile(file)
  }

  const clearExcelSummary = () => {
    setExcelFileName(null)
    setExcelInvalidCount(null)
    setExcelDuplicateCount(null)
  }

  // ── SMTP test connection ────────────────────────────────────────────────
  const handleTestSmtpConnection = () => {
    testSmtpMutation.mutate(smtpCredentials, {
      onSuccess: (result) => {
        setSmtpTestResult(result)
        setSmtpTestPassed(result.success)
      },
      onError: () => {
        setSmtpTestResult({ success: false, message: "Could not reach the server to test this connection." })
        setSmtpTestPassed(false)
      },
    })
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
        sendMethod,
        fromPrefix: isSmtp ? undefined : fromPrefix.trim(),
        smtpCredentials: isSmtp ? smtpCredentials : undefined,
        replyToAddress,
        replyToName: replyToName || undefined,
        testEmail: testEmail.trim(),
        sampleName: sampleName || undefined,
      },
      { onSuccess: () => setTestDialogOpen(false) },
    )
  }

  // ── Send ────────────────────────────────────────────────────────────────
  /**
   * Idempotency key for this composition.
   *
   * Generated on the first send attempt and then reused, which is what makes it work: a fresh key per
   * click would defeat the guard entirely. The server rejects a second submission carrying the same
   * key (RQ-VE-415), so a double-clicked Send button, or a retry after a network timeout, cannot mail
   * the whole list twice.
   *
   * Created lazily inside the handler rather than during render — `crypto.randomUUID`, `Date.now` and
   * `Math.random` are all impure, and calling them while rendering is both a React rule violation and
   * a real hazard, since a re-render could produce a different key and silently disable the guard.
   */
  const clientRequestIdRef = useRef<string | null>(null)

  const handleSend = () => {
    if (!canSubmit) return
    if (clientRequestIdRef.current === null) {
      clientRequestIdRef.current = newClientRequestId()
    }
    const audienceType = AUDIENCE_TYPE_BY_TAB[recipientTab]
    sendMutation.mutate(
      {
        campaignName: campaignName.trim(),
        subject,
        body,
        contentType,
        sendMethod,
        fromPrefix: isSmtp ? undefined : fromPrefix.trim(),
        smtpCredentials: isSmtp ? smtpCredentials : undefined,
        replyToAddress,
        replyToName: replyToName || undefined,
        // Ignored server-side when audienceType is ALL_USERS — the audience is resolved from the
        // live user table instead. See LeadMailSendRequest#getAudienceType().
        recipients: recipientTab === "all-users" ? [] : sendableRecipients,
        audienceType,
        allUsersConfirmationPhrase: recipientTab === "all-users" ? allUsersConfirmationInput.trim() : undefined,
        clientRequestId: clientRequestIdRef.current,
      },
      {
        onSuccess: (data) => {
          router.push(`${PATH_CONSTANTS.ADMIN_LEAD_MAIL_CAMPAIGN_DETAIL}/${data.leadMailCampaignId}`)
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
        <CardContent className="space-y-4">
          <RadioGroup
            value={sendMethod}
            onValueChange={(v) => setSendMethod(v as LeadMailSendMethod)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor="lm-method-zepto"
              className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm"
            >
              <RadioGroupItem value={LEAD_MAIL_SEND_METHOD.ZEPTO_MAIL} id="lm-method-zepto" className="mt-0.5" />
              <div>
                <p className="font-medium">Send via ZeptoMail</p>
                <p className="text-xs text-muted-foreground">
                  {(fromPrefix.trim() || LEAD_MAIL_DEFAULT_FROM_PREFIX)}@{LEAD_MAIL_SENDER_DOMAIN}
                </p>
              </div>
            </label>
            <label
              htmlFor="lm-method-smtp"
              className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm"
            >
              <RadioGroupItem value={LEAD_MAIL_SEND_METHOD.SMTP} id="lm-method-smtp" className="mt-0.5" />
              <div>
                <p className="font-medium">Send via my own SMTP account</p>
                <p className="text-xs text-muted-foreground">Session only — never saved</p>
              </div>
            </label>
          </RadioGroup>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {!isSmtp && (
              <div className="space-y-1.5">
                <Label htmlFor="lm-from-prefix">From</Label>
                <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
                  <Input
                    id="lm-from-prefix"
                    value={fromPrefix}
                    onChange={(e) => setFromPrefix(e.target.value)}
                    placeholder={LEAD_MAIL_DEFAULT_FROM_PREFIX}
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                  <span className="whitespace-nowrap px-3 text-sm text-muted-foreground">
                    @{LEAD_MAIL_SENDER_DOMAIN}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  The part before the @ — any prefix on {LEAD_MAIL_SENDER_DOMAIN} works.
                </p>
              </div>
            )}
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
          </div>

          {isSmtp && (
            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">SMTP configuration</p>
              <p className="text-xs text-muted-foreground">
                Use an app-specific password where your provider supports one, not your main account password.
                These fields are used for this session only and are never saved.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-host">Host</Label>
                  <Input
                    id="lm-smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpForm.host}
                    onChange={(e) => updateSmtpField("host", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-port">Port</Label>
                  <Input
                    id="lm-smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpForm.port}
                    onChange={(e) => updateSmtpField("port", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-username">Username</Label>
                  <Input
                    id="lm-smtp-username"
                    placeholder="you@example.com"
                    value={smtpForm.username}
                    onChange={(e) => updateSmtpField("username", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-password">Password</Label>
                  <Input
                    id="lm-smtp-password"
                    type="password"
                    autoComplete="off"
                    placeholder="App-specific password"
                    value={smtpForm.password}
                    onChange={(e) => updateSmtpField("password", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-encryption">Encryption</Label>
                  <Select
                    value={smtpForm.encryptionMode}
                    onValueChange={(v) => updateSmtpField("encryptionMode", v as LeadMailSmtpEncryptionMode)}
                  >
                    <SelectTrigger id="lm-smtp-encryption" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SMTP_ENCRYPTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lm-smtp-from-address">From address</Label>
                  <Input
                    id="lm-smtp-from-address"
                    type="email"
                    placeholder="you@example.com"
                    value={smtpForm.fromAddress}
                    onChange={(e) => updateSmtpField("fromAddress", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="lm-smtp-from-name">From name (optional)</Label>
                  <Input
                    id="lm-smtp-from-name"
                    placeholder="Your Name"
                    value={smtpForm.fromName}
                    onChange={(e) => updateSmtpField("fromName", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestSmtpConnection}
                  disabled={!smtpFormComplete || testSmtpMutation.isPending}
                >
                  {testSmtpMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing…
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                {smtpTestResult && (
                  <span
                    className={`flex items-center gap-1.5 text-xs ${
                      smtpTestResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {smtpTestResult.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {smtpTestResult.message}
                  </span>
                )}
              </div>
              {!smtpTestPassed && (
                <p className="text-xs text-muted-foreground">
                  A successful connection test is required this session before you can send via SMTP.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requirement 7. Distinct from the subject on purpose: the subject is what the recipient
              reads, the name is what the operator recognises in campaign history six months later —
              and those are rarely the same sentence. */}
          <div className="space-y-1.5">
            <Label htmlFor="lm-campaign-name">
              Campaign name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="lm-campaign-name"
              placeholder="October founder outreach"
              value={campaignName}
              maxLength={160}
              onChange={(e) => setCampaignName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Internal label shown in campaign history. Recipients never see this.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lm-subject">
              Subject <span className="text-rose-500">*</span>
            </Label>
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
              <Tabs value={htmlMode} onValueChange={(v) => setHtmlMode(v as "rich" | "source" | "preview")}>
                <TabsList>
                  <TabsTrigger value="rich">Rich Text</TabsTrigger>
                  <TabsTrigger value="source">HTML Source</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="rich" className="mt-3">
                  <TiptapEditor
                    content={htmlBody}
                    onChange={setHtmlBody}
                    placeholder="Hi {{name}}, I wanted to reach out about…"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    A visual editor for simple formatting. For a full custom HTML email, use the HTML
                    Source tab instead — switching back here may reformat hand-written markup.
                  </p>
                </TabsContent>

                <TabsContent value="source" className="mt-3">
                  <Textarea
                    placeholder={'<p>Hi {{name}},</p>\n<p>I wanted to reach out about…</p>'}
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    className="min-h-[260px] font-mono text-xs"
                    spellCheck={false}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Paste raw HTML — sent as-is. <code className="rounded bg-muted px-1 py-0.5">{"{{name}}"}</code>{" "}
                    is replaced per recipient. Switch to Preview to see how it renders.
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-3">
                  <iframe
                    title="HTML email preview"
                    sandbox=""
                    className="min-h-[260px] w-full rounded-md border bg-white"
                    srcDoc={
                      htmlBody.trim()
                        ? htmlBody
                        : '<p style="color:#9ca3af;font-family:sans-serif;padding:12px">Nothing to preview yet — add HTML in the Source or Rich Text tab.</p>'
                    }
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Rendered in an isolated sandbox (scripts disabled).{" "}
                    <code className="rounded bg-muted px-1 py-0.5">{"{{name}}"}</code> is shown literally here — use
                    the Preview button below to see it resolved against a sample name.
                  </p>
                </TabsContent>
              </Tabs>
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

      {/* ── Recipients (Phase 3 audience builder) ────────────────────────── */}
      {/* overflow-visible override: the user-search picker's own scroll/overflow content must
          escape the card's rounded border instead of being clipped. */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={recipientTab} onValueChange={(v) => setRecipientTab(v as RecipientTab)}>
            <TabsList>
              <TabsTrigger value="excel">Upload Excel/CSV</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="search">Search Users</TabsTrigger>
              <TabsTrigger value="all-users">All Users</TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Requires an &quot;Email&quot; column; &quot;Name&quot; column is optional.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => downloadTemplateMutation.mutate()}
                  disabled={downloadTemplateMutation.isPending}
                >
                  <Download className="size-3.5" /> Download sample template
                </Button>
              </div>

              {excelFileName ? (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{excelFileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(excelInvalidCount ?? 0) > 0 && `${excelInvalidCount} invalid row(s)`}
                        {(excelInvalidCount ?? 0) > 0 && (excelDuplicateCount ?? 0) > 0 && " · "}
                        {(excelDuplicateCount ?? 0) > 0 && `${excelDuplicateCount} duplicate row(s)`}
                        {!excelInvalidCount && !excelDuplicateCount && "All rows parsed cleanly"}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clearExcelSummary}>
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
                  disabled={parseRecipientsMutation.isPending}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/40"
                  }`}
                >
                  {parseRecipientsMutation.isPending ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Drag & drop or click to browse</span>
                  <span className="text-xs text-muted-foreground">.xlsx or .csv · max 5&nbsp;MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleRecipientsFile(file)
                      e.target.value = ""
                    }}
                  />
                </button>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-3">
              <ManualRecipientAddRow existingRows={rows} onAdd={(row) => setRows((prev) => [...prev, row])} />
            </TabsContent>

            <TabsContent value="search" className="mt-3">
              <AudienceUserSearchPicker
                existingRows={rows}
                onAddSelected={(newRows) => setRows((prev) => [...prev, ...newRows])}
              />
            </TabsContent>

            <TabsContent value="all-users" className="mt-3">
              <AllUsersAudiencePanel
                active={recipientTab === "all-users"}
                sendMethod={sendMethod}
                confirmationInput={allUsersConfirmationInput}
                onConfirmationInputChange={setAllUsersConfirmationInput}
              />
            </TabsContent>
          </Tabs>

          {recipientTab !== "all-users" && (
            <RecipientReviewTable rows={rows} onChange={setRows} isAnnotating={annotateMutation.isPending} />
          )}

          {isSmtp && recipientTab !== "all-users" && sendableRecipients.length > 300 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                SMTP sends are limited to 300 recipients per campaign — consumer providers (Gmail, Outlook) impose
                their own daily sending caps. Split this list into smaller batches, or use ZeptoMail instead.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={openPreview} disabled={!subject.trim() || !body.trim()}>
          Preview
        </Button>
        <Button
          variant="outline"
          onClick={() => setTestDialogOpen(true)}
          disabled={!subject.trim() || !body.trim() || (isSmtp && !smtpTestPassed)}
        >
          Send Test
        </Button>
        <Button onClick={handleSend} disabled={!canSubmit || sendMutation.isPending}>
          {sendMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : recipientTab === "all-users" ? (
            <>
              <Users className="h-4 w-4" /> Send to all eligible users
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send to {sendableRecipients.length} recipient
              {sendableRecipients.length === 1 ? "" : "s"}
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
