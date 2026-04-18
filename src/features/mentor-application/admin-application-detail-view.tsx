/**
 * ─── ADMIN APPLICATION DETAIL VIEW ──────────────────────────────────────────
 *
 * Full-detail view for a single mentor application.
 * Route: /admin/mentor-applications/[applicationId]
 */

"use client"

import React, { useState } from "react"
import { useRouter } from 'nextjs-toploader/app';
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Layers,
  Loader2,
  Mail,
  RotateCcw,
  Tag,
  User,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { applicationKeys } from "./api/mentor-application.hooks"
import { getApplicationById } from "./api/mentor-application.api"
import { getAllCategoriesWithSkills } from "@/features/user/api/category.api"
import {
  useApproveApplication,
  usePermanentlyRejectApplication,
  useRejectApplication,
  useRevokeMentor,
} from "./api/mentor-application.hooks"
import type { MentorApplicationStatus } from "./api/mentor-application.types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MentorApplicationStatus }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary" className="text-sm px-3 py-1"><Clock className="mr-1.5 h-3.5 w-3.5" />Pending Review</Badge>
    case "APPROVED":
      return <Badge className="bg-green-600 text-sm px-3 py-1"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Approved</Badge>
    case "REJECTED":
      return <Badge variant="destructive" className="text-sm px-3 py-1"><XCircle className="mr-1.5 h-3.5 w-3.5" />Rejected</Badge>
    case "PERMANENTLY_REJECTED":
      return <Badge variant="destructive" className="text-sm px-3 py-1"><Ban className="mr-1.5 h-3.5 w-3.5" />Permanently Rejected</Badge>
    case "WITHDRAWN":
      return <Badge variant="outline" className="text-sm px-3 py-1">Withdrawn</Badge>
    default:
      return <Badge variant="outline" className="text-sm px-3 py-1">{status}</Badge>
  }
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string | number | null
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {children ?? (
          <p className="mt-0.5 text-sm text-foreground wrap-break-word">
            {value ?? <span className="text-muted-foreground italic">Not provided</span>}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminApplicationDetailView({
  applicationId,
}: {
  applicationId: string
}) {
  const router = useRouter()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [permRejectDialogOpen, setPermRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // ── Fetch application ──────────────────────────────────────────────────────
  const {
    data: app,
    isLoading,
    isError,
  } = useQuery({
    queryKey: applicationKeys.detail(applicationId),
    queryFn: () => getApplicationById(applicationId),
    enabled: !!applicationId,
  })

  // ── Fetch categories + skills catalogue for label resolution ───────────────
  const { data: catalogue = [] } = useQuery({
    queryKey: ["categories-with-skills"],
    queryFn: getAllCategoriesWithSkills,
    staleTime: 1000 * 60 * 10,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const approveMutation = useApproveApplication(() =>
    router.push(PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS)
  )
  const rejectMutation = useRejectApplication(() => {
    setRejectDialogOpen(false)
    setRejectionReason("")
    router.push(PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS)
  })
  const permRejectMutation = usePermanentlyRejectApplication(() => {
    setPermRejectDialogOpen(false)
    setRejectionReason("")
    router.push(PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS)
  })
  const revokeMutation = useRevokeMentor(() =>
    router.push(PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS)
  )

  // ── Resolve category & skill names ─────────────────────────────────────────
  function getCategoryName(id: string): string {
    return catalogue.find((c) => c.categoryId === id)?.name ?? id
  }

  function getSkillName(id: string): string {
    for (const cat of catalogue) {
      const skill = cat.skills.find((s) => s.skillId === id)
      if (skill) return skill.name
    }
    return id
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (isError || !app) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Application not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const handleReject = () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) return
    rejectMutation.mutate({ id: app.applicationId, data: { reason: rejectionReason } })
  }

  const handlePermReject = () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) return
    permRejectMutation.mutate({ id: app.applicationId, data: { reason: rejectionReason } })
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{app.userName}</h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-muted-foreground">{app.userEmail}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Attempt #{app.attemptNumber} · Applied {formatDate(app.createdAt)}
          </p>
        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {app.status === "PENDING" && (
            <>
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                onClick={() => approveMutation.mutate(app.applicationId)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={() => {
                  setRejectionReason("")
                  setRejectDialogOpen(true)
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setRejectionReason("")
                  setPermRejectDialogOpen(true)
                }}
              >
                <Ban className="h-3.5 w-3.5" />
                Block
              </Button>
            </>
          )}
          {app.status === "APPROVED" && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => revokeMutation.mutate(app.userId)}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Revoke Mentor
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Professional Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailRow icon={User} label="Headline" value={app.headline} />
              <Separator />
              <DetailRow icon={Building2} label="Current Company" value={app.currentCompany} />
              <Separator />
              <DetailRow icon={Briefcase} label="Current Role" value={app.currentRole} />
              <Separator />
              <DetailRow icon={CalendarDays} label="Years of Experience" value={`${app.yearsOfExperience} year${app.yearsOfExperience !== 1 ? "s" : ""}`} />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                About the Applicant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {app.bio}
              </p>
            </CardContent>
          </Card>

          {/* Why Mentor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Why They Want to Mentor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {app.whyMentor}
              </p>
            </CardContent>
          </Card>

          {/* Categories & Skills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categories & Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {app.categoryIds.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {app.categoryIds.map((id) => (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {getCategoryName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No categories selected</p>
              )}

              {app.skillIds.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {app.skillIds.map((id) => (
                        <Badge key={id} variant="outline" className="text-xs">
                          {getSkillName(id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Applicant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={User} label="Name" value={app.userName} />
              <Separator />
              <DetailRow icon={Mail} label="Email" value={app.userEmail} />
              <Separator />
              <DetailRow icon={Hash} label="Application ID" value={app.applicationId} />
              <Separator />
              <DetailRow icon={RotateCcw} label="Attempt Number" value={`#${app.attemptNumber}`} />
            </CardContent>
          </Card>

          {/* Links & Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Links & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Resume */}
              {app.resumeUrl ? (
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">View Resume</p>
                    <p className="text-xs text-muted-foreground truncate">Opens in new tab</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 shrink-0" />
                  No resume uploaded
                </div>
              )}

              {/* LinkedIn */}
              {app.linkedinUrl ? (
                <a
                  href={app.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                    <ExternalLink className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">LinkedIn Profile</p>
                    <p className="text-xs text-muted-foreground truncate">{app.linkedinUrl}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  No LinkedIn provided
                </div>
              )}

              {/* Portfolio */}
              {app.portfolioUrl ? (
                <a
                  href={app.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">Portfolio</p>
                    <p className="text-xs text-muted-foreground truncate">{app.portfolioUrl}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  No portfolio provided
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Review Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={CalendarDays} label="Submitted" value={formatDateTime(app.createdAt)} />
              {app.reviewedAt && (
                <>
                  <Separator />
                  <DetailRow icon={CalendarDays} label="Reviewed" value={formatDateTime(app.reviewedAt)} />
                </>
              )}
              {app.reviewedByName && (
                <>
                  <Separator />
                  <DetailRow icon={User} label="Reviewed By" value={app.reviewedByName} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Rejection Reason (if any) */}
          {app.rejectionReason && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {app.rejectionReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Reject Dialog ────────────────────────────────────────────────── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The applicant can reapply after 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (min 10 characters)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectionReason.length < 10 || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Permanently Reject Dialog ────────────────────────────────────── */}
      <Dialog open={permRejectDialogOpen} onOpenChange={setPermRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Reject Application</DialogTitle>
            <DialogDescription>
              This will prevent the applicant from ever reapplying. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (min 10 characters)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain the reason for permanent rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermReject}
              disabled={rejectionReason.length < 10 || permRejectMutation.isPending}
            >
              {permRejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Permanently Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


