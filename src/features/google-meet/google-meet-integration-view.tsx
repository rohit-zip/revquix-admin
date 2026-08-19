"use client"

/**
 * ─── PLATFORM GOOGLE MEET INTEGRATION ───────────────────────────────────────
 *
 * The operator surface for the Google accounts REVQUIX owns and mints Meet rooms from.
 *
 * Not a mentor's calendar connection. That is a different feature, with a different scope, and a
 * blast radius of one mentor. This one has a blast radius of every future booking on the
 * Revquix-hosted path: if the account here stops working, every one of them falls back to a manual
 * link at once.
 *
 * WHAT IS DELIBERATELY NOT ON THIS PAGE
 *
 *  - The OAuth client id and secret. They live in environment config. A form that writes an OAuth
 *    client secret to the database is a credential store nobody asked to operate, and it would put
 *    the platform's Google identity one XSS away from an attacker.
 *
 *  - Any meeting URL. A Revquix-hosted room is accessType OPEN - forced, because RESTRICTED is
 *    refused on a non-Workspace account - so the URL is a bearer capability: anyone holding it
 *    walks in, signed in or not. A URL on an admin screen is a URL in a screenshot.
 */

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Play,
  ShieldAlert,
  Star,
  Trash2,
  Video,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  useDisconnectMeetAccount,
  useMeetAccounts,
  useMeetStatus,
  usePromoteMeetAccount,
  useRunMeetRoundTrip,
  useStartMeetAuthorization,
} from "./api/google-meet.hooks"
import type { PlatformMeetAccount } from "./api/google-meet.types"

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

/**
 * The single most useful sentence per row: what is wrong, and whose problem it is.
 *
 * `credentialUnreadable` is separated from `requiresReauth` because the causes and the places to go
 * are different. A revoked grant is fixed at Google; an unreadable credential is a rotated
 * encryption key or a restored backup, and an operator sent to Google to fix it wastes an
 * afternoon. Both end at "reconnect", but only one of them starts there.
 */
function accountProblem(account: PlatformMeetAccount): string | null {
  if (account.credentialUnreadable) {
    return "The stored credential cannot be decrypted with this environment's key - a rotated GOOGLE_CALENDAR_ENCRYPTION_KEY or a restored backup. Nothing at Google is wrong. Disconnect and connect it again."
  }
  if (account.requiresReauth) {
    return "Google says the authorisation is gone - revoked, or expired because the OAuth consent screen is still in Testing status (those refresh tokens die after 7 days). Only reconnecting fixes it."
  }
  if (account.status === "DEGRADED") {
    return "Recent calls failed. This may clear on its own; the pool is skipping this account meanwhile."
  }
  return null
}

export default function GoogleMeetIntegrationView() {
  const accountsQuery = useMeetAccounts()
  const statusQuery = useMeetStatus()
  const authorize = useStartMeetAuthorization()
  const roundTrip = useRunMeetRoundTrip()
  const promote = usePromoteMeetAccount()
  const disconnect = useDisconnectMeetAccount()

  const [confirmingDisconnect, setConfirmingDisconnect] = useState<string | null>(null)

  const accounts = accountsQuery.data ?? []
  const healthy = statusQuery.data?.healthy ?? false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Video className="size-6" /> Revquix-hosted Google Meet
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The Google accounts Revquix creates meeting rooms from. Mentors and customers authorise
          nothing — these accounts do it for the whole platform.
        </p>
      </div>

      {/*
        The incident banner. Its own cheap query, separate from the accounts table, so it stays
        correct even when rendering the table fails - this is the thing somebody looks at first when
        bookings start arriving without links.
      */}
      {statusQuery.isSuccess && !healthy ? (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Revquix-hosted meetings are falling back to manual links</AlertTitle>
          <AlertDescription>
            {statusQuery.data?.message} New bookings on this path will ask the mentor to add a link
            instead. Nothing has failed for the customer, and no payment is affected.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Connected accounts</CardTitle>
            <CardDescription>
              One is preferred; the rest are standby. The runtime skips an unhealthy preferred
              account rather than failing bookings, so a revoked credential fails over on the next
              call instead of waiting for someone to notice.
            </CardDescription>
          </div>
          <Button onClick={() => authorize.mutate()} disabled={authorize.isPending}>
            {authorize.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Connect Google account
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No account is connected, so nothing can create a Revquix-hosted room yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Before go-live, publish the OAuth consent screen to production. While it sits in
                Testing, Google issues refresh tokens that expire after 7 days — room creation would
                work, ship, and then break silently every week.
              </p>
            </div>
          ) : (
            accounts.map((account) => {
              const problem = accountProblem(account)
              return (
                <div key={account.meetAccountId} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{account.googleEmail}</span>
                    <Badge variant={account.role === "PRIMARY" ? "default" : "secondary"}>
                      {account.role}
                    </Badge>
                    <Badge
                      variant={
                        account.status === "ACTIVE" && !account.requiresReauth
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {account.status}
                    </Badge>
                    {/*
                      Server-computed, never inferred here from role + status. The runtime's
                      selection rule and this label must not be able to disagree about which account
                      is actually live.
                    */}
                    {account.selectedForNextRoom ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="size-3" /> next room
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {account.spacesCreatedCount} room{account.spacesCreatedCount === 1 ? "" : "s"}{" "}
                    created · last healthy {formatDate(account.lastHealthyAt)} · connected{" "}
                    {formatDate(account.connectedAt)}
                  </p>

                  {/*
                    The create ceiling is 10 per minute per account, and it is MEASURED, not
                    documented - a burst test got 10 through and a 429 on the 11th. Surfaced because
                    an operator seeing 9/10 during a busy hour learns that bookings are about to
                    start falling back to manual links, which is the difference between capacity
                    planning and an incident.
                  */}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Create budget this minute: {account.budgetUsedInWindow}/{account.budgetCeiling}
                  </p>

                  {problem ? (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      {problem}
                    </p>
                  ) : null}

                  {account.lastError ? (
                    <p className="mt-1.5 break-all text-xs text-muted-foreground">
                      Last error ({formatDate(account.lastErrorAt)}): {account.lastError}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {account.role !== "PRIMARY" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={promote.isPending}
                        onClick={() => promote.mutate(account.meetAccountId)}
                      >
                        <Star className="size-3.5" /> Make preferred
                      </Button>
                    ) : null}

                    {confirmingDisconnect === account.meetAccountId ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={disconnect.isPending}
                          onClick={() => {
                            disconnect.mutate(account.meetAccountId)
                            setConfirmingDisconnect(null)
                          }}
                        >
                          {disconnect.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          Yes, disconnect
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingDisconnect(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmingDisconnect(account.meetAccountId)}
                      >
                        <Trash2 className="size-3.5" /> Disconnect
                      </Button>
                    )}
                  </div>

                  {/*
                    Confirmation, because this is not a per-mentor setting. Disconnecting the only
                    healthy account takes Revquix-hosted meetings down for the whole marketplace
                    until somebody reconnects one.
                  */}
                  {confirmingDisconnect === account.meetAccountId ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {account.selectedForNextRoom && accounts.length === 1
                        ? "This is the only usable account. Disconnecting it stops Revquix-hosted room creation platform-wide until another is connected."
                        : "The grant is revoked at Google where possible, then the row is removed."}
                    </p>
                  ) : null}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Round-trip test</CardTitle>
            <CardDescription>
              Creates a real throwaway room, reads it back, then ends any conference in it. Proves
              the credential, the scope, the account tier and the create quota in one call.
            </CardDescription>
          </div>
          <Button
            onClick={() => roundTrip.mutate()}
            disabled={roundTrip.isPending || accounts.length === 0}
          >
            {roundTrip.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run test
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {roundTrip.data ? (
            <>
              <div className="flex items-center gap-2">
                {roundTrip.data.success ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3" /> passed
                  </Badge>
                ) : (
                  <Badge variant="destructive">failed</Badge>
                )}
                {roundTrip.data.googleEmail ? (
                  <span className="text-xs text-muted-foreground">
                    via {roundTrip.data.googleEmail}
                  </span>
                ) : null}
              </div>

              {/*
                The quiet failure this test exists to catch. A downgraded access type means
                uninvited joiners have to knock - and since nobody from Revquix is ever in the room,
                nobody can admit them. Every booking on this path would break at the door, and
                nothing else in the system would notice.
              */}
              {roundTrip.data.grantedAccessType && !roundTrip.data.accessTypeAsRequested ? (
                <Alert variant="destructive">
                  <ShieldAlert className="size-4" />
                  <AlertTitle>
                    Google granted accessType {roundTrip.data.grantedAccessType}
                  </AlertTitle>
                  <AlertDescription>
                    Customers would have to knock to enter, and nobody from Revquix is in the room to
                    admit them. Do not enable Revquix-hosted meetings until this reads OPEN.
                  </AlertDescription>
                </Alert>
              ) : null}

              <ol className="space-y-1 text-xs text-muted-foreground">
                {roundTrip.data.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>

              {roundTrip.data.warning ? (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{roundTrip.data.warning}</p>
                </>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not run yet. Each run leaves one inert, undeletable space on the account — Google
              publishes no way to remove one — so run it when you need an answer, not on a loop.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
