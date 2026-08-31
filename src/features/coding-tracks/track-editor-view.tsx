"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  usePublishTrack,
  useRetireTrack,
  useSaveItems,
  useSaveSections,
  useTrackDetail,
  useUnlistTrack,
  useUpdateTrack,
} from "./api/track.hooks"
import type { TrackSection, TrackView } from "./api/track.types"

/**
 * ─── ONE TRACK, BEING ASSEMBLED ──────────────────────────────────────────────
 *
 * docs/CODING_PROBLEMS_MASTER_PLAN.md §10.
 *
 * ─── ⚠ ORDER IS POSITIONAL, SO THE ARRAY IS THE ORDER ───────────────────────
 *
 * Sections and items are saved as whole ordered lists. There is no reorder endpoint and no
 * position field to type: moving a row up rewrites the array and saves it. A separate reorder call
 * would be the same fact stored twice, and the two drift the first time a drag lands while another
 * tab is saving.
 *
 * ─── ⚠ UP/DOWN BUTTONS RATHER THAN DRAG AND DROP ───────────────────────────
 *
 * A curator orders a forty-item list once and then edits it twice a year. Drag-and-drop costs a
 * library, a keyboard story and a touch story to save clicks nobody is making in volume — and it
 * is the control that is hardest to use with a screen reader on a screen whose entire job is
 * ordering.
 *
 * ─── ⚠ A WITHDRAWN PROBLEM IS SHOWN, NOT HIDDEN ────────────────────────────
 *
 * `problemStatus` travels on every row so this screen can say that item 12 points at something
 * retired last week. The public page renders it struck through and drops it from both halves of
 * the count; the curator is the only person who can act on it.
 */
export function TrackEditorView({ trackId }: { trackId: string }) {
  const { data: track, isPending } = useTrackDetail(trackId)

  if (isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!track) return <p className="text-sm text-muted-foreground">That track could not be loaded.</p>

  return <Editor track={track} />
}

function Editor({ track }: { track: TrackView }) {
  const update = useUpdateTrack(track.trackId)
  const saveSections = useSaveSections(track.trackId)
  const publish = usePublishTrack(track.trackId)
  const unlist = useUnlistTrack(track.trackId)
  const retire = useRetireTrack(track.trackId)

  const [title, setTitle] = useState(track.title)
  const [summary, setSummary] = useState(track.summaryHtml)
  const [band, setBand] = useState(track.difficultyBand ?? "")
  const [position, setPosition] = useState(String(track.position))
  const [newSection, setNewSection] = useState("")

  /** The whole list, rewritten. See the file note on positional ordering. */
  function writeSections(sections: TrackSection[]) {
    saveSections.mutate({
      sections: sections.map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        summaryHtml: section.summaryHtml,
      })),
    })
  }

  function moveSection(index: number, delta: number) {
    const next = [...track.sections]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    writeSections(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tracks">
            <ChevronLeft className="size-3.5" />
            All tracks
          </Link>
        </Button>
        <Badge variant="secondary">{track.status.toLowerCase()}</Badge>
        <span className="text-xs text-muted-foreground">/{track.slug}</span>
        <span className="text-xs text-muted-foreground">
          <span className="tabular-nums">{track.required}</span> counted of{" "}
          <span className="tabular-nums">{track.total}</span> rows
        </span>

        <div className="ml-auto flex flex-wrap gap-2">
          {/*
            ⚠ Publish refuses an empty track server-side (RQ-CD-98). §10's promise is a fixed count
            and that finishing it is sufficient; a page making that promise over nothing is worse
            than no page. The button is offered anyway so the refusal explains itself.
          */}
          <Button size="sm" onClick={() => publish.mutate(undefined)} disabled={publish.isPending}>
            {publish.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {track.status === "PUBLISHED" ? "Re-publish" : "Publish"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => unlist.mutate(undefined)}>
            Unlist
          </Button>
          <Button size="sm" variant="ghost" onClick={() => retire.mutate(undefined)}>
            Retire
          </Button>
        </div>
      </div>

      {/* ── The track's own fields ───────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Band — who it is FOR, not how hard the problems are
            </span>
            <Input
              value={band}
              onChange={(event) => setBand(event.target.value)}
              placeholder="FOUNDATION"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            Summary — HTML, sanitised server-side
          </span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            className="w-full rounded-lg border bg-background p-2 text-sm"
          />
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Order on /tracks</span>
            <Input
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="w-24"
              inputMode="numeric"
            />
          </label>
          <Button
            size="sm"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                title: title.trim(),
                summaryHtml: summary,
                difficultyBand: band.trim() || undefined,
                position: Number.isFinite(Number(position)) ? Number(position) : 0,
              })
            }
          >
            {update.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </section>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Sections</h2>
          <Input
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
            placeholder="New section title"
            className="max-w-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!newSection.trim() || saveSections.isPending}
            onClick={() => {
              writeSections([
                ...track.sections,
                { sectionId: "", title: newSection.trim(), summaryHtml: "", position: 0, items: [] },
              ])
              setNewSection("")
            }}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>

        {track.sections.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No sections yet. A section is the unit somebody can finish in an evening —{" "}
            <span className="font-medium">Arrays 6/8</span> rather than a forty-problem wall.
          </p>
        ) : (
          <ul className="space-y-3">
            {track.sections.map((section, index) => (
              <SectionCard
                key={section.sectionId}
                trackId={track.trackId}
                section={section}
                index={index}
                count={track.sections.length}
                onMove={(delta) => moveSection(index, delta)}
                onRemove={() =>
                  writeSections(track.sections.filter((_, i) => i !== index))
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SectionCard({
  trackId,
  section,
  index,
  count,
  onMove,
  onRemove,
}: {
  trackId: string
  section: TrackSection
  index: number
  count: number
  onMove: (delta: number) => void
  onRemove: () => void
}) {
  const saveItems = useSaveItems(trackId)
  const [slug, setSlug] = useState("")

  /** Whole-list again: every write sends the section's problems in their new order. */
  function writeItems(items: TrackSection["items"]) {
    saveItems.mutate({
      sectionId: section.sectionId,
      body: {
        items: items.map((item) => ({
          slug: item.slug,
          optional: item.optional,
          note: item.note,
        })),
      },
    })
  }

  function move(itemIndex: number, delta: number) {
    const next = [...section.items]
    const target = itemIndex + delta
    if (target < 0 || target >= next.length) return
    ;[next[itemIndex], next[target]] = [next[target], next[itemIndex]]
    writeItems(next)
  }

  return (
    <li className="rounded-xl border">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <span className="text-xs tabular-nums text-muted-foreground">{index + 1}</span>
        <span className="min-w-0 flex-1 truncate font-medium">{section.title}</span>
        <span className="text-xs text-muted-foreground">
          <span className="tabular-nums">{section.items.length}</span> problem
          {section.items.length === 1 ? "" : "s"}
        </span>
        <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>

      <ul className="divide-y">
        {section.items.map((item, itemIndex) => (
          <li key={item.slug} className="flex flex-wrap items-center gap-2 px-4 py-2">
            <span className="text-xs tabular-nums text-muted-foreground">
              {item.number ?? "—"}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                item.problemStatus !== "PUBLISHED" && "text-muted-foreground line-through",
              )}
            >
              {item.title}
            </span>

            {item.problemStatus !== "PUBLISHED" ? (
              // ⚠ The whole reason problemStatus travels. This row counts for nobody and the
              // curator is the only person who can fix it.
              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                {item.problemStatus.toLowerCase()}
              </Badge>
            ) : null}

            <button
              type="button"
              onClick={() =>
                writeItems(
                  section.items.map((one, i) =>
                    i === itemIndex ? { ...one, optional: !one.optional } : one,
                  ),
                )
              }
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                item.optional
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
              )}
              title="An optional item is reachable but does not count towards the section's n/m."
            >
              {item.optional ? "optional" : "counts"}
            </button>

            <Button
              size="icon"
              variant="ghost"
              disabled={itemIndex === 0}
              onClick={() => move(itemIndex, -1)}
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={itemIndex === section.items.length - 1}
              onClick={() => move(itemIndex, 1)}
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => writeItems(section.items.filter((_, i) => i !== itemIndex))}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="problem slug — e.g. two-sum"
          className="max-w-xs"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!slug.trim() || saveItems.isPending}
          onClick={() => {
            writeItems([
              ...section.items,
              {
                slug: slug.trim(),
                title: slug.trim(),
                problemStatus: "PUBLISHED",
                optional: false,
                position: section.items.length,
              },
            ])
            setSlug("")
          }}
        >
          <Plus className="size-3.5" />
          Add problem
        </Button>
        <span className="text-xs text-muted-foreground">
          By slug — the server refuses one that does not exist, and one listed twice in the same
          section.
        </span>
      </div>
    </li>
  )
}
