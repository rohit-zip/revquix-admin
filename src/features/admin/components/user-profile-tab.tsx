/**
 * ─── USER PROFILE TAB (ADMIN) ─────────────────────────────────────────────────
 *
 * Renders all UserAuth fields for an admin detail view:
 * identity, account status, timestamps, skills, categories, auth providers.
 */

"use client"

import React from "react"
import {
  User,
  Mail,
  AtSign,
  Phone,
  Shield,
  Key,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  AlertTriangle,
  Tag,
  CreditCard,
  Link2,
  AlertCircle,
  FolderGit2,
  ExternalLink,
  Code2,
  Eye,
  EyeOff,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { useAdminUserDetail, useModerateUserProject } from "@/features/admin/api/admin-user.hooks"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const PROJECT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatProjectDate(year: number | null, month: number | null): string {
  if (!year) return ""
  return month ? `${PROJECT_MONTHS[month - 1]} ${year}` : String(year)
}

function BoolBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return value ? (
    <Badge variant="outline" className="gap-1 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-3" />
      {trueLabel}
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1 text-xs opacity-80">
      <XCircle className="size-3" />
      {falseLabel}
    </Badge>
  )
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${mono ? "font-mono" : ""} ${value ? "" : "text-muted-foreground"}`}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfileTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfileTab({ userId }: UserProfileTabProps) {
  const { data: user, isLoading, isError } = useAdminUserDetail(userId)
  const moderateProject = useModerateUserProject(userId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError || !user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load user details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Identity & Contact ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Identity & Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow icon={Key} label="User ID" value={user.userId} mono />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={AtSign} label="Username" value={user.username ? `@${user.username}` : null} />
            <InfoRow icon={User} label="Display Name" value={user.name} />
            <InfoRow icon={Phone} label="Mobile" value={user.mobile} mono />
          </div>
        </CardContent>
      </Card>

      {/* ── Account Status ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <BoolBadge value={user.isEmailVerified} trueLabel="Email Verified" falseLabel="Email Not Verified" />
            <BoolBadge value={user.isAccountNonLocked} trueLabel="Unlocked" falseLabel="Locked" />
            <BoolBadge value={user.isEnabled} trueLabel="Enabled" falseLabel="Disabled" />
            <BoolBadge value={!user.isDeleted} trueLabel="Active" falseLabel="Deleted" />
            {user.passwordChangeRequired && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <AlertTriangle className="size-3" />
                Password Change Required
              </Badge>
            )}
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow icon={Lock} label="Failed Login Attempts" value={String(user.failedLoginAttempts)} />
            <InfoRow icon={Lock} label="Account Locked Until" value={formatDateTime(user.accountLockedUntil)} />
            <InfoRow icon={CreditCard} label="Free Calls Used" value={String(user.freeCallsUsed)} />
          </div>
        </CardContent>
      </Card>

      {/* ── Network / IP (Admin PII) ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4" />
            Network Information
            <Badge variant="outline" className="text-xs ml-2">Admin Only</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            PII fields visible only to administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow icon={Globe} label="Registration IP" value={user.registerIp} mono />
            <InfoRow icon={Globe} label="Last Login IP" value={user.lastLoginIp} mono />
          </div>
        </CardContent>
      </Card>

      {/* ── Timestamps ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Timestamps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow icon={Calendar} label="Account Created" value={formatDateTime(user.createdAt)} />
            <InfoRow icon={Clock} label="Last Updated" value={formatDateTime(user.updatedAt)} />
            <InfoRow icon={Clock} label="Last Login" value={formatDateTime(user.lastLoginAt)} />
            <InfoRow icon={Clock} label="Last Login Failed" value={formatDateTime(user.lastLoginFailedAt)} />
            <InfoRow icon={Clock} label="Last Password Change" value={formatDateTime(user.lastPasswordChangeAt)} />
            <InfoRow icon={Clock} label="Last Username Change" value={formatDateTime(user.lastUsernameChangeAt)} />
            {user.deletedAt && (
              <InfoRow icon={Clock} label="Deleted At" value={formatDateTime(user.deletedAt)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Skills ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="size-4" />
            Skills
            <Badge variant="secondary" className="text-xs ml-2">
              {user.skills.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No skills selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill.skillId} variant="outline" className="text-xs py-1 px-2.5">
                  {skill.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="size-4" />
            Categories
            <Badge variant="secondary" className="text-xs ml-2">
              {user.categories.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No categories selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.categories.map((cat) => (
                <Badge key={cat.categoryId} variant="secondary" className="text-xs py-1 px-2.5">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Projects ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderGit2 className="size-4" />
            Projects
            <Badge variant="secondary" className="text-xs ml-2">
              {user.projects?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!user.projects || user.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No projects added</p>
          ) : (
            <div className="space-y-3">
              {user.projects.map((project) => {
                const dateLabel = `${formatProjectDate(project.startYear, project.startMonth)}${
                  project.isOngoing
                    ? " – Present"
                    : project.endYear
                      ? ` – ${formatProjectDate(project.endYear, project.endMonth)}`
                      : ""
                }`
                const isHidden = project.moderationStatus === "HIDDEN"
                const isPending =
                  moderateProject.isPending &&
                  moderateProject.variables?.projectId === project.projectId
                return (
                  <div
                    key={project.projectId}
                    className={`rounded-lg border p-3 ${isHidden ? "border-destructive/40 bg-destructive/5" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{project.title}</p>
                      {isHidden && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <EyeOff className="size-3" />
                          Hidden
                        </Badge>
                      )}
                      {project.status && (
                        <Badge variant="outline" className="text-xs">
                          {project.statusLabel ?? project.status}
                        </Badge>
                      )}
                      {project.projectType && (
                        <Badge variant="secondary" className="text-xs">
                          {project.projectTypeLabel ?? project.projectType}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={isHidden ? "outline" : "ghost"}
                        disabled={isPending}
                        onClick={() =>
                          moderateProject.mutate({
                            projectId: project.projectId,
                            status: isHidden ? "VISIBLE" : "HIDDEN",
                          })
                        }
                        className="ml-auto h-7 gap-1 text-xs"
                      >
                        {isHidden ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                        {isHidden ? "Restore" : "Hide"}
                      </Button>
                    </div>
                    {project.roleInProject && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{project.roleInProject}</p>
                    )}
                    {dateLabel.trim() && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{dateLabel}</p>
                    )}
                    {(project.liveUrl || project.sourceUrl) && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            Live
                          </a>
                        )}
                        {project.sourceUrl && (
                          <a
                            href={project.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Code2 className="size-3" />
                            Source
                          </a>
                        )}
                      </div>
                    )}
                    {project.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.skills.map((skill) => (
                          <Badge key={skill.skillId} variant="outline" className="text-xs py-0.5 px-2">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.media.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[...project.media]
                          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                          .map((m) =>
                            m.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={m.mediaId}
                                src={m.url}
                                alt="Project image"
                                loading="lazy"
                                className={`h-12 w-16 rounded-md border object-cover ${
                                  m.isPrimary ? "border-primary ring-1 ring-primary/40" : "border-border"
                                }`}
                              />
                            ) : null,
                          )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Auth Providers ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-4" />
            Authentication Providers
            <Badge variant="secondary" className="text-xs ml-2">
              {user.authProviders.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.authProviders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No external providers linked</p>
          ) : (
            <div className="space-y-3">
              {user.authProviders.map((ap, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <ProviderIcon provider={ap.provider} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{ap.provider}</p>
                    <p className="text-xs text-muted-foreground truncate">{ap.email ?? ap.providerUserId}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    Linked {formatDateTime(ap.linkedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Roles ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Assigned Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1 text-xs">
                <Shield className="size-3" />
                {role.replace("ROLE_", "").replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Provider Icon ────────────────────────────────────────────────────────────

function ProviderIcon({ provider }: { provider: string }) {
  const name = provider?.toUpperCase()
  if (name === "GOOGLE") {
    return (
      <div className="size-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-red-600 dark:text-red-400">G</span>
      </div>
    )
  }
  if (name === "GITHUB") {
    return (
      <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">GH</span>
      </div>
    )
  }
  return (
    <div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <Link2 className="size-4 text-muted-foreground" />
    </div>
  )
}
