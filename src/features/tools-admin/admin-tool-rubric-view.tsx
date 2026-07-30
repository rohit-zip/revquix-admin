/**
 * ─── SCREEN 6: RUBRIC VERSIONS (§8.6) ────────────────────────────────────────
 *
 * §8.6 calls this "the screen that will get skipped and then badly missed", and the reason is worth
 * keeping in the file: **publishing a rubric change without seeing the distribution move is how a
 * platform silently re-scores every user overnight.** A version field alone permits that. The diff is
 * the control.
 *
 * Two things it deliberately does not do:
 *
 *  - It does not re-score a corpus through a *candidate* rubric. That needs the scoring engine, which
 *    P11 owns. This compares two versions that have both already produced reports, which is the question
 *    immediately after a publication — and the one that catches a mistake while it is a day old.
 *  - It does not draw a conclusion when the two corpora are too different in size. `comparableCorpus`
 *    is the honesty flag, and the warning replaces the chart's implied conclusion.
 *
 * The band counts come from their own exact query rather than from summing the histogram, because the
 * STRONG/EXCELLENT boundary at 85 sits inside the 80–89 bucket. Deriving bands from buckets counted
 * every report scoring 85–89 as STRONG — a real bug, caught by a test, and it mattered because the
 * conversion CTA switches on the band.
 */

"use client"

import React from "react"
import { AlertTriangle, GitCompare } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRubricDistribution } from "./api/tools-admin.hooks"
import type { RubricVersionDistribution } from "./api/tools-admin.types"
import {
  ConstraintNote,
  MiniBar,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatNumber,
} from "./components/tools-admin-shared"

export default function AdminToolRubricView() {
  const [toolKey, setToolKey] = React.useState<string>("")
  const [before, setBefore] = React.useState<string>("")
  const [after, setAfter] = React.useState<string>("")

  const query = useRubricDistribution({
    toolKey: toolKey || undefined,
    before: before || undefined,
    after: after || undefined,
  })

  const data = query.data
  const tools = React.useMemo(
    () => Array.from(new Set((data?.corpus ?? []).map((entry) => entry.toolKey))),
    [data],
  )
  const versionsForTool = React.useMemo(
    () => (data?.corpus ?? []).filter((entry) => entry.toolKey === toolKey),
    [data, toolKey],
  )

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Rubric versions"
        description="The score distribution of one rubric version against another, over the reports each actually produced. Publishing a rubric change without seeing the distribution move is how a platform silently re-scores every user overnight."
      />

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load the distribution</AlertTitle>
          <AlertDescription>
            This page needs <code>PERM_MANAGE_TOOL_RUBRIC</code>. An unknown tool key is also refused.
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active rubric version" value={data.activeRubricVersion} hint="app.tools.rubric.version" />
            <StatCard
              label="Active prompt version"
              value={data.activePromptVersion}
              hint="Independent of the rubric version by design — conflating them either over-invalidates the cache or serves prose written against a rubric it no longer matches"
            />
            <StatCard
              label="Versions with stored reports"
              value={data.corpus.length}
              hint="Derived from the corpus, not from config — a version that was published, used and rolled back is still listed"
            />
          </div>

          <SectionCard
            title="Choose a comparison"
            description="Pick a tool, then a baseline and a comparison version. Both must already have scored reports."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="rubric-tool">Tool</Label>
                <Select
                  value={toolKey || undefined}
                  onValueChange={(value) => {
                    setToolKey(value)
                    setBefore("")
                    setAfter("")
                  }}
                  disabled={tools.length === 0}
                >
                  <SelectTrigger id="rubric-tool">
                    <SelectValue placeholder={tools.length === 0 ? "No scored reports yet" : "Choose a tool"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((key) => (
                      <SelectItem key={key} value={key}>
                        {key.replace(/_/g, " ").toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rubric-before">Baseline version</Label>
                <Select
                  value={before || undefined}
                  onValueChange={setBefore}
                  disabled={versionsForTool.length === 0}
                >
                  <SelectTrigger id="rubric-before">
                    <SelectValue placeholder="Choose a version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versionsForTool.map((entry) => (
                      <SelectItem key={entry.rubricVersion} value={entry.rubricVersion}>
                        {entry.rubricVersion} · {formatNumber(entry.reports)} report(s)
                        {entry.active ? " · active" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rubric-after">Comparison version</Label>
                <Select
                  value={after || undefined}
                  onValueChange={setAfter}
                  disabled={versionsForTool.length === 0}
                >
                  <SelectTrigger id="rubric-after">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {versionsForTool.map((entry) => (
                      <SelectItem key={entry.rubricVersion} value={entry.rubricVersion}>
                        {entry.rubricVersion} · {formatNumber(entry.reports)} report(s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {data.corpus.length === 0 && (
            <SectionCard title="No scored reports yet" description="">
              <p className="text-sm text-muted-foreground">
                No tool has produced a scored report, so there is no distribution to show. This screen
                exists before the scoring engine deliberately: the first rubric publication is exactly
                when the diff is needed, and building the view afterwards is how it gets skipped.
              </p>
            </SectionCard>
          )}

          {!data.comparableCorpus && data.comparabilityNote && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>These two versions are not comparable</AlertTitle>
              <AlertDescription>{data.comparabilityNote}</AlertDescription>
            </Alert>
          )}

          {data.meanShift !== null && data.comparableCorpus && (
            <Alert>
              <GitCompare className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>
                Mean score moved by {data.meanShift > 0 ? "+" : ""}
                {data.meanShift.toFixed(1)} points
              </AlertTitle>
              <AlertDescription className="text-xs">
                {Math.abs(data.meanShift) >= 5
                  ? "That is a material shift. Every user scored under the new version is being told something different about the same résumé — confirm it is intended before this becomes the published rubric."
                  : "A small shift. Check the band counts below as well: the conversion CTA switches on the band, so a boundary crossing matters more than a mean moving."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.before && <DistributionPanel title="Baseline" distribution={data.before} />}
            {data.after && <DistributionPanel title="Comparison" distribution={data.after} />}
          </div>

          {data.deltas && data.deltas.length > 0 && (
            <SectionCard
              title="Bucket-by-bucket movement"
              description="Percentage-point change in each ten-point band. Positive means more reports landed there after the change."
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Score band</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">After</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.deltas.map((delta) => (
                      <TableRow key={delta.bucket}>
                        <TableCell className="text-xs">{delta.label}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {delta.beforePercent.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {delta.afterPercent.toFixed(1)}%
                        </TableCell>
                        <TableCell
                          className={[
                            "text-right text-xs font-medium tabular-nums",
                            delta.deltaPercent > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : delta.deltaPercent < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {delta.deltaPercent > 0 ? "+" : ""}
                          {delta.deltaPercent.toFixed(1)} pp
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}

          <ConstraintNote>
            Band counts are computed from the published thresholds directly
            (0–49 / 50–69 / 70–84 / 85–100), <strong>not</strong> by summing the ten-point histogram. The
            STRONG/EXCELLENT boundary at 85 sits inside the 80–89 bucket, so a bucket sum would count every
            report scoring 85–89 as STRONG — and since the conversion CTA switches on the band, this screen
            would have disagreed with what users were actually shown.
          </ConstraintNote>
        </>
      )}
    </div>
  )
}

function DistributionPanel({
  title,
  distribution,
}: {
  title: string
  distribution: RubricVersionDistribution
}) {
  return (
    <SectionCard
      title={`${title} — ${distribution.rubricVersion}`}
      description={`${formatNumber(distribution.reports)} scored report(s)`}
      actions={
        distribution.partialReports > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {formatNumber(distribution.partialReports)} partial
          </Badge>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Mean</dt>
            <dd className="text-lg font-semibold tabular-nums">{distribution.meanScore.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Median</dt>
            <dd className="text-lg font-semibold tabular-nums">{distribution.medianScore.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Min</dt>
            <dd className="text-lg font-semibold tabular-nums">{distribution.minScore}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Max</dt>
            <dd className="text-lg font-semibold tabular-nums">{distribution.maxScore}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Published bands</p>
          {distribution.bands.map((band) => (
            <div key={band.band} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0">
                {band.band.replace(/_/g, " ").toLowerCase()}{" "}
                <span className="text-muted-foreground">{band.range}</span>
              </span>
              <div className="flex-1">
                <MiniBar
                  percent={band.percent}
                  label={`${band.percent.toFixed(1)} percent in the ${band.band} band`}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                {formatNumber(band.reports)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Ten-point histogram</p>
          {distribution.buckets.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 text-muted-foreground">{bucket.label}</span>
              <div className="flex-1">
                <MiniBar percent={bucket.percent} label={`${bucket.percent.toFixed(1)} percent`} />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                {formatNumber(bucket.reports)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
