"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  Clock,
  Archive,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import {
  useContactQueryDetail,
  useReplyToContactQuery,
  useUpdateContactNote,
  useUpdateContactStatus,
} from "./api/contact.hooks"
import {
  RELATED_ENTITY_LABELS,
  CONTACT_QUERY_STATUS,
  INQUIRY_TYPE_LABELS,
  type ContactQueryStatus,
} from "./api/contact.types"
import { CANNED_REPLIES } from "./canned-replies"
import { ReplyEditor } from "./reply-editor"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

function getStatusBadge(status: ContactQueryStatus) {
  const map: Record<
    ContactQueryStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    NEW: { variant: "destructive", label: "New" },
    IN_PROGRESS: { variant: "secondary", label: "In Progress" },
    COMPLETED: { variant: "outline", label: "Completed" },
    SPAM: { variant: "outline", label: "Spam" },
    ARCHIVED: { variant: "outline", label: "Archived" },
  }
  const info = map[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  )
}

interface AdminContactQueryDetailViewProps {
  contactQueryId: string
}

export function AdminContactQueryDetailView({ contactQueryId }: AdminContactQueryDetailViewProps) {
  const router = useRouter()
  const { data: query, isLoading, isError } = useContactQueryDetail(contactQueryId)
  const updateStatus = useUpdateContactStatus()
  const updateNote = useUpdateContactNote()
  const replyMutation = useReplyToContactQuery()

  const [replySubject, setReplySubject] = useState("")
  const [replyBody, setReplyBody] = useState("")
  /**
   * Compose a staff-only note instead of a reply.
   *
   * The `internalNote` textarea further down writes the single `internal_note` COLUMN on the
   * ticket, which has no position relative to the conversation it is about. This writes a
   * message on the thread — same privacy, but in order, so "we checked the gateway on the 3rd"
   * sits between the two replies it explains.
   */
  const [asInternalNote, setAsInternalNote] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [note, setNote] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !query) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Could not load this contact query. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const noteValue = note ?? query.internalNote ?? ""
  const defaultSubject = `Revquix Support - ${query.ticketRef}`

  const subjectPresets = [
    defaultSubject,
    ...(query.subject ? [`Re: ${query.subject}`] : []),
    "Following up on your inquiry",
    `Resolution of your request [${query.ticketRef}]`,
  ]

  const handleStatus = (status: ContactQueryStatus) => {
    updateStatus.mutate({ contactQueryId, request: { status } })
  }

  const handleReply = () => {
    const subject = replySubject.trim()
    replyMutation.mutate(
      {
        contactQueryId,
        request: {
          subject: subject || undefined,
          body: replyBody,
          internalNote: asInternalNote,
        },
      },
      {
        onSuccess: () => {
          setReplySubject("")
          setReplyBody("")
          setAsInternalNote(false)
          setEditorKey((k) => k + 1)
        },
      },
    )
  }

  const handleSaveNote = () => {
    updateNote.mutate({ contactQueryId, request: { internalNote: noteValue } })
  }

  const replyDisabled = replyMutation.isPending || replyBody.trim().length === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_CONTACT_QUERIES)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{query.ticketRef}</h1>
            {getStatusBadge(query.status)}
            <Badge variant="secondary">{INQUIRY_TYPE_LABELS[query.inquiryType]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Received {formatDate(query.createdAt)}
          </p>
        </div>
      </div>

      {/* Status actions */}
      <div className="flex flex-wrap gap-2">
        {query.status !== CONTACT_QUERY_STATUS.IN_PROGRESS &&
          query.status !== CONTACT_QUERY_STATUS.COMPLETED && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatus(CONTACT_QUERY_STATUS.IN_PROGRESS)}
              disabled={updateStatus.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark In Progress
            </Button>
          )}
        {query.status !== CONTACT_QUERY_STATUS.COMPLETED && (
          <Button
            size="sm"
            onClick={() => handleStatus(CONTACT_QUERY_STATUS.COMPLETED)}
            disabled={updateStatus.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Completed
          </Button>
        )}
        {query.status !== CONTACT_QUERY_STATUS.SPAM && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatus(CONTACT_QUERY_STATUS.SPAM)}
            disabled={updateStatus.isPending}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Mark Spam
          </Button>
        )}
        {query.status !== CONTACT_QUERY_STATUS.ARCHIVED && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatus(CONTACT_QUERY_STATUS.ARCHIVED)}
            disabled={updateStatus.isPending}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        )}
      </div>

      {query.status === CONTACT_QUERY_STATUS.COMPLETED && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Completed</AlertTitle>
          <AlertDescription>
            {query.resolvedAt ? `Resolved on ${formatDate(query.resolvedAt)}` : "This query is resolved."}
          </AlertDescription>
        </Alert>
      )}

      {/* Submitter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Submitter
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <DetailRow label="Name" value={query.name} />
          <DetailRow label="Email" value={query.email} />
          {/* ── What the ticket is about (Phase 3) ──────────────────────────
              Present only when the member arrived from a "Get help with this" control. This is
              the typed version of pageUrl: an id you can search on rather than a URL you have to
              read and decode. It may dangle — the record can be archived after the ticket — so it
              renders as a reference, not as a link to something assumed to exist. */}
          {query.relatedEntityType && query.relatedEntityId ? (
            <DetailRow
              label={`About this ${RELATED_ENTITY_LABELS[query.relatedEntityType].toLowerCase()}`}
              value={query.relatedEntityId}
            />
          ) : null}
          <DetailRow label="Phone" value={query.phone} />
          <DetailRow
            label="Preferred channel"
            value={query.preferredContactMethod}
          />
          <DetailRow label="Company" value={query.company} />
          <DetailRow label="Budget" value={query.budgetRange} />
          <DetailRow label="Hiring urgency" value={query.hiringUrgency} />
          <DetailRow label="Engagement" value={query.hiringFor} />
          <DetailRow label="Related service" value={query.relatedService} />
          <DetailRow
            label="Account"
            value={query.authenticatedSubmission ? `Signed-in (${query.userId ?? "user"})` : "Guest"}
          />
          <DetailRow label="Marketing opt-in" value={query.marketingOptIn ? "Yes" : "No"} />
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.subject && <p className="font-medium text-sm">{query.subject}</p>}
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{query.message}</p>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <DetailRow label="Source page" value={query.pageUrl} />
          <DetailRow label="Referrer" value={query.referrerUrl} />
          <DetailRow label="UTM source" value={query.utmSource} />
          <DetailRow label="UTM medium" value={query.utmMedium} />
          <DetailRow label="UTM campaign" value={query.utmCampaign} />
          <DetailRow label="Locale" value={query.locale} />
          <DetailRow label="IP address" value={query.ipAddress} />
          <DetailRow label="User agent" value={query.userAgent} />
          <DetailRow label="First responded" value={query.firstRespondedAt ? formatDate(query.firstRespondedAt) : null} />
        </CardContent>
      </Card>

      {/* ── The thread, both sides ──────────────────────────────────────────
          Was staff replies only, which was accurate until Phase 2: there was no
          other kind. Now a member's reply is a row here too, and a thread that
          rendered one side would make the member's half invisible to the person
          answering — the same one-way defect this phase set out to fix, only
          pointing the other way.

          Three visually distinct kinds, and the distinction is load-bearing:
            · staff reply   — what we sent, with its delivery status
            · member reply  — what they sent back
            · internal note — never sent, never visible to them */}
      {query.replies && query.replies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {query.replies.map((reply) => {
              const fromMember = reply.direction === "USER_TO_STAFF"
              return (
                <div
                  key={reply.replyId}
                  className={
                    reply.internalNote
                      ? "rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
                      : fromMember
                        ? "rounded-lg border border-primary-300 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-950/20"
                        : "rounded-lg border p-4"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">
                      {reply.internalNote
                        ? "Internal note"
                        : fromMember
                          ? `${query.name} replied`
                          : (reply.subject ?? "Support reply")}
                    </p>
                    <div className="flex items-center gap-2">
                      {reply.internalNote ? (
                        <Badge variant="outline">Not sent — staff only</Badge>
                      ) : fromMember ? (
                        <Badge variant="outline">From member</Badge>
                      ) : (
                        <Badge variant={reply.deliveryStatus === "SENT" ? "secondary" : "destructive"}>
                          {reply.deliveryStatus}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(reply.sentAt ?? reply.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-sm prose-p:text-foreground prose-a:text-primary-500"
                    dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Reply composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {asInternalNote ? "Add an internal note" : "Reply to the member"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply-subject">Subject</Label>
            <Input
              id="reply-subject"
              placeholder={defaultSubject}
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {subjectPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReplySubject(preset)}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>

            {/* ── Canned bodies (Phase 4 §7) ────────────────────────────────
                Inserting one REPLACES the editor content and does nothing else — no send, no
                status change. A canned reply that could go out in one click is how somebody
                sends "we've issued your refund" to a person whose refund was not issued.
                Hidden while composing an internal note: these are all addressed to the member. */}
            {!asInternalNote && (
              <div className="flex flex-wrap gap-1.5">
                {CANNED_REPLIES.map((canned) => (
                  <button
                    key={canned.id}
                    type="button"
                    title={canned.hint}
                    onClick={() => {
                      // ⚠ The editorKey bump is REQUIRED, not cosmetic. `ReplyEditor` is TipTap's
                      // `useEditor({ content })`, which reads `content` once at initialisation and
                      // has no effect syncing later changes — so setting state alone updates
                      // `replyBody` while the visible editor stays exactly as it was. Remounting is
                      // what actually inserts the text, and it is why `editorKey` already exists
                      // (the post-send clear needs it for the same reason).
                      setReplyBody(canned.body({ name: query.name, ticketRef: query.ticketRef }))
                      setEditorKey((k) => k + 1)
                    }}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {canned.label}
                  </button>
                ))}
              </div>
            )}

            <ReplyEditor key={editorKey} content={replyBody} onChange={setReplyBody} />
            {/* The old copy said replies "route back to the support inbox", which was never true —
                there is no inbound mail ingestion. Members now answer on their ticket page, and
                the reply email is a deep link there. Anonymous /contact submissions have no page
                to link to and keep the reply-to behaviour. */}
            <p className="text-xs text-muted-foreground">
              {asInternalNote
                ? "Not sent to anyone. Visible only in this console, in thread order."
                : query.userId
                  ? `Emailed to ${query.email} as a link to their ticket page, where they can reply.`
                  : `Emailed to ${query.email} with the full message — this submission has no account, so there is no ticket page to link to.`}
            </p>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={asInternalNote}
              onChange={(e) => setAsInternalNote(e.target.checked)}
            />
            <span>
              <span className="font-medium">Internal note</span>
              <span className="block text-xs text-muted-foreground">
                Records this on the thread for the team without sending it. Does not count as a
                first response and leaves the ticket in the queue.
              </span>
            </span>
          </label>

          <Button onClick={handleReply} disabled={replyDisabled}>
            {replyMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {asInternalNote ? "Save internal note" : "Send Reply"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Internal note */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Internal note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add an internal note visible only to admins…"
            value={noteValue}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <Button variant="outline" onClick={handleSaveNote} disabled={updateNote.isPending}>
            {updateNote.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save note
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
