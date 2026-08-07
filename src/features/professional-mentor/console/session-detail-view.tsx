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
                Where the link came from matters more than whether one exists: a GOOGLE_MEET service
                whose link says MANUAL fell back, and that is the booking a retry is for.
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
              <Field label="Google event">{booking.googleEventId ?? "—"}</Field>
              <Field label="Google calendar">{booking.googleCalendarId ?? "—"}</Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Join evidence ({booking.joinEvents?.length ?? 0})
              </CardTitle>
              <CardDescription>
                Every click of our own Join button. This is the ledger a no-show dispute is settled
                from — and the reason a dispute rule waits rather than firing instantly, since a
                mentor who joined through some other link leaves no row here.
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
