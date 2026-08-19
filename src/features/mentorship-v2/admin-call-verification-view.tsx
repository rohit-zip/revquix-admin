"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 4/5 CALL LIFECYCLE VERIFICATION ───────────────────
 *
 * Six panels, each mapping to a stated exit criterion from Phase 4 (the shared 1:1 call
 * lifecycle) or Phase 5 (mock-interview structured feedback). Almost every behaviour here is
 * triggered by time passing — a reminder at T-24h, an attendance window opening at the
 * session's end, auto-completion a day later, a feedback reminder at 50%/90% of the deadline
 * window, a feedback breach once it lapses — and waiting for real time to verify each one is
 * not a workable loop. The "Run sweep now" button runs the exact code the scheduler runs, not
 * a parallel copy, so a green manual run is real evidence about the scheduled one.
 *
 *  1. **Invariants** — `invariantWarnings`, rendered in red, must always be empty. It
 *     catches a booking starting soon with no link, a booking stuck past its auto-complete
 *     deadline, and (Phase 5) a booking past its feedback deadline that is still
 *     `FEEDBACK_PENDING` rather than `DISPUTED` — each meaning a stage of the sweep has
 *     stopped running.
 *  2. **Lifecycle counts + sweep** — the seven-stage sweep run on demand, with the report
 *     broken into exactly the categories the sweep itself reports.
 *  3. **Feedback (Phase 5)** — how many bookings owe feedback, how many have breached, how
 *     many reports were ever filed and how many of those were late, alongside the live
 *     50%/90% reminder thresholds.
 *  4. **Link provenance** — the distribution of `MeetingLinkSource` over recent bookings.
 *  5. **Booking inspector** — every session timestamp, join event, notification and (Phase 5)
 *     feedback status for one booking, plus a force-complete action and a force-submit-
 *     feedback override for a booking genuinely stuck past its breach.
 *  6. **Recent reviews** — the last 20 ratings, with hide/unhide.
 */

import { useState } from "react"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Link2,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Users,
  Video,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  useCallSnapshot,
  useForceCompleteBooking,
  useForceSubmitFeedback,
  useInspectBookingSession,
  useModerateReview,
  useRunLifecycleSweep,
} from "./api/calls.hooks"
import type { ForceSubmitFeedbackRequest } from "./api/calls.types"

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

export default function AdminCallVerificationView() {
  const snapshotQuery = useCallSnapshot()
  const snapshot = snapshotQuery.data
  const sweep = useRunLifecycleSweep()

  const [bookingIdInput, setBookingIdInput] = useState("")
  const [activeBookingId, setActiveBookingId] = useState("")
  const bookingQuery = useInspectBookingSession(activeBookingId)
  const booking = bookingQuery.data

  const [forceCompleteReason, setForceCompleteReason] = useState("")
  const forceComplete = useForceCompleteBooking()
  const moderate = useModerateReview()

  const invariantsBroken = (snapshot?.invariantWarnings.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Video className="size-5" /> Sessions engine
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Verification surface for meeting links, join evidence, reminders, attendance,
            auto-completion and mock-interview structured feedback. Almost
            everything here is normally driven by time passing — the sweep button runs the same
            code the scheduler runs, so it can be verified in seconds instead of a day.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void snapshotQuery.refetch()}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading call lifecycle snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            Confirm this account holds ROLE_ADMIN or PERM_VIEW_MENTORSHIP_V2_INTERNALS.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className={invariantsBroken ? "size-4 text-destructive" : "size-4"} />
                Runtime invariants
              </CardTitle>
              <CardDescription>
                Must always be empty. A non-empty list means a session is about to fail visibly, or
                the lifecycle sweep has stopped running.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invariantsBroken ? (
                <ul className="space-y-1.5 text-sm text-destructive">
                  {snapshot.invariantWarnings.map((warning) => (
                    <li key={warning} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {warning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="size-4" /> No invariant violations.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── 2. Lifecycle counts + sweep ── */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="size-4" /> Lifecycle state
                </CardTitle>
                <CardDescription>
                  Config values are echoed from the server, so this panel and the actual sweep
                  cannot disagree about the thresholds in use.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => sweep.mutate()}
                disabled={sweep.isPending}
              >
                {sweep.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Run sweep now
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                <Stat label="Upcoming (24h)" value={snapshot.upcomingNext24h} />
                <Stat
                  label="Missing link"
                  value={snapshot.missingMeetingLink}
                  tone={snapshot.missingMeetingLink > 0 ? "warning" : undefined}
                />
                <Stat label="In progress" value={snapshot.inProgress} />
                <Stat label="Awaiting confirmation" value={snapshot.awaitingAttendanceConfirmation} />
                <Stat
                  label="Overdue auto-complete"
                  value={snapshot.overdueForAutoComplete}
                  tone={snapshot.overdueForAutoComplete > 0 ? "destructive" : undefined}
                />
                <Stat label="Total reviews" value={snapshot.totalReviews} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Join window: {snapshot.joinWindowMinutes} min</span>
                <span>Attendance window: {snapshot.attendanceWindowHours}h</span>
                <span>Review window: {snapshot.reviewWindowDays} days</span>
                <span>Sweep cron: {snapshot.lifecycleSweepCron}</span>
                <span>Retry links: {snapshot.retryMeetingLink ? "on" : "off"}</span>
              </div>

              {sweep.data ? (
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Last manual sweep result</AlertTitle>
                  <AlertDescription className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                    <span>Link retries: {sweep.data.linkRetriesAttempted}</span>
                    <span>Links resolved: {sweep.data.linksResolved}</span>
                    <span>Nudges sent: {sweep.data.linkNudgesSent}</span>
                    <span>Reminders sent: {sweep.data.remindersSent}</span>
                    <span>Attendance opened: {sweep.data.attendanceWindowsOpened}</span>
                    <span>Auto-completed: {sweep.data.autoCompleted}</span>
                    <span>Feedback reminders: {sweep.data.feedbackRemindersSent}</span>
                    <span>Feedback breaches: {sweep.data.feedbackBreaches}</span>
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {/* ── 3. Feedback ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" /> Mock-interview feedback
              </CardTitle>
              <CardDescription>
                Reminders fire at {snapshot.feedbackReminderFirstPercentage}% and{" "}
                {snapshot.feedbackReminderSecondPercentage}% of each booking&apos;s own feedback
                window elapsed — a percentage, not a fixed offset, because the deadline itself is
                mentor-configurable 1–48h per service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <Stat label="Awaiting feedback" value={snapshot.awaitingFeedback} />
                <Stat
                  label="Overdue (breached)"
                  value={snapshot.overdueForFeedback}
                  tone={snapshot.overdueForFeedback > 0 ? "destructive" : undefined}
                />
                <Stat label="Total reports filed" value={snapshot.totalFeedbackReports} />
                <Stat
                  label="Filed after breach"
                  value={snapshot.feedbackReportsFiledAfterBreach}
                  tone={snapshot.feedbackReportsFiledAfterBreach > 0 ? "warning" : undefined}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                On a breach: the booking moves <code>FEEDBACK_PENDING → DISPUTED</code>, the
                mentor&apos;s payout for the session is held, their reliability record is penalised,
                and a <code>FEEDBACK_NOT_SUBMITTED</code> dispute is opened by the platform —
                mirroring the same four actions the legacy mock-interview flow already took for a
                missed feedback report, reused rather than duplicated. The dispute is where these
                are undone: resolving it is what releases the payout and moves the booking off
                <code>DISPUTED</code>, so a breached booking should always have one in the Disputes
                queue.
              </p>
            </CardContent>
          </Card>

          {/* ── 4. Link provenance + notification totals ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4" /> Meeting link sources
                </CardTitle>
                <CardDescription>
                  Over the 100 most recently created bookings. A healthy pilot should show mostly
                  AUTO_GOOGLE_MEET, with MANUAL only for mentors who have not connected Google.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {Object.entries(snapshot.meetingLinkSources).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{source}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="size-4" /> Notifications sent (all time)
                </CardTitle>
                <CardDescription>Counts by kind, from the deduplication ledger.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1.5 overflow-y-auto">
                {Object.entries(snapshot.notificationCounts).length === 0 ? (
                  <p className="text-sm text-muted-foreground">None sent yet.</p>
                ) : (
                  Object.entries(snapshot.notificationCounts).map(([kind, count]) => (
                    <div key={kind} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{kind}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 5. Booking inspector ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4" /> Booking inspector
              </CardTitle>
              <CardDescription>
                Every session timestamp, join event and notification for one booking — the screen
                to open when a customer says &ldquo;I could not join&rdquo; or a mentor says
                &ldquo;I was never paid&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="booking-id-input">Booking ID</Label>
                  <Input
                    id="booking-id-input"
                    placeholder="BKG00000001"
                    value={bookingIdInput}
                    onChange={(event) => setBookingIdInput(event.target.value)}
                    className="w-56"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveBookingId(bookingIdInput.trim())}
                  disabled={!bookingIdInput.trim()}
                >
                  Inspect
                </Button>
                {snapshot.upcoming[0] ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setBookingIdInput(snapshot.upcoming[0].bookingId)
                      setActiveBookingId(snapshot.upcoming[0].bookingId)
                    }}
                  >
                    Use most recent upcoming
                  </Button>
                ) : null}
              </div>

              {bookingQuery.isFetching ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : bookingQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>No booking found with that id.</AlertDescription>
                </Alert>
              ) : booking ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <Field label="Status" value={`${booking.statusLabel} (${booking.status})`} />
                    <Field
                      label="Service"
                      value={`${booking.serviceTitle ?? "—"} · ${booking.mentorName ?? booking.mentorUserId}`}
                    />
                    <Field label="Buyer" value={booking.buyerName ?? booking.buyerUserId} />
                    <Field
                      label="Scheduled"
                      value={
                        booking.startsAt
                          ? `${formatDate(booking.startsAt)} → ${formatDate(booking.endsAt)}`
                          : "—"
                      }
                    />
                    <Field
                      label="Within join window"
                      value={booking.withinJoinWindow ? "Yes" : "No"}
                    />
                    <Field
                      label="Minutes until start"
                      value={booking.minutesUntilStart != null ? String(booking.minutesUntilStart) : "—"}
                    />
                    <Field
                      label="Meeting link"
                      value={
                        booking.hasMeetingLink
                          ? `Ready (${booking.meetingLinkSource})`
                          : (booking.meetingLinkError ?? "Not ready")
                      }
                    />
                    <Field label="Mentor joined" value={formatDate(booking.mentorJoinedAt)} />
                    <Field label="Buyer joined" value={formatDate(booking.buyerJoinedAt)} />
                    <Field
                      label="Attendance deadline"
                      value={formatDate(booking.attendanceDeadlineAt)}
                    />
                    <Field
                      label="Mentor confirmed"
                      value={formatDate(booking.mentorConfirmedAttendedAt)}
                    />
                    <Field
                      label="Buyer confirmed"
                      value={formatDate(booking.buyerConfirmedAttendedAt)}
                    />
                    <Field label="Auto-complete at" value={formatDate(booking.autoCompleteAt)} />
                    <Field label="Auto-completed" value={booking.autoCompleted ? "Yes" : "No"} />
                    {/* Two tallies against one cap: each side has its own budget, so "1 / 1"
                        on the customer's line says nothing about whether the mentor may still
                        move this booking. Shown separately for exactly that reason. */}
                    <Field
                      label="Reschedules used (customer)"
                      value={`${booking.rescheduleCount ?? 0} / ${booking.maxReschedules ?? 0}`}
                    />
                    <Field
                      label="Reschedules used (mentor)"
                      value={`${booking.mentorRescheduleCount ?? 0} / ${booking.maxReschedules ?? 0}`}
                    />
                    {booking.feedbackRequired ? (
                      <>
                        <Field
                          label="Feedback window opened"
                          value={formatDate(booking.feedbackWindowStartedAt)}
                        />
                        <Field
                          label="Feedback deadline"
                          value={formatDate(booking.feedbackDeadlineAt)}
                        />
                        <Field
                          label="Feedback status"
                          value={
                            booking.feedback
                              ? booking.feedback.submittedAfterBreach
                                ? "Filed (late)"
                                : "Filed (on time)"
                              : booking.feedbackBreached
                                ? "Breached — not filed"
                                : booking.status === "FEEDBACK_PENDING"
                                  ? "Awaiting mentor"
                                  : "Not owed yet"
                          }
                        />
                      </>
                    ) : null}
                  </div>

                  <Separator />

                  {/*
                    Revquix-hosted room attendance.

                    Rendered LEDGER FIRST, INFERENCE SECOND, and that ordering is the whole design.
                    Google tells us who was in the room and for how long; it does NOT tell us who
                    they are - it returns no email address for any participant, ever. So each row
                    shows what Google said, and the attribution beside it carries a visible mark of
                    how it was reached.

                    A tick is rendered ONLY from `identified` (matchMethod GOOGLE_SUB - an id Google
                    verified and the participant could not choose). A display name is typed into the
                    Meet lobby by whoever is joining, so treating it as identity on the screen a
                    refund is decided from would be indefensible.
                  */}
                  {booking.meetSpaceName ? (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                        <Video className="size-3.5" /> Revquix room attendance
                        {booking.meetAttendanceStatus ? (
                          <Badge
                            variant={
                              booking.meetAttendanceStatus === "ERROR" ? "destructive" : "secondary"
                            }
                          >
                            {booking.meetAttendanceStatus}
                          </Badge>
                        ) : null}
                      </p>

                      <p className="mb-1.5 text-xs text-muted-foreground">
                        {booking.meetSpaceName}
                        {booking.meetTornDownAt
                          ? ` · room shut ${formatDate(booking.meetTornDownAt)}`
                          : " · room not shut yet"}
                      </p>

                      {/*
                        NO_RECORD is not a failure and must not read like one. On this path the
                        tracked join hop is the only door to the room, so Google having no
                        conference is positive evidence that nobody entered - a far stronger claim
                        than the click ledger's "nobody pressed our button", which was always weak
                        because the calendar invite let people in around it.
                      */}
                      {booking.meetAttendanceStatus === "NO_RECORD" ? (
                        <p className="text-sm text-muted-foreground">
                          Google has no record of anyone entering this room. On a Revquix-hosted
                          session the Join button is the only way in, so this is evidence that the
                          session did not happen - not a missing reading.
                        </p>
                      ) : booking.meetParticipants.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {booking.meetAttendanceStatus === "ERROR"
                            ? "Attendance could not be read from Google. Use the Join ledger below."
                            : "Not read yet - this happens after the room is shut."}
                        </p>
                      ) : (
                        <>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {booking.meetParticipants.map((participant) => (
                              <li key={participant.meetParticipantId}>
                                {participant.identified ? (
                                  <span className="font-medium text-foreground">
                                    {participant.resolvedRole}
                                  </span>
                                ) : (
                                  <span className="font-medium">unidentified</span>
                                )}
                                {" · "}
                                {participant.displayName ?? "no name"}
                                {participant.kind === "ANONYMOUS" ? " (not signed in)" : ""}
                                {" · "}
                                {formatDate(participant.joinedAt)}
                                {participant.leftAt
                                  ? ` → ${formatDate(participant.leftAt)}`
                                  : " → still in the room when read"}
                                {participant.minutesPresent !== null
                                  ? ` · ${participant.minutesPresent} min`
                                  : ""}
                              </li>
                            ))}
                          </ul>

                          {/*
                            Distinct SIGNED-IN identities, never the row count. One person who drops
                            and rejoins produces several rows, and anonymous rows cannot be
                            deduplicated at all - so a row count would let one participant
                            reconnecting twice read as a fully attended session.
                          */}
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {booking.meetDistinctSignedInCount} distinct signed-in identit
                            {booking.meetDistinctSignedInCount === 1 ? "y" : "ies"} across{" "}
                            {booking.meetParticipants.length} record
                            {booking.meetParticipants.length === 1 ? "" : "s"}.
                          </p>
                        </>
                      )}

                      {/*
                        The blank space is the problem this solves. Revquix's default auth is
                        email-OTP, so a buyer with no Google identity is an ORDINARY buyer - but an
                        unlabelled row on a refund screen reads as an intruder unless something says
                        otherwise. The server phrases it, because the server is what knows which
                        party lacks a Google login.
                      */}
                      {/*
                        A third signed-in account in a room only two people were given. One of the
                        few direct signs a room URL left the tracked join hop - but very often just
                        the mentor on a second Google account, so it is surfaced and NOT acted on.
                      */}
                      {booking.meetUnexpectedParticipantCount > 0 ? (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                          <ShieldAlert className="size-3.5 shrink-0" />
                          {booking.meetUnexpectedParticipantCount} signed-in participant
                          {booking.meetUnexpectedParticipantCount === 1 ? " was" : "s were"} neither
                          the mentor nor the customer. Worth a look before completing this booking.
                        </p>
                      ) : null}

                      {booking.meetAttendanceCaveat ? (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
                          {booking.meetAttendanceCaveat}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {booking.meetSpaceName ? <Separator /> : null}

                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                      <Users className="size-3.5" /> Join events ({booking.joinEvents.length})
                    </p>
                    {booking.joinEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nobody has clicked Join yet.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {booking.joinEvents.map((event) => (
                          <li key={event.joinEventId}>
                            {event.role} · {formatDate(event.joinClickedAt)}
                            {event.withinWindow ? "" : " (outside window)"} · {event.ipAddress ?? "—"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                      <Bell className="size-3.5" /> Notifications ({booking.notifications.length})
                    </p>
                    {booking.notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None sent yet.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {booking.notifications.map((entry) => (
                          <li key={entry.notificationLogId}>
                            {entry.kind} → {entry.recipientUserId} · {formatDate(entry.sentAt)}
                            {entry.failureReason ? (
                              <span className="text-destructive"> · failed: {entry.failureReason}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {booking.status === "IN_PROGRESS" || booking.status === "PENDING_CONFIRMATION" ? (
                    <div className="space-y-2 rounded-lg border border-border/60 p-3">
                      <p className="text-sm font-medium">Force-complete this booking</p>
                      <p className="text-xs text-muted-foreground">
                        For a session that plainly happened but neither party will confirm, and the
                        deadline is a long way off. Recorded as an admin action.
                      </p>
                      <div className="flex flex-wrap items-end gap-2">
                        <Input
                          placeholder="Reason (optional)"
                          value={forceCompleteReason}
                          onChange={(event) => setForceCompleteReason(event.target.value)}
                          className="w-64"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={forceComplete.isPending}
                          onClick={() =>
                            forceComplete.mutate({
                              bookingId: booking.bookingId,
                              reason: forceCompleteReason || undefined,
                            })
                          }
                        >
                          {forceComplete.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          Force-complete
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {booking.status === "DISPUTED" && booking.feedbackRequired && !booking.feedback ? (
                    <ForceSubmitFeedbackPanel bookingId={booking.bookingId} />
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter a booking id to see every timestamp, join event and notification for it.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── 6. Recent reviews ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4" /> Recent reviews
              </CardTitle>
              <CardDescription>
                Hiding excludes a review from both the service and the mentor-level rating
                aggregate and recomputes them immediately — the row survives as dispute evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.recentReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                snapshot.recentReviews.map((review) => (
                  <div
                    key={review.reviewId}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/60 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-sm">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={
                              index < review.rating
                                ? "size-3.5 fill-amber-400 text-amber-400"
                                : "size-3.5 text-muted-foreground"
                            }
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {review.buyerName ?? review.buyerUserId} · {review.serviceTitle ?? review.serviceId}
                        </span>
                        {review.isHidden ? <Badge variant="destructive">hidden</Badge> : null}
                      </p>
                      {review.comment ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={moderate.isPending}
                      onClick={() =>
                        moderate.mutate({
                          reviewId: review.reviewId,
                          hidden: !review.isHidden,
                          reason: review.isHidden ? undefined : "Hidden by admin during review",
                        })
                      }
                    >
                      {review.isHidden ? "Unhide" : "Hide"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "warning" | "destructive"
}) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "text-lg font-semibold " +
          (tone === "destructive"
            ? "text-destructive"
            : tone === "warning"
              ? "text-amber-600 dark:text-amber-500"
              : "")
        }
      >
        {value}
      </p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

const FEEDBACK_SCORE_FIELDS: { key: keyof ForceSubmitFeedbackRequest; label: string }[] = [
  { key: "scoreCommunication", label: "Communication" },
  { key: "scoreConfidence", label: "Confidence" },
  { key: "scoreTechnicalAccuracy", label: "Technical accuracy" },
  { key: "scoreProblemSolving", label: "Problem solving" },
  { key: "scoreClarityOfThought", label: "Clarity of thought" },
  { key: "scoreBodyLanguage", label: "Body language" },
  { key: "scoreTimeManagement", label: "Time management" },
  { key: "scoreQuestionUnderstanding", label: "Question understanding" },
]

/**
 * The admin override for a booking that breached its feedback deadline and whose mentor
 * remains unresponsive. Deliberately plain number inputs rather than the mentor-facing form's
 * sliders — this is an exceptional-path admin tool, used rarely, and the priority is that
 * every one of the 8 required fields is visibly present and quick to fill from notes taken
 * while following up with a mentor by phone or email, not a polished first-time experience.
 */
function ForceSubmitFeedbackPanel({ bookingId }: { bookingId: string }) {
  const forceSubmit = useForceSubmitFeedback()
  const [scores, setScores] = useState<Record<string, number>>(
    FEEDBACK_SCORE_FIELDS.reduce<Record<string, number>>((acc, field) => {
      acc[field.key] = 5
      return acc
    }, {}),
  )
  const [overallRating, setOverallRating] = useState(5)
  const [strengths, setStrengths] = useState("")
  const [improvements, setImprovements] = useState("")
  const [summary, setSummary] = useState("")

  const strengthsList = strengths
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const improvementsList = improvements
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const canSubmit = strengthsList.length > 0 && improvementsList.length > 0 && summary.trim().length > 0

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <div>
          <p className="text-sm font-medium">File feedback on the mentor&apos;s behalf</p>
          <p className="text-xs text-muted-foreground">
            This booking has already breached its feedback deadline and the mentor has not filed
            a report. Use this only after following up with the mentor directly — the candidate is
            still owed a report regardless of who types it.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FEEDBACK_SCORE_FIELDS.map((field) => (
          <div key={field.key} className="grid gap-1">
            <Label htmlFor={`admin-score-${field.key}`}>{field.label} (1–10)</Label>
            <Input
              id={`admin-score-${field.key}`}
              type="number"
              min={1}
              max={10}
              value={scores[field.key]}
              onChange={(event) =>
                setScores((prev) => ({
                  ...prev,
                  [field.key]: Math.min(10, Math.max(1, Number(event.target.value) || 1)),
                }))
              }
            />
          </div>
        ))}
        <div className="grid gap-1">
          <Label htmlFor="admin-overall-rating">Overall rating (1–10)</Label>
          <Input
            id="admin-overall-rating"
            type="number"
            min={1}
            max={10}
            value={overallRating}
            onChange={(event) => setOverallRating(Math.min(10, Math.max(1, Number(event.target.value) || 1)))}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="admin-strengths">Strengths (one per line)</Label>
          <Textarea
            id="admin-strengths"
            rows={3}
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="admin-improvements">Areas to improve (one per line)</Label>
          <Textarea
            id="admin-improvements"
            rows={3}
            value={improvements}
            onChange={(event) => setImprovements(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="admin-summary">Summary</Label>
        <Textarea
          id="admin-summary"
          rows={4}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={!canSubmit || forceSubmit.isPending}
        onClick={() =>
          forceSubmit.mutate({
            bookingId,
            payload: {
              scoreCommunication: scores.scoreCommunication,
              scoreConfidence: scores.scoreConfidence,
              scoreTechnicalAccuracy: scores.scoreTechnicalAccuracy,
              scoreProblemSolving: scores.scoreProblemSolving,
              scoreClarityOfThought: scores.scoreClarityOfThought,
              scoreBodyLanguage: scores.scoreBodyLanguage,
              scoreTimeManagement: scores.scoreTimeManagement,
              scoreQuestionUnderstanding: scores.scoreQuestionUnderstanding,
              overallRating,
              strengths: strengthsList,
              improvements: improvementsList,
              summary: summary.trim(),
            },
          })
        }
      >
        {forceSubmit.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ClipboardList className="size-3.5" />}
        File feedback on the mentor&apos;s behalf
      </Button>
    </div>
  )
}
