"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { useProblemList, useProblemQueueSize } from "./api/problem.hooks"
import type {
  ProblemDifficulty,
  ProblemStatus,
  ProblemSummary,
  VerificationStatus,
} from "./api/problem.types"

/**
 * ─── CODING PROBLEM REVIEW QUEUE ─────────────────────────────────────────────
 *
 * docs/CODING_PROBLEMS_MASTER_PLAN.md §5.4.
 *
 * ─── The queue is OLDEST FIRST, and the list says so ─────────────────────────
 *
 * Not a default. A newest-first queue means somebody who submitted in March is still waiting in
 * June, because there is always something newer at the top — and the author who waits longest is
 * the one most likely never to write another problem. The backend orders it; this screen states
 * it, so nobody "fixes" the sort later.
 *
 * ─── What this screen is NOT ─────────────────────────────────────────────────
 *
 * Not an authoring surface. Problems are written in revquix-web on the Blog editor; this console
 * decides what the platform publishes. There is deliberately no "new problem" button.
 */

const STATUS_TABS: { value: ProblemStatus; label: string }[] = [
  { value: "IN_REVIEW", label: "Waiting" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "UNLISTED", label: "Unlisted" },
  { value: "RETIRED", label: "Retired" },
]

const DIFFICULTY_STYLES: Record<ProblemDifficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HARD: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export function ProblemQueueView() {
  const [status, setStatus] = useState<ProblemStatus>("IN_REVIEW")
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useProblemList(status, page)
  const { data: queue } = useProblemQueueSize()

  const problems = data?.content ?? []

  function selectStatus(next: ProblemStatus) {
    setStatus(next)
    // Page 0, always. Staying on page 3 while switching to a tab with one page shows an empty
    // list that looks like "there is nothing here" rather than "you are past the end".
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coding problems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review what authors submit and decide what the platform publishes.
          </p>
        </div>
        {queue != null && (
          <Badge
            variant={queue.inReview > 0 ? "default" : "outline"}
            className="h-7 gap-1.5 px-3 text-xs"
          >
            <Clock className="size-3" />
            {queue.inReview} waiting
          </Badge>
        )}
      </header>

      <nav className="flex flex-wrap gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => selectStatus(tab.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              status === tab.value
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.value === "IN_REVIEW" && queue != null && queue.inReview > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {queue.inReview}
              </span>
            )}
          </button>
        ))}
      </nav>

      {status === "IN_REVIEW" && problems.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Oldest submission first — the longest wait is at the top.
        </p>
      )}

      {isLoading ? (
        <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : isError ? (
        <p className="py-16 text-sm text-destructive">
          Could not load problems. Try again in a moment.
        </p>
      ) : problems.length === 0 ? (
        <EmptyState status={status} />
      ) : (
        <ul className="divide-y rounded-lg border">
          {problems.map((problem) => (
            <ProblemRow key={problem.problemId} problem={problem} />
          ))}
        </ul>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {data?.totalPages} · {data?.totalElements} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data?.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data?.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProblemRow({ problem }: { problem: ProblemSummary }) {
  return (
    <li>
      <Link
        href={`${PATH_CONSTANTS.ADMIN_PROBLEMS}/${problem.problemId}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {problem.number != null && (
              <span className="text-sm tabular-nums text-muted-foreground">#{problem.number}</span>
            )}
            <span className="truncate font-medium">{problem.title}</span>
            {problem.difficulty && (
              <Badge
                variant="secondary"
                className={cn("border-0", DIFFICULTY_STYLES[problem.difficulty])}
              >
                {problem.difficulty[0] + problem.difficulty.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {problem.topics.length > 0 && <span>{problem.topics.join(" · ")}</span>}
            {problem.languages.length > 0 && <span>{problem.languages.join(", ")}</span>}
            <span>{relativeTime(problem.submittedAt ?? problem.updatedAt)}</span>
          </div>
        </div>

        <VerificationPill status={problem.verification} />
      </Link>
    </li>
  )
}

/**
 * The gate's verdict, on the row.
 *
 * Shown in the LIST and not only on the detail screen because it is what decides whether a
 * problem is worth opening: a FAILED one is going straight back to its author whatever the prose
 * says, and a reviewer should not have to open it to find that out.
 */
function VerificationPill({ status }: { status: VerificationStatus }) {
  if (status === "PASSED") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="size-3" /> Checks passed
      </Badge>
    )
  }
  if (status === "FAILED") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="size-3" /> Checks failed
      </Badge>
    )
  }
  if (status === "VERIFYING") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="size-3 animate-spin" /> Checking
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Not checked
    </Badge>
  )
}

function EmptyState({ status }: { status: ProblemStatus }) {
  const copy: Record<ProblemStatus, string> = {
    IN_REVIEW: "Nothing waiting. Authors will appear here when they submit.",
    PUBLISHED: "No problems are live yet.",
    DRAFT: "No drafts. Drafts belong to their authors until they submit them.",
    UNLISTED: "Nothing unlisted.",
    RETIRED: "Nothing retired.",
  }
  return (
    <div className="rounded-lg border border-dashed py-16 text-center">
      <p className="text-sm text-muted-foreground">{copy[status]}</p>
    </div>
  )
}

/**
 * "3 days ago", from an ISO instant.
 *
 * Hand-rolled rather than pulling in a formatting library for one string. The queue's whole point
 * is how long somebody has been waiting, so this is the number the screen exists to show.
 */
export function relativeTime(iso: string | null): string {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
