"use client"

/**
 * ─── INTEREST SEGMENTS CONSOLE ────────────────────────────────────────────────
 *
 * Saved audience predicates over the interest graph, and the builder for them.
 *
 * ─── The one idea this screen has to communicate ───
 * A segment is a DEFINITION, not a list of people. Interest facets decay continuously, so the same
 * predicate resolves to a different set every week — and a campaign is therefore not reproducible
 * from its segment. Everything here is worded to keep that in front of the operator: the count is
 * always labelled "match", always shown with the timestamp it was computed at, and never presented
 * as "will receive".
 *
 * ─── Why the count is not live ───
 * Evaluating runs a real predicate query. It is behind an explicit press rather than firing on
 * every edit, both to avoid a query per keystroke and because a confident count for a half-typed
 * facet key is worse than no count at all.
 *
 * ⚠ `lastCount` is nullable and `null` ≠ `0`. Nobody-matches and nobody-has-asked are opposite
 *   conclusions, and coalescing them would tell an operator their segment is empty when it has
 *   simply never been run.
 */

import React from "react"
import { Archive, Bug, Info, Play, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useArchiveSegment,
  useCreateSegment,
  useEvaluateSegment,
  usePreviewDefinition,
  useSegments,
  useUpdateSegment,
} from "./api/segments.hooks"
import {
  EMPTY_DEFINITION,
  FACET_TYPES,
  INTENT_STAGES,
  SENIORITIES,
  type FacetClause,
  type FacetType,
  type IntentStage,
  type Segment,
  type SegmentDefinition,
  type Seniority,
} from "./api/segments.types"

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
}

/** How many conditions a definition carries — the list's at-a-glance "is this narrow?" signal. */
function clauseCount(d: SegmentDefinition): number {
  const profile = d.profile ?? {}
  return (
    (d.all?.length ?? 0) +
    (d.none?.length ?? 0) +
    (profile.intentStage?.length ? 1 : 0) +
    (profile.seniority?.length ? 1 : 0) +
    (profile.lastSignalWithinDays != null ? 1 : 0) +
    (profile.minCompleteness != null ? 1 : 0) +
    (d.requireSupply ? 1 : 0)
  )
}

export default function SegmentsConsoleView() {
  const [editing, setEditing] = React.useState<Segment | "new" | null>(null)
  const [archiving, setArchiving] = React.useState<Segment | null>(null)

  const { data, isLoading } = useSegments(0, 50)
  const evaluate = useEvaluateSegment()
  const archive = useArchiveSegment()

  const rows = data?.content ?? []

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Segments</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Saved audiences built from the interest graph. Used to target campaigns without pasting
            a list.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-3.5 w-3.5" />
          New segment
        </Button>
      </div>

      {/*
        Said on the screen because it is the single most misread thing here. An operator who
        believes a segment is a frozen list will be baffled when a campaign sent to it reaches a
        different number of people than the console showed yesterday.
      */}
      <div className="flex items-start gap-2.5 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          A segment is a rule, not a fixed list. Interests fade over time, so the same segment
          reaches different people next week — and counts here are{" "}
          <strong>people who match</strong>, before unsubscribes, account checks and frequency
          caps are applied at send time.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Live segments
            {typeof data?.totalElements === "number" && (
              <span className="ml-2 font-normal text-muted-foreground">
                ({data.totalElements})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No segments yet. Create one to target a campaign by interest.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Conditions</TableHead>
                  <TableHead className="text-right">Matching</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((segment) => (
                  <TableRow key={segment.segmentId}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left text-sm font-medium hover:underline"
                        onClick={() => setEditing(segment)}
                      >
                        {segment.name}
                      </button>
                      {segment.description && (
                        <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                          {segment.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {clauseCount(segment.definition)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {/*
                        null ≠ 0. "Not evaluated" and "nobody matches" are opposite conclusions and
                        the operator's next action differs completely.
                      */}
                      {segment.lastCount == null ? (
                        <span className="text-xs text-muted-foreground">Not evaluated</span>
                      ) : (
                        <span className="font-medium">{segment.lastCount}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {/* The timestamp always travels with the number — it is a snapshot. */}
                      {formatDateTime(segment.lastCountAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={evaluate.isPending}
                          onClick={() => evaluate.mutate(segment.segmentId)}
                        >
                          <Play className="h-3 w-3" />
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setArchiving(segment)}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <SegmentBuilderDialog
          segment={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!archiving} onOpenChange={(open) => !open && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{archiving?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              It will no longer be selectable for new campaigns. Past campaigns keep their link to
              it, so their history stays intact — this is why there is no delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiving) archive.mutate(archiving.segmentId)
                setArchiving(null)
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function SegmentBuilderDialog({
  segment,
  onClose,
}: {
  segment: Segment | null
  onClose: () => void
}) {
  const [name, setName] = React.useState(segment?.name ?? "")
  const [description, setDescription] = React.useState(segment?.description ?? "")
  const [definition, setDefinition] = React.useState<SegmentDefinition>(
    segment?.definition ?? EMPTY_DEFINITION,
  )

  const create = useCreateSegment()
  const update = useUpdateSegment()
  const preview = usePreviewDefinition()

  const saving = create.isPending || update.isPending
  const conditions = clauseCount(definition)

  const patch = (next: Partial<SegmentDefinition>) =>
    setDefinition((d) => ({ ...d, ...next }))

  const patchProfile = (next: Partial<SegmentDefinition["profile"]>) =>
    setDefinition((d) => ({ ...d, profile: { ...d.profile, ...next } }))

  const addClause = (list: "all" | "none") =>
    setDefinition((d) => ({
      ...d,
      [list]: [...(d[list] ?? []), { facetType: "SKILL" as FacetType, facetKey: "" }],
    }))

  const setClause = (list: "all" | "none", index: number, next: Partial<FacetClause>) =>
    setDefinition((d) => ({
      ...d,
      [list]: (d[list] ?? []).map((c, i) => (i === index ? { ...c, ...next } : c)),
    }))

  const removeClause = (list: "all" | "none", index: number) =>
    setDefinition((d) => ({ ...d, [list]: (d[list] ?? []).filter((_, i) => i !== index) }))

  const submit = () => {
    const body = { name: name.trim(), description: description.trim() || undefined, definition }
    if (segment) {
      update.mutate({ segmentId: segment.segmentId, ...body }, { onSuccess: onClose })
    } else {
      create.mutate(body, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{segment ? "Edit segment" : "New segment"}</DialogTitle>
          <DialogDescription>
            Everyone matching <strong>all</strong> of the conditions below, and{" "}
            <strong>none</strong> of the exclusions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="segment-name">Name</Label>
              <Input
                id="segment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Backend seniors blocked on system design"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="segment-desc">
                What it is for <span className="text-muted-foreground">(recommended)</span>
              </Label>
              <Textarea
                id="segment-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="For the system-design mentorship push"
              />
            </div>
          </div>
          {/*
            Pressed for, because a predicate of five facet ids is unreadable six months later and
            the description is the only thing that records why it exists.
          */}

          <ClauseList
            title="Must match all of"
            clauses={definition.all ?? []}
            onAdd={() => addClause("all")}
            onChange={(i, next) => setClause("all", i, next)}
            onRemove={(i) => removeClause("all", i)}
          />

          <ClauseList
            title="Must match none of"
            hint="An exclusion on its own is not a segment — the API refuses it, because “everyone except X” is a send to everyone."
            clauses={definition.none ?? []}
            onAdd={() => addClause("none")}
            onChange={(i, next) => setClause("none", i, next)}
            onRemove={(i) => removeClause("none", i)}
          />

          {/* ── Profile conditions ── */}
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <MultiToggle
                label="Intent stage"
                options={INTENT_STAGES}
                selected={definition.profile?.intentStage ?? []}
                onToggle={(value) =>
                  patchProfile({
                    intentStage: toggle(definition.profile?.intentStage ?? [], value) as IntentStage[],
                  })
                }
              />
              <MultiToggle
                label="Seniority"
                options={SENIORITIES}
                selected={definition.profile?.seniority ?? []}
                onToggle={(value) =>
                  patchProfile({
                    seniority: toggle(definition.profile?.seniority ?? [], value) as Seniority[],
                  })
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="segment-recency" className="text-xs">
                  Active in the last (days)
                </Label>
                <Input
                  id="segment-recency"
                  type="number"
                  min={1}
                  value={definition.profile?.lastSignalWithinDays ?? ""}
                  onChange={(e) =>
                    patchProfile({
                      lastSignalWithinDays: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="14"
                />
                {/*
                  The usual way to say "people who are actually still around". Without it a segment
                  accumulates everybody who ever matched, and the first campaign to a year-old
                  cohort is the one that earns the unsubscribes.
                */}
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to include people who have not been active recently.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="segment-completeness" className="text-xs">
                  Minimum profile completeness
                </Label>
                <Input
                  id="segment-completeness"
                  type="number"
                  min={0}
                  max={100}
                  value={definition.profile?.minCompleteness ?? ""}
                  onChange={(e) =>
                    patchProfile({
                      minCompleteness: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="40"
                />
              </div>
            </div>
          </div>

          {/* ── Supply gate ── */}
          <label className="flex items-start gap-2.5 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={definition.requireSupply}
              onChange={(e) => patch({ requireSupply: e.target.checked })}
            />
            <span>
              Only people whose target role we can actually serve
              {/*
                ⚠ Said out loud because the flag currently matches NOBODY, and that is correct
                rather than broken: no role has a measured mentor supply yet, and the backend gate
                deliberately requires a real measurement rather than reading `mentor_supply > 0`,
                which would be indistinguishable from "measured and genuinely zero". Without this
                warning an operator would tick it, see a count of 0, and conclude the segment is
                wrong.
              */}
              <span className="mt-1 block text-xs text-amber-600 dark:text-amber-500">
                Mentor supply per role has not been measured yet, so this currently matches nobody.
                Leave it off until role coverage is computed.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={conditions === 0 || preview.isPending}
              onClick={() => preview.mutate(definition)}
            >
              <Bug className="h-3.5 w-3.5" />
              {preview.isPending ? "Counting…" : "Preview count"}
            </Button>
            {preview.data && (
              <span className="text-sm">
                <strong>{preview.data.matchedCount}</strong>{" "}
                <span className="text-muted-foreground">match right now</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!name.trim() || conditions === 0 || saving} onClick={submit}>
              {saving ? "Saving…" : segment ? "Save changes" : "Create segment"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ClauseList({
  title,
  hint,
  clauses,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string
  hint?: string
  clauses: FacetClause[]
  onAdd: () => void
  onChange: (index: number, next: Partial<FacetClause>) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}

      {clauses.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground">None.</p>
      ) : (
        clauses.map((clause, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <Select
              value={clause.facetType}
              onValueChange={(v) => onChange(index, { facetType: v as FacetType })}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACET_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/*
              A free-text id rather than a picker. Each facet type resolves against a different
              registry — skills, roles, categories, companies, enum names — and a picker per type
              is a much larger surface than this phase needs. The count preview is the check: a
              wrong id returns 0 and is immediately obvious.
            */}
            <Input
              value={clause.facetKey}
              onChange={(e) => onChange(index, { facetKey: e.target.value })}
              placeholder="registry id, e.g. java"
              className="h-8 flex-1 font-mono text-xs"
            />
            <Input
              type="number"
              value={clause.minWeight ?? ""}
              onChange={(e) =>
                onChange(index, { minWeight: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="min"
              title="Minimum strength. Blank uses the platform floor."
              className="h-8 w-20 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onRemove(index)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}

function MultiToggle<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly T[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className="rounded-full border px-2 py-0.5 text-[11px] transition-colors data-[on=true]:border-primary data-[on=true]:bg-primary/10"
            data-on={selected.includes(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export { formatDateTime as formatSegmentDateTime }
