"use client"

/**
 * ─── PROFESSIONAL MENTOR V2 · CONSOLE HOME ───────────────────────────────────
 *
 * The index for the eleven V2 admin consoles.
 *
 * <h3>Why this page exists</h3>
 * The consoles were built one per phase and, until now, were named after their phase in the sidebar
 * ("Mentorship V2 (Phase 7)"). A phase number is a fact about how the subsystem was BUILT; it tells
 * an admin looking for the dispute queue nothing at all. This page is the directory: one card per
 * console, each saying what question it answers, so finding a surface never again requires knowing
 * the build order.
 *
 * <h3>What it deliberately does not do</h3>
 * No aggregated operational metrics — no open-dispute count, no revenue tile. Every one of those
 * numbers already has an owning console that computes it with the right invariants and caveats, and
 * a second copy computed here would be the copy that goes stale and gets believed. The only live
 * data on this page is the rollout state (the V2 flag, the pilot allowlist and the phase registry),
 * which is genuinely global rather than belonging to any single console.
 */

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRightLeft,
  Brain,
  CalendarSearch,
  CheckCircle2,
  Coins,
  FlaskConical,
  Loader2,
  type LucideIcon,
  Package,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Video,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useMentorshipV2Health } from "./api/mentorship-v2.hooks"

interface ConsoleEntry {
  Icon: LucideIcon
  title: string
  href: string
  /** Phase numbers this console covers — used to pull status out of the phase registry. */
  phases: number[]
  /** What the console answers. Written as the question an admin actually arrives with. */
  description: string
  /** The concrete surfaces on the page, so the card is a table of contents rather than a teaser. */
  contains: string
}

/**
 * Grouped by how the consoles are used rather than by phase order: an admin either has an
 * operational question about live money and live people, or is diagnosing the platform itself.
 */
const OPERATIONS: ConsoleEntry[] = [
  {
    Icon: ShieldAlert,
    title: "Disputes & Reliability",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_DISPUTES,
    phases: [7],
    description:
      "The dispute queue, the SLA clocks, and the resolutions that move money or suspend a mentor.",
    contains:
      "Queue with filters · first-response/resolution SLA breaches · one-click executable resolutions · appeal window · mentor reliability scores and their breakdown",
  },
  {
    Icon: Receipt,
    title: "Orders & Checkout",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_COMMERCE,
    phases: [3],
    description:
      "Every V2 order end to end: what was charged, what the mentor nets, and why a checkout failed.",
    contains:
      "Order inspector · revenue lines and fee breakdown · slot reservations and the expiry sweep · gateway webhook feed · refunds · commerce invariant assertions",
  },
  {
    Icon: Video,
    title: "Sessions & Feedback",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_CALLS,
    phases: [4, 5],
    description:
      "The 1:1 call lifecycle from meeting link to completion, plus mock-interview feedback delivery.",
    contains:
      "Meeting-link health and the cancel deadline · join evidence ledger · reminders · attendance and no-show reports · auto-completion sweep · reviews · feedback SLA",
  },
  {
    Icon: ShoppingBag,
    title: "Service Catalogue",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SERVICES,
    phases: [2],
    description: "What mentors are selling, and why a given service can or cannot go live.",
    contains:
      "Catalogue snapshot across the platform · publish-gate inspector for any service · description sanitiser probe · service-type capability registry",
  },
  {
    Icon: Package,
    title: "Packages & Entitlements",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_PACKAGES,
    phases: [6],
    description:
      "Multi-session packages: what a buyer still owns, and what happens when a mentor stops being bookable.",
    contains:
      "Entitlement ledger · escrow invariant · availability-breach SLA ladder (nudge → auto-pause → self-serve refund) · expiry settlement sweep",
  },
  {
    Icon: CalendarSearch,
    title: "Availability Engine",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_AVAILABILITY,
    phases: [1],
    description: "Why a mentor shows the slots they show — or shows none at all.",
    contains:
      "Run the engine for any mentor with a step-by-step trace · double-booking (exclusion constraint) proof · Google Calendar round trip · mentor availability health",
  },
  {
    Icon: Coins,
    title: "Pricing Zones & FX",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_PRICING,
    phases: [8],
    description:
      "Country-based pricing and the exchange rates the “≈” prices depend on. Editing here affects new quotes only.",
    contains:
      "Zone multiplier ladder with the [0.5×, 4×] guardrail · country → zone map · FX rate table with age and charge-eligibility · forced FX fetch",
  },
]

const DIAGNOSTICS: ConsoleEntry[] = [
  {
    Icon: Search,
    title: "Marketplace & Search",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SEARCH,
    phases: [9],
    description:
      "The answer to “why is this mentor’s service not appearing in the marketplace”.",
    contains:
      "Projection health and drift repair · automated content gate results · query analytics and zero-result queries · synonym rules · SEO landing coverage",
  },
  {
    Icon: Brain,
    title: "Semantic Search",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_SEMANTIC,
    phases: [10],
    description:
      "Whether hybrid semantic ranking is actually running, and which piece is missing when it is not.",
    contains:
      "pgvector capability probe · embedding coverage and the nightly pass · HNSW index budget · V1/V2 A/B comparison · offline job queues (synonym mining, skill suggestions, intent clusters)",
  },
  {
    Icon: ArrowRightLeft,
    title: "Migration & Cutover",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_CUTOVER,
    phases: [11],
    description: "The go/no-go for switching the legacy booking system off.",
    contains:
      "Legacy backfill ledger · dual-run blocking bridge · cross-boundary revenue reconciliation · mentors with no V2 storefront · decommission readiness and the 90-day archive countdown",
  },
  {
    Icon: FlaskConical,
    title: "Foundations & Rollout Flag",
    href: PATH_CONSTANTS.ADMIN_MENTORSHIP_V2_VERIFICATION,
    phases: [0],
    description:
      "The subsystem's foundations — open this when something looks wrong everywhere rather than in one place.",
    contains:
      "Schema and extension health · seeded pricing reference data · rollout flag and pilot allowlist · live platform-fee calculator · phase registry",
  },
]

export default function AdminMentorshipV2ConsoleHomeView() {
  const healthQuery = useMentorshipV2Health()
  const health = healthQuery.data

  const phaseStatus = new Map(
    (health?.phases ?? []).map((phase) => [phase.phaseNumber, phase] as const),
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Professional Mentor V2 — Admin Console</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Every V2 admin surface, by what it does. Each console carries its own phase number for
            cross-referencing the implementation strategy doc, but you should never need to know the
            phase to find a page. Reads need{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              PERM_VIEW_MENTORSHIP_V2_INTERNALS
            </code>
            ; write actions on each page need their own permission and are enforced server-side.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void healthQuery.refetch()}
          disabled={healthQuery.isFetching}
        >
          {healthQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {/* ── Rollout state: the only genuinely global numbers in the subsystem ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollout state</CardTitle>
          <CardDescription>
            Live from the Phase 0 health endpoint. The flag and the allowlist gate mentor-facing V2
            surfaces; admins bypass both, which is why you can see these consoles regardless.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthQuery.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading rollout state…
            </p>
          ) : healthQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Could not load rollout state</AlertTitle>
              <AlertDescription>
                The console directory below still works. Open Foundations &amp; Rollout Flag for the
                full diagnostic.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StateBadge
                  ok={health?.v2FeatureFlagEnabled ?? false}
                  okLabel="V2 flag enabled"
                  failLabel="V2 flag disabled"
                />
                <StateBadge
                  ok={health?.schemaExists ?? false}
                  okLabel="mentorship schema present"
                  failLabel="mentorship schema missing"
                />
                <StateBadge
                  ok={health?.btreeGistExtensionExists ?? false}
                  okLabel="btree_gist present"
                  failLabel="btree_gist missing"
                />
                <Badge variant="secondary">
                  {health?.pilotUserIds.length ?? 0} mentor(s) in the pilot allowlist
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(health?.phases ?? []).map((phase) => (
                  <Badge
                    key={phase.phaseNumber}
                    variant={phase.status === "COMPLETE" ? "secondary" : "outline"}
                    className="font-normal"
                    title={`Migrations ${phase.migrationsRange} · ${phase.status}`}
                  >
                    P{phase.phaseNumber} {phase.phaseName}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConsoleGroup
        heading="Operations"
        blurb="Live money and live people. These are the consoles a support or finance admin opens."
        entries={OPERATIONS}
        phaseStatus={phaseStatus}
      />

      <ConsoleGroup
        heading="Diagnostics & migration"
        blurb="Platform-level health, discovery and the legacy-system wind-down."
        entries={DIAGNOSTICS}
        phaseStatus={phaseStatus}
      />
    </div>
  )
}

function ConsoleGroup({
  heading,
  blurb,
  entries,
  phaseStatus,
}: {
  heading: string
  blurb: string
  entries: ConsoleEntry[]
  phaseStatus: Map<number, { phaseName: string; status: string }>
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{blurb}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const EntryIcon = entry.Icon
          const incomplete = entry.phases.some(
            (phase) => phaseStatus.get(phase) && phaseStatus.get(phase)!.status !== "COMPLETE",
          )
          return (
            <Card key={entry.href} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <EntryIcon className="size-4 shrink-0" />
                    {entry.title}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 font-normal">
                    Phase {entry.phases.join("/")}
                  </Badge>
                </div>
                <CardDescription>{entry.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">{entry.contains}</p>
                {incomplete && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="size-3.5" />
                    Phase registry does not report this phase as complete
                  </p>
                )}
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={entry.href}>Open console</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function StateBadge({
  ok,
  okLabel,
  failLabel,
}: {
  ok: boolean
  okLabel: string
  failLabel: string
}) {
  return (
    <Badge variant={ok ? "secondary" : "destructive"} className="gap-1 font-normal">
      {ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      {ok ? okLabel : failLabel}
    </Badge>
  )
}
