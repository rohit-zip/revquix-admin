"use client"

/**
 * LeadMailCampaignDetailView — send report and operator controls for one campaign.
 *
 * Phase 2 adds three things the report could not do before:
 *  - Lifecycle controls. Phase 1 built pause/resume/cancel/retry-failed but nothing could invoke
 *    them, so a send with the wrong subject line still had no stop button in the UI.
 *  - Paginated recipients. The detail response caps its inlined array, so a large campaign showed a
 *    silently truncated report.
 *  - CSV export, because past a few hundred rows this question is answered in a spreadsheet.
 *
 * Polling stops at a terminal status. The interval is a predicate over the latest query data rather
 * than a constant — with a constant, a finished campaign was re-fetched every three seconds for as
 * long as the tab stayed open (plan §0.4 defect 2).
 */

import { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  Ban,
  Copy,
  Download,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useCloneLeadMailCampaign,
  useDownloadLeadMailRecipientsCsv,
  useLeadMailCampaign,
  useLeadMailCampaignAction,
  useLeadMailCampaignRecipients,
} from "./api/lead-mail.hooks"
import {
  LEAD_MAIL_CAMPAIGN_STATUS,
  LEAD_MAIL_DELIVERY_STATUS,
  LEAD_MAIL_SEND_METHOD,
  LEAD_MAIL_SMTP_ENCRYPTION_MODE,
  isDispatchingCampaignStatus,
  isTerminalCampaignStatus,
  type LeadMailDeliveryStatus,
  type SmtpCredentialsInput,
} from "./api/lead-mail.types"
import {
  CampaignStatusBadge,
  DeliveryStatusBadge,
  SKIP_REASON_LABELS,
  formatDateTime,
} from "./components/lead-mail-badges"
import { TablePagination } from "./components/table-pagination"
import { useDebouncedValue } from "./use-debounced-value"

const POLL_INTERVAL_MS = 3000
const RECIPIENT_PAGE_SIZE = 50
const ANY = "__any__"

type LifecycleAction = "pause" | "resume" | "cancel" | "retry-failed"

export function LeadMailCampaignDetailView({ campaignId }: { campaignId: string }) {
  const router = useRouter()

  const { data, isLoading } = useLeadMailCampaign(campaignId, {
    refetchInterval: (query) =>
      isTerminalCampaignStatus(query.state.data?.status) ? false : POLL_INTERVAL_MS,
  })

  const [recipientPage, setRecipientPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>(ANY)
  const [recipientSearch, setRecipientSearch] = useState("")
  const debouncedRecipientSearch = useDebouncedValue(recipientSearch, 300)

  const recipients = useLeadMailCampaignRecipients(
    campaignId,
    recipientPage,
    RECIPIENT_PAGE_SIZE,
    statusFilter === ANY ? undefined : (statusFilter as LeadMailDeliveryStatus),
    debouncedRecipientSearch.trim() || undefined,
  )

  const action = useLeadMailCampaignAction()
  const cloneCampaign = useCloneLeadMailCampaign()
  const downloadCsv = useDownloadLeadMailRecipientsCsv()

  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [smtpForm, setSmtpForm] = useState<SmtpCredentialsInput>(emptySmtpForm())

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const skippedCount = data.skippedCount ?? 0
  const settled = data.sentCount + data.failedCount + skippedCount
  const progressPct = data.recipientCount > 0 ? Math.round((settled / data.recipientCount) * 100) : 0
  const isDispatching = isDispatchingCampaignStatus(data.status)
  const isTerminal = isTerminalCampaignStatus(data.status)
  const isDraft = data.status === LEAD_MAIL_CAMPAIGN_STATUS.DRAFT
  const isPaused = data.status === LEAD_MAIL_CAMPAIGN_STATUS.PAUSED
  const isInterrupted = data.status === LEAD_MAIL_CAMPAIGN_STATUS.INTERRUPTED
  const isSmtp = data.sendMethod === LEAD_MAIL_SEND_METHOD.SMTP

  // Resume and retry need SMTP credentials again: they existed only in the memory of the worker that
  // stopped, and are never persisted. Cancel and pause need nothing.
  const actionNeedsCredentials = (a: LifecycleAction) =>
    isSmtp && (a === "resume" || a === "retry-failed")

  const requestAction = (a: LifecycleAction) => {
    if (a === "cancel" || actionNeedsCredentials(a)) {
      setPendingAction(a)
      return
    }
    action.mutate({ campaignId, action: a })
  }

  const confirmAction = () => {
    if (!pendingAction) return
    action.mutate(
      {
        campaignId,
        action: pendingAction,
        request: {
          reason: pendingAction === "cancel" ? cancelReason.trim() || undefined : undefined,
          smtpCredentials: actionNeedsCredentials(pendingAction) ? smtpForm : undefined,
        },
      },
      {
        onSuccess: () => {
          setPendingAction(null)
          setCancelReason("")
          setSmtpForm(emptySmtpForm())
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header + controls ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">
                {data.campaignName ?? data.subject ?? "Untitled campaign"}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.subject ? <span>{data.subject} · </span> : null}
                Created {formatDateTime(data.createdAt)}
                {data.createdByName ? ` by ${data.createdByName}` : ""}
                {data.fromPrefix ? ` · from ${data.fromPrefix}@revquix.com` : ""}
                {isSmtp ? " · via SMTP" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CampaignStatusBadge status={data.status} />
              {data.sendConcurrency ? (
                <Badge variant="secondary" className="text-xs" title="Messages in flight at once">
                  {data.sendConcurrency} at a time
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* An interrupted campaign is the one state that needs explaining: it stopped without
              finishing, and for SMTP it cannot restart on its own. */}
          {isInterrupted && (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>This campaign stopped before finishing</AlertTitle>
              <AlertDescription>
                {data.failureReason ??
                  "The sending process stopped mid-campaign."}{" "}
                Resume it to continue from where it left off — already-sent recipients are never
                re-sent.
              </AlertDescription>
            </Alert>
          )}

          {data.status === LEAD_MAIL_CAMPAIGN_STATUS.CANCELLED && data.failureReason && (
            <Alert>
              <Ban className="size-4" />
              <AlertTitle>
                Cancelled{data.cancelledByName ? ` by ${data.cancelledByName}` : ""}
                {data.cancelledAt ? ` · ${formatDateTime(data.cancelledAt)}` : ""}
              </AlertTitle>
              <AlertDescription>{data.failureReason}</AlertDescription>
            </Alert>
          )}

          {isDraft ? (
            <p className="text-sm text-muted-foreground">
              This campaign is a draft and has not been sent. Nothing has been delivered.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                <Stat label="Recipients" value={data.recipientCount} />
                <Stat label="Sent" value={data.sentCount} tone="positive" />
                <Stat label="Failed" value={data.failedCount} tone="negative" />
                <Stat label="Skipped" value={skippedCount} tone="muted" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isDispatching ? "Sending…" : isPaused ? "Paused" : "Done"}</span>
                  <span>
                    {settled} / {data.recipientCount}
                  </span>
                </div>
                <Progress value={progressPct} />
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {isDispatching && (
              <>
                <Button variant="outline" size="sm" onClick={() => requestAction("pause")} disabled={action.isPending}>
                  <PauseCircle className="size-4" /> Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  onClick={() => requestAction("cancel")}
                  disabled={action.isPending}
                >
                  <Ban className="size-4" /> Cancel
                </Button>
              </>
            )}

            {(isPaused || isInterrupted) && (
              <>
                <Button size="sm" onClick={() => requestAction("resume")} disabled={action.isPending}>
                  <PlayCircle className="size-4" /> Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  onClick={() => requestAction("cancel")}
                  disabled={action.isPending}
                >
                  <Ban className="size-4" /> Cancel
                </Button>
              </>
            )}

            {isTerminal && data.failedCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => requestAction("retry-failed")} disabled={action.isPending}>
                <RefreshCw className="size-4" /> Retry {data.failedCount} failed
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                cloneCampaign.mutate(campaignId, {
                  onSuccess: (draft) =>
                    router.push(
                      `${PATH_CONSTANTS.ADMIN_LEAD_MAIL_CAMPAIGN_DETAIL}/${draft.leadMailCampaignId}`,
                    ),
                })
              }
              disabled={cloneCampaign.isPending}
            >
              <Copy className="size-4" /> Duplicate
            </Button>

            {!isDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv.mutate({
                    campaignId,
                    fallbackFileName: `${campaignId}-recipients.csv`,
                  })
                }
                disabled={downloadCsv.isPending}
              >
                {downloadCsv.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Export CSV
              </Button>
            )}

            {action.isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Applying…
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Send report ────────────────────────────────────────────────────── */}
      {!isDraft && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Send report</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value)
                      setRecipientPage(0)
                    }}
                    placeholder="Search email"
                    className="pl-8"
                    aria-label="Search recipients by email"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v)
                    setRecipientPage(0)
                  }}
                >
                  <SelectTrigger className="w-[150px]" aria-label="Filter recipients by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any status</SelectItem>
                    <SelectItem value={LEAD_MAIL_DELIVERY_STATUS.SENT}>Sent</SelectItem>
                    <SelectItem value={LEAD_MAIL_DELIVERY_STATUS.FAILED}>Failed</SelectItem>
                    <SelectItem value={LEAD_MAIL_DELIVERY_STATUS.SKIPPED}>Skipped</SelectItem>
                    <SelectItem value={LEAD_MAIL_DELIVERY_STATUS.PENDING}>Pending</SelectItem>
                    <SelectItem value={LEAD_MAIL_DELIVERY_STATUS.SENDING}>Sending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recipients.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (recipients.data?.content.length ?? 0) === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No recipients match these filters.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.data?.content.map((recipient) => (
                        <TableRow key={recipient.leadMailRecipientId}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{recipient.name ?? "—"}</p>
                              <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DeliveryStatusBadge status={recipient.deliveryStatus} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(recipient.sentAt)}
                          </TableCell>
                          {/* A skip reason is information; an error is a problem. Same column,
                              deliberately different styling. */}
                          {recipient.skipReason ? (
                            <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                              {SKIP_REASON_LABELS[recipient.skipReason] ?? recipient.skipReason}
                            </TableCell>
                          ) : (
                            <TableCell
                              className="max-w-xs truncate text-xs text-rose-500"
                              title={recipient.errorMessage ?? undefined}
                            >
                              {recipient.errorMessage ?? "—"}
                              {(recipient.attemptCount ?? 0) > 1 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({recipient.attemptCount} attempts)
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <TablePagination
                  page={recipients.data?.number ?? 0}
                  totalPages={recipients.data?.totalPages ?? 0}
                  totalElements={recipients.data?.totalElements ?? 0}
                  pageSize={recipients.data?.size ?? RECIPIENT_PAGE_SIZE}
                  onPageChange={setRecipientPage}
                  isLoading={recipients.isFetching}
                  itemLabel="recipients"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Confirmation / credential re-entry ─────────────────────────────── */}
      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null)
            setSmtpForm(emptySmtpForm())
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "cancel"
                ? "Cancel this campaign?"
                : pendingAction === "resume"
                  ? "Resume this campaign"
                  : "Retry failed recipients"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "cancel"
                ? "Recipients not yet sent will be recorded as skipped. Messages already handed to the sending provider cannot be recalled."
                : "This campaign was sent over SMTP. Your credentials were never stored, so re-enter them to continue. Recipients already sent are never re-sent."}
            </DialogDescription>
          </DialogHeader>

          {pendingAction === "cancel" ? (
            <div className="space-y-1.5">
              <Label htmlFor="lm-cancel-reason">Reason (optional)</Label>
              <Textarea
                id="lm-cancel-reason"
                value={cancelReason}
                maxLength={500}
                placeholder="Wrong recipient list"
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Recorded on the campaign, so the reason is still available later.
              </p>
            </div>
          ) : (
            pendingAction !== null && <SmtpFields value={smtpForm} onChange={setSmtpForm} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={action.isPending}>
              Back
            </Button>
            <Button
              onClick={confirmAction}
              disabled={action.isPending || (pendingAction !== null && !isActionReady(pendingAction, smtpForm))}
              variant={pendingAction === "cancel" ? "destructive" : "default"}
            >
              {action.isPending && <Loader2 className="size-4 animate-spin" />}
              {pendingAction === "cancel" ? "Cancel campaign" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "positive" | "negative" | "muted"
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-rose-600 dark:text-rose-400"
        : tone === "muted"
          ? "text-muted-foreground"
          : ""
  return (
    <div className="rounded-md border p-3">
      <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/**
 * SMTP credential fields for a resume or retry.
 *
 * Component-local state held by the parent and discarded when the dialog closes — never persisted and
 * never cached, matching how the compose screen treats them.
 */
function SmtpFields({
  value,
  onChange,
}: {
  value: SmtpCredentialsInput
  onChange: (next: SmtpCredentialsInput) => void
}) {
  const set = (patch: Partial<SmtpCredentialsInput>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-host">Host</Label>
        <Input id="lm-smtp-host" value={value.host} onChange={(e) => set({ host: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-port">Port</Label>
        <Input
          id="lm-smtp-port"
          type="number"
          value={value.port}
          onChange={(e) => set({ port: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-username">Username</Label>
        <Input
          id="lm-smtp-username"
          autoComplete="off"
          value={value.username}
          onChange={(e) => set({ username: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-password">Password</Label>
        <Input
          id="lm-smtp-password"
          type="password"
          autoComplete="off"
          value={value.password}
          onChange={(e) => set({ password: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-encryption">Encryption</Label>
        <Select
          value={value.encryptionMode}
          onValueChange={(v) => set({ encryptionMode: v as SmtpCredentialsInput["encryptionMode"] })}
        >
          <SelectTrigger id="lm-smtp-encryption">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LEAD_MAIL_SMTP_ENCRYPTION_MODE.STARTTLS}>STARTTLS</SelectItem>
            <SelectItem value={LEAD_MAIL_SMTP_ENCRYPTION_MODE.SSL}>SSL</SelectItem>
            <SelectItem value={LEAD_MAIL_SMTP_ENCRYPTION_MODE.NONE}>None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lm-smtp-from">From address</Label>
        <Input
          id="lm-smtp-from"
          value={value.fromAddress}
          onChange={(e) => set({ fromAddress: e.target.value })}
        />
      </div>
    </div>
  )
}

function emptySmtpForm(): SmtpCredentialsInput {
  return {
    host: "",
    port: 587,
    username: "",
    password: "",
    encryptionMode: LEAD_MAIL_SMTP_ENCRYPTION_MODE.STARTTLS,
    fromAddress: "",
    fromName: "",
  }
}

/** Cancel needs nothing; resume and retry over SMTP need a complete credential set. */
function isActionReady(action: LifecycleAction, smtp: SmtpCredentialsInput): boolean {
  if (action === "cancel") return true
  return (
    smtp.host.trim().length > 0 &&
    smtp.username.trim().length > 0 &&
    smtp.password.length > 0 &&
    smtp.fromAddress.trim().length > 0 &&
    smtp.port > 0
  )
}
