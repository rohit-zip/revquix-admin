/**
 * ─── MOCK FEEDBACK FORM VIEW ─────────────────────────────────────────────────
 *
 * Multi-section form for professional mentors to submit detailed
 * feedback after a completed mock interview session.
 */

"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  MessageSquareText,
  Minus,
  Plus,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { useMockBookingDetail, useSubmitMockFeedback } from "./api/mock-interview.hooks"
import {
  QUICK_TAG_OPTIONS,
  CANDIDATE_LEVEL_OPTIONS,
  type MockInterviewFeedbackRequest,
  type SectionFeedback,
} from "./api/mock-interview.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { cn } from "@/lib/utils"

// ─── Score Config ─────────────────────────────────────────────────────────────

const SCORE_FIELDS = [
  { key: "scoreCommunication", label: "Communication Skills", icon: "💬", description: "Clarity, articulation, structure" },
  { key: "scoreConfidence", label: "Confidence Level", icon: "💪", description: "Composure, assertiveness, poise" },
  { key: "scoreTechnicalAccuracy", label: "Technical Accuracy", icon: "🎯", description: "Correctness, depth of knowledge" },
  { key: "scoreProblemSolving", label: "Problem Solving", icon: "🧩", description: "Approach, logic, optimization" },
  { key: "scoreClarityOfThought", label: "Clarity of Thought", icon: "💡", description: "Structured thinking, coherence" },
  { key: "scoreBodyLanguage", label: "Body Language & Presence", icon: "🎭", description: "Eye contact, gestures, energy" },
  { key: "scoreTimeManagement", label: "Time Management", icon: "⏱️", description: "Pacing, prioritization" },
  { key: "scoreQuestionUnderstanding", label: "Understanding of Questions", icon: "👂", description: "Comprehension, clarification" },
] as const

function getScoreColor(score: number): string {
  if (score <= 3) return "text-red-400"
  if (score <= 5) return "text-orange-400"
  if (score <= 7) return "text-yellow-400"
  if (score <= 9) return "text-green-400"
  return "text-emerald-400"
}

function getScoreBarColor(score: number): string {
  if (score <= 3) return "bg-red-500"
  if (score <= 5) return "bg-orange-500"
  if (score <= 7) return "bg-yellow-500"
  if (score <= 9) return "bg-green-500"
  return "bg-emerald-500"
}

// ─── Dynamic List Field ───────────────────────────────────────────────────────

function DynamicListField({
  items,
  onUpdate,
  placeholder,
  maxItems = 10,
  addLabel = "Add item",
}: {
  items: string[]
  onUpdate: (items: string[]) => void
  placeholder: string
  maxItems?: number
  addLabel?: string
}) {
  const addItem = () => {
    if (items.length < maxItems) onUpdate([...items, ""])
  }
  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index))
  }
  const updateItem = (index: number, value: string) => {
    const updated = [...items]
    updated[index] = value
    onUpdate(updated)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-5 text-center">{index + 1}.</span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm"
          />
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeItem(index)}>
            <Minus className="size-3.5" />
          </Button>
        </div>
      ))}
      {items.length < maxItems && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addItem}>
          <Plus className="size-3" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}

// ─── Section Feedback Card ────────────────────────────────────────────────────

function SectionFeedbackCard({
  title,
  icon,
  color,
  section,
  onUpdate,
}: {
  title: string
  icon: React.ReactNode
  color: string
  section: SectionFeedback
  onUpdate: (s: SectionFeedback) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("rounded-lg border overflow-hidden", color)}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
          {section.rating && (
            <Badge variant="secondary" className="text-xs ml-2">{section.rating}/10</Badge>
          )}
        </div>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          <div>
            <Label className="text-xs text-muted-foreground">Rating (1–10)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider
                value={[section.rating || 5]}
                onValueChange={([v]) => onUpdate({ ...section, rating: v })}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className={cn("text-lg font-bold w-8 text-center", getScoreColor(section.rating || 5))}>
                {section.rating || 5}
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Detailed Feedback</Label>
            <Textarea
              value={section.feedback || ""}
              onChange={(e) => onUpdate({ ...section, feedback: e.target.value })}
              placeholder={`Provide detailed feedback for ${title.toLowerCase()}…`}
              rows={3}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Key Highlights</Label>
            <DynamicListField
              items={section.highlights || []}
              onUpdate={(highlights) => onUpdate({ ...section, highlights })}
              placeholder="Add a highlight…"
              maxItems={5}
              addLabel="Add highlight"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Score Slider Row ─────────────────────────────────────────────────────────

function ScoreSliderRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: string
  label: string
  description: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className={cn("text-xl font-bold tabular-nums min-w-10 text-right", getScoreColor(value))}>
          {value}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
            <div
              className={cn("h-full rounded-full transition-all duration-300", getScoreBarColor(value))}
              style={{ width: `${(value / 10) * 100}%` }}
            />
          </div>
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={1}
            max={10}
            step={1}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MockFeedbackFormViewProps {
  bookingId: string
  backPath?: string
  backLabel?: string
}

export default function MockFeedbackFormView({
  bookingId,
  backPath = PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS,
  backLabel = "Bookings",
}: MockFeedbackFormViewProps) {
  const router = useRouter()
  const { data: booking, isLoading } = useMockBookingDetail(bookingId)
  const submitMutation = useSubmitMockFeedback(() => {
    router.push(`${PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS}/${bookingId}`)
  })

  // ── Form State ──────────────────────────────────────────────────────────

  const [scores, setScores] = useState<Record<string, number>>({
    scoreCommunication: 5,
    scoreConfidence: 5,
    scoreTechnicalAccuracy: 5,
    scoreProblemSolving: 5,
    scoreClarityOfThought: 5,
    scoreBodyLanguage: 5,
    scoreTimeManagement: 5,
    scoreQuestionUnderstanding: 5,
  })

  const [sectionIntroduction, setSectionIntroduction] = useState<SectionFeedback>({})
  const [sectionTechnical, setSectionTechnical] = useState<SectionFeedback>({})
  const [sectionBehavioral, setSectionBehavioral] = useState<SectionFeedback>({})
  const [sectionClosing, setSectionClosing] = useState<SectionFeedback>({})

  const [strengths, setStrengths] = useState<string[]>([""])
  const [improvements, setImprovements] = useState<string[]>([""])
  const [actionPlan, setActionPlan] = useState<string[]>([""])

  const [currentLevel, setCurrentLevel] = useState<string>("")
  const [recommendedRoles, setRecommendedRoles] = useState<string[]>([])
  const [hireabilityScore, setHireabilityScore] = useState(50)
  const [roleInput, setRoleInput] = useState("")

  const [benchmarkingPercentile, setBenchmarkingPercentile] = useState(50)
  const [benchmarkingSummary, setBenchmarkingSummary] = useState("")

  const [bestMoment, setBestMoment] = useState("")
  const [weakestMoment, setWeakestMoment] = useState("")

  const [mentorNotesHtml, setMentorNotesHtml] = useState("")

  const [quickTags, setQuickTags] = useState<string[]>([])

  const [overallRating, setOverallRating] = useState(5)
  const [summary, setSummary] = useState("")

  // ── Handlers ────────────────────────────────────────────────────────────

  const updateScore = useCallback((key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleQuickTag = useCallback((tag: string) => {
    setQuickTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    )
  }, [])

  const addRecommendedRole = useCallback(() => {
    if (roleInput.trim() && recommendedRoles.length < 10) {
      setRecommendedRoles((prev) => [...prev, roleInput.trim()])
      setRoleInput("")
    }
  }, [roleInput, recommendedRoles.length])

  const removeRecommendedRole = useCallback((index: number) => {
    setRecommendedRoles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── Computed ────────────────────────────────────────────────────────────

  const averageScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length * 10
  ) / 10

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!summary.trim()) {
      toast.error("Please provide an overall summary before submitting.")
      return
    }

    const cleanList = (items: string[]) => items.filter((s) => s.trim().length > 0)
    const cleanSection = (s: SectionFeedback): SectionFeedback | undefined => {
      if (!s.feedback && !s.rating && (!s.highlights || s.highlights.length === 0)) return undefined
      return {
        ...s,
        highlights: s.highlights?.filter((h) => h.trim().length > 0),
      }
    }

    const data: MockInterviewFeedbackRequest = {
      ...scores as Pick<MockInterviewFeedbackRequest,
        "scoreCommunication" | "scoreConfidence" | "scoreTechnicalAccuracy" | "scoreProblemSolving" |
        "scoreClarityOfThought" | "scoreBodyLanguage" | "scoreTimeManagement" | "scoreQuestionUnderstanding">,
      sectionIntroduction: cleanSection(sectionIntroduction),
      sectionTechnical: cleanSection(sectionTechnical),
      sectionBehavioral: cleanSection(sectionBehavioral),
      sectionClosing: cleanSection(sectionClosing),
      strengths: cleanList(strengths).length > 0 ? cleanList(strengths) : undefined,
      improvements: cleanList(improvements).length > 0 ? cleanList(improvements) : undefined,
      actionPlan: cleanList(actionPlan).length > 0 ? cleanList(actionPlan) : undefined,
      currentLevel: currentLevel || undefined,
      recommendedRoles: recommendedRoles.length > 0 ? recommendedRoles : undefined,
      hireabilityScore,
      benchmarkingPercentile,
      benchmarkingSummary: benchmarkingSummary || undefined,
      bestMoment: bestMoment || undefined,
      weakestMoment: weakestMoment || undefined,
      mentorNotesHtml: mentorNotesHtml || undefined,
      quickTags: quickTags.length > 0 ? quickTags : undefined,
      overallRating,
      summary: summary.trim(),
    }

    submitMutation.mutate({ bookingId, data })
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!booking) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Booking Not Found</AlertTitle>
        <AlertDescription>Unable to load the booking. Please go back and try again.</AlertDescription>
      </Alert>
    )
  }

  if (booking.status !== "COMPLETED") {
    return (
      <Alert>
        <AlertTitle>Session Not Completed</AlertTitle>
        <AlertDescription>Feedback can only be submitted after the mock interview session is completed.</AlertDescription>
      </Alert>
    )
  }

  if (booking.feedbackSubmitted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link>
        </Button>
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Feedback Already Submitted</AlertTitle>
          <AlertDescription>
            You have already submitted feedback for this booking.{" "}
            <Link href={`${PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS}/${bookingId}`} className="underline text-blue-400">
              View feedback →
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Submit Interview Feedback
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          For <strong>{booking.userName}</strong> — Booking <code className="text-xs">{booking.bookingId}</code>
        </p>
      </div>

      {/* ── 1. Quantitative Scores ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Performance Scores
          </CardTitle>
          <CardDescription>
            Rate the candidate on each dimension from 1 (poor) to 10 (exceptional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Average Score Highlight */}
          <div className="flex items-center justify-center gap-3 mb-6 py-4 rounded-lg bg-muted/50 border">
            <Star className="size-5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-muted-foreground">Average Score</span>
            <span className={cn("text-3xl font-bold", getScoreColor(averageScore))}>
              {averageScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>

          <div className="divide-y divide-border">
            {SCORE_FIELDS.map((field) => (
              <ScoreSliderRow
                key={field.key}
                icon={field.icon}
                label={field.label}
                description={field.description}
                value={scores[field.key]}
                onChange={(v) => updateScore(field.key, v)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Section-wise Feedback ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Section-wise Feedback
          </CardTitle>
          <CardDescription>
            Click each section to expand and provide detailed round-by-round feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <SectionFeedbackCard
            title="🟢 Introduction Round"
            icon={<span className="text-green-400">●</span>}
            color="border-green-500/20"
            section={sectionIntroduction}
            onUpdate={setSectionIntroduction}
          />
          <SectionFeedbackCard
            title="🟡 Technical Round"
            icon={<span className="text-yellow-400">●</span>}
            color="border-yellow-500/20"
            section={sectionTechnical}
            onUpdate={setSectionTechnical}
          />
          <SectionFeedbackCard
            title="🔵 Behavioral Round"
            icon={<span className="text-blue-400">●</span>}
            color="border-blue-500/20"
            section={sectionBehavioral}
            onUpdate={setSectionBehavioral}
          />
          <SectionFeedbackCard
            title="🔴 Closing Round"
            icon={<span className="text-red-400">●</span>}
            color="border-red-500/20"
            section={sectionClosing}
            onUpdate={setSectionClosing}
          />
        </CardContent>
      </Card>

      {/* ── 3. Strengths & Weaknesses ───────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-400">
              <Trophy className="h-4 w-4" />
              Strengths
            </CardTitle>
            <CardDescription>Bullet points only — max 10</CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicListField
              items={strengths}
              onUpdate={setStrengths}
              placeholder="e.g., Clear and structured communication"
              addLabel="Add strength"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-400">
              <Target className="h-4 w-4" />
              Areas of Improvement
            </CardTitle>
            <CardDescription>Actionable points only — no vague feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicListField
              items={improvements}
              onUpdate={setImprovements}
              placeholder="e.g., Avoid filler words like 'umm', practice structured answers"
              addLabel="Add improvement"
            />
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Actionable Improvement Plan ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4" />
            Actionable Improvement Plan
          </CardTitle>
          <CardDescription>
            Top things the candidate should do immediately to improve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicListField
            items={actionPlan}
            onUpdate={setActionPlan}
            placeholder="e.g., Practice DSA medium-level problems on arrays daily"
            addLabel="Add action item"
          />
        </CardContent>
      </Card>

      {/* ── 5. Role Fit Evaluation ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            Role Fit Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Current Level</Label>
              <Select value={currentLevel} onValueChange={setCurrentLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {CANDIDATE_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hireability Score</Label>
              <div className="flex items-center gap-3 mt-1">
                <Slider
                  value={[hireabilityScore]}
                  onValueChange={([v]) => setHireabilityScore(v)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className={cn("text-lg font-bold w-12 text-right tabular-nums", getScoreColor(hireabilityScore / 10))}>
                  {hireabilityScore}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Recommended Roles</Label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g., Backend Developer, SDE-1"
                className="flex-1 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecommendedRole() } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addRecommendedRole}>Add</Button>
            </div>
            {recommendedRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recommendedRoles.map((role, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => removeRecommendedRole(i)}>
                    {role}
                    <Minus className="size-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Benchmarking ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Benchmarking
          </CardTitle>
          <CardDescription>Compare this candidate against others you&apos;ve interviewed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Percentile (compared to other candidates)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider
                value={[benchmarkingPercentile]}
                onValueChange={([v]) => setBenchmarkingPercentile(v)}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-lg font-bold w-16 text-right tabular-nums">
                Top {100 - benchmarkingPercentile}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Performed better than <strong>{benchmarkingPercentile}%</strong> of candidates
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Benchmarking Summary</Label>
            <Textarea
              value={benchmarkingSummary}
              onChange={(e) => setBenchmarkingSummary(e.target.value)}
              placeholder="e.g., Communication is above average, but technical depth needs significant improvement for SDE-2 roles"
              rows={2}
              className="mt-1 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 7. Session Highlights ───────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-400">
              <Zap className="h-4 w-4" />
              Best Answer Moment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={bestMoment}
              onChange={(e) => setBestMoment(e.target.value)}
              placeholder="Describe the candidate's best moment in the interview…"
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-400">
              <Target className="h-4 w-4" />
              Weakest Answer Moment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={weakestMoment}
              onChange={(e) => setWeakestMoment(e.target.value)}
              placeholder="Describe where the candidate struggled the most…"
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* ── 8. Mentor Notes (TipTap) ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4" />
            Mentor Notes
          </CardTitle>
          <CardDescription>
            Private observations, attitude notes, red flags, or anything else noteworthy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={mentorNotesHtml}
            onChange={setMentorNotesHtml}
            placeholder="Write your detailed notes here — supports rich text formatting…"
          />
        </CardContent>
      </Card>

      {/* ── 9. Quick Tags ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            Quick Tags
          </CardTitle>
          <CardDescription>Select up to 5 tags that best describe this candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAG_OPTIONS.map((tag) => {
              const selected = quickTags.includes(tag.value)
              return (
                <button
                  key={tag.value}
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                    selected
                      ? cn(tag.color, "ring-1 ring-offset-1 ring-offset-background")
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                  onClick={() => toggleQuickTag(tag.value)}
                >
                  {selected && <CheckCircle2 className="size-3" />}
                  {tag.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 10. Overall Summary ─────────────────────────────────────────── */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            Overall Rating & Summary
          </CardTitle>
          <CardDescription>Your final verdict for this interview session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground">Overall Rating (1–10)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[overallRating]}
                onValueChange={([v]) => setOverallRating(v)}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <div className={cn(
                "flex items-center justify-center size-14 rounded-xl border-2 font-bold text-2xl",
                getScoreColor(overallRating),
                overallRating >= 8 ? "border-green-500/50 bg-green-500/10" :
                overallRating >= 5 ? "border-yellow-500/50 bg-yellow-500/10" :
                "border-red-500/50 bg-red-500/10"
              )}>
                {overallRating}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-muted-foreground">
              Summary <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a comprehensive summary of the interview — this is what the candidate will read first…"
              rows={4}
              className="mt-1 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.length}/5000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Submit Button ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" asChild>
          <Link href={`${PATH_CONSTANTS.PROFESSIONAL_MENTOR_BOOKINGS}/${bookingId}`}>Cancel</Link>
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !summary.trim()}
          className="gap-2"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Submitting…</>
          ) : (
            <><CheckCircle2 className="size-4" /> Submit Feedback</>
          )}
        </Button>
      </div>
    </div>
  )
}



