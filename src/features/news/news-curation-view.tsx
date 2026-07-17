"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { BlogSearchCombobox } from "./components/blog-search-combobox"
import {
  useArchiveBlog,
  useEditorialCategories,
  useEditorialPost,
  useEndStripTemplates,
  usePublishBlog,
  useScheduleBlog,
  useUnarchiveBlog,
  useUnpublishBlog,
  useUpdateBlog,
} from "./api/news.hooks"
import {
  BYLINE_OPTIONS,
  STRUCTURED_DATA_OPTIONS,
  type BylineType,
  type EndStripCta,
  type StructuredDataType,
  type UpdateBlogRequest,
} from "./api/news.types"
import { formatDateTime, KindBadge, StatusBadge } from "./news-badges"

const NONE = "__none__"

interface FormState {
  editorialCategory: string
  priority: number
  featured: boolean
  bylineType: BylineType
  bylineLabel: string
  seoTitle: string
  seoDescription: string
  ogImageKey: string
  structuredDataType: StructuredDataType
  focusKeyword: string
  noindex: boolean
  commentsEnabled: boolean
  endStripTemplateId: string
  endStripTitle: string
  endStripDescription: string
  endStripCtas: EndStripCta[]
  keepReadingIds: string[]
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function NewsCurationView({ blogId }: { blogId: string }) {
  const { data: post, isLoading, isError } = useEditorialPost(blogId)
  const { data: categories } = useEditorialCategories()
  const { data: endStrips } = useEndStripTemplates()

  const update = useUpdateBlog()
  const schedule = useScheduleBlog()
  const publish = usePublishBlog()
  const unpublish = useUnpublishBlog()
  const archive = useArchiveBlog()
  const unarchive = useUnarchiveBlog()

  const [form, setForm] = useState<FormState | null>(null)
  const [scheduleAt, setScheduleAt] = useState("")

  useEffect(() => {
    if (!post) return
    setForm({
      editorialCategory: post.editorialCategory ?? "",
      priority: post.priority ?? 0,
      featured: post.featured,
      bylineType: post.bylineType ?? "ORG",
      bylineLabel: post.bylineLabel ?? "",
      seoTitle: post.seoTitle ?? "",
      seoDescription: post.seoDescription ?? "",
      ogImageKey: post.ogImageKey ?? "",
      structuredDataType: post.structuredDataType ?? "BlogPosting",
      focusKeyword: post.focusKeyword ?? "",
      noindex: post.noindex,
      commentsEnabled: post.commentsEnabled,
      endStripTemplateId: post.endStripTemplateId ?? "",
      endStripTitle: post.endStripTitle ?? "",
      endStripDescription: post.endStripDescription ?? "",
      endStripCtas: post.endStripCtas ?? [],
      keepReadingIds: post.keepReadingIds ?? [],
    })
    setScheduleAt(toDatetimeLocal(post.publishAt))
  }, [post])

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Could not load this article.{" "}
        <Link href={PATH_CONSTANTS.ADMIN_NEWS} className="underline">
          Back to editorial
        </Link>
      </div>
    )
  }

  const patch = (p: Partial<FormState>) => setForm((f) => (f ? { ...f, ...p } : f))

  const onSave = () => {
    const request: UpdateBlogRequest = {
      editorialCategory: form.editorialCategory || null,
      priority: form.priority,
      featured: form.featured,
      bylineType: form.bylineType,
      bylineLabel: form.bylineLabel || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      ogImageKey: form.ogImageKey || null,
      structuredDataType: form.structuredDataType,
      focusKeyword: form.focusKeyword || null,
      noindex: form.noindex,
      commentsEnabled: form.commentsEnabled,
      endStripTemplateId: form.endStripTemplateId || null,
      endStripTitle: form.endStripTitle || null,
      endStripDescription: form.endStripDescription || null,
      endStripCtas: form.endStripCtas.filter((c) => c.label.trim() && c.href.trim()),
      keepReadingIds: form.keepReadingIds.map((s) => s.trim()).filter(Boolean),
    }
    update.mutate({ blogId, request })
  }

  const addCta = () =>
    form.endStripCtas.length < 2 &&
    patch({ endStripCtas: [...form.endStripCtas, { label: "", href: "", style: "primary" }] })
  const updateCta = (i: number, p: Partial<EndStripCta>) =>
    patch({ endStripCtas: form.endStripCtas.map((c, idx) => (idx === i ? { ...c, ...p } : c)) })
  const removeCta = (i: number) =>
    patch({ endStripCtas: form.endStripCtas.filter((_, idx) => idx !== i) })

  const addKeepReading = () =>
    form.keepReadingIds.length < 3 && patch({ keepReadingIds: [...form.keepReadingIds, ""] })
  const updateKeepReading = (i: number, v: string) =>
    patch({ keepReadingIds: form.keepReadingIds.map((s, idx) => (idx === i ? v : s)) })
  const removeKeepReading = (i: number) =>
    patch({ keepReadingIds: form.keepReadingIds.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={PATH_CONSTANTS.ADMIN_NEWS}
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Editorial
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight">{post.title || "Untitled"}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={post.status} />
            <KindBadge kind={post.kind} />
            <span className="text-xs text-muted-foreground">/{post.slug}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={PATH_CONSTANTS.WEB_EDITORIAL_EDIT(blogId)} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Edit content
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={PATH_CONSTANTS.WEB_EDITORIAL_PREVIEW(blogId)} target="_blank" rel="noreferrer">
              <FileText className="h-4 w-4" /> Preview
            </a>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onSave} disabled={update.isPending}>
            <Save className="h-4 w-4" /> Save curation
          </Button>
        </div>
      </div>

      {/* ── Lifecycle ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Lifecycle</CardTitle>
          <CardDescription>
            Publish state and scheduled auto-publish. Governance rules run on publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {post.status === "PUBLISHED" ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unpublish.mutate(blogId)}>
                <Undo2 className="h-4 w-4" /> Unpublish
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => publish.mutate(blogId)}>
                <Send className="h-4 w-4" /> Publish now
              </Button>
            )}
            {post.status === "PUBLISHED" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => archive.mutate(blogId)}>
                <Archive className="h-4 w-4" /> Archive
              </Button>
            )}
            {post.status === "ARCHIVED" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unarchive.mutate(blogId)}>
                <ArchiveRestore className="h-4 w-4" /> Unarchive
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="space-y-1">
              <Label htmlFor="scheduleAt">Schedule publish (E1)</Label>
              <Input
                id="scheduleAt"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="w-60"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!scheduleAt || post.status !== "DRAFT" || schedule.isPending}
              onClick={() =>
                schedule.mutate({ blogId, request: { publishAt: new Date(scheduleAt).toISOString() } })
              }
            >
              <CalendarClock className="h-4 w-4" /> Schedule
            </Button>
            {post.publishAt && (
              <span className="pb-2 text-xs text-muted-foreground">
                Scheduled for {formatDateTime(post.publishAt)}
              </span>
            )}
          </div>
          {post.status !== "DRAFT" && (
            <p className="text-xs text-muted-foreground">
              Scheduling is only available for drafts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Featuring & priority ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Featuring &amp; priority</CardTitle>
          <CardDescription>Controls landing hero eligibility and ordering.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={form.featured}
              onCheckedChange={(v) => patch({ featured: v })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="priority">Priority (0–100)</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              max={100}
              value={form.priority}
              onChange={(e) => patch({ priority: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Category & byline ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Category &amp; byline</CardTitle>
          <CardDescription>Section placement and attribution.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Editorial category</Label>
            <Select
              value={form.editorialCategory || NONE}
              onValueChange={(v) => patch({ editorialCategory: v === NONE ? "" : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Uncategorised</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Byline</Label>
            <Select
              value={form.bylineType}
              onValueChange={(v) => {
                const t = v as BylineType
                patch({
                  bylineType: t,
                  bylineLabel:
                    t === "ORG" && !form.bylineLabel ? "Revquix Editorial" : form.bylineLabel,
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BYLINE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.bylineType === "ORG" && (
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bylineLabel">Byline label</Label>
              <Input
                id="bylineLabel"
                value={form.bylineLabel}
                onChange={(e) => patch({ bylineLabel: e.target.value })}
                placeholder="Revquix Editorial"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SEO ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>SEO &amp; structured data</CardTitle>
          <CardDescription>Search metadata and social preview.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Structured data type</Label>
            <Select
              value={form.structuredDataType}
              onValueChange={(v) => patch({ structuredDataType: v as StructuredDataType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRUCTURED_DATA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="focusKeyword">Focus keyword</Label>
            <Input
              id="focusKeyword"
              value={form.focusKeyword}
              onChange={(e) => patch({ focusKeyword: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={form.seoTitle}
              maxLength={70}
              onChange={(e) => patch({ seoTitle: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea
              id="seoDescription"
              value={form.seoDescription}
              maxLength={160}
              onChange={(e) => patch({ seoDescription: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="ogImageKey">OG image key</Label>
            <Input
              id="ogImageKey"
              value={form.ogImageKey}
              onChange={(e) => patch({ ogImageKey: e.target.value })}
              placeholder="revquix/… (leave blank to fall back to the cover image)"
            />
            {post.coverPhotoKey && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => patch({ ogImageKey: post.coverPhotoKey ?? "" })}
              >
                Use cover image ({post.coverPhotoKey})
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:col-span-2">
            <div>
              <Label htmlFor="noindex">No-index</Label>
              <p className="text-xs text-muted-foreground">Suppress this article from search engines.</p>
            </div>
            <Switch id="noindex" checked={form.noindex} onCheckedChange={(v) => patch({ noindex: v })} />
          </div>
        </CardContent>
      </Card>

      {/* ── End strip ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>End strip</CardTitle>
          <CardDescription>
            Closing call-to-action rendered under the article. Manage templates in{" "}
            <Link href={PATH_CONSTANTS.ADMIN_NEWS_END_STRIPS} className="underline">
              End Strips
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Template</Label>
            <Select
              value={form.endStripTemplateId || NONE}
              onValueChange={(v) => patch({ endStripTemplateId: v === NONE ? "" : v })}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="No end strip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No end strip</SelectItem>
                {endStrips
                  ?.filter((s) => s.isActive)
                  .map((s) => (
                    <SelectItem key={s.stripId} value={s.stripId}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="endStripTitle">Title override</Label>
              <Input
                id="endStripTitle"
                value={form.endStripTitle}
                onChange={(e) => patch({ endStripTitle: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endStripDescription">Description override</Label>
              <Input
                id="endStripDescription"
                value={form.endStripDescription}
                onChange={(e) => patch({ endStripDescription: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Call-to-action buttons (max 2)</Label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="gap-1"
                disabled={form.endStripCtas.length >= 2}
                onClick={addCta}
              >
                <Plus className="h-3 w-3" /> Add CTA
              </Button>
            </div>
            {form.endStripCtas.map((cta, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Label"
                  value={cta.label}
                  onChange={(e) => updateCta(i, { label: e.target.value })}
                  className="w-40"
                />
                <Input
                  placeholder="https://…"
                  value={cta.href}
                  onChange={(e) => updateCta(i, { href: e.target.value })}
                  className="min-w-40 flex-1"
                />
                <Select value={cta.style || "primary"} onValueChange={(v) => updateCta(i, { style: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon-sm" aria-label="Remove CTA" onClick={() => removeCta(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Keep reading ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Keep reading</CardTitle>
          <CardDescription>
            Pin up to 3 follow-on articles. Search by title or slug — leave empty to auto-fill
            server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {form.keepReadingIds.map((id, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-full sm:w-96">
                <BlogSearchCombobox
                  value={id}
                  excludeIds={[blogId, ...form.keepReadingIds.filter((_, idx) => idx !== i)]}
                  onSelect={(post) => updateKeepReading(i, post?.blogId ?? "")}
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove"
                onClick={() => removeKeepReading(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="gap-1"
            disabled={form.keepReadingIds.length >= 3}
            onClick={addKeepReading}
          >
            <Plus className="h-3 w-3" /> Add article
          </Button>
        </CardContent>
      </Card>

      {/* ── Comments ── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Editorial articles default to comments off.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="commentsEnabled">Enable comments</Label>
            <Switch
              id="commentsEnabled"
              checked={form.commentsEnabled}
              onCheckedChange={(v) => patch({ commentsEnabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={onSave} disabled={update.isPending}>
          <Save className="h-4 w-4" /> Save curation
        </Button>
      </div>
    </div>
  )
}
