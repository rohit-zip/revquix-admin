"use client"

/**
 * ─── ONE SESSION ──────────────────────────────────────────────────────────────
 *
 * The booking's full case file, promoted from a box on a diagnostics console to its own route.
 *
 * Everything here already existed as `BookingSessionDiagnosticsResponse` — what changes is that you
 * can now reach it by clicking a row instead of by knowing a booking id. The two admin actions
 * (force-complete, force-submit feedback) come with it, because the moment an operator can find a
 * stuck booking they will want to unstick it without going somewhere else.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Send, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useForceCompleteBooking,
  useInspectBookingSession,
} from "@/features/mentorship-v2/api/calls.hooks"
import { PersonCell, RefLink, StatusBadge, formatWhen } from "./console-format"
import SessionMessagesCard from "./session-messages-card"

export default function SessionDetailView({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const query = useInspectBookingSession(bookingId)
  const booking = query.data
  const forceComplete = useForceCompleteBooking()
  const [reason, setReason] = useState("")

  if (query.isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-5 animate-spin" /> Loading session…
      </p>
    )
  }

  if (query.isError || !booking) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_SESSIONS)}>
          <ArrowLeft className="size-4" /> Back to sessions
        </Button>
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>No session found</AlertTitle>
          <AlertDescription>
            Nothing matches <span className="font-mono">{bookingId}</span>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const openAfterSession =
    booking.status === "IN_PROGRESS" || booking.status === "PENDING_CONFIRMATION"

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_SESSIONS)}
        >
          <ArrowLeft className="size-4" /> Sessions
        </Button>
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {booking.serviceTitle ?? "Session"}
            <StatusBadge status={booking.status} label={booking.statusLabel} />
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{booking.bookingId}</p>
        </div>
      </header>

      {booking.feedbackBreached ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>The feedback deadline lapsed with no report filed</AlertTitle>
          <AlertDescription className="text-xs">
            The mentor missed {formatWhen(booking.feedbackDeadlineAt)}. This is a statement about the
            deadline and the absence of a report — not the same thing as the booking&apos;s status,
            which covers any complaint.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Mentor">
                <PersonCell name={booking.mentorName} userId={booking.mentorUserId} />
              </Field>
              <Field label="Buyer">
                <PersonCell name={booking.buyerName} userId={booking.buyerUserId} />
              </Field>
              <Field label="Order">
                <RefLink
                  id={booking.orderId}
                  href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${booking.orderId}`}
                />
              </Field>
              <Field label="Service">
                <RefLink
                  id={booking.serviceId}
                  href={`${PATH_CONSTANTS.ADMIN_PM_SERVICES}/${booking.serviceId}`}
                />
              </Field>
              <Field label="Starts">{formatWhen(booking.startsAt)}</Field>
              <Field label="Ends">{formatWhen(booking.endsAt)}</Field>
              <Field label="Duration">
                {booking.durationMinutes ? `${booking.durationMinutes} min` : "—"}
              </Field>
              <Field label="Timezones">
                {booking.mentorTimezone ?? "—"} / {booking.buyerTimezone ?? "—"}
              </Field>
              <Field label="Reschedules">
                {booking.rescheduleCount ?? 0} by buyer · {booking.mentorRescheduleCount ?? 0} by
                mentor (cap {booking.maxReschedules ?? "—"} each)
              </Field>
              <Field label="Auto-complete at">
                {formatWhen(booking.autoCompleteAt)}
                {booking.autoCompleted ? " (done)" : ""}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting link</CardTitle>
              <CardDescription>
                Where the link came from matters more than whether one exists: a REVQUIX_MEET
                service whose link says MANUAL failed to mint a room, and that is the booking a
                retry is for.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider">{booking.meetingProvider ?? "—"}</Field>
              <Field label="Source">{booking.meetingLinkSource ?? "none"}</Field>
              <Field label="Ready at">{formatWhen(booking.meetingLinkReadyAt)}</Field>
              <Field label="Link present">{booking.hasMeetingLink ? "Yes" : "NO"}</Field>
              {booking.meetingLinkError ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Last error</p>
                  <p className="mt-0.5 text-sm text-destructive">{booking.meetingLinkError}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/*
            ── Room attendance ──────────────────────────────────────────────
            The server has returned these records since M5; this page rendered only the click
            ledger below, which is the WEAKER of the two sources and, on a session held in a room
            Revquix minted, the one that misses joins. Every session is held that way now, so an
            operator working a no-show here was reading half the evidence.

            Rendered only when there IS a Revquix room. An empty table on a legacy booking would
            read as "Google saw nobody", which is a completely different claim from "Google was
            never in a position to see anyone".
          */}
          {booking.meetSpaceName ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  In the room ({booking.meetParticipants?.length ?? 0})
                </CardTitle>
                <CardDescription>
                  Google&apos;s own record of who was in the Revquix-hosted room. Stronger than the
                  Join ledger below, because that room can only be reached through the Join button —
                  so an empty record here means nobody entered, not merely that nobody clicked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Room">{booking.meetSpaceName}</Field>
                  <Field label="Read of the room">
                    {/*
                      NO_RECORD is evidence, not an error, and must never be styled as one — it is
                      the strongest finding this panel can produce.
                    */}
                    {booking.meetAttendanceStatus ?? "not read yet"}
                  </Field>
                  <Field label="Distinct signed-in identities">
                    {booking.meetDistinctSignedInCount}
                  </Field>
                  <Field label="Torn down">{formatWhen(booking.meetTornDownAt)}</Field>
                </div>

                {booking.meetAttendanceCaveat ? (
                  <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs text-muted-foreground">
                    {booking.meetAttendanceCaveat}
                  </p>
                ) : null}

                {booking.meetUnexpectedParticipantCount > 0 ? (
                  <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs">
                    <strong>{booking.meetUnexpectedParticipantCount}</strong> signed-in{" "}
                    {booking.meetUnexpectedParticipantCount === 1 ? "identity was" : "identities were"}{" "}
                    in this room and matched neither party. Usually the mentor on a second Google
                    account or a colleague they brought — a flag for you, not a finding.
                  </p>
                ) : null}

                {booking.meetParticipants && booking.meetParticipants.length > 0 ? (
                  <ol className="space-y-1 border-l pl-3">
                    {booking.meetParticipants.map((participant) => (
                      <li key={participant.meetParticipantId} className="text-xs">
                        <p className="flex flex-wrap items-center gap-1.5 font-medium">
                          {/*
                            `identified` and nothing else. A display name is typed by whoever joined
                            the Meet lobby, so rendering an unmatched row as "MENTOR" would let a
                            no-show claim — which is a refund — be defeated by typing.
                          */}
                          {participant.identified ? (
                            <Badge variant="outline" className="h-4 px-1 text-[10px]">
                              {participant.resolvedRole}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                              unidentified
                            </Badge>
                          )}
                          <span className={participant.identified ? "" : "text-muted-foreground"}>
                            {participant.displayName ?? "no name"}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {formatWhen(participant.joinedAt)} →{" "}
                          {participant.leftAt
                            ? formatWhen(participant.leftAt)
                            : "still in the room when read"}
                          {participant.minutesPresent == null
                            ? ""
                            : ` · ${participant.minutesPresent} min`}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {booking.meetAttendanceStatus === "NO_RECORD"
                      ? "Google has no conference for this room at all — nobody entered it."
                      : "Google's records for this room have not been read yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Join evidence ({booking.joinEvents?.length ?? 0})
              </CardTitle>
              <CardDescription>
                Every click of our own Join button. The weaker of the two sources: on a legacy
                booking a mentor could reach the call through a calendar invite and leave no row
                here at all, which is why a dispute rule waits rather than firing instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Mentor joined">{formatWhen(booking.mentorJoinedAt)}</Field>
                <Field label="Buyer joined">{formatWhen(booking.buyerJoinedAt)}</Field>
                <Field label="Session started">{formatWhen(booking.sessionStartedAt)}</Field>
                <Field label="Session ended">{formatWhen(booking.sessionEndedAt)}</Field>
                <Field label="Buyer confirmed">{formatWhen(booking.buyerConfirmedAttendedAt)}</Field>
                <Field label="Mentor confirmed">
                  {formatWhen(booking.mentorConfirmedAttendedAt)}
                </Field>
              </div>
              {booking.joinEvents && booking.joinEvents.length > 0 ? (
                <ol className="space-y-1 border-l pl-3">
                  {booking.joinEvents.map((event) => (
                    <li key={event.joinEventId} className="text-xs">
                      <p className="font-medium">
                        {event.role ?? "unknown role"} · {formatWhen(event.joinClickedAt)}
                        {event.withinWindow ? null : (
                          <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                            outside window
                          </Badge>
                        )}
                      </p>
                      <p className="text-muted-foreground">{event.ipAddress ?? "no ip"}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted-foreground">Nobody clicked Join.</p>
              )}
            </CardContent>
          </Card>

          {booking.feedbackRequired ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mock-interview feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Window started">{formatWhen(booking.feedbackWindowStartedAt)}</Field>
                  <Field label="Deadline">{formatWhen(booking.feedbackDeadlineAt)}</Field>
                </div>
                {booking.feedback ? (
                  <div className="rounded-md border p-3">
                    <p className="text-sm font-medium">
                      Overall {booking.feedback.overallRating}/5
                      {booking.feedback.submittedAfterBreach ? (
                        <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                          filed after the deadline
                        </Badge>
                      ) : null}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{booking.feedback.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {formatWhen(booking.feedback.submittedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No report filed.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/*
            The private buyer/mentor conversation. Below the join evidence and above the
            notification log, because it sits between them in what it answers: the join ledger is
            what the platform recorded, the notifications are what the platform sent, and this is
            what the two people actually said to each other.

            Collapsed and un-fetched until opened — every read writes an audit row, and a panel
            that loaded with the page would record every operator who opened a booking for any
            reason as having read a private conversation.
          */}
          <SessionMessagesCard bookingId={booking.bookingId} />

          {booking.notifications && booking.notifications.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Notifications ({booking.notifications.length})
                </CardTitle>
                <CardDescription>
                  What this booking actually sent — the answer to &quot;did they get the email&quot;.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1 border-l pl-3">
                  {booking.notifications.map((row) => (
                    <li key={row.notificationLogId} className="text-xs">
                      <p className="font-medium">
                        {row.kind ?? "unknown"} → {row.recipientUserId}
                      </p>
                      <p className="text-muted-foreground">
                        {formatWhen(row.sentAt)}
                        {row.failureReason ? ` · FAILED: ${row.failureReason}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ── Actions ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>
                Both of these are for a booking the lifecycle sweep cannot move on its own. Prefer
                fixing the sweep.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why are you forcing this? Recorded against the booking."
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!openAfterSession || !reason.trim() || forceComplete.isPending}
                onClick={() =>
                  forceComplete.mutate(
                    { bookingId: booking.bookingId, reason: reason.trim() },
                    { onSuccess: () => setReason("") },
                  )
                }
              >
                {forceComplete.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Force complete
              </Button>
              {!openAfterSession ? (
                <p className="text-xs text-muted-foreground">
                  Only a session that is in progress or awaiting attendance confirmation can be forced
                  to complete. This one is {booking.statusLabel.toLowerCase()}.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Completing releases the mentor&apos;s payout. Needs{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                    PERM_MANAGE_MENTORSHIP_V2_COMMERCE
                  </code>
                  .
                </p>
              )}
              <div className="border-t pt-3">
                <Button asChild size="sm" variant="ghost" className="w-full">
                  <a href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${booking.orderId}`}>
                    <Send className="size-4" /> Open the order
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{children}</div>
    </div>
  )
}
