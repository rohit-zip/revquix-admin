/**
 * ─── ACTIVE SESSIONS TAB ─────────────────────────────────────────────────────
 *
 * Displays all active sessions for the current user with device info,
 * location, and revoke controls.
 */

"use client"

import React, { useState } from "react"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  useCurrentSessionId,
  useMyActiveSessions,
  useRevokeAllOtherSessions,
  useRevokeSession,
} from "@/features/user/api/session.hooks"
import type { UserSessionResponse } from "@/features/user/api/session.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  const cls = "size-5 text-muted-foreground"
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className={cls} />
    case "tablet":
      return <Tablet className={cls} />
    default:
      return <Monitor className={cls} />
  }
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Session Card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: UserSessionResponse
  onRevoke: (sessionId: string) => void
  isRevoking: boolean
}

function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div
        className={`relative flex items-start gap-4 p-4 rounded-lg border transition-colors ${
          session.isCurrent
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
            : "border-border bg-card hover:bg-accent/50"
        }`}
      >
        {/* Device Icon */}
        <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-muted">
          <DeviceIcon deviceType={session.deviceType} />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {session.browser ?? "Unknown Browser"}
            </span>
            <span className="text-muted-foreground text-xs">on</span>
            <span className="text-sm text-muted-foreground">
              {session.os ?? "Unknown OS"}
            </span>
            {session.isCurrent && (
              <Badge
                variant="outline"
                className="gap-1 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3" />
                This device
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {session.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {session.location}
              </span>
            )}
            {session.ipAddress && (
              <span className="flex items-center gap-1">
                <Globe className="size-3" />
                {session.ipAddress}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Last active {formatRelativeTime(session.lastUsedAt)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Signed in {formatDateTime(session.issuedAt)}
          </div>
        </div>

        {/* Revoke Button */}
        {!session.isCurrent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out this session</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session on <strong>{session.browser ?? "Unknown Browser"}</strong>{" "}
              {session.os && <>({session.os})</>} will be immediately invalidated.
              {session.location && (
                <> This was last used from {session.location}.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onRevoke(session.sessionId)
                setConfirmOpen(false)
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionsTab() {
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)

  // Fetch the current session ID first (reads RT cookie)
  const { data: currentSessionData } = useCurrentSessionId()
  const currentSessionId = currentSessionData?.sessionId

  // Fetch active sessions
  const { data: sessions, isLoading, isError, refetch } = useMyActiveSessions(currentSessionId)

  // Mutations
  const revokeSession = useRevokeSession(currentSessionId)
  const revokeAllOthers = useRevokeAllOtherSessions(currentSessionId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load sessions</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeSessions = sessions ?? []
  const otherSessions = activeSessions.filter((s) => !s.isCurrent)

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Active Sessions
              </CardTitle>
              <CardDescription className="mt-1">
                {activeSessions.length} active session{activeSessions.length !== 1 ? "s" : ""} across your devices
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setRevokeAllOpen(true)}
                disabled={revokeAllOthers.isPending}
              >
                {revokeAllOthers.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sign out all other devices
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Shield className="size-10 opacity-40" />
              <p className="text-sm">No active sessions found</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                onRevoke={(id) => revokeSession.mutate(id)}
                isRevoking={revokeSession.isPending && revokeSession.variables === session.sessionId}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Revoke All Confirmation */}
      <AlertDialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out from all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate{" "}
              <strong>{otherSessions.length} other session{otherSessions.length !== 1 ? "s" : ""}</strong>.
              Anyone logged in on those devices will need to sign in again.
              Your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                revokeAllOthers.mutate()
                setRevokeAllOpen(false)
              }}
            >
              Sign Out All Other Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
