"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 9 SEARCH & MARKETPLACE CONSOLE ────────────────────
 *
 * The runtime verification surface for the marketplace search subsystem.
 *
 * Its job is to make Phase 9's claims **falsifiable from a browser**, which is the shape every prior
 * phase's admin view took and the thing that has repeatedly caught real bugs. Six panels:
 *
 *  1. **Invariants & live config** — recomputed on every open, never stored. `invariantViolations` must
 *     always render empty. The panel also echoes the ranking weights the running process is using,
 *     because they are config-tunable without a deploy and the only trustworthy answer to "what is
 *     production ranking on" is the one the process reports.
 *  2. **Projection coverage** — how much of the catalogue is indexed, how much is listable, and the two
 *     drift counters (`missingProjectionRows`, `orphanedRows`) that must both be zero.
 *  3. **Live query tester** — runs the real pipeline and shows per-result relevance scores. The only way
 *     to answer "why is this above that" without database access, and the question that gets asked every
 *     time somebody tunes a weight.
 *  4. **Content gate** — the services excluded from the marketplace and exactly which rule fired.
 *     Decision #6 removed the admin review step, so this automated check is the whole quality mechanism
 *     and its findings need somewhere to be read.
 *  5. **Query analytics** — the zero-result corpus (master plan §7.3's "single most valuable product
 *     input you will get") and the per-variant click-through table Phase 10's A/B test will read.
 *  6. **Synonyms & SEO coverage** — the curated dictionary, editable, and which landing pages clear the
 *     indexing floor.
 */

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FlaskConical,
  Gauge,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import {
  useDeleteSearchSynonym,
  useQueryTest,
  useRefreshSearchDocument,
  useReindexProjection,
  useRunMentorProjectionSweep,
  useRunProjectionSweep,
  useSaveSearchSynonym,
  useSearchDocument,
  useSearchSnapshot,
  useSearchSynonyms,
} from "./api/search.hooks"

function formatAge(iso?: string | null): string {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return "—"
  const minutes = Math.round((Date.now() - then) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function percent(value?: number | null): string {
  if (value == null) return "—"
  return `${(value * 100).toFixed(1)}%`
}

export default function AdminSearchVerificationView() {
  const snapshotQuery = useSearchSnapshot()
  const snapshot = snapshotQuery.data
  const sweep = useRunProjectionSweep()
  const mentorSweep = useRunMentorProjectionSweep()
  const reindex = useReindexProjection()

  const invariantsBroken = (snapshot?.invariantViolations.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Search className="size-5" /> Marketplace &amp; search
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The denormalised search projection, the query pipeline that reads it, and the automated
            content gate that decides what the marketplace promotes. The projection is a cache — every
            column is derived, and the supported repair for any inconsistency is a rebuild, never a manual
            UPDATE.
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
            Loading search snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 9 schema may not be migrated yet. Run the app once against a database with
            V196–V198 applied, then refresh. If the migration ran, check the application log for
            AdminSearchInspectionService errors — every aggregate on this page is individually guarded, so
            a total failure means the projection table itself is unreachable.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants & live config ─────────────────────────────── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">Invariants &amp; live config</CardTitle>
              <CardDescription>
                Recomputed on every open. Asserted here: no live public service is missing from the
                projection (each one would be a real, bookable listing invisible in the marketplace); no
                projection row outlives its service; the generated tsvector is actually being populated
                (if it silently stopped, existing rows would keep working and search would slowly go
                blind); and the positive ranking weights still sum to 1.0, so they remain readable as
                percentages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.invariantViolations.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="size-4" /> No invariant violations.
                </p>
              ) : (
                <Alert variant="destructive">
                  <ShieldAlert className="size-4" />
                  <AlertTitle>
                    {snapshot.invariantViolations.length} invariant violation(s)
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {snapshot.invariantViolations.map((violation) => (
                        <li key={violation}>{violation}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {snapshot.warnings.length > 0 ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>{snapshot.warnings.length} warning(s)</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {snapshot.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Gauge className="size-4" /> Live ranking configuration
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Read from the running process, not from a file. These are tunable without a deploy, so
                  this table is the only trustworthy answer to “what is production ranking on right now”.
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(snapshot.liveConfig).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs"
                    >
                      <span className="truncate text-muted-foreground">{key}</span>
                      <span className="font-mono font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Projection coverage ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" /> Projection coverage
              </CardTitle>
              <CardDescription>
                A service is <strong>listable</strong> when it is ACTIVE, PUBLIC and passed the automated
                content check. Anything else keeps a projection row with the flag off, so the reason it is
                absent from the marketplace is readable from one row rather than from a missing one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <Stat label="Services in catalogue" value={snapshot.totalServices} />
                <Stat label="Projection rows" value={snapshot.projectionRows} />
                <Stat label="Listable in marketplace" value={snapshot.listableRows} />
                <Stat
                  label="Excluded by content gate"
                  value={snapshot.contentFlaggedRows}
                  tone={snapshot.contentFlaggedRows > 0 ? "warning" : "default"}
                />
                <Stat label="Bookable within 7 days" value={snapshot.bookableWithin7dRows} />
                <Stat label="With at least one rating" value={snapshot.ratedRows} />
                <Stat
                  label="Missing projection row"
                  value={snapshot.missingProjectionRows}
                  tone={snapshot.missingProjectionRows > 0 ? "danger" : "default"}
                />
                <Stat
                  label="Orphaned rows"
                  value={snapshot.orphanedRows}
                  tone={snapshot.orphanedRows > 0 ? "danger" : "default"}
                />
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Oldest refresh: {formatAge(snapshot.oldestRefreshAt)}</span>
                <span>Newest refresh: {formatAge(snapshot.newestRefreshAt)}</span>
                <span>
                  Oldest availability check: {formatAge(snapshot.oldestAvailabilityCheckAt)}
                </span>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => sweep.mutate()}
                  disabled={sweep.isPending}
                >
                  {sweep.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Run projection sweep
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => reindex.mutate(false)}
                  disabled={reindex.isPending}
                >
                  {reindex.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Rebuild all (fast)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => reindex.mutate(true)}
                  disabled={reindex.isPending}
                >
                  Rebuild all + availability
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The sweep refreshes the stalest availability snapshots, backfills rows whose refresh event
                was dropped, and clears orphans — it is what the scheduler runs hourly. A full rebuild
                re-derives every row from the catalogue; the “+ availability” variant additionally asks
                the availability engine about every service, which is the one operation here that can take
                minutes.
              </p>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => mentorSweep.mutate()}
                  disabled={mentorSweep.isPending}
                >
                  {mentorSweep.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Run mentor directory sweep
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A SEPARATE table from everything above. <code>mentor_search_document</code> — what a
                mentor card on /mentors actually reads — is an aggregate over{" "}
                <code>service_search_document</code>, rebuilt on its own hourly cadence. The sweep and
                rebuild buttons above only touch the service-level table, so a mentor card can still show
                a stale availability snapshot (e.g. a green “available” rail next to “No open slots right
                now”) for up to an hour after they have already fixed the underlying service row. Use this
                button to force the mentor-level aggregate to catch up immediately.
              </p>
            </CardContent>
          </Card>

          {/* ── 3. Live query tester ────────────────────────────────────── */}
          <QueryTesterPanel />

          {/* ── 4. Content gate ────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automated content gate</CardTitle>
              <CardDescription>
                Decision #6 removed the admin review step for marketplace listing, so these automated
                checks are the entire quality mechanism. A flagged service is <strong>excluded from the
                marketplace</strong> but stays fully reachable at its own URL and bookable by anyone
                holding the link — declining to promote a listing and suspending someone’s business are
                different acts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(snapshot.contentFlagCounts).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(snapshot.contentFlagCounts).map(([flag, count]) => (
                    <Badge key={flag} variant="outline" className="gap-1.5">
                      {flag}
                      <span className="font-mono">{count}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="size-4" /> No listings are currently excluded.
                </p>
              )}

              {snapshot.flaggedServices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-3">Service</th>
                        <th className="py-1.5 pr-3">Mentor</th>
                        <th className="py-1.5 pr-3">Status</th>
                        <th className="py-1.5 pr-3">Flags</th>
                        <th className="py-1.5">Checked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.flaggedServices.map((service) => (
                        <tr key={service.serviceId} className="border-t">
                          <td className="py-1.5 pr-3">
                            <span className="font-medium">{service.title ?? "—"}</span>
                            <span className="ml-1.5 font-mono text-muted-foreground">
                              {service.serviceId}
                            </span>
                          </td>
                          <td className="py-1.5 pr-3">{service.mentorUsername ?? "—"}</td>
                          <td className="py-1.5 pr-3">{service.status ?? "—"}</td>
                          <td className="py-1.5 pr-3">
                            <div className="flex flex-wrap gap-1">
                              {service.flags.map((flag) => (
                                <Badge key={flag} variant="destructive" className="text-[10px]">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-1.5">{formatAge(service.refreshedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── 5. Query analytics ─────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Query analytics (last 30 days)</CardTitle>
              <CardDescription>
                Zero-result queries are, in the master plan’s own words, the single most valuable product
                input this system produces — and they are the literal input to the semantic layer’s synonym-mining
                job. The variant table works with one variant today on purpose: it means the V1 baseline
                is already measured on the day the hybrid experiment starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-4">
                <Stat label="Searches logged" value={snapshot.searchesLogged} />
                <Stat
                  label="Returned nothing"
                  value={snapshot.zeroResultSearches}
                  tone={
                    snapshot.searchesLogged > 50
                      && snapshot.zeroResultSearches * 4 > snapshot.searchesLogged
                      ? "warning"
                      : "default"
                  }
                />
                <Stat label="Led to a click" value={snapshot.searchesWithClick} />
                <Stat label="Led to a booking" value={snapshot.searchesWithBooking} />
              </div>

              {snapshot.variantPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-3">Variant</th>
                        <th className="py-1.5 pr-3">Searches</th>
                        <th className="py-1.5 pr-3">Click-through</th>
                        <th className="py-1.5 pr-3">Booking rate</th>
                        <th className="py-1.5">Avg click position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.variantPerformance.map((variant) => (
                        <tr key={variant.variant ?? "unknown"} className="border-t">
                          <td className="py-1.5 pr-3 font-mono">{variant.variant ?? "—"}</td>
                          <td className="py-1.5 pr-3">{variant.searches}</td>
                          <td className="py-1.5 pr-3">{percent(variant.clickThroughRate)}</td>
                          <td className="py-1.5 pr-3">{percent(variant.bookingRate)}</td>
                          <td className="py-1.5">
                            {variant.averageClickPosition == null
                              ? "—"
                              : variant.averageClickPosition.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Zero-result queries</p>
                  {snapshot.zeroResultQueries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      None recorded. Either nothing has failed yet, or nobody has searched.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {snapshot.zeroResultQueries.map((stat) => (
                        <li
                          key={stat.query ?? ""}
                          className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                        >
                          <span className="truncate font-mono">{stat.query}</span>
                          <span className="shrink-0 text-muted-foreground">
                            ×{stat.occurrences} · {formatAge(stat.lastSearchedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Top queries</p>
                  {snapshot.topQueries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None recorded yet.</p>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {snapshot.topQueries.map((stat) => (
                        <li
                          key={stat.query ?? ""}
                          className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                        >
                          <span className="truncate font-mono">{stat.query}</span>
                          <span className="shrink-0 text-muted-foreground">
                            ×{stat.occurrences} · {stat.clicks} click(s)
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 6. Synonyms & SEO coverage ─────────────────────────────── */}
          <SynonymPanel />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO landing coverage</CardTitle>
              <CardDescription>
                One page per service type × skill, generated from the same projection. A page is only
                indexed once at least {snapshot.landingIndexFloor} live listings back it — a landing page
                with one listing is thin content that will not rank, and generating thousands of them is
                the standard way a marketplace earns a manual action instead of traffic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Stat label="Indexable pages" value={snapshot.landingPagesIndexable} />
                <Stat label="Below the floor" value={snapshot.landingPagesBelowFloor} />
                <Stat label="Indexing floor" value={snapshot.landingIndexFloor} />
              </div>

              {snapshot.topLandingPages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {snapshot.topLandingPages.map((page) => (
                    <Badge
                      key={`${page.serviceType}-${page.skillSlug}`}
                      variant={page.indexable ? "default" : "outline"}
                      className="gap-1.5 text-[10px]"
                    >
                      <span className="font-mono">{page.path ?? "—"}</span>
                      <span>{page.serviceCount}</span>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── Document inspector ─────────────────────────────────────── */}
          <DocumentInspectorPanel />
        </>
      ) : null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "warning" | "danger"
}) {
  return (
    <div
      className={
        tone === "danger"
          ? "rounded-md border border-destructive bg-destructive/5 px-3 py-2"
          : tone === "warning"
            ? "rounded-md border border-amber-500/60 bg-amber-500/5 px-3 py-2"
            : "rounded-md border px-3 py-2"
      }
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value.toLocaleString()}</p>
    </div>
  )
}

/**
 * The live query tester.
 *
 * Runs the real pipeline — synonym expansion, full text, trigram fallback, the weighted blend — and shows
 * each result's score. Nothing else can answer "why is this above that", and because the weights are
 * config-tunable that question follows every tuning change.
 */
function QueryTesterPanel() {
  const [draft, setDraft] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)

  const test = useQueryTest({ q: submitted ?? undefined, size: 10 }, submitted !== null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="size-4" /> Live query tester
        </CardTitle>
        <CardDescription>
          Runs exactly what the marketplace runs and shows the score behind each position. Test queries
          are deliberately <strong>not</strong> written to search analytics — an admin probing the index is
          not a user searching, and letting these into the corpus would pollute the zero-result list this
          console exists to help read.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(draft.trim())
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. sde mock interview, javs, system design"
            className="max-w-sm"
          />
          <Button type="submit" size="sm" disabled={test.isFetching}>
            {test.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Run
          </Button>
        </form>

        {test.isError ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Query failed</AlertTitle>
            <AlertDescription>
              The marketplace read path is designed never to fail — facet and rail failures degrade
              silently. A failure here therefore points at the projection table or the text search
              configuration rather than at the query itself.
            </AlertDescription>
          </Alert>
        ) : null}

        {test.data ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono">
                {test.data.rankingVariant ?? "—"}
              </Badge>
              <span className="text-muted-foreground">
                {test.data.totalResults} result(s) in {test.data.elapsedMs}ms
              </span>
              {test.data.fuzzyMatched ? (
                <Badge variant="secondary">Trigram fallback fired</Badge>
              ) : null}
              {test.data.appliedSynonyms.length > 0 ? (
                <span className="text-muted-foreground">
                  synonyms: {test.data.appliedSynonyms.join(", ")}
                </span>
              ) : null}
            </div>

            {test.data.results.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {test.data.emptyStateMessage ?? "No results."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-1.5 pr-3">#</th>
                      <th className="py-1.5 pr-3">Score</th>
                      <th className="py-1.5 pr-3">Title</th>
                      <th className="py-1.5 pr-3">Type</th>
                      <th className="py-1.5 pr-3">Rating</th>
                      <th className="py-1.5 pr-3">Booked</th>
                      <th className="py-1.5">Avail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {test.data.results.map((row, index) => (
                      <tr key={row.serviceId} className="border-t">
                        <td className="py-1.5 pr-3 text-muted-foreground">{index + 1}</td>
                        <td className="py-1.5 pr-3 font-mono">
                          {row.relevanceScore == null ? "—" : row.relevanceScore.toFixed(4)}
                        </td>
                        <td className="py-1.5 pr-3">
                          <span className="font-medium">{row.title}</span>
                          <span className="ml-1.5 text-muted-foreground">
                            @{row.mentorUsername}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3">{row.serviceTypeLabel}</td>
                        <td className="py-1.5 pr-3">
                          {row.avgRating == null ? "—" : `${row.avgRating} (${row.reviewCount ?? 0})`}
                        </td>
                        <td className="py-1.5 pr-3">{row.orderCount ?? 0}</td>
                        <td className="py-1.5">
                          {row.availableWithin24h ? "24h" : row.availableWithin7d ? "7d" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** The curated synonym dictionary, editable. Upserts by term, so retyping a term edits its rule. */
function SynonymPanel() {
  const synonyms = useSearchSynonyms()
  const save = useSaveSearchSynonym()
  const remove = useDeleteSearchSynonym()

  const [term, setTerm] = useState("")
  const [expansion, setExpansion] = useState("")

  const trimmedTerm = term.trim().toLowerCase()
  const trimmedExpansion = expansion.trim()
  // Validated at the point of typing rather than on submit. The same rules are enforced server-side and
  // by a DB CHECK; catching them here just means the admin gets a sentence instead of a 400.
  const selfMapping = !!trimmedTerm && trimmedTerm === trimmedExpansion.toLowerCase()
  const canSave = !!trimmedTerm && !!trimmedExpansion && !selfMapping && !save.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Query expansion dictionary</CardTitle>
        <CardDescription>
          Expansion is <strong>additive</strong>: a query for “sde” becomes “sde OR software OR engineer”,
          never a replacement. Dropping the original term is the single most common way a synonym list
          makes search worse — it stops matching a listing literally titled “SDE Mock Interview”, which is
          the listing the user wanted. Saving evicts the cached dictionary, so a rule is testable in the
          panel above straight away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSave) return
            save.mutate(
              { term: trimmedTerm, expansion: trimmedExpansion, isActive: true },
              {
                onSuccess: () => {
                  setTerm("")
                  setExpansion("")
                },
              },
            )
          }}
        >
          <div className="space-y-1">
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="term (e.g. sde)"
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Input
              value={expansion}
              onChange={(event) => setExpansion(event.target.value)}
              placeholder="expansion (e.g. software engineer developer)"
              className="w-80"
            />
            {selfMapping ? (
              <p className="text-xs text-destructive">
                The expansion must differ from the term — a rule mapping a word to itself does nothing.
              </p>
            ) : null}
          </div>
          <Button type="submit" size="sm" disabled={!canSave}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save rule
          </Button>
        </form>

        <Separator />

        {synonyms.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading dictionary…</p>
        ) : synonyms.data && synonyms.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1.5 pr-3">Term</th>
                  <th className="py-1.5 pr-3">Expansion</th>
                  <th className="py-1.5 pr-3">Source</th>
                  <th className="py-1.5 pr-3">Active</th>
                  <th className="py-1.5 pr-3">Hits</th>
                  <th className="py-1.5" />
                </tr>
              </thead>
              <tbody>
                {synonyms.data.map((row) => (
                  <tr key={row.synonymId} className="border-t">
                    <td className="py-1.5 pr-3 font-mono">{row.term}</td>
                    <td className="py-1.5 pr-3">{row.expansion}</td>
                    <td className="py-1.5 pr-3">
                      <Badge variant={row.source === "MINED" ? "secondary" : "outline"} className="text-[10px]">
                        {row.source}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-3">{row.active ? "yes" : "no"}</td>
                    <td className="py-1.5 pr-3">{row.hitCount}</td>
                    <td className="py-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive"
                        onClick={() => remove.mutate(row.synonymId)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No synonym rules. Abbreviated queries such as “SDE” or “DSA” will only match listings that
            spell them out.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The single-service inspector.
 *
 * "Why is my service not in the marketplace" has exactly one place to look, and this is it: `listable`,
 * the content flags, the availability snapshot and the last refresh reason cover every possible cause
 * between them.
 */
function DocumentInspectorPanel() {
  const [draft, setDraft] = useState("")
  const [serviceId, setServiceId] = useState("")

  const document = useSearchDocument(serviceId, serviceId.length > 0)
  const refresh = useRefreshSearchDocument()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Projection row inspector</CardTitle>
        <CardDescription>
          Paste a service id to see its raw projection row. If the row is missing entirely, the service
          has never been indexed — rebuild it here and the response says immediately whether it became
          listable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setServiceId(draft.trim())
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="MSV..."
            className="max-w-xs font-mono"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!draft.trim()}>
            Inspect
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => refresh.mutate(draft.trim())}
            disabled={!draft.trim() || refresh.isPending}
          >
            {refresh.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Rebuild this row
          </Button>
        </form>

        {serviceId && document.isError ? (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>No projection row for {serviceId}</AlertTitle>
            <AlertDescription>
              That is a finding rather than an error. Either the service id is wrong, or the service has
              never been indexed — use “Rebuild this row” to create it and see the outcome.
            </AlertDescription>
          </Alert>
        ) : null}

        {document.data ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={document.data.listable ? "default" : "destructive"}>
                {document.data.listable ? "Listable" : "Not listable"}
              </Badge>
              <Badge variant="outline">{document.data.status}</Badge>
              <Badge variant="outline">{document.data.visibility}</Badge>
              <Badge variant={document.data.contentCheckPassed ? "outline" : "destructive"}>
                content check {document.data.contentCheckPassed ? "passed" : "failed"}
              </Badge>
              {document.data.refreshReason ? (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {document.data.refreshReason}
                </Badge>
              ) : null}
            </div>

            {document.data.contentCheckFlags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {document.data.contentCheckFlags.map((flag) => (
                  <Badge key={flag} variant="destructive" className="text-[10px]">
                    {flag}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Title" value={document.data.title} />
              <Field label="Mentor" value={`@${document.data.mentorUsername}`} />
              <Field label="Type" value={document.data.serviceType} />
              <Field
                label="Price"
                value={`${document.data.baseCurrency} ${(document.data.basePriceMinor / 100).toFixed(2)}`}
              />
              <Field
                label="USD comparison key"
                value={`${(document.data.usdPriceMinor / 100).toFixed(2)} (sort/band only)`}
              />
              <Field label="Duration" value={document.data.durationMinutes ?? "—"} />
              <Field label="Skills" value={document.data.skillNames.join(", ") || "—"} />
              <Field
                label="Rating"
                value={
                  document.data.avgRating == null
                    ? "unrated"
                    : `${document.data.avgRating} (${document.data.reviewCount ?? 0})`
                }
              />
              <Field
                label="Availability"
                value={
                  document.data.hasAvailability24h
                    ? "within 24h"
                    : document.data.hasAvailability7d
                      ? "within 7 days"
                      : "none known"
                }
              />
              <Field label="Next available" value={formatAge(document.data.nextAvailableAt)} />
              <Field
                label="Availability checked"
                value={formatAge(document.data.availabilityCheckedAt)}
              />
              <Field label="Refreshed" value={formatAge(document.data.refreshedAt)} />
              <Field
                label="Mentor completion rate"
                value={percent(document.data.mentorCompletionRate)}
              />
              <Field label="Conversion rate" value={percent(document.data.conversionRate)} />
              <Field label="Upheld disputes" value={document.data.mentorOpenDisputes ?? 0} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{String(value)}</span>
    </div>
  )
}
