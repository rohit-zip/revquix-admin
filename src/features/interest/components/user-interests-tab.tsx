"use client"

/**
 * ─── USER INTERESTS TAB ───────────────────────────────────────────────────────
 *
 * The ninth tab on /users/[userId]. Renders what Revquix has inferred about one
 * person, and — more importantly — why.
 *
 * ⚠ THREE THINGS ON THIS SCREEN ARE LOAD-BEARING AND EASY TO "TIDY AWAY":
 *
 * 1. The `why?` button on every facet. Without it a facet is an unfalsifiable
 *    number. The first time somebody asks "why does Revquix think this?" and the
 *    answer is "the algorithm decided", this tab becomes decoration nobody acts on.
 *
 * 2. SKILL_GAP sorts above SKILL. A gap is a named, dated, self-diagnosed need
 *    produced at the moment of maximum willingness to buy help closing it. It is
 *    the most commercially actionable thing here and it belongs at the top.
 *
 * 3. Every strength shows its computed-at timestamp. `strength` is a nightly
 *    snapshot, not a live value — a stale one is indistinguishable from a genuinely
 *    fading interest, and presenting it as live is the failure the announcement
 *    daily-stat table already paid for.
 */

import React from "react"
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  EyeOff,
  Info,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  useInterestEvidence,
  useInterestProfile,
  useRecomputeInterestProfile,
  useSetFacetSuppressed,
} from "../api/interest.hooks"
import type {
  InterestConfidence,
  InterestFacet,
  InterestFacetType,
} from "../api/interest.types"

interface UserInterestsTabProps {
  userId: string
  /** PERM_VIEW_USER_INTERESTS also grants suppress — see AdminInterestController. */
  canEdit?: boolean
}

/**
 * Render order. Gaps first because they are what can be acted on; behavioural and
 * derived types last because they explain rather than drive.
 */
const TYPE_ORDER: InterestFacetType[] = [
  "SKILL_GAP",
  "ROLE",
  "SKILL",
  "COMPANY_TARGET",
  "TOPIC",
  "DOMAIN",
  "SENIORITY",
  "LOCATION",
  "WORK_MODE",
  "GOAL",
  "TOOL",
  "SERVICE_CATEGORY",
]

const TYPE_LABEL: Record<InterestFacetType, string> = {
  SKILL_GAP: "Skill gaps",
  ROLE: "Target roles",
  SKILL: "Skills",
  COMPANY_TARGET: "Target companies",
  TOPIC: "Content topics",
  DOMAIN: "Domains",
  SENIORITY: "Seniority",
  LOCATION: "Location",
  WORK_MODE: "Work mode",
  GOAL: "Goals",
  TOOL: "Tools used",
  SERVICE_CATEGORY: "Browsed categories",
}

const CONFIDENCE_TONE: Record<InterestConfidence, string> = {
  DECLARED: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  DERIVED_STRONG: "border-sky-500/40 text-sky-600 dark:text-sky-400",
  DERIVED_WEAK: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  INFERRED: "border-muted-foreground/30 text-muted-foreground",
}

export default function UserInterestsTab({ userId, canEdit = false }: UserInterestsTabProps) {
  const { data, isLoading, isError } = useInterestProfile(userId)
  const recompute = useRecomputeInterestProfile(userId)
  const suppress = useSetFacetSuppressed(userId)

  const [drawer, setDrawer] = React.useState<{
    facetType: InterestFacetType
    facetKey: string
    label: string
  } | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Could not load this user&apos;s interest profile.
        </CardContent>
      </Card>
    )
  }

  const groups = TYPE_ORDER.map((type) => ({
    type,
    facets: data.facetsByType?.[type] ?? [],
  })).filter((g) => g.facets.length > 0)

  const totalFacets = groups.reduce((n, g) => n + g.facets.length, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="size-4" />
                Inferred interest profile
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Derived from behaviour — never shown on this user&apos;s public profile.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recompute.mutate()}
              disabled={recompute.isPending}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${recompute.isPending ? "animate-spin" : ""}`} />
              Recompute
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/*
            The user's own switch. Shown prominently and first, because everything
            below it is historical when this is off — nothing new is being collected
            and this person is in no segment. A profile that looks live when it is
            frozen is the one thing this header must not do.
          */}
          {!data.personalisationEnabled && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Personalisation is switched off by this user
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Everything below is historical. No new signals are being recorded, no
                  recommendations are personalised, and this account is excluded from every
                  segment.
                </p>
              </div>
            </div>
          )}

          {!data.hasProfile && totalFacets === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm font-medium">Nothing inferred yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This user has not produced any interest signals. Signals come from tool runs —
                a readiness report or a JD match is the usual first one.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Intent" value={data.intentStage ?? "—"} at={data.intentStageAt} />
                <Stat label="Seniority" value={data.seniority ?? "—"} />
                <Stat
                  label="Readiness"
                  value={data.readinessScore != null ? String(data.readinessScore) : "—"}
                  at={data.readinessAt}
                />
                <Stat
                  label="Last JD match"
                  value={data.lastMatchScore != null ? `${data.lastMatchScore}%` : "—"}
                  at={data.lastMatchAt}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{totalFacets}</strong> facets
                </span>
                <span>
                  <strong className="text-foreground">{data.signalCount ?? 0}</strong> signals
                </span>
                <span>
                  Completeness <strong className="text-foreground">{data.completeness ?? 0}%</strong>
                </span>
                {data.primaryRoleName && (
                  <span className="flex items-center gap-1">
                    <Target className="size-3" />
                    {data.primaryRoleName}
                    {data.secondaryRoleName ? ` · ${data.secondaryRoleName}` : ""}
                  </span>
                )}
                {data.recomputedAt && <span>Computed {formatWhen(data.recomputedAt)}</span>}
              </div>

              {data.summaryText && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-sm italic">{data.summaryText}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" />
                    Generated {data.summaryAt ? formatWhen(data.summaryAt) : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Facets ─────────────────────────────────────────────────────────── */}
      {groups.map((group) => (
        <Card key={group.type}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {TYPE_LABEL[group.type]}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {group.facets.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {group.facets.map((facet) => (
              <FacetRow
                key={`${facet.facetType}:${facet.facetKey}`}
                facet={facet}
                floor={data.surfacingFloor}
                canEdit={canEdit}
                onWhy={() =>
                  setDrawer({
                    facetType: facet.facetType,
                    facetKey: facet.facetKey,
                    label: facet.displayLabel,
                  })
                }
                onToggleSuppress={() =>
                  suppress.mutate({
                    facetType: facet.facetType,
                    facetKey: facet.facetKey,
                    suppressed: !facet.suppressed,
                  })
                }
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <EvidenceDrawer
        userId={userId}
        target={drawer}
        onClose={() => setDrawer(null)}
      />
    </div>
  )
}

// ─── Facet row ────────────────────────────────────────────────────────────────

function FacetRow({
  facet,
  floor,
  canEdit,
  onWhy,
  onToggleSuppress,
}: {
  facet: InterestFacet
  floor: number
  canEdit: boolean
  onWhy: () => void
  onToggleSuppress: () => void
}) {
  const strength = facet.strength ?? 0
  // Scaled against 2× the floor rather than against the max on screen: a relative bar
  // would make the strongest facet look full even when everything is below the line,
  // which is exactly the reading that must not happen.
  const pct = Math.max(2, Math.min(100, (strength / Math.max(floor * 2, 1)) * 100))

  return (
    <div
      className={`group flex items-center gap-3 rounded-md border px-3 py-2 ${
        facet.suppressed ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{facet.displayLabel}</span>

          <Badge
            variant="outline"
            className={`h-4 px-1.5 text-[10px] ${CONFIDENCE_TONE[facet.confidence]}`}
          >
            {facet.confidence.replace("DERIVED_", "").toLowerCase()}
          </Badge>

          {facet.pinned && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              declared
            </Badge>
          )}
          {facet.suppressed && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              suppressed
            </Badge>
          )}
          {/*
            The honest flag. A facet below the floor, or a weak one seen once, is in
            the database and is NOT influencing anything the user sees. Hiding these
            rows would make this tab agree with the recommender and disagree with the
            data — which is the state in which "why is this user seeing that?" stops
            being answerable.
          */}
          {!facet.suppressed && !facet.surfaced && (
            <Badge
              variant="outline"
              className="h-4 gap-1 px-1.5 text-[10px] text-muted-foreground"
              title={`Below the surfacing floor of ${floor}, or not seen enough times. Nothing acts on it.`}
            >
              <Info className="size-2.5" />
              not surfaced
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                facet.surfaced ? "bg-primary" : "bg-muted-foreground/40"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {strength.toFixed(1)}
          </span>
          {/*
            ⚠ Never render the strength without this. It is a nightly snapshot, and a
            stale one looks identical to a genuinely fading interest.
          */}
          {facet.strengthComputedAt && (
            <span className="text-[11px] text-muted-foreground">
              as of {formatWhen(facet.strengthComputedAt)}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            · {facet.signalCount ?? 0} signal{(facet.signalCount ?? 0) === 1 ? "" : "s"}
          </span>
          {facet.sourceKinds?.length ? (
            <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
              · {facet.sourceKinds.slice(0, 2).join(", ").toLowerCase().replace(/_/g, " ")}
              {facet.sourceKinds.length > 2 ? ` +${facet.sourceKinds.length - 2}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onWhy}>
        why?
        <ChevronRight className="size-3" />
      </Button>

      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onToggleSuppress}
          title={facet.suppressed ? "Restore this facet" : "Suppress this facet"}
        >
          <EyeOff className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

// ─── Evidence drawer ──────────────────────────────────────────────────────────

function EvidenceDrawer({
  userId,
  target,
  onClose,
}: {
  userId: string
  target: { facetType: InterestFacetType; facetKey: string; label: string } | null
  onClose: () => void
}) {
  const { data, isLoading } = useInterestEvidence(
    userId,
    target?.facetType ?? null,
    target?.facetKey ?? null,
  )

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{target?.label}</DialogTitle>
          <DialogDescription className="text-xs">
            Every signal behind this facet, newest first. This is the audit trail for the
            number on the previous screen.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-2 pr-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No signals found. If this facet exists without evidence, its signals have passed
              the 24-month retention window.
            </p>
          ) : (
            <div className="space-y-2 pr-3">
              {data.map((e) => (
                <div key={e.id} className="rounded-md border px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{formatWhen(e.occurredAt)}</span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {e.source.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {e.resolution.toLowerCase()}
                      {/*
                        The score only exists for a VECTOR match, and it is the most
                        important number in this drawer when a mapping is wrong.
                        Measured: "Member of Technical Staff" matches "Technical Writer"
                        at 0.780 — above any usable floor. Seeing the score is what tells
                        an admin whether to add an alias or move the floor.
                      */}
                      {e.resolutionScore != null ? ` ${e.resolutionScore.toFixed(2)}` : ""}
                    </Badge>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      +{e.weight ?? 0}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    observed <span className="font-mono">{e.rawTerm}</span>
                  </p>
                  {e.evidenceLabel && (
                    <p className="mt-0.5 text-muted-foreground">{e.evidenceLabel}</p>
                  )}
                  {e.evidenceRef && (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                      {e.evidenceKind} {e.evidenceRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

function Stat({ label, value, at }: { label: string; value: string; at?: string | null }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      {at && <p className="text-[11px] text-muted-foreground">{formatWhen(at)}</p>}
    </div>
  )
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
