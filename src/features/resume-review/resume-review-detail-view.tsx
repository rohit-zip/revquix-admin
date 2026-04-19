"use client"

import { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  useAdminResumeReviewDetail,
  useAdminResumeReviewReport,
  useAdminResumeReviewUploads,
  useAdminResumeReviewStatusLog,
  useAcceptResumeReview,
  useAdminCancelResumeReview,
  useSubmitResumeReport,
} from "./api/resume-review.hooks"
import type { SubmitResumeReportRequest, ResumeReviewStatusLogResponse, ResumeReviewUploadResponse } from "./api/resume-review.types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, FileText, Download,
} from "lucide-react"

interface Props {
  bookingId: string
}

const STATUS_MAP: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment" },
  PENDING_ACCEPTANCE: { variant: "secondary", label: "Pending Acceptance" },
  IN_PROGRESS: { variant: "default", label: "In Progress" },
  REPORT_SUBMITTED: { variant: "default", label: "Report Ready" },
  COMPLETED: { variant: "outline", label: "Completed" },
  CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled (User)" },
  CANCELLED_BY_ADMIN: { variant: "destructive", label: "Cancelled (Admin)" },
  PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed" },
  EXPIRED: { variant: "outline", label: "Expired" },
}

function getStatusBadge(status: string) {
  const info = STATUS_MAP[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

export default function AdminResumeReviewDetailView({ bookingId }: Props) {
  const router = useRouter()
  const { data: booking, isLoading } = useAdminResumeReviewDetail(bookingId)
  const { data: report } = useAdminResumeReviewReport(bookingId)
  const { data: uploads } = useAdminResumeReviewUploads(bookingId)
  const { data: statusLogs } = useAdminResumeReviewStatusLog(bookingId)

  const acceptMutation = useAcceptResumeReview()
  const cancelMutation = useAdminCancelResumeReview()
  const submitReportMutation = useSubmitResumeReport()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [reportOpen, setReportOpen] = useState(false)

  // Report form state
  const [reportForm, setReportForm] = useState<SubmitResumeReportRequest>({
    overallScore: 70,
    atsCompatibilityScore: 70,
    contentQualityScore: 70,
    formattingScore: 70,
    keywordsScore: 70,
    careerProgressionScore: 70,
    sectionAtsFeedback: "",
    sectionContentFeedback: "",
    sectionFormattingFeedback: "",
    sectionKeywordsFeedback: "",
    sectionCareerFeedback: "",
    sectionSummaryFeedback: "",
    strengths: [],
    improvements: [],
    actionItems: [],
    recommendedChanges: "",
    reviewerNotes: "",
    quickTags: [],
  })
  const [strengthInput, setStrengthInput] = useState("")
  const [improvementInput, setImprovementInput] = useState("")
  const [actionInput, setActionInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!booking) return <div className="text-center p-12 text-muted-foreground">Booking not found</div>

  const canAccept = booking.status === "PENDING_ACCEPTANCE"
  const canSubmitReport = booking.status === "IN_PROGRESS" && !report
  const canCancel = ["PENDING_ACCEPTANCE", "IN_PROGRESS"].includes(booking.status)

  const addToArray = (key: keyof SubmitResumeReportRequest, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return
    const current = (reportForm[key] as string[]) ?? []
    setReportForm({ ...reportForm, [key]: [...current, value.trim()] })
    setter("")
  }

  const removeFromArray = (key: keyof SubmitResumeReportRequest, index: number) => {
    const current = (reportForm[key] as string[]) ?? []
    setReportForm({ ...reportForm, [key]: current.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/resume-reviews")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Resume Review Detail</h1>
          <p className="text-sm text-muted-foreground font-mono">{booking.bookingId}</p>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {canAccept && (
          <Button onClick={() => acceptMutation.mutate(bookingId)} disabled={acceptMutation.isPending}>
            {acceptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Accept & Assign to Me
          </Button>
        )}
        {canSubmitReport && (
          <Button onClick={() => setReportOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Submit Report
          </Button>
        )}
        {canCancel && (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      {/* Booking Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">User</p><p className="font-medium">{booking.userName}</p><p className="text-xs text-muted-foreground">{booking.userEmail}</p></div>
            <div><p className="text-muted-foreground">Plan</p><p className="font-medium">{booking.planName}</p></div>
            <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{formatAmount(booking.finalAmountMinor, booking.currency)}</p></div>
            <div><p className="text-muted-foreground">Booked</p><p className="font-medium">{formatDate(booking.createdAt)}</p></div>
            {booking.reviewerName && <div><p className="text-muted-foreground">Reviewer</p><p className="font-medium">{booking.reviewerName}</p></div>}
            {booking.targetJobRole && <div><p className="text-muted-foreground">Target Role</p><p className="font-medium">{booking.targetJobRole}</p></div>}
            {booking.targetCompany && <div><p className="text-muted-foreground">Target Company</p><p className="font-medium">{booking.targetCompany}</p></div>}
            {booking.experienceLevel && <div><p className="text-muted-foreground">Experience</p><p className="font-medium">{booking.experienceLevel}</p></div>}
            {booking.couponCode && <div><p className="text-muted-foreground">Coupon</p><p className="font-medium">{booking.couponCode}</p></div>}
            {booking.overallScore != null && <div><p className="text-muted-foreground">Score</p><p className="font-medium">{booking.overallScore}/100</p></div>}
            {booking.ratingStars != null && <div><p className="text-muted-foreground">Rating</p><p className="font-medium">{booking.ratingStars}/5 ★</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* Uploads */}
      {uploads?.length ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Uploads ({uploads.length}/{booking.maxUploads})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {uploads.map((u: ResumeReviewUploadResponse) => (
              <div key={u.uploadId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">v{u.versionNumber} — {u.originalFilename ?? "Resume"}</p>
                    <p className="text-xs text-muted-foreground">{u.fileSizeBytes ? `${(u.fileSizeBytes / 1024).toFixed(0)} KB` : ""} · {new Date(u.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {u.downloadUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={u.downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Existing Report */}
      {report && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{report.overallScore}<span className="text-lg text-muted-foreground">/100</span></p>
            </div>
            <div className="space-y-2">
              {[
                { label: "ATS Compatibility", score: report.atsCompatibilityScore },
                { label: "Content Quality", score: report.contentQualityScore },
                { label: "Formatting", score: report.formattingScore },
                { label: "Keywords", score: report.keywordsScore },
                { label: "Career Progression", score: report.careerProgressionScore },
              ].map(({ label, score }) => score != null && (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{score}/100</span></div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
            {report.strengths?.length ? (
              <div className="flex flex-wrap gap-1">
                {report.strengths.map((s, i) => <Badge key={i} variant="outline" className="bg-green-50 text-green-700">{s}</Badge>)}
              </div>
            ) : null}
            {report.actionItems?.length ? (
              <ul className="space-y-1 text-sm">
                {report.actionItems.map((item, i) => <li key={i}><span className="font-bold text-blue-500">{i + 1}.</span> {item}</li>)}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      {statusLogs?.length ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-muted pl-4 space-y-4">
              {statusLogs.map((log: ResumeReviewStatusLogResponse, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.toStatus)}
                    <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                  <p className="text-xs text-muted-foreground">by {log.actorName} ({log.actorType})</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Resume Review</DialogTitle>
            <DialogDescription>This will cancel the review and initiate a refund.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep</Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate({ bookingId, reason: cancelReason || undefined }, { onSuccess: () => setCancelOpen(false) })} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Builder Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Review Report</DialogTitle>
            <DialogDescription>Complete the resume review analysis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Scores */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Scores</h4>
              {[
                { key: "overallScore" as const, label: "Overall Score" },
                { key: "atsCompatibilityScore" as const, label: "ATS Compatibility" },
                { key: "contentQualityScore" as const, label: "Content Quality" },
                { key: "formattingScore" as const, label: "Formatting" },
                { key: "keywordsScore" as const, label: "Keywords" },
                { key: "careerProgressionScore" as const, label: "Career Progression" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-semibold">{(reportForm[key] as number) ?? 0}/100</span>
                  </div>
                  <Slider
                    value={[(reportForm[key] as number) ?? 0]}
                    onValueChange={([v]) => setReportForm({ ...reportForm, [key]: v })}
                    max={100} step={1}
                  />
                </div>
              ))}
            </div>

            {/* Feedback Sections */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Detailed Feedback</h4>
              {[
                { key: "sectionAtsFeedback" as const, label: "ATS Feedback" },
                { key: "sectionContentFeedback" as const, label: "Content Feedback" },
                { key: "sectionFormattingFeedback" as const, label: "Formatting Feedback" },
                { key: "sectionKeywordsFeedback" as const, label: "Keywords Feedback" },
                { key: "sectionCareerFeedback" as const, label: "Career Feedback" },
                { key: "sectionSummaryFeedback" as const, label: "Summary / Executive Feedback" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Textarea
                    value={(reportForm[key] as string) ?? ""}
                    onChange={(e) => setReportForm({ ...reportForm, [key]: e.target.value })}
                    rows={3}
                  />
                </div>
              ))}
            </div>

            {/* Tags: Strengths */}
            <div className="space-y-2">
              <Label className="text-xs">Strengths</Label>
              <div className="flex gap-2">
                <Input value={strengthInput} onChange={(e) => setStrengthInput(e.target.value)} placeholder="Add strength" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToArray("strengths", strengthInput, setStrengthInput) } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => addToArray("strengths", strengthInput, setStrengthInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {reportForm.strengths?.map((s, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 cursor-pointer" onClick={() => removeFromArray("strengths", i)}>
                    {s} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags: Improvements */}
            <div className="space-y-2">
              <Label className="text-xs">Areas for Improvement</Label>
              <div className="flex gap-2">
                <Input value={improvementInput} onChange={(e) => setImprovementInput(e.target.value)} placeholder="Add improvement" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToArray("improvements", improvementInput, setImprovementInput) } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => addToArray("improvements", improvementInput, setImprovementInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {reportForm.improvements?.map((s, i) => (
                  <Badge key={i} variant="outline" className="bg-amber-50 cursor-pointer" onClick={() => removeFromArray("improvements", i)}>
                    {s} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags: Action Items */}
            <div className="space-y-2">
              <Label className="text-xs">Action Items</Label>
              <div className="flex gap-2">
                <Input value={actionInput} onChange={(e) => setActionInput(e.target.value)} placeholder="Add action item" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToArray("actionItems", actionInput, setActionInput) } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => addToArray("actionItems", actionInput, setActionInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {reportForm.actionItems?.map((s, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50 cursor-pointer" onClick={() => removeFromArray("actionItems", i)}>
                    {s} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Tags */}
            <div className="space-y-2">
              <Label className="text-xs">Quick Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToArray("quickTags", tagInput, setTagInput) } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => addToArray("quickTags", tagInput, setTagInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {reportForm.quickTags?.map((s, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray("quickTags", i)}>
                    {s} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommended Changes */}
            <div className="space-y-1">
              <Label className="text-xs">Recommended Changes</Label>
              <Textarea
                value={reportForm.recommendedChanges ?? ""}
                onChange={(e) => setReportForm({ ...reportForm, recommendedChanges: e.target.value })}
                rows={3}
              />
            </div>

            {/* Reviewer Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Reviewer Notes (internal)</Label>
              <Textarea
                value={reportForm.reviewerNotes ?? ""}
                onChange={(e) => setReportForm({ ...reportForm, reviewerNotes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Reviewed Upload */}
            {uploads?.length ? (
              <div className="space-y-1">
                <Label className="text-xs">Reviewed Upload Version</Label>
                <select
                  className="w-full rounded-md border p-2 text-sm"
                  value={reportForm.reviewedUploadId ?? ""}
                  onChange={(e) => setReportForm({ ...reportForm, reviewedUploadId: e.target.value || undefined })}
                >
                  <option value="">Select upload...</option>
                  {uploads.map((u: ResumeReviewUploadResponse) => (
                    <option key={u.uploadId} value={u.uploadId}>v{u.versionNumber} — {u.originalFilename}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              onClick={() => submitReportMutation.mutate(
                { bookingId, data: reportForm },
                { onSuccess: () => setReportOpen(false) },
              )}
              disabled={submitReportMutation.isPending}
            >
              {submitReportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






