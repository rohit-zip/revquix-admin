"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 10 SEMANTIC SEARCH CONSOLE ────────────────────────
 *
 * The verification surface for hybrid semantic search.
 *
 * This page is shaped by one fact that separates Phase 10 from every phase before it: **its exit criterion
 * cannot be satisfied by code.** "V2 beats V1 on booking conversion, or V1 is kept and V2 is shelved" is a
 * product outcome only live traffic decides. So the page answers two questions and keeps them visibly apart:
 *
 *   1. **Is it built correctly?** Panels 1–4: invariants, the pgvector capability probe, model reachability,
 *      embedding coverage, and the HNSW index against its §1.3 memory budget. All mechanical, all with right
 *      answers, all assertable here and now.
 *   2. **Is it better?** Panel 5: the per-variant conversion table, which is empty until real traffic has been
 *      served by the treatment arm. This console can compute it. It cannot make it favourable.
 *
 * A green invariant list is easy to mistake for a green light, which is why panel 5 states outright that it is
 * the only panel that decides anything.
 *
 * Panel 6 is the side-by-side query comparison — the tool that makes a ranking change something you can reason
 * about the same day instead of three weeks later. Panels 7–8 are the offline job review queues.
 */

import { useState } from "react"
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Database,
  FlaskConical,
  Gauge,
  Lightbulb,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import {
  useAcceptSkillSuggestion,
  useClearEmbeddings,
  useRefreshSemanticCapability,
  useRejectSkillSuggestion,
  useCorpusCoverage,
  useRunEmbeddingPass,
  useRunMentorEmbeddingPass,
  useRunOfflineJobs,
  useSemanticComparison,
  useSemanticSnapshot,
} from "./api/semantic.hooks"
import type { SemanticResultLine } from "./api/semantic.types"

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

function score(value?: number | null): string {
  return value == null ? "—" : value.toFixed(4)
}

export default function AdminSemanticVerificationView() {
  const snapshotQuery = useSemanticSnapshot()
  const snapshot = snapshotQuery.data

  const refreshCapability = useRefreshSemanticCapability()
  const runEmbedding = useRunEmbeddingPass()
  const clearEmbeddings = useClearEmbeddings()
  const runOfflineJobs = useRunOfflineJobs()
  const mentorCoverage = useCorpusCoverage("MENTOR")
  const runMentorEmbedding = useRunMentorEmbeddingPass()

  const invariantsBroken = (snapshot?.invariantViolations.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Brain className="size-5" /> Semantic search
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A second retriever alongside the keyword search: a 384-dimension embedding per listing,
            an HNSW index, and Reciprocal Rank Fusion merging the two rank lists. Everything here is
            <strong> off by default</strong> and degrades to keyword search when unavailable — the phase&apos;s
            own exit criterion allows the answer &ldquo;keep V1&rdquo;.
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

      {/* ── Mentor corpus ────────────────────────────────────────────────────
          Its own panel, not a row in the service snapshot. The two corpora share a model and an
          inference container but not a sweep, so "the services are fully embedded" says nothing
          about the mentors — a combined number would answer a question nobody asked. */}
      <section className="rounded-lg border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Mentor corpus</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              <code>mentorship.mentor_search_document</code> — the /mentors read model. Embeds
              headline, top skills, designation and the first 400 characters of bio. Name and company
              are excluded on purpose: similarity between people&apos;s names is noise.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => runMentorEmbedding.mutate(undefined)}
            disabled={runMentorEmbedding.isPending}
          >
            {runMentorEmbedding.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Brain className="size-4" />
            )}
            Run mentor pass
          </Button>
        </div>

        {mentorCoverage.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading coverage…</p>
        ) : mentorCoverage.data ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Listable" value={Number(mentorCoverage.data.listable_rows ?? 0)} />
            <Stat label="Embedded" value={Number(mentorCoverage.data.embedded_rows ?? 0)} />
            <Stat
              label="Missing"
              value={Number(mentorCoverage.data.unembedded_rows ?? 0)}
              tone={Number(mentorCoverage.data.unembedded_rows ?? 0) > 0 ? "warning" : "default"}
            />
            {/*
              ⚠ "Embedded" counts rows holding a vector and says nothing about whether that vector
              still describes the current text. A re-index preserves vectors on purpose, so a corpus
              can be 100% embedded and entirely stale at the same time - which this panel reported as
              full coverage until "Stale" was added.
            */}
            <Stat
              label="Stale"
              value={Number(mentorCoverage.data.stale_rows ?? 0)}
              tone={Number(mentorCoverage.data.stale_rows ?? 0) > 0 ? "warning" : "default"}
            />
            <Stat
              label="Parked"
              value={Number(mentorCoverage.data.parked_rows ?? 0)}
              tone={Number(mentorCoverage.data.parked_rows ?? 0) > 0 ? "warning" : "default"}
            />
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Coverage unavailable — the corpus may predate its migration.
          </p>
        )}
      </section>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading semantic snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 10 schema may not be migrated yet. Run the app once against a database with V199–V201
            applied. Note that V199 is <strong>conditional</strong> — it degrades to a warning when pgvector is
            absent rather than failing — so a successful migration does not guarantee the vector column exists.
            Panel 1 below distinguishes the two.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Capability & invariants ──────────────────────────────── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">Capability &amp; invariants</CardTitle>
              <CardDescription>
                Recomputed on every open. Four things must all be true for vector retrieval to run: pgvector
                installed, the embedding column present, its width matching configuration, and the HNSW index
                built. A missing index does not error — it silently turns every vector query into a sequential
                scan of the catalogue, which surfaces as a latency incident rather than an alert, so it is
                checked here explicitly.
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
                  <AlertTitle>{snapshot.invariantViolations.length} invariant violation(s)</AlertTitle>
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

              {!snapshot.databaseReady && snapshot.unavailableReason ? (
                <Alert>
                  <Database className="size-4" />
                  <AlertTitle>Database not ready for vector search</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{snapshot.unavailableReason}</p>
                    <p className="text-xs">
                      This is a <strong>supported state</strong>, not a fault. The marketplace runs the
                      keyword search with no errors. To enable semantic search: set{" "}
                      <code>POSTGRES_IMAGE=pgvector/pgvector:pg15</code>, recreate the postgres container, run{" "}
                      <code>REINDEX DATABASE …</code> once (the collation changes musl → glibc, and text index
                      ordering is collation-dependent), then re-run migration V199.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <StatusChip label="Vector retrieval" ok={snapshot.capabilityAvailable} />
                <StatusChip label="Database ready" ok={snapshot.databaseReady} />
                <StatusChip label="HNSW index" ok={snapshot.hnswIndexPresent} />
                <StatusChip label="Model reachable" ok={snapshot.modelReachable} />
              </div>

              <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
                <Field label="pgvector" value={snapshot.pgvectorVersion ?? "not installed"} />
                <Field
                  label="Column width"
                  value={snapshot.columnDimensions == null ? "—" : `vector(${snapshot.columnDimensions})`}
                />
                <Field label="Configured model" value={snapshot.configuredModel ?? "—"} />
                <Field
                  label="Served model"
                  value={snapshot.servedModel ?? "unreachable"}
                  // The quiet-corruption case: the container serving one model while the application labels
                  // vectors with another means similarity comparisons stop meaning anything, and nothing errors.
                  tone={
                    snapshot.servedModel && snapshot.servedModel !== snapshot.configuredModel
                      ? "danger"
                      : "default"
                  }
                />
                <Field label="Model version" value={snapshot.modelVersion ?? "—"} />
                <Field label="Max input length" value={snapshot.modelMaxInputLength ?? "—"} />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => refreshCapability.mutate()}
                  disabled={refreshCapability.isPending}
                >
                  {refreshCapability.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Database className="size-4" />
                  )}
                  Re-probe the database
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Re-probing exists so that after installing pgvector you can see your own fix without restarting
                the application — otherwise you would reasonably conclude the fix had not worked.
              </p>
            </CardContent>
          </Card>

          {/* ── 2. Embedding coverage ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" /> Embedding coverage
              </CardTitle>
              <CardDescription>
                Embeddings are generated <strong>offline in batches</strong>, never on a request — §1.3 states
                batch-only is the only viable mode under the memory budget. A row is re-embedded only when its
                content actually changed, detected by a SHA-256 hash of the embedded text rather than a
                timestamp; comparing timestamps would re-embed the whole catalogue every time Phase 9&apos;s
                hourly projection sweep touched a row.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Listable services" value={snapshot.listableRows} />
                <Stat label="Embedded" value={snapshot.embeddedRows} />
                <Stat
                  label="Not yet embedded"
                  value={snapshot.unembeddedRows}
                  tone={snapshot.unembeddedRows > 0 ? "warning" : "default"}
                />
                <Stat
                  label="Parked (hit retry cap)"
                  value={snapshot.parkedRows}
                  tone={snapshot.parkedRows > 0 ? "danger" : "default"}
                />
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Oldest embedding: {formatAge(snapshot.oldestEmbeddedAt)}</span>
                <span>Newest embedding: {formatAge(snapshot.newestEmbeddedAt)}</span>
                <span>
                  Models in index:{" "}
                  {snapshot.modelsInIndex.length === 0 ? "none" : snapshot.modelsInIndex.join(", ")}
                </span>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => runEmbedding.mutate()}
                  disabled={runEmbedding.isPending}
                >
                  {runEmbedding.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Run an embedding pass
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => clearEmbeddings.mutate()}
                  disabled={clearEmbeddings.isPending}
                >
                  {clearEmbeddings.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Clear all embeddings
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                While a pass runs, watch <code>docker stats revquix-embeddings</code>. That is how the §1.3 exit
                criterion — worker memory staying inside the 2–3 GB ceiling, &ldquo;verified by actually
                watching process RSS&rdquo; — is checked; a JVM cannot read the RSS of a service it reaches over
                HTTP. Clearing is the repair for a model mismatch and removes all semantic ranking until the
                next pass finishes, which is why it is a deliberate action rather than automatic.
              </p>

              {snapshot.recentRuns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-3">Started</th>
                        <th className="py-1.5 pr-3">Trigger</th>
                        <th className="py-1.5 pr-3">Candidates</th>
                        <th className="py-1.5 pr-3">Embedded</th>
                        <th className="py-1.5 pr-3">Unchanged</th>
                        <th className="py-1.5 pr-3">Failed</th>
                        <th className="py-1.5 pr-3">Duration</th>
                        <th className="py-1.5">First error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentRuns.map((run) => (
                        <tr key={run.runId} className="border-t">
                          <td className="py-1.5 pr-3">{formatAge(run.startedAt)}</td>
                          <td className="py-1.5 pr-3 font-mono">{run.triggerSource ?? "—"}</td>
                          <td className="py-1.5 pr-3">{run.candidates ?? 0}</td>
                          <td className="py-1.5 pr-3">{run.embedded ?? 0}</td>
                          <td className="py-1.5 pr-3">{run.skippedUnchanged ?? 0}</td>
                          <td
                            className={
                              (run.failed ?? 0) > 0 ? "py-1.5 pr-3 text-destructive" : "py-1.5 pr-3"
                            }
                          >
                            {run.failed ?? 0}
                          </td>
                          <td className="py-1.5 pr-3">
                            {run.durationMs == null ? "—" : `${run.durationMs}ms`}
                          </td>
                          <td className="max-w-[240px] truncate py-1.5">{run.firstError ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No embedding pass has run yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Index size vs the RAM budget ────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> HNSW index vs the memory budget
              </CardTitle>
              <CardDescription>
                §1.3 allocates 2–3 GB for model plus index on a 12 GB box that also runs Postgres, Redis and the
                JVM. The model&apos;s share is enforced by a hard cgroup limit in its compose file. The
                index&apos;s share cannot be — it lives inside Postgres and grows with the catalogue, where no
                container limit reaches it. So it is monitored instead, and §1.3&apos;s stated mitigation on
                breach is to reduce HNSW <code>m</code>/<code>ef_construction</code> or move to IVFFlat —
                explicitly <strong>not</strong> to resize the VM, whose size is a fixed constraint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {snapshot.indexSizePretty ?? "0 bytes"} of {snapshot.indexBudgetMb} MB budget
                  </span>
                  <span className="font-medium">
                    {(snapshot.indexBudgetUsedFraction * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(100, snapshot.indexBudgetUsedFraction * 100)} />
              </div>

              <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Index" value={snapshot.indexName ?? "not built"} />
                <Field label="Size" value={`${snapshot.indexSizeMb.toFixed(2)} MB`} />
                <Field
                  label="Per embedded row"
                  value={
                    snapshot.indexBytesPerRow > 0
                      ? `${Math.round(snapshot.indexBytesPerRow)} bytes`
                      : "—"
                  }
                />
                <Field
                  label="Projected at 10× catalogue"
                  value={`${snapshot.projectedMbAt10x.toFixed(0)} MB`}
                  tone={snapshot.projectedMbAt10x > snapshot.indexBudgetMb ? "warning" : "default"}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The projection is a linear extrapolation from the current per-row cost. HNSW growth is slightly
                sub-linear, so this over-estimates — which is the right direction for a budget check: an early
                warning costs a glance at this page, a late one costs an incident.
              </p>
            </CardContent>
          </Card>

          {/* ── 4. The A/B experiment ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                V1 vs V2 — the only panel that decides anything
              </CardTitle>
              <CardDescription>
                The exit criterion: <strong>V2 beats V1 on booking conversion, or V1 is kept and V2
                is shelved.</strong> Everything above this panel tells you whether semantic search is built
                correctly. Only this table tells you whether it is <em>better</em>, and it stays empty until
                real traffic has been served by the treatment arm. Do not ship on aesthetics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Experiment" value={snapshot.experimentKey ?? "—"} />
                <Field label="Enabled" value={snapshot.experimentEnabled ? "yes" : "no"} />
                <Field label="Rollout" value={`${snapshot.experimentRolloutPercent}%`} />
                <Field
                  label="Assignment"
                  value={snapshot.experimentSuppressedReason ? "suppressed" : "active"}
                  tone={snapshot.experimentSuppressedReason ? "warning" : "default"}
                />
              </div>

              {snapshot.experimentSuppressedReason ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Everyone is getting V1</AlertTitle>
                  <AlertDescription>
                    {snapshot.experimentSuppressedReason}
                    <p className="mt-1 text-xs">
                      There are four possible causes — the feature is off, the database is not ready, the
                      experiment is off, or the rollout is 0% — and this line names which one, so you do not
                      have to guess from a config file.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}

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
              ) : (
                <p className="text-xs text-muted-foreground">
                  No search analytics in the window yet.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                A <code>HYBRID_V2</code> row appears only for searches that <em>actually</em> ran through vector
                retrieval. A treatment-arm search that fell back to keyword-only — the model was unreachable, or
                nothing cleared the similarity floor — is recorded as <code>FTS_V1</code>, because that is what
                ran. Labelling the intended variant instead would attribute control-arm behaviour to the
                treatment arm, which is the one mistake that makes an A/B result unreadable rather than noisy.
              </p>
            </CardContent>
          </Card>

          {/* ── 5. Side-by-side query comparison ───────────────────────── */}
          <ComparisonPanel />

          {/* ── 6. Offline job review queues ───────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="size-4" /> Offline jobs
              </CardTitle>
              <CardDescription>
                Synonym mining from zero-result queries, skill auto-tagging, and intent clustering — all three
                driven by the <strong>same embedding model</strong> rather than a generative LLM. That is a
                decision: an embedding-derived suggestion can only propose words that exist in the catalogue, it
                is reproducible so a reviewer can re-derive it, and it needs no second slice of the §1.3 memory
                budget. <strong>Nothing here changes what a buyer sees until a human accepts it.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Mined synonyms" value={snapshot.minedSynonymsTotal} />
                <Stat
                  label="Awaiting review"
                  value={snapshot.minedSynonymsInactive}
                  tone={snapshot.minedSynonymsInactive > 0 ? "warning" : "default"}
                />
                <Stat
                  label="Pending skill tags"
                  value={snapshot.pendingSkillSuggestions}
                  tone={snapshot.pendingSkillSuggestions > 0 ? "warning" : "default"}
                />
                <Stat label="Accepted" value={snapshot.acceptedSkillSuggestions} />
                <Stat label="Rejected" value={snapshot.rejectedSkillSuggestions} />
                <Stat label="Intent clusters" value={snapshot.intentClusters} />
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => runOfflineJobs.mutate()}
                disabled={runOfflineJobs.isPending}
              >
                {runOfflineJobs.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lightbulb className="size-4" />
                )}
                Run all three now
              </Button>
              <p className="text-xs text-muted-foreground">
                Mined synonym rules are written <strong>inactive</strong> and live in the Search tab
                at <code>/mentorship-v2/search</code>, where they can be reviewed and enabled alongside the
                hand-written ones. An automated job must not change live search behaviour without a human.
              </p>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">Skill tag suggestions awaiting review</p>
                {snapshot.topSkillSuggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing pending.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-1.5 pr-3">Service</th>
                          <th className="py-1.5 pr-3">Suggested skill</th>
                          <th className="py-1.5 pr-3">Confidence</th>
                          <th className="py-1.5 pr-3">Proposed</th>
                          <th className="py-1.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.topSkillSuggestions.map((suggestion) => (
                          <SuggestionRow key={suggestion.suggestionId} suggestion={suggestion} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Rejecting is permanent by design: the row is kept rather than deleted, which is what stops the
                  nightly job re-proposing it. A review queue that refills with the same rejected rows every
                  week is one nobody reads.
                </p>
              </div>

              <Separator />

              <div>
                <p className="mb-1 text-sm font-medium">Intents with the most failing queries</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  A large cluster that mostly returns nothing is demand with no supply behind it — the single
                  most actionable thing search analytics produces, and invisible from a flat list of queries.
                </p>
                {snapshot.failingIntents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No clusters computed yet. Run the offline jobs.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {snapshot.failingIntents.map((cluster) => (
                      <li key={cluster.clusterId} className="rounded-md border px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono">{cluster.representativeQuery}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {cluster.queryCount} search(es) ·{" "}
                            <span
                              className={cluster.zeroResultCount > 0 ? "text-destructive" : undefined}
                            >
                              {cluster.zeroResultCount} failing
                            </span>{" "}
                            · cohesion {cluster.cohesion?.toFixed(2) ?? "—"}
                          </span>
                        </div>
                        {cluster.memberQueries.length > 1 ? (
                          <p className="mt-1 truncate text-muted-foreground">
                            {cluster.memberQueries.slice(0, 6).join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── 7. Live config echo ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live semantic configuration</CardTitle>
              <CardDescription>
                Read from the running process, not from a file. These are tunable without a deploy, so this is
                the only trustworthy answer to &ldquo;what is production actually using&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StatusChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={
        ok
          ? "flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/5 px-3 py-2 text-sm"
          : "flex items-center gap-2 rounded-md border border-amber-500/60 bg-amber-500/5 px-3 py-2 text-sm"
      }
    >
      {ok ? (
        <CheckCircle2 className="size-4 text-emerald-600" />
      ) : (
        <AlertTriangle className="size-4 text-amber-600" />
      )}
      <span>{label}</span>
    </div>
  )
}

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

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string | number
  tone?: "default" | "warning" | "danger"
}) {
  return (
    <div
      className={
        tone === "danger"
          ? "flex items-center justify-between gap-2 rounded-md border border-destructive px-2.5 py-1.5"
          : tone === "warning"
            ? "flex items-center justify-between gap-2 rounded-md border border-amber-500/60 px-2.5 py-1.5"
            : "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
      }
    >
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{String(value)}</span>
    </div>
  )
}

function SuggestionRow({
  suggestion,
}: {
  suggestion: import("./api/semantic.types").SkillSuggestionRow
}) {
  const accept = useAcceptSkillSuggestion()
  const reject = useRejectSkillSuggestion()
  const busy = accept.isPending || reject.isPending

  return (
    <tr className="border-t">
      <td className="py-1.5 pr-3">
        <span className="font-medium">{suggestion.serviceTitle ?? "—"}</span>
        <span className="ml-1.5 font-mono text-muted-foreground">{suggestion.serviceId}</span>
      </td>
      <td className="py-1.5 pr-3">
        {suggestion.skillName ?? suggestion.skillId}
      </td>
      <td className="py-1.5 pr-3 font-mono">
        {suggestion.confidence == null ? "—" : suggestion.confidence.toFixed(3)}
      </td>
      <td className="py-1.5 pr-3">{formatAge(suggestion.suggestedAt)}</td>
      <td className="py-1.5">
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2"
            disabled={busy}
            onClick={() => accept.mutate(suggestion.suggestionId)}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-destructive"
            disabled={busy}
            onClick={() => reject.mutate(suggestion.suggestionId)}
          >
            Reject
          </Button>
        </div>
      </td>
    </tr>
  )
}

/**
 * The side-by-side comparison.
 *
 * The primary diagnostic for this phase, because the exit criterion is otherwise only answerable weeks later
 * from aggregate conversion numbers. Three arms are shown rather than two: keyword-only, hybrid, and raw
 * unfused vector neighbours. The third exists because when the hybrid ordering looks wrong the question is
 * always &ldquo;is the embedding bad or is the fusion bad&rdquo;, and only the unfused list distinguishes those.
 */
function ComparisonPanel() {
  const [draft, setDraft] = useState("")
  const [submitted, setSubmitted] = useState("")

  const comparison = useSemanticComparison(submitted, 10, submitted.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="size-4" /> Side-by-side: keyword vs hybrid vs raw vector
        </CardTitle>
        <CardDescription>
          Runs one query through all three retrieval paths and shows every rank and score. Try a paraphrase that
          shares no words with any listing — &ldquo;help me get better at whiteboard rounds&rdquo; — which is
          exactly the query keyword search cannot serve and an embedding can. Test queries are deliberately
          <strong> not</strong> written to search analytics: an admin probing the index is not a visitor, and
          test queries in the corpus would corrupt the A/B numbers this phase is judged on.
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
            placeholder="e.g. help me prepare for a system design round"
            className="max-w-md"
          />
          <Button type="submit" size="sm" disabled={comparison.isFetching || !draft.trim()}>
            {comparison.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Compare
          </Button>
        </form>

        {comparison.isError ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Comparison failed</AlertTitle>
            <AlertDescription>
              The marketplace read path is built never to fail — facet and rail failures degrade silently. A
              failure here therefore points at the vector column, the HNSW index or the model service rather
              than at the query.
            </AlertDescription>
          </Alert>
        ) : null}

        {comparison.data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={comparison.data.semanticApplied ? "default" : "outline"}>
                {comparison.data.semanticApplied ? "semantics applied" : "keyword only"}
              </Badge>
              <span className="text-muted-foreground">
                {comparison.data.keywordCandidates} keyword ·{" "}
                {comparison.data.vectorCandidates} vector · depth {comparison.data.fusionDepth} ·{" "}
                {comparison.data.elapsedMs}ms
              </span>
              {comparison.data.vectorOnlyMatches > 0 ? (
                <Badge variant="secondary">
                  {comparison.data.vectorOnlyMatches} vector-only match(es)
                </Badge>
              ) : null}
            </div>

            {comparison.data.degradedReason ? (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertTitle>Semantics did not contribute</AlertTitle>
                <AlertDescription>{comparison.data.degradedReason}</AlertDescription>
              </Alert>
            ) : null}

            {comparison.data.vectorOnlyMatches > 0 ? (
              <p className="rounded-md border border-amber-500/60 bg-amber-500/5 px-3 py-2 text-xs">
                <strong>{comparison.data.vectorOnlyMatches}</strong> result(s) were found by vector search but
                not by keyword search. Fusion only re-orders rows the keyword page already contained, so these
                reach a real user only through the &ldquo;closest by meaning&rdquo; rail on an empty result set.
                This number is the measure of how much recall fusion is leaving on the table — and it bounds
                what the A/B test can possibly show.
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-3">
              <ResultColumn title="Keyword only (V1)" lines={comparison.data.keywordResults} />
              <ResultColumn title="Hybrid (V2)" lines={comparison.data.hybridResults} highlight />
              <ResultColumn
                title="Raw vector neighbours"
                lines={comparison.data.vectorNeighbours}
                showSimilarity
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ResultColumn({
  title,
  lines,
  highlight = false,
  showSimilarity = false,
}: {
  title: string
  lines: SemanticResultLine[]
  highlight?: boolean
  showSimilarity?: boolean
}) {
  return (
    <div className={highlight ? "rounded-md border border-primary/50 p-2" : "rounded-md border p-2"}>
      <p className="mb-2 text-xs font-semibold">{title}</p>
      {lines.length === 0 ? (
        <p className="text-xs text-muted-foreground">No results.</p>
      ) : (
        <ol className="space-y-1">
          {lines.map((line) => (
            <li key={`${title}-${line.serviceId}`} className="rounded border px-2 py-1 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-medium">
                  {line.position}. {line.title}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {showSimilarity ? score(line.vectorSimilarity) : score(line.combinedScore)}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                <span>kw {line.keywordRank ?? "—"}</span>
                <span>vec {line.vectorRank ?? "—"}</span>
                <span>sim {score(line.vectorSimilarity)}</span>
                <span>fused {score(line.fusedScore)}</span>
                <span>biz {score(line.businessScore)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
