/**
 * ─── MOCK FEEDBACK VIEW ──────────────────────────────────────────────────────
 *
 * Read-only view of mentor feedback for a completed mock interview session.
 * Shows scores as visual progress bars, section feedback, strengths/weaknesses,
 * role fit evaluation, benchmarking, and mentor notes.
 */

"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Rocket,
  Sparkles,
  Star,
  Tag,
  Target,
  Trophy,
  Zap,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

import { useMockFeedback, useMockBookingDetail } from "./api/mock-interview.hooks"
import { QUICK_TAG_OPTIONS, CANDIDATE_LEVEL_OPTIONS, type SectionFeedbackDto } from "./api/mock-interview.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { cn } from "@/lib/utils"

// ─── Score Helpers ────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<string, { label: string; icon: string }> = {
  scoreCommunication: { label: "Communication Skills", icon: "💬" },
  scoreConfidence: { label: "Confidence Level", icon: "💪" },
  scoreTechnicalAccuracy: { label: "Technical Accuracy", icon: "🎯" },
  scoreProblemSolving: { label: "Problem Solving", icon: "🧩" },
  scoreClarityOfThought: { label: "Clarity of Thought", icon: "💡" },
  scoreBodyLanguage: { label: "Body Language & Presence", icon: "🎭" },
  scoreTimeManagement: { label: "Time Management", icon: "⏱️" },
  scoreQuestionUnderstanding: { label: "Understanding of Questions", icon: "👂" },
}

function getScoreColor(score: number): string {
  if (score <= 3) return "text-red-400"
  if (score <= 5) return "text-orange-400"
  if (score <= 7) return "text-yellow-400"
  if (score <= 9) return "text-green-400"
  return "text-emerald-400"
}

function getProgressColor(score: number): string {
  if (score <= 3) return "[&>[data-slot=progress-indicator]]:bg-red-500"
  if (score <= 5) return "[&>[data-slot=progress-indicator]]:bg-orange-500"
  if (score <= 7) return "[&>[data-slot=progress-indicator]]:bg-yellow-500"
  if (score <= 9) return "[&>[data-slot=progress-indicator]]:bg-green-500"
  return "[&>[data-slot=progress-indicator]]:bg-emerald-500"
}

function getScoreLabel(score: number): string {
  if (score <= 2) return "Needs Work"
  if (score <= 4) return "Below Average"
  if (score <= 6) return "Average"
  if (score <= 8) return "Good"
  if (score <= 9) return "Excellent"
  return "Outstanding"
}

// ─── Score Bar Component ──────────────────────────────────────────────────────

function ScoreBar({ icon, label, score }: { icon: string; label: string; score: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg w-7">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
            <span className={cn("text-sm font-bold tabular-nums", getScoreColor(score))}>
              {score}/10
            </span>
          </div>
        </div>
        <Progress value={score * 10} className={cn("h-2", getProgressColor(score))} />
      </div>
    </div>
  )
}

// ─── Section Display ──────────────────────────────────────────────────────────

function SectionDisplay({
  title,
  colorDot,
  section,
}: {
  title: string
  colorDot: string
  section: SectionFeedbackDto | null
}) {
  const highlights = section?.highlights ?? []
  if (!section || (!section.feedback && !section.rating && highlights.length === 0)) return null

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", colorDot)} />
        <h4 className="font-medium text-sm">{title}</h4>
        {section.rating && (
          <Badge variant="secondary" className="text-xs ml-auto">
            {section.rating}/10
          </Badge>
        )}
      </div>
      {section.feedback && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.feedback}</p>
      )}
      {highlights.length > 0 && (
        <div className="space-y-1">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MockFeedbackViewProps {
  bookingId: string
  backPath?: string
  backLabel?: string
}

export default function MockFeedbackView({
  bookingId,
  backPath = PATH_CONSTANTS.MOCK_INTERVIEW_MY_BOOKINGS,
  backLabel = "My Bookings",
}: MockFeedbackViewProps) {
  const { data: feedback, isLoading, isError } = useMockFeedback(bookingId)
  const { data: booking } = useMockBookingDetail(bookingId)

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !feedback) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link>
        </Button>
        <Alert>
          <AlertTitle>No Feedback Yet</AlertTitle>
          <AlertDescription>
            Feedback has not been submitted for this booking yet. Please check back later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const scores = [
    { key: "scoreCommunication", score: feedback.scoreCommunication },
    { key: "scoreConfidence", score: feedback.scoreConfidence },
    { key: "scoreTechnicalAccuracy", score: feedback.scoreTechnicalAccuracy },
    { key: "scoreProblemSolving", score: feedback.scoreProblemSolving },
    { key: "scoreClarityOfThought", score: feedback.scoreClarityOfThought },
    { key: "scoreBodyLanguage", score: feedback.scoreBodyLanguage },
    { key: "scoreTimeManagement", score: feedback.scoreTimeManagement },
    { key: "scoreQuestionUnderstanding", score: feedback.scoreQuestionUnderstanding },
  ]

  const averageScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length * 10
  ) / 10

  const strengths = feedback.strengths ?? []
  const improvements = feedback.improvements ?? []
  const actionPlan = feedback.actionPlan ?? []
  const recommendedRoles = feedback.recommendedRoles ?? []
  const quickTags = feedback.quickTags ?? []

  const quickTagLabels = quickTags
    .map((t) => QUICK_TAG_OPTIONS.find((opt) => opt.value === t))
    .filter(Boolean)

  const currentLevelLabel = feedback.currentLevel
    ? CANDIDATE_LEVEL_OPTIONS.find((o) => o.value === feedback.currentLevel)?.label ?? feedback.currentLevel
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Interview Feedback Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {booking && (
              <>For <strong>{feedback.userName}</strong> by <strong>{feedback.mentorName}</strong> — </>
            )}
            <code className="text-xs">{feedback.bookingId}</code>
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <CheckCircle2 className="size-3" />
          Submitted {new Date(feedback.submittedAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </Badge>
      </div>

      {/* Quick Tags */}
      {quickTagLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickTagLabels.map((tag) => tag && (
            <span
              key={tag.value}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium",
                tag.color,
              )}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Overall Rating Hero ─────────────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={cn(
              "flex items-center justify-center size-24 rounded-2xl border-2 font-bold text-4xl shrink-0",
              getScoreColor(feedback.overallRating),
              feedback.overallRating >= 8 ? "border-green-500/50 bg-green-500/10" :
              feedback.overallRating >= 5 ? "border-yellow-500/50 bg-yellow-500/10" :
              "border-red-500/50 bg-red-500/10"
            )}>
              {feedback.overallRating}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Star className="size-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-semibold">Overall Rating</span>
                <span className="text-muted-foreground">/ 10</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 1. Performance Scores ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Performance Scores
          </CardTitle>
          <CardDescription>
            Average: <strong className={getScoreColor(averageScore)}>{averageScore}</strong> / 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {scores.map(({ key, score }) => {
              const meta = SCORE_LABELS[key]
              return meta ? (
                <ScoreBar key={key} icon={meta.icon} label={meta.label} score={score} />
              ) : null
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Section-wise Feedback ────────────────────────────────────── */}
      {(feedback.sectionIntroduction || feedback.sectionTechnical || feedback.sectionBehavioral || feedback.sectionClosing) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Section-wise Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SectionDisplay title="Introduction Round" colorDot="bg-green-400" section={feedback.sectionIntroduction} />
            <SectionDisplay title="Technical Round" colorDot="bg-yellow-400" section={feedback.sectionTechnical} />
            <SectionDisplay title="Behavioral Round" colorDot="bg-blue-400" section={feedback.sectionBehavioral} />
            <SectionDisplay title="Closing Round" colorDot="bg-red-400" section={feedback.sectionClosing} />
          </CardContent>
        </Card>
      )}

      {/* ── 3. Strengths & Improvements ─────────────────────────────────── */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {strengths.length > 0 && (
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-400">
                  <Trophy className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {improvements.length > 0 && (
            <Card className="border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-orange-400">
                  <Target className="h-4 w-4" />
                  Areas of Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-400 shrink-0 mt-0.5">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── 4. Actionable Improvement Plan ──────────────────────────────── */}
      {actionPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4" />
              Actionable Improvement Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {actionPlan.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center size-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ── 5. Role Fit Evaluation ──────────────────────────────────────── */}
      {(feedback.currentLevel || feedback.hireabilityScore != null || recommendedRoles.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" />
              Role Fit Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {currentLevelLabel && (
                <div className="text-center p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">Current Level</p>
                  <p className="text-lg font-bold">{currentLevelLabel}</p>
                </div>
              )}
              {feedback.hireabilityScore != null && (
                <div className="text-center p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">Hireability Score</p>
                  <p className={cn("text-3xl font-bold", getScoreColor(feedback.hireabilityScore / 10))}>
                    {feedback.hireabilityScore}%
                  </p>
                </div>
              )}
              {recommendedRoles.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-1">
                  <p className="text-xs text-muted-foreground mb-2">Recommended Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendedRoles.map((role, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 6. Benchmarking ─────────────────────────────────────────────── */}
      {(feedback.benchmarkingPercentile != null || feedback.benchmarkingSummary) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Benchmarking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.benchmarkingPercentile != null && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{feedback.benchmarkingPercentile}%</p>
                  <p className="text-xs text-muted-foreground">Percentile</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <p className="text-sm text-muted-foreground">
                  You performed better than <strong className="text-foreground">{feedback.benchmarkingPercentile}%</strong> of candidates interviewed by this mentor.
                </p>
              </div>
            )}
            {feedback.benchmarkingSummary && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.benchmarkingSummary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 7. Session Highlights ───────────────────────────────────────── */}
      {(feedback.bestMoment || feedback.weakestMoment) && (
        <div className="grid gap-6 md:grid-cols-2">
          {feedback.bestMoment && (
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-400">
                  <Zap className="h-4 w-4" />
                  Best Moment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.bestMoment}</p>
              </CardContent>
            </Card>
          )}
          {feedback.weakestMoment && (
            <Card className="border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-orange-400">
                  <Target className="h-4 w-4" />
                  Weakest Moment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.weakestMoment}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── 8. Mentor Notes ─────────────────────────────────────────────── */}
      {feedback.mentorNotesHtml && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-4 w-4" />
              Mentor Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-muted-foreground/30"
              dangerouslySetInnerHTML={{ __html: feedback.mentorNotesHtml }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}


