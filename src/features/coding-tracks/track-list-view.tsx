"use client"

import { useState } from "react"
import Link from "next/link"
import { Layers, Loader2, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { useCreateTrack, useTrackList } from "./api/track.hooks"
import type { TrackStatus } from "./api/track.types"

/**
 * ─── TRACK CURATION ──────────────────────────────────────────────────────────
 *
 * docs/CODING_PROBLEMS_MASTER_PLAN.md §10.
 *
 * ─── Why this screen is in the console and not in the dashboard ──────────────
 *
 * Problems are authored in revquix-web by anyone with `PERM_CREATE_PROBLEM`, because the machine
 * gate and a human reviewer stand between an author and the catalogue. A track has neither, and it
 * is a claim about *other people's* problems — "do these, in this order, and finishing it is
 * sufficient". §1.1 calls it the product. That belongs with whoever already decides what the
 * platform publishes.
 *
 * ─── ⚠ THE COUNT SHOWN IS THE ONE THE PUBLIC PAGE COUNTS ────────────────────
 *
 * `required` excludes optional items AND problems that have since been withdrawn, exactly as the
 * visitor's page does. A curator seeing a different total from the one a member sees is how a
 * "40-problem track" quietly becomes 37 without anybody noticing.
 */

const STATUS_TONE: Record<TrackStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  UNLISTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  RETIRED: "bg-destructive/10 text-destructive",
}

export function TrackListView() {
  const { data: tracks, isPending } = useTrackList()
  const create = useCreateTrack()
  const [title, setTitle] = useState("")

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tracks</h1>
        <p className="text-sm text-muted-foreground">
          Ordered paths through the published catalogue. A track is the product; the judge under it
          is the infrastructure.
        </p>
      </header>

      {/*
        ⚠ Create takes a title and nothing else. The slug is generated from it once and is an SEO
        identity thereafter — a form that asked for both would invite somebody to change the slug
        of a page people have bookmarked.
      */}
      <form
        className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim()) return
          create.mutate({ title: title.trim() }, { onSuccess: () => setTitle("") })
        }}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New track title — e.g. DSA from Scratch"
          className="max-w-sm"
        />
        <Button type="submit" size="sm" disabled={!title.trim() || create.isPending}>
          {create.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Create draft
        </Button>
        <span className="text-xs text-muted-foreground">
          The URL comes from the title and does not change when you rename it.
        </span>
      </form>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading tracks…</p>
      ) : !tracks || tracks.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tracks yet. The names are a product decision — see §17.5.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {tracks.map((track) => (
            <li key={track.trackId}>
              <Link
                href={`/tracks/${track.trackId}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <Layers className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">{track.title}</span>

                <Badge className={cn("shrink-0", STATUS_TONE[track.status])} variant="secondary">
                  {track.status.toLowerCase()}
                </Badge>

                <span className="shrink-0 text-xs text-muted-foreground">
                  <span className="tabular-nums">{track.required}</span> counted
                  {track.total !== track.required ? (
                    <>
                      {" · "}
                      <span className="tabular-nums">{track.total - track.required}</span> not
                    </>
                  ) : null}
                </span>

                <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                  /{track.slug}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
