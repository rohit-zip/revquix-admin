"use client"

/**
 * ─── INTEREST CONSOLE ─────────────────────────────────────────────────────────
 *
 * Three screens sharing one view, selected by `screen`:
 *
 *   overview      — is resolution healthy, and is anyone accumulating a profile?
 *   unmapped      — what do users care about that the taxonomy cannot describe?
 *   auto-matches  — what did the embedding pass decide without a human agreeing?
 *
 * They are a feedback loop rather than a dashboard: each one turns something
 * invisible into something a person can act on in one click.
 */

import React from "react"
import { AlertTriangle, Check, Info, Sparkles, X } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useAutoMatches,
  useConfirmAutoMatch,
  useInterestOverview,
  useResolveUnmappedTerm,
  useUnmappedTerms,
} from "./api/interest.hooks"

type Screen = "overview" | "unmapped" | "auto-matches"

export default function InterestConsoleView({ screen }: { screen: Screen }) {
  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-xl font-semibold">
          {screen === "overview" && "Interest graph"}
          {screen === "unmapped" && "Unmapped terms"}
          {screen === "auto-matches" && "Auto-matched terms"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {screen === "overview" &&
            "Coverage, resolution health, and what the platform's users are actually interested in."}
          {screen === "unmapped" &&
            "Terms the resolvers could not place. This is the taxonomy roadmap, ranked by how many different people wrote them."}
          {screen === "auto-matches" &&
            "Mappings the embedding pass chose on its own, weakest match first. Confirming one turns it into a permanent alias."}
        </p>
      </div>

      {screen === "overview" && <OverviewScreen />}
      {screen === "unmapped" && <UnmappedScreen />}
      {screen === "auto-matches" && <AutoMatchScreen />}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewScreen() {
  const { data, isLoading } = useInterestOverview()

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full" />
  }

  const unresolved = data.resolutionMix?.find((r) => r.resolution === "UNRESOLVED")
  const unresolvedPct = unresolved?.pct ?? 0
  const supplyUncomputed = data.rolesTotal - data.rolesWithSupplyComputed

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric label="Users with a profile" value={data.usersWithProfile} />
        <Metric label="Users with 5+ facets" value={data.usersWithFiveFacets} />
        <Metric label="Personalisation opt-outs" value={data.personalisationOptOuts} />
        <Metric label="Facets" value={data.totalFacets} />
        <Metric label="Signals" value={data.totalSignals} />
        <Metric label="Open unmapped terms" value={data.openUnmappedTerms} />
      </div>

      {/*
        The health metric. Above ~30% unresolved means the taxonomy has drifted from
        what users actually write, and the unmapped queue is where that gets fixed.
      */}
      {unresolvedPct > 30 && (
        <Alert
          tone="warn"
          title={`${unresolvedPct}% of signals are resolving to nothing`}
          body="The taxonomy has drifted away from what users are writing. Work the unmapped queue — it is ranked by how many distinct people used each term."
        />
      )}

      {/*
        ⚠ Surfaced deliberately. mentor_supply gates Phase 5 recommendations, and a
        NULL supply_computed_at means "never counted" rather than "no supply". A gate
        written as `mentor_supply > 0` would silently disable every recommendation on
        the platform. See V291.
      */}
      {supplyUncomputed > 0 && (
        <Alert
          tone="info"
          title={`Mentor supply has never been computed for ${supplyUncomputed} of ${data.rolesTotal} roles`}
          body="Recommendation gates must read supply_computed_at, not mentor_supply. Treating an uncomputed 0 as 'no supply' would switch off every recommendation. Phase 5 owns computing this."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">How terms are resolving</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resolution</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.resolutionMix?.map((row) => (
                  <TableRow key={row.resolution}>
                    <TableCell className="text-sm">{row.resolution}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Intent stages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.intentFunnel?.map((row) => (
                  <TableRow key={row.stage}>
                    <TableCell className="text-sm">{row.stage}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.users}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Most common interests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Avg strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.facetLeaderboard?.map((row, i) => (
                <TableRow key={`${row.facet_type}-${row.display_label}-${i}`}>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.facet_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{row.display_label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.users}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.avg_strength}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Unmapped terms ───────────────────────────────────────────────────────────

function UnmappedScreen() {
  const { data, isLoading } = useUnmappedTerms("OPEN", 0, 100)
  const resolve = useResolveUnmappedTerm()

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const rows = data?.content ?? []

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nothing unmapped. Every term users have written resolves to something.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Term</TableHead>
              {/*
                Ordered by distinct users, NOT hit count. A term one resume repeats
                forty times is noise; a term forty people used once is a gap, and
                ranking on the wrong one wastes the whole session.
              */}
              <TableHead className="text-right">People</TableHead>
              <TableHead className="text-right">Hits</TableHead>
              <TableHead className="w-40 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((term) => (
              <TableRow key={`${term.facetType}:${term.normalisedTerm}`}>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {term.facetType}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{term.normalisedTerm}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {term.distinctUsers}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {term.hitCount}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={resolve.isPending}
                    onClick={() =>
                      resolve.mutate({
                        facetType: term.facetType,
                        normalisedTerm: term.normalisedTerm,
                        reject: true,
                      })
                    }
                  >
                    <X className="size-3" />
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Rejecting keeps the term out of this queue permanently — most rejections are the JD
            parser emitting something that was never a role or a skill. Mapping a <strong>role</strong>{" "}
            to a canonical entry creates an alias; a <strong>skill</strong> that does not match is a
            request to add a skill, which goes through the Skills admin because that registry is also
            read by the profile editor.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Auto-matches ─────────────────────────────────────────────────────────────

function AutoMatchScreen() {
  const { data, isLoading } = useAutoMatches(100)
  const confirm = useConfirmAutoMatch()

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const rows = data ?? []

  return (
    <div className="space-y-4">
      {/*
        The argument for this screen existing at all. Worth stating on the page,
        because the natural instinct on seeing a 0.78 match is to trust it.
      */}
      <Alert
        tone="info"
        title="The embedding pass can be confidently wrong"
        body='Measured on this platform: "Member of Technical Staff" matches "Technical Writer" at 0.78 — higher than two correct matches, with a wider margin over its runner-up. No floor separates them, because the model is behaving correctly on the words it was given. Auto-matched facets are recorded at a weakened confidence so a one-off cannot surface; confirming one here turns it into a permanent alias that resolves exactly.'
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No auto-matches yet. Every term so far has resolved exactly or by an approved alias.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Observed</TableHead>
                  <TableHead>Matched to</TableHead>
                  {/* Ascending — the worst matches are the point of this screen. */}
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">People</TableHead>
                  <TableHead className="w-32 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={`${m.facetType}:${m.rawTerm}:${m.facetKey}`}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.facetType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{m.rawTerm}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {m.displayLabel ?? m.facetKey}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          (m.avgScore ?? 1) < 0.65
                            ? "text-amber-600 dark:text-amber-400"
                            : undefined
                        }
                      >
                        {m.avgScore != null ? m.avgScore.toFixed(2) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.distinctUsers}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={confirm.isPending || m.facetType !== "ROLE"}
                        title={
                          m.facetType === "ROLE"
                            ? "Create a permanent alias"
                            : "Only roles have an alias table"
                        }
                        onClick={() =>
                          confirm.mutate({
                            facetType: m.facetType,
                            rawTerm: m.rawTerm,
                            facetKey: m.facetKey,
                          })
                        }
                      >
                        <Check className="size-3" />
                        Confirm
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  )
}

function Alert({
  tone,
  title,
  body,
}: {
  tone: "warn" | "info"
  title: string
  body: string
}) {
  const Icon = tone === "warn" ? AlertTriangle : Sparkles
  const classes =
    tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
      : "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-300"

  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-xs ${classes}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
