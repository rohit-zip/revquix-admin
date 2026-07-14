/**
 * ─── USER BADGES & VISIBILITY TAB (ADMIN) ─────────────────────────────────────
 *
 * Two cards on /users/{userId}:
 *   • Badges          — grant/revoke trust badges (PERM_MANAGE_USER_BADGES)
 *   • Discovery & SEO — override SEO priority / search boost / sitemap noindex
 *                       (PERM_MANAGE_SEO_PRIORITY)
 *
 * Every grant/revoke requires a reason and is audited on the backend. The
 * Professional Mentor badge is derived from mentor status and shown read-only.
 */

"use client"

import React from "react"
import {
  Award,
  BadgeCheck,
  Building2,
  Crown,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useAuthorization } from "@/hooks/useAuthorization"
import {
  useAdminUserBadges,
  useAdminUserDetail,
  useGrantUserBadge,
  useRevokeUserBadge,
  useUpdateUserSeoPriority,
} from "@/features/admin/api/admin-user.hooks"
import type { AdminBadgeView } from "@/features/user/api/session.types"

// ─── Badge visual registry (mirrors backend colorKey/iconKey) ─────────────────

const BADGE_UI: Record<string, { icon: React.ElementType; className: string }> = {
  GOLD_ELITE:          { icon: Crown,      className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  STAFF:               { icon: Shield,     className: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300" },
  BLUE_VERIFIED:       { icon: BadgeCheck, className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  PROFESSIONAL_MENTOR: { icon: BadgeCheck, className: "border-primary/30 bg-primary/10 text-primary" },
  PARTNER:             { icon: Building2,  className: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400" },
}

/** Admin-grantable badge keys, in display precedence order. */
const GRANTABLE_BADGES: { key: string; label: string; description: string }[] = [
  { key: "GOLD_ELITE",    label: "Top Voice",     description: "Topmost, highest-trust members. Scarce & prestigious." },
  { key: "STAFF",         label: "Revquix Staff", description: "Official Revquix team member." },
  { key: "BLUE_VERIFIED", label: "Verified",      description: "Identity / authenticity verified by Revquix." },
  { key: "PARTNER",       label: "Partner",       description: "Verified partner / organisation account." },
]

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function BadgeIcon({ badgeKey, className }: { badgeKey: string; className?: string }) {
  const Icon = BADGE_UI[badgeKey]?.icon ?? Award
  return <Icon className={className ?? "size-4"} />
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserBadgesTabProps {
  userId: string
}

export default function UserBadgesTab({ userId }: UserBadgesTabProps) {
  const { hasAnyAuthority } = useAuthorization()
  const canManageBadges = hasAnyAuthority(["PERM_MANAGE_USER_BADGES"])
  const canManageSeo = hasAnyAuthority(["PERM_MANAGE_SEO_PRIORITY"])

  const { data: badges, isLoading } = useAdminUserBadges(userId)
  const { data: detail } = useAdminUserDetail(userId)

  const grant = useGrantUserBadge(userId)
  const revoke = useRevokeUserBadge(userId)

  // Grant dialog
  const [grantKey, setGrantKey] = React.useState<string | null>(null)
  const [grantReason, setGrantReason] = React.useState("")
  const [grantExpiry, setGrantExpiry] = React.useState("")

  // Revoke dialog
  const [revokeTarget, setRevokeTarget] = React.useState<AdminBadgeView | null>(null)
  const [revokeReason, setRevokeReason] = React.useState("")

  if (!canManageBadges && !canManageSeo) return null

  const activeBadges = (badges ?? []).filter((b) => b.active)
  const historyBadges = (badges ?? []).filter((b) => !b.active)
  const activeKeys = new Set(activeBadges.map((b) => b.key))
  const grantable = GRANTABLE_BADGES.filter((b) => !activeKeys.has(b.key))

  const grantMeta = grantKey ? GRANTABLE_BADGES.find((b) => b.key === grantKey) : null

  function openGrant(key: string) {
    setGrantReason("")
    setGrantExpiry("")
    setGrantKey(key)
  }

  function submitGrant() {
    if (!grantKey || grantReason.trim().length === 0) return
    grant.mutate(
      {
        badgeKey: grantKey,
        reason: grantReason.trim(),
        expiresAt: grantExpiry ? new Date(grantExpiry).toISOString() : null,
      },
      { onSuccess: () => setGrantKey(null) },
    )
  }

  function submitRevoke() {
    if (!revokeTarget || revokeReason.trim().length === 0) return
    revoke.mutate(
      { badgeKey: revokeTarget.key, reason: revokeReason.trim() },
      { onSuccess: () => setRevokeTarget(null) },
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Badges card ──────────────────────────────────────────────────── */}
      {canManageBadges && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="size-4" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Active badges */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active badges
              </p>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : activeBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active badges.</p>
              ) : (
                <div className="space-y-2">
                  {activeBadges.map((b) => (
                    <div
                      key={b.userBadgeId ?? b.key}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                            BADGE_UI[b.key]?.className ?? ""
                          }`}
                        >
                          <BadgeIcon badgeKey={b.key} className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{b.label}</span>
                            {!b.manuallyGrantable && (
                              <Badge variant="secondary" className="text-[10px]">Derived</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Granted {formatDate(b.grantedAt)}
                            {b.grantedBy ? ` · by ${b.grantedBy}` : ""}
                            {b.expiresAt ? ` · expires ${formatDate(b.expiresAt)}` : ""}
                          </p>
                          {b.reason && (
                            <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                              “{b.reason}”
                            </p>
                          )}
                        </div>
                      </div>
                      {b.manuallyGrantable && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive shrink-0"
                          onClick={() => {
                            setRevokeReason("")
                            setRevokeTarget(b)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grant */}
            {grantable.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Grant a badge
                </p>
                <div className="flex flex-wrap gap-2">
                  {grantable.map((b) => (
                    <Button
                      key={b.key}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openGrant(b.key)}
                    >
                      <Plus className="size-3.5" />
                      <BadgeIcon badgeKey={b.key} className="size-3.5" />
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {historyBadges.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  History
                </p>
                <div className="space-y-1.5">
                  {historyBadges.map((b) => (
                    <div
                      key={b.userBadgeId ?? `${b.key}-${b.revokedAt}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-dashed p-2.5 text-xs text-muted-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <BadgeIcon badgeKey={b.key} className="size-3.5" />
                        <span className="font-medium text-foreground/70">{b.label}</span>
                      </span>
                      <span>
                        Revoked {formatDate(b.revokedAt)}
                        {b.revokeReason ? ` · “${b.revokeReason}”` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Discovery & SEO card ─────────────────────────────────────────── */}
      {canManageSeo && <DiscoverySeoCard userId={userId} detail={detail} />}

      {/* ── Grant dialog ─────────────────────────────────────────────────── */}
      <Dialog open={grantKey !== null} onOpenChange={(o) => (o ? null : grant.isPending ? null : setGrantKey(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${
                  grantKey ? BADGE_UI[grantKey]?.className ?? "" : ""
                }`}
              >
                {grantKey && <BadgeIcon badgeKey={grantKey} className="size-4" />}
              </span>
              <DialogTitle>Grant {grantMeta?.label} badge</DialogTitle>
            </div>
            <DialogDescription>{grantMeta?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="grant-reason" className="text-sm">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="grant-reason"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Recorded in the audit log"
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grant-expiry" className="text-xs text-muted-foreground">
                Expiry (optional — leave blank for permanent)
              </Label>
              <Input
                id="grant-expiry"
                type="datetime-local"
                value={grantExpiry}
                onChange={(e) => setGrantExpiry(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantKey(null)} disabled={grant.isPending}>
              Cancel
            </Button>
            <Button onClick={submitGrant} disabled={grant.isPending || grantReason.trim().length === 0}>
              {grant.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Grant badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revoke dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(o) => (o ? null : revoke.isPending ? null : setRevokeTarget(null))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke {revokeTarget?.label} badge</DialogTitle>
            <DialogDescription>
              This removes the badge from the user&apos;s public profile immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <Label htmlFor="revoke-reason" className="text-sm">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Recorded in the audit log"
              maxLength={500}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revoke.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRevoke}
              disabled={revoke.isPending || revokeReason.trim().length === 0}
            >
              {revoke.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Revoke badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Discovery & SEO card ─────────────────────────────────────────────────────

function DiscoverySeoCard({
  userId,
  detail,
}: {
  userId: string
  detail:
    | {
        seoPriority?: number | null
        seoPriorityOverride?: number | null
        searchBoost?: number | null
        searchBoostOverride?: number | null
        seoNoindex?: boolean | null
        badgeRank?: number | null
      }
    | undefined
}) {
  const update = useUpdateUserSeoPriority(userId)

  const [seoOverride, setSeoOverride] = React.useState("")
  const [boostOverride, setBoostOverride] = React.useState("")
  const [noindex, setNoindex] = React.useState(false)
  const [reason, setReason] = React.useState("")

  // Seed local state from the loaded detail once available.
  React.useEffect(() => {
    if (!detail) return
    setSeoOverride(detail.seoPriorityOverride != null ? String(detail.seoPriorityOverride) : "")
    setBoostOverride(detail.searchBoostOverride != null ? String(detail.searchBoostOverride) : "")
    setNoindex(!!detail.seoNoindex)
  }, [detail])

  function parseOverride(v: string): number | null {
    if (v.trim() === "") return null
    const n = Number.parseInt(v, 10)
    if (Number.isNaN(n)) return null
    return Math.max(0, Math.min(100, n))
  }

  function save() {
    update.mutate({
      seoPriorityOverride: parseOverride(seoOverride),
      searchBoostOverride: parseOverride(boostOverride),
      noindex,
      reason: reason.trim() || null,
    })
  }

  function clearOverrides() {
    setSeoOverride("")
    setBoostOverride("")
    update.mutate({
      seoPriorityOverride: null,
      searchBoostOverride: null,
      noindex,
      reason: reason.trim() || "Reset overrides to badge defaults",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="size-4" />
          Discovery &amp; SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Effective values */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Badge rank" value={detail?.badgeRank ?? 0} />
          <Stat label="SEO priority" value={detail?.seoPriority ?? 50} />
          <Stat label="Search boost" value={detail?.searchBoost ?? 0} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seo-override" className="text-sm">SEO priority override (0–100)</Label>
            <Input
              id="seo-override"
              type="number"
              min={0}
              max={100}
              value={seoOverride}
              placeholder="Badge default"
              onChange={(e) => setSeoOverride(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="boost-override" className="text-sm">Search boost override (0–100)</Label>
            <Input
              id="boost-override"
              type="number"
              min={0}
              max={100}
              value={boostOverride}
              placeholder="Badge default"
              onChange={(e) => setBoostOverride(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="seo-noindex" className="text-sm">Exclude from sitemap (noindex)</Label>
            <p className="text-xs text-muted-foreground">
              Removes the profile from the sitemap and serves robots noindex.
            </p>
          </div>
          <Switch id="seo-noindex" checked={noindex} onCheckedChange={setNoindex} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seo-reason" className="text-sm text-muted-foreground">Reason (optional)</Label>
          <Input
            id="seo-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Recorded in the audit log"
            maxLength={500}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={clearOverrides} disabled={update.isPending}>
            Reset to badge defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}
