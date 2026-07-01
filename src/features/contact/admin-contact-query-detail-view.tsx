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
  CONTACT_QUERY_STATUS,
  INQUIRY_TYPE_LABELS,
  type ContactQueryStatus,
} from "./api/contact.types"
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
      { contactQueryId, request: { subject: subject || undefined, body: replyBody } },
      {
        onSuccess: () => {
          setReplySubject("")
          setReplyBody("")
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

      {/* Reply thread */}
      {query.replies && query.replies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Reply thread
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {query.replies.map((reply) => (
              <div key={reply.replyId} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium">{reply.subject}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={reply.deliveryStatus === "SENT" ? "secondary" : "destructive"}>
                      {reply.deliveryStatus}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(reply.sentAt ?? reply.createdAt)}</span>
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none text-sm prose-p:text-foreground prose-a:text-primary-500"
                  dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reply composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Reply by email
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
            <ReplyEditor key={editorKey} content={replyBody} onChange={setReplyBody} />
            <p className="text-xs text-muted-foreground">
              Sent to {query.email} from contact@revquix.com. Replies route back to the support inbox.
            </p>
          </div>

          <Button onClick={handleReply} disabled={replyDisabled}>
            {replyMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Reply
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
