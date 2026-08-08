"use client"

/**
 * ─── SESSION MESSAGES (ADMIN, READ-ONLY) ─────────────────────────────────────
 *
 * The private buyer/mentor conversation, on the booking's own page.
 *
 * ── The three support questions this exists to answer ─────────────────────────
 *  1. **"They asked me to pay outside Revquix."** The content flags are on the messages. Before
 *     this panel, that claim was one person's word against another's with no record either way.
 *  2. **"My mentor never sent me the document."** The attachment list settles it, including the
 *     case where it was sent and then withdrawn — a deleted message stays as a tombstone.
 *  3. **"Why can't I reply?"** The computed window carries its own reason string, so nobody has to
 *     reconstruct the rule from four booking statuses and a package expiry.
 *
 * ── ⚠ Read-only, opened deliberately, and audited ─────────────────────────────
 * There is no admin write path into this thread. Admins read; they do not join. A third voice in a
 * two-party conversation is what a dispute is for, and `DisputeMessage` already supports it with
 * internal-note handling this table does not have.
 *
 * The panel is **collapsed by default and fetches nothing until it is opened.** That is the whole
 * reason it is a disclosure rather than a card that loads with the page: every fetch writes an
 * `AdminActionType.MESSAGE_THREAD_VIEWED` audit row, and a panel that loaded automatically would
 * record every operator who opened a booking for any reason as having read a private conversation.
 * The audit trail is only worth having if the rows in it mean something.
 *
 * ── What the transcript deliberately does not do ──────────────────────────────
 * No left/right alignment. In the parties' own view, side means "mine" — an admin has no side, and
 * borrowing the convention would silently imply one. Here every message is a left-aligned row with
 * an explicit role chip, which is the shape an operator scanning for a pattern reads fastest.
 */

import { useState } from "react"
import {
  ChevronDown,
  Eye,
  FileText,
  Loader2,
  Lock,
  MessagesSquare,
  ShieldAlert,
  Trash2,
  Unlock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useInspectBookingMessages } from "@/features/mentorship-v2/api/calls.hooks"
import type { AdminMessage } from "@/features/mentorship-v2/api/calls.types"
import { formatWhen } from "./console-format"

const ROLE_LABEL: Record<AdminMessage["authorRole"], string> = {
  USER: "Customer",
  MENTOR: "Mentor",
  ADMIN: "Revquix team",
  SYSTEM: "Revquix",
}

const ROLE_TONE: Record<AdminMessage["authorRole"], string> = {
  USER: "border-sky-300/70 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
  MENTOR:
    "border-violet-300/70 bg-violet-50 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200",
  ADMIN: "border-border bg-muted text-foreground",
  SYSTEM: "border-dashed border-border bg-muted/50 text-muted-foreground",
}

/** "CONTACT_DETAILS" → "Contact details" — an operator reads prose, not enum constants. */
function humaniseFlag(flag: string): string {
  const spaced = flag.replace(/_/g, " ").toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export default function SessionMessagesCard({ bookingId }: { bookingId: string }) {
  // Closed until asked for. See the file header: the audit row is the reason.
  const [opened, setOpened] = useState(false)
  const query = useInspectBookingMessages(bookingId, opened)
  const thread = query.data

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessagesSquare className="size-4 text-muted-foreground" aria-hidden />
              Messages
              {thread?.exists && thread.flaggedMessageCount > 0 ? (
                <Badge variant="destructive" className="h-5 gap-1 px-1.5 text-[10px]">
                  <ShieldAlert className="size-3" aria-hidden />
                  {thread.flaggedMessageCount} flagged
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              The private conversation between these two people. Read-only — the console cannot post
              into it, because an admin joining a two-party thread is what a dispute is for.{" "}
              <strong className="font-medium text-foreground">
                Opening this records an audit row against your account.
              </strong>
            </CardDescription>
          </div>
          {!opened ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setOpened(true)}>
              <Eye className="size-4" aria-hidden /> Open the thread
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpened(false)}>
              <ChevronDown className="size-4 rotate-180" aria-hidden /> Collapse
            </Button>
          )}
        </div>
      </CardHeader>

      {opened ? (
        <CardContent className="space-y-4">
          {query.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" aria-hidden /> Loading the
              conversation…
            </p>
          ) : query.isError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Could not load this thread. Reads need{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                PERM_VIEW_MENTORSHIP_V2_INTERNALS
              </code>
              .
            </p>
          ) : !thread?.exists ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              These two have never messaged each other. That is different from an empty
              conversation — no thread row exists, so nothing has been opened, read or deleted.
            </p>
          ) : (
            <>
              {/*
                The summary strip. An operator opening this is triaging, and the four numbers plus
                the window state answer most questions before the transcript is read at all.
              */}
              <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Messages" value={String(thread.messageCount ?? 0)} />
                <Metric
                  label="Flagged"
                  value={String(thread.flaggedMessageCount)}
                  tone={thread.flaggedMessageCount > 0 ? "warn" : undefined}
                />
                <Metric label="Attachments" value={String(thread.attachmentCount)} />
                <Metric
                  label="Deleted"
                  value={String(thread.deletedMessageCount)}
                  tone={thread.deletedMessageCount > 0 ? "warn" : undefined}
                />
                <Metric
                  label="Customer last read"
                  value={formatWhen(thread.buyerLastReadAt)}
                  className="sm:col-span-1"
                />
                <Metric label="Mentor last read" value={formatWhen(thread.mentorLastReadAt)} />
                <Metric label="Thread opened" value={formatWhen(thread.createdAt)} />
                <Metric label="Last message" value={formatWhen(thread.lastMessageAt)} />
              </div>

              {thread.window ? (
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-relaxed",
                    thread.window.open
                      ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  {thread.window.open ? (
                    <Unlock className="mt-px size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
                  )}
                  <span>
                    <strong className="font-medium">
                      {thread.window.open ? "Both parties can write." : "Read-only."}
                    </strong>{" "}
                    {/*
                      The reason string is written in the second person for the parties ("You have a
                      session with this person"). Rendered bare in a console it addresses the
                      operator, who has no session with anyone. Quoting it keeps the diagnostic
                      value — it is exactly what the two of them are being told, which is the thing
                      a support conversation needs — without pretending it was written for the
                      reader.
                    */}
                    <span className="italic">
                      Shown to them as: &ldquo;{thread.window.reason}&rdquo;
                    </span>
                    {thread.window.closesAt
                      ? ` Closes ${formatWhen(thread.window.closesAt)}.`
                      : ""}
                  </span>
                </div>
              ) : null}

              {thread.hasMore ? (
                <p className="text-xs text-muted-foreground">
                  Showing the most recent {thread.messages.length} messages of{" "}
                  {thread.messageCount}. Older ones are not loaded.
                </p>
              ) : null}

              {/*
                The whole conversation, not only this booking's. The thread is keyed on the pair, so
                the message that explains a dispute about session 3 was very often sent between
                sessions 2 and 3 with no booking stamp at all — and each row says which session it
                belongs to, so the distinction stays visible.
              */}
              <ol className="space-y-2.5">
                {thread.messages.map((message) => (
                  <AdminMessageRow
                    key={message.messageId}
                    message={message}
                    currentBookingId={bookingId}
                  />
                ))}
              </ol>
            </>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}

function AdminMessageRow({
  message,
  currentBookingId,
}: {
  message: AdminMessage
  currentBookingId: string
}) {
  const flagged = message.contentFlags.length > 0
  const otherSession = message.bookingId != null && message.bookingId !== currentBookingId

  return (
    <li
      className={cn(
        "rounded-md border p-3",
        flagged
          ? "border-amber-300/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
          : "border-border",
        message.deleted && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge
          variant="outline"
          className={cn("h-5 px-1.5 text-[10px] font-medium", ROLE_TONE[message.authorRole])}
        >
          {ROLE_LABEL[message.authorRole]}
        </Badge>
        <span className="font-medium">{message.authorName ?? "—"}</span>
        <span className="text-muted-foreground">{formatWhen(message.createdAt)}</span>

        {/*
          Which session this message belongs to. A message with no booking is not an anomaly — it
          is somebody talking between sessions, which is a large share of a package thread.
        */}
        {message.bookingId == null ? (
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
            between sessions
          </Badge>
        ) : otherSession ? (
          <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] font-normal">
            {message.bookingId}
          </Badge>
        ) : null}

        {message.deleted ? (
          <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-normal">
            <Trash2 className="size-2.5" aria-hidden /> deleted
          </Badge>
        ) : null}
      </div>

      {message.body ? (
        <p
          className={cn(
            "mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
            message.deleted && "italic text-muted-foreground",
          )}
        >
          {message.body}
        </p>
      ) : (
        <p className="mt-1.5 text-sm italic text-muted-foreground">No text — attachment only.</p>
      )}

      {message.attachments.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {message.attachments.map((attachment) => (
            <li key={attachment.attachmentId}>
              <a
                href={attachment.downloadUrl ?? "#"}
                target="_blank"
                // Object-storage origin: window.opener on a cross-origin tab is a real handle
                // back into the console.
                rel="noopener noreferrer"
                className="inline-flex max-w-xs items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[11px] transition-colors hover:bg-accent"
              >
                <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{attachment.filename}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {attachment.sizeLabel}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        The moderation record. `warningAcknowledged` is the part that matters: it says the sender
        was told and chose to send it anyway, which is the difference between somebody who typed a
        number without thinking and somebody who was warned and went ahead.
      */}
      {flagged ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            {message.contentFlags.map(humaniseFlag).join(", ")}
            {message.warningAcknowledged
              ? " · the sender was warned and sent it anyway"
              : " · flagged, delivered without an acknowledgement"}
          </span>
        </p>
      ) : null}
    </li>
  )
}

function Metric({
  label,
  value,
  tone,
  className,
}: {
  label: string
  value: string
  tone?: "warn"
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-medium",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </div>
  )
}
