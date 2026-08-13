"use client"

/**
 * The segment picker in the compose wizard's audience step.
 *
 * ─── Why this shows a count and still refuses to promise one ───
 * The number is "people who match the rule right now". It is NOT the recipient count, and the two
 * differ for entirely legitimate reasons: unsubscribes, unverified or deleted accounts, people who
 * switched personalisation off, people who told us they landed a role, and anybody emailed too
 * recently are all removed at send time. A panel that showed this as "will receive" would be wrong
 * on every campaign, and an operator who caught it once would stop trusting the preview.
 *
 * ─── No typed-phrase confirmation, unlike All Users ───
 * A segment narrows by construction, and the backend refuses a definition that does not. Adding
 * friction to a routine send is what trains people to type through the confirmation on the one
 * send where it matters.
 */

import React from "react"
import { Info, Play, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useEvaluateSegment, useSegments } from "../api/segments.hooks"

interface SegmentAudiencePanelProps {
  active: boolean
  selectedSegmentId: string | null
  onSelect: (segmentId: string | null) => void
}

export function SegmentAudiencePanel({
  active,
  selectedSegmentId,
  onSelect,
}: SegmentAudiencePanelProps) {
  // Only fetched when the tab is actually open. The compose screen mounts every audience panel at
  // once, and four panels each fetching on mount is three wasted requests per composition.
  const { data, isLoading } = useSegments(0, 100)
  const evaluate = useEvaluateSegment()

  const segments = data?.content ?? []
  const selected = segments.find((s) => s.segmentId === selectedSegmentId) ?? null

  if (!active) return null

  if (isLoading) return <Skeleton className="h-40 w-full" />

  if (segments.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No segments yet. Create one under <strong>Marketing → Segments</strong> to target a
        campaign by interest.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="segment-select" className="text-sm font-medium">
          Segment
        </label>
        <Select value={selectedSegmentId ?? ""} onValueChange={(v) => onSelect(v || null)}>
          <SelectTrigger id="segment-select">
            <SelectValue placeholder="Choose a segment…" />
          </SelectTrigger>
          <SelectContent>
            {segments.map((segment) => (
              <SelectItem key={segment.segmentId} value={segment.segmentId}>
                {segment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="space-y-3 rounded-md border p-4">
          {selected.description && (
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            {selected.lastCount == null ? (
              // null ≠ 0. Telling an operator "0 people match" when nobody has evaluated the
              // segment would send them off to fix a definition that may be perfectly good.
              <span className="text-sm text-muted-foreground">
                Not evaluated yet — run it to see how many people match.
              </span>
            ) : (
              <span className="text-sm">
                <strong>{selected.lastCount}</strong> people matched when this was last counted
                {selected.lastCountAt && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({new Date(selected.lastCountAt).toLocaleString()})
                  </span>
                )}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={evaluate.isPending}
              onClick={() => evaluate.mutate(selected.segmentId)}
            >
              <Play className="h-3 w-3" />
              {evaluate.isPending ? "Counting…" : "Recount"}
            </Button>
          </div>

          {/*
            The honest caveat, on the screen where the decision is made. The recipient count will
            be lower than this and the report will say why per person — but an operator who expects
            the two to agree will read the difference as a bug.
          */}
          <div className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This is how many people match the rule, not how many will receive the email. At send
              time we also remove unsubscribes, unverified and closed accounts, anyone who switched
              personalisation off, anyone who told us they landed a role, and anyone emailed too
              recently. The send report lists each of those separately.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
