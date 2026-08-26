"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  ShieldAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import {
  useApproveProblem,
  useProblemDetail,
  usePublishProblem,
  useRepublishProblem,
  useRequestProblemChanges,
  useRetireProblem,
  useUnlistProblem,
} from "./api/problem.hooks"
import { ProblemVerificationPanel } from "./problem-verification-panel"
import { relativeTime } from "./problem-queue-view"
import type { ProblemDetail, ProblemTestCase } from "./api/problem.types"

/**
 * ─── PROBLEM REVIEW ──────────────────────────────────────────────────────────
 *
 * docs/CODING_PROBLEMS_MASTER_PLAN.md §5.4.
 *
 * ─── The order of this page is the order of the job ──────────────────────────
 *
 * 1. What the machine already proved, so the reviewer does not redo it.
 * 2. The statement, rendered, large, first — because the single most likely
 *    problem with a community submission is that it is a LeetCode statement pasted verbatim, and
 *    hosting that is a takedown letter with our name on it. No automated check finds it; a person
 *    reading the prose does.
 * 3. The test cases, because "do the hidden cases include the empty input, the single element and
 *    the maximum constraint" is the check that separates a real problem from a toy — and it is the
 *    other thing a machine cannot do.
 * 4. The reference solutions, last, as evidence rather than as the subject.
 *
 * ─── The buttons come from the SERVER ────────────────────────────────────────
 *
 * `availableActions` is computed by the backend's state machine. This screen renders it and does
 * not re-derive it: a console with its own copy of the rules would disagree the first time one
 * changed, and the disagreement would surface as a button that 409s.
 */
export function ProblemReviewView({ problemId }: { problemId: string }) {
  const { data: problem, isLoading, isError } = useProblemDetail(problemId)

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </p>
    )
  }

  if (isError || !problem) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-destructive">That problem could not be loaded.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={PATH_CONSTANTS.ADMIN_PROBLEMS}>Back to the queue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={PATH_CONSTANTS.ADMIN_PROBLEMS}>
          <ArrowLeft className="size-4" /> Queue
        </Link>
      </Button>

      <ProblemHeader problem={problem} />

      <ProblemVerificationPanel
        status={problem.verificationStatus}
        report={problem.verification}
        verifiedAt={problem.verifiedAt}
      />

      <OriginalityPrompt problem={problem} />

      <StatementSection problem={problem} />

      <TestCasesSection cases={problem.testCases} />

      <SolutionsSection problem={problem} />

      {problem.reviewTrail.length > 0 && <ReviewTrail problem={problem} />}

      <DecisionBar problem={problem} />
    </div>
  )
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

function ProblemHeader({ problem }: { problem: ProblemDetail }) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {problem.number != null && (
          <span className="text-lg tabular-nums text-muted-foreground">#{problem.number}</span>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
        {problem.difficulty && <Badge variant="secondary">{problem.difficulty}</Badge>}
        <Badge variant="outline">{problem.status.replace("_", " ")}</Badge>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <div className="flex gap-1.5">
          <dt>Author</dt>
          <dd className="text-foreground">{problem.authorName ?? problem.authorUserId}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Submitted</dt>
          <dd className="text-foreground">{relativeTime(problem.submittedAt)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Slug</dt>
          <dd className="font-mono text-xs text-foreground">/{problem.slug}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Languages</dt>
          <dd className="text-foreground">{problem.languages.join(", ") || "—"}</dd>
        </div>
      </dl>

      {problem.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.topics.map((topic) => (
            <Badge key={topic.topicId} variant="outline" className="font-normal">
              {topic.name}
            </Badge>
          ))}
        </div>
      )}
    </header>
  )
}

/**
 * The one prompt on this screen.
 *
 * Deliberately a standing note rather than a checkbox: a checkbox becomes a thing people click.
 * The point is to put the question in front of somebody's eyes at the moment they are reading the
 * prose, because it is the check the whole gate exists for and the only one with legal weight.
 */
function OriginalityPrompt({ problem }: { problem: ProblemDetail }) {
  if (problem.status !== "IN_REVIEW") return null
  return (
    <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-medium">Read the statement before anything else.</p>
        <p className="mt-1 text-muted-foreground">
          Everything a machine can check has been checked. What is left is whether this is
          <strong className="font-medium text-foreground"> original prose</strong>, whether the
          difficulty is honest, whether the topics are right, and whether the hidden cases cover the
          empty input, the single element and the maximum constraint.
        </p>
      </div>
    </div>
  )
}

/* ── Statement ──────────────────────────────────────────────────────────────── */

function StatementSection({ problem }: { problem: ProblemDetail }) {
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="text-sm font-medium text-muted-foreground">Statement</h2>

      {/*
        The stored HTML, rendered.

        Safe to inject: it was sanitised SERVER-side by ProblemStatementSanitizer before it was
        stored — a tighter safelist than the blog's, with iframes, inline styles, ids and foreign
        images all removed. Rendering the raw author input here instead would put an XSS on the one
        screen an administrator opens.
      */}
      <div
        className="prose prose-sm max-w-none prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-headings:text-foreground prose-code:text-foreground prose-a:text-primary-500"
        dangerouslySetInnerHTML={{ __html: problem.statementHtml }}
      />

      {problem.constraintsHtml && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Constraints
          </h3>
          <div
            className="prose prose-sm max-w-none prose-p:text-foreground prose-li:text-foreground prose-code:text-foreground"
            dangerouslySetInnerHTML={{ __html: problem.constraintsHtml }}
          />
        </div>
      )}

      {(problem.expectedTimeComplexity || problem.expectedSpaceComplexity) && (
        <p className="text-xs text-muted-foreground">
          Author&rsquo;s intended complexity:{" "}
          <span className="font-mono text-foreground">
            {problem.expectedTimeComplexity ?? "—"} time, {problem.expectedSpaceComplexity ?? "—"}{" "}
            space
          </span>
        </p>
      )}

      {problem.hints.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Lightbulb className="size-3" /> {problem.hints.length} hint
            {problem.hints.length === 1 ? "" : "s"}
          </h3>
          {problem.hints.map((hint, index) => (
            <div key={index} className="flex gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">{index + 1}.</span>
              <div
                className="prose prose-sm max-w-none prose-p:text-foreground prose-p:my-0"
                dangerouslySetInnerHTML={{ __html: hint }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ── Test cases ─────────────────────────────────────────────────────────────── */

function TestCasesSection({ cases }: { cases: ProblemTestCase[] }) {
  const [showHidden, setShowHidden] = useState(false)
  const samples = cases.filter((c) => c.kind === "SAMPLE")
  const hidden = cases.filter((c) => c.kind === "HIDDEN")

  return (
    <section className="rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Test cases
          <span className="ml-2 font-normal">
            {samples.length} sample · {hidden.length} hidden
          </span>
        </h2>
        {hidden.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowHidden((v) => !v)}>
            {showHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showHidden ? "Hide" : "Show"} hidden cases
          </Button>
        )}
      </header>

      <div className="divide-y">
        {samples.map((testCase) => (
          <TestCaseRow key={testCase.testCaseId} testCase={testCase} />
        ))}
        {showHidden &&
          hidden.map((testCase) => <TestCaseRow key={testCase.testCaseId} testCase={testCase} />)}
      </div>

      {!showHidden && hidden.length > 0 && (
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">
          The hidden cases are what decide whether a solution is really correct. Worth opening:
          check they cover the empty input, a single element, duplicates and the largest constraint.
        </p>
      )}
    </section>
  )
}

function TestCaseRow({ testCase }: { testCase: ProblemTestCase }) {
  return (
    <div className="grid gap-2 px-5 py-3 sm:grid-cols-[auto_1fr_1fr] sm:items-baseline sm:gap-4">
      <Badge
        variant={testCase.kind === "SAMPLE" ? "secondary" : "outline"}
        className="w-fit font-normal"
      >
        {testCase.kind === "SAMPLE"
          ? `Example ${testCase.position + 1}`
          : `#${testCase.position + 1}`}
      </Badge>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Input</p>
        <code className="block truncate font-mono text-xs">{testCase.input}</code>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Expected</p>
        <code className="block truncate font-mono text-xs">{testCase.expected}</code>
      </div>
    </div>
  )
}

/* ── Solutions ──────────────────────────────────────────────────────────────── */

/**
 * The reference solutions.
 *
 * Last on the page and collapsed by default: the gate has already proved they work, so a reviewer
 * reads them to judge whether the intended approach is sensible for the stated difficulty — not to
 * check correctness. Putting them higher invites the wrong job.
 */
function SolutionsSection({ problem }: { problem: ProblemDetail }) {
  const languages = Object.keys(problem.solutions)
  const [active, setActive] = useState(languages[0] ?? "")
  const [open, setOpen] = useState(false)

  if (languages.length === 0) {
    return (
      <section className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        No reference solution. This problem cannot pass the checks without one.
      </section>
    )
  }

  return (
    <section className="rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Reference solutions
          <span className="ml-2 font-normal">— the answers, for {languages.join(", ")}</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </Button>
      </header>

      {open && (
        <>
          {languages.length > 1 && (
            <div className="flex gap-1 border-b px-5 py-2">
              {languages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setActive(language)}
                  className={cn(
                    "rounded px-2 py-1 text-xs transition-colors",
                    active === language
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {language}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                void navigator.clipboard?.writeText(problem.solutions[active] ?? "")
              }}
            >
              <Copy className="size-3.5" />
            </Button>
            <pre className="overflow-x-auto p-5 text-xs">
              <code>{problem.solutions[active]}</code>
            </pre>
          </div>
        </>
      )}
    </section>
  )
}

/* ── Trail ──────────────────────────────────────────────────────────────────── */

function ReviewTrail({ problem }: { problem: ProblemDetail }) {
  return (
    <section className="rounded-lg border p-5">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">History</h2>
      <ol className="space-y-3">
        {problem.reviewTrail.map((entry) => (
          <li key={entry.reviewId} className="flex gap-3 text-sm">
            <span className="w-32 shrink-0 text-xs text-muted-foreground">
              {relativeTime(entry.createdAt)}
            </span>
            <div className="min-w-0">
              <p>
                <span className="font-medium">{entry.action.replace(/_/g, " ").toLowerCase()}</span>
                <span className="text-muted-foreground">
                  {" "}
                  by {entry.actorName ?? entry.actorUserId}
                </span>
              </p>
              {entry.note && <p className="mt-0.5 text-muted-foreground">{entry.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ── Decision ───────────────────────────────────────────────────────────────── */

function DecisionBar({ problem }: { problem: ProblemDetail }) {
  const [note, setNote] = useState("")
  // ⚠ The note is COLLAPSED by default, and that is the fix for a real fault.
  //
  // This bar is sticky so a reviewer can act without scrolling back through a long statement. With
  // the textarea always open it stood ~270px tall and permanently covered a third of the viewport
  // — including the statement, which is the one thing this page exists to have somebody read
  // closely. Collapsed it is one row, and "Request changes" opens it because that is the path
  // where a note is required anyway.
  const [noteOpen, setNoteOpen] = useState(false)
  // ⚠ Declared with the other hooks, ABOVE the early return below. A hook after a
  // conditional return runs in a different order on the render where that return fires,
  // which is the one rule React cannot recover from.
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const actions = problem.availableActions

  const approve = useApproveProblem()
  const requestChanges = useRequestProblemChanges({
    onSuccess: () => {
      setNote("")
      setNoteOpen(false)
    },
  })
  const publish = usePublishProblem()
  const unlist = useUnlistProblem()
  const retire = useRetireProblem()
  const republish = useRepublishProblem()

  const busy =
    approve.isPending ||
    requestChanges.isPending ||
    publish.isPending ||
    unlist.isPending ||
    retire.isPending ||
    republish.isPending

  const canDecide = actions.includes("APPROVE") || actions.includes("REQUEST_CHANGES")
  const trimmed = note.trim()

  if (actions.length === 0) return null

  /**
   * One press, two jobs.
   *
   * Without a note this opens the field and focuses it instead of submitting — a disabled button
   * with no explanation makes somebody guess why. With one, it sends.
   */
  function onRequestChanges() {
    if (!trimmed) {
      setNoteOpen(true)
      requestAnimationFrame(() => noteRef.current?.focus())
      return
    }
    requestChanges.mutate({ problemId: problem.problemId, note: trimmed })
  }

  return (
    <section className="sticky bottom-4 rounded-lg border bg-background/95 shadow-lg backdrop-blur">
      {canDecide && noteOpen && (
        <div className="border-b p-4">
          <label htmlFor="review-note" className="text-sm font-medium">
            Note to the author
          </label>
          <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
            Required to send it back — this note is the only thing they see. Optional on approve.
          </p>
          <Textarea
            id="review-note"
            ref={noteRef}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Add an example with duplicate values, and tighten the constraint on n."
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3">
        {actions.includes("APPROVE") && (
          <Button
            disabled={busy}
            onClick={() =>
              approve.mutate({
                problemId: problem.problemId,
                note: trimmed || undefined,
              })
            }
          >
            {approve.isPending && <Loader2 className="size-4 animate-spin" />}
            Approve and publish
          </Button>
        )}

        {actions.includes("REQUEST_CHANGES") && (
          <Button variant="outline" disabled={busy} onClick={onRequestChanges}>
            {requestChanges.isPending && <Loader2 className="size-4 animate-spin" />}
            Request changes
          </Button>
        )}

        {actions.includes("PUBLISH") && (
          <Button disabled={busy} onClick={() => publish.mutate(problem.problemId)}>
            {publish.isPending && <Loader2 className="size-4 animate-spin" />}
            Publish
          </Button>
        )}

        {actions.includes("UNLIST") && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              unlist.mutate({
                problemId: problem.problemId,
                note: trimmed || undefined,
              })
            }
          >
            Unlist
          </Button>
        )}

        {actions.includes("RETIRE") && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              retire.mutate({
                problemId: problem.problemId,
                note: trimmed || undefined,
              })
            }
          >
            Retire
          </Button>
        )}

        {actions.includes("REPUBLISH") && (
          <Button disabled={busy} onClick={() => republish.mutate(problem.problemId)}>
            Republish
          </Button>
        )}

        {canDecide && !noteOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => {
              setNoteOpen(true)
              requestAnimationFrame(() => noteRef.current?.focus())
            }}
          >
            <MessageSquarePlus className="size-4" />
            {trimmed ? "Edit note" : "Add a note"}
          </Button>
        )}
      </div>

      {problem.status === "IN_REVIEW" && problem.verificationStatus !== "PASSED" && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Approving is unavailable until the automated checks pass. Sending it back with a note is
          the right move.
        </p>
      )}
    </section>
  )
}
