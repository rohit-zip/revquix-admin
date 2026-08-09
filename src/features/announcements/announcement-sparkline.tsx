"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"
import type { AnnouncementStatsPoint } from "./api/announcement.types"

/**
 * ─── THE 30-DAY SPARKLINE ────────────────────────────────────────────────────
 *
 * Inline SVG, no charting dependency. The admin console has none, and adding one
 * to draw a single polyline would be ~50kB of JavaScript for something the
 * browser already knows how to do — on a screen an admin opens a few times a
 * week.
 *
 * ─── ⚠ The whole difficulty here is null, not drawing ───────────────────────
 *
 * `impressions` is nullable: a day's figure is the difference between two
 * cumulative snapshots, so the first day of the series — and any day after a
 * night the rollup did not run — has nothing to subtract from. See the V279
 * migration header.
 *
 * A charting library would happily coerce those nulls to zero and draw a clean
 * line straight through them. That line would be a lie in the most damaging
 * possible way: it renders a launch day as a flat zero, on the day the
 * announcement almost certainly performed best, and there is no error, no
 * warning, and nothing about the chart that looks wrong.
 *
 * So this component breaks the path at every gap and marks it. A visible
 * discontinuity is the honest rendering of "we cannot know this".
 */

interface AnnouncementSparklineProps {
  points: AnnouncementStatsPoint[]
  /** Which series to draw. */
  metric: "impressions" | "newSubjects" | "clicks" | "dismissals"
  className?: string
  ariaLabel: string
}

const VIEW_W = 600
const VIEW_H = 120
const PAD_Y = 8

export function AnnouncementSparkline({
  points,
  metric,
  className,
  ariaLabel,
}: AnnouncementSparklineProps) {
  const gradientId = useId()

  if (points.length === 0) {
    return (
      <div
        className={cn(
          "flex h-30 items-center justify-center rounded-lg border border-dashed",
          "text-xs text-muted-foreground",
          className,
        )}
      >
        No data yet — the rollup runs nightly.
      </div>
    )
  }

  const values = points.map((p) => valueOf(p, metric))
  const max = Math.max(1, ...values.filter((v): v is number => v != null))

  // A single point has no line to draw. Placing it mid-canvas rather than at
  // x=0 keeps the dot visible instead of half-clipped by the viewBox edge.
  const stepX = points.length > 1 ? VIEW_W / (points.length - 1) : 0
  const xAt = (index: number) => (points.length > 1 ? index * stepX : VIEW_W / 2)
  const yAt = (value: number) => VIEW_H - PAD_Y - (value / max) * (VIEW_H - PAD_Y * 2)

  // Contiguous runs of measurable days. Each becomes its own path, so the line
  // genuinely breaks at a gap rather than being drawn across it.
  const segments = buildSegments(values)

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        // No fixed width/height: the SVG scales to its container, which is what
        // keeps the chart usable in the console's responsive two-column layout.
        className="h-30 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {/* currentColor throughout, so the caller sets the hue with a text
                class and the chart works in both themes with no palette here. */}
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {segments.map((segment) => {
          const line = segment.map((i) => `${xAt(i)},${yAt(values[i] as number)}`).join(" ")
          return (
            <g key={`seg-${segment[0]}`}>
              {segment.length > 1 ? (
                <>
                  <polygon
                    points={`${xAt(segment[0])},${VIEW_H} ${line} ${xAt(segment[segment.length - 1])},${VIEW_H}`}
                    fill={`url(#${gradientId})`}
                  />
                  <polyline
                    points={line}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : (
                // A one-day run has no polyline. Without this dot the day would
                // simply not be drawn, which reads as "no data" rather than "one
                // measurable day between two gaps".
                <circle
                  cx={xAt(segment[0])}
                  cy={yAt(values[segment[0]] as number)}
                  r={2.5}
                  fill="currentColor"
                />
              )}
            </g>
          )
        })}

        {/* Gap markers. Drawn last so they sit above the fill. */}
        {values.map((value, index) =>
          value == null ? (
            <line
              key={`gap-${points[index].date}`}
              x1={xAt(index)}
              y1={PAD_Y}
              x2={xAt(index)}
              y2={VIEW_H}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.25}
              vectorEffect="non-scaling-stroke"
            />
          ) : null,
        )}
      </svg>

      <figcaption className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatDay(points[0].date)}</span>
        <span>peak {max.toLocaleString()}</span>
        <span>{formatDay(points[points.length - 1].date)}</span>
      </figcaption>
    </figure>
  )
}

function valueOf(point: AnnouncementStatsPoint, metric: AnnouncementSparklineProps["metric"]) {
  switch (metric) {
    case "impressions":
      return point.impressions
    case "newSubjects":
      return point.newSubjects
    case "clicks":
      return point.clicks
    case "dismissals":
      return point.dismissals
  }
}

/**
 * Splits the series into runs of consecutive non-null indices.
 *
 * This is what makes the break real. Filtering the nulls out instead would join
 * the surviving points into one continuous line — visually identical to having
 * no gaps at all, which is exactly the misreading this component exists to
 * prevent.
 */
function buildSegments(values: (number | null)[]): number[][] {
  const segments: number[][] = []
  let current: number[] = []

  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push(i)
    }
  }
  if (current.length) segments.push(current)
  return segments
}

/** `9 Aug`. The axis labels only need enough to orient, not a full date. */
function formatDay(isoDate: string): string {
  // Parsed as a UTC instant because the backend's stat_date is a UTC calendar
  // date. Letting the browser parse `YYYY-MM-DD` as local time would shift the
  // label a day west of Greenwich.
  const date = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date)
}
