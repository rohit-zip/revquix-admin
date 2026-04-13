"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Calendar, CheckCircle2, ExternalLink, Loader2, Unlink, AlertTriangle } from "lucide-react"
import {
  getAuthorizationUrl,
  getCalendarStatus,
  disconnectCalendar,
  GoogleCalendarStatus,
} from "@/features/professional-mentor/api/google-calendar.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * Google Calendar connection card for the mentor dashboard.
 * Allows mentors to connect/disconnect Google Calendar for automatic Meet link generation.
 */
export function GoogleCalendarCard() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const data = await getCalendarStatus()
      setStatus(data)
    } catch {
      // Silently fail — mentor may not have the permission
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    setActionLoading(true)
    try {
      const url = await getAuthorizationUrl()
      window.location.href = url
    } catch {
      toast.error("Failed to start Google Calendar connection. Please try again.")
      setActionLoading(false)
    }
  }

  async function handleDisconnect() {
    setActionLoading(true)
    try {
      await disconnectCalendar()
      setStatus({ connected: false })
      toast.success("Google Calendar disconnected successfully.")
    } catch {
      toast.error("Failed to disconnect Google Calendar.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-blue-500" />
          <CardTitle className="text-base">Google Calendar</CardTitle>
          {status?.connected && !status.requiresReauth && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="mr-1 size-3" />
              Connected
            </Badge>
          )}
          {status?.requiresReauth && (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <AlertTriangle className="mr-1 size-3" />
              Reconnect Required
            </Badge>
          )}
        </div>
        <CardDescription>
          {status?.connected
            ? "Google Meet links are auto-generated for your bookings."
            : "Connect your Google Calendar to automatically create Google Meet links when a session is booked."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connected account</span>
              <span className="font-medium">{status.googleEmail}</span>
            </div>
            {status.connectedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connected since</span>
                <span>{new Date(status.connectedAt).toLocaleDateString()}</span>
              </div>
            )}
            {status.lastUsedAt && status.lastUsedAt !== "" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last used</span>
                <span>{new Date(status.lastUsedAt).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {status.requiresReauth ? (
                <Button onClick={handleConnect} disabled={actionLoading} size="sm" variant="default">
                  {actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ExternalLink className="mr-2 size-4" />}
                  Reconnect
                </Button>
              ) : null}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={actionLoading}>
                    <Unlink className="mr-2 size-4" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Future bookings will require you to manually set Google Meet links.
                      Existing sessions with auto-generated links will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      {actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-muted-foreground/20 p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Without connection:</strong> You&apos;ll need to manually create and paste a Google Meet link for each booking.
              </p>
              <p>
                <strong>With connection:</strong> Google Meet links are automatically created when a session is booked. ✨
              </p>
            </div>
            <Button onClick={handleConnect} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 size-4" />
              )}
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

