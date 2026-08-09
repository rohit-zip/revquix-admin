"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AnnouncementPreview } from "./announcement-preview"
import { useAnnouncementOverlap } from "./api/announcement.hooks"
import { AnnouncementMediaPicker } from "./announcement-media-picker"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import type {
  AdminAnnouncement,
  AnnouncementAppearance,
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementCtaStyle,
  AnnouncementIcon,
  AnnouncementLayout,
  AnnouncementMediaPosition,
  AnnouncementReshowPolicy,
  AnnouncementSurface,
  AnnouncementUpsertRequest,
} from "./api/announcement.types"

/**
 * ─── ANNOUNCEMENT EDITOR ─────────────────────────────────────────────────────
 *
 * Two panes: form left, live preview right.
 *
 * ─── Both surfaces ──────────────────────────────────────────────────────────
 *
 * The surface picker chooses BAR or MODAL and the form swaps its payload half
 * accordingly: a bar gets message / short message / appearance / icon, a modal
 * gets eyebrow / heading / TipTap body / layout / asset picker / chaining.
 * Everything above the fold — schedule, targeting, audience, CTAs, frequency —
 * is shared, because it is shared on the table too.
 *
 * ─── Why the character counters matter more than they look ──────────────────
 *
 * 90 characters fits one comfortable desktop line and wraps to three on a 360px
 * phone. The counter plus the preview's breakpoint switcher are the only two
 * things standing between "reads well in my browser" and a two-line banner
 * shoving the navbar down on every mobile page of the site.
 */

const CATEGORIES: { value: AnnouncementCategory; label: string; hint: string }[] = [
  { value: "MARKETING", label: "Marketing", hint: "Promotions and feature nudges. Always dismissible." },
  { value: "RELEASE", label: "Release", hint: "Product updates and changelog entries." },
  {
    value: "SYSTEM",
    label: "System",
    hint: "Incidents and maintenance. Shows on mentor profiles too, and ignores frequency caps.",
  },
]

const APPEARANCES: { value: AnnouncementAppearance; label: string }[] = [
  { value: "ACCENT", label: "Accent (brand)" },
  { value: "ACCENT_SOFT", label: "Accent soft" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "SUCCESS", label: "Success" },
  { value: "WARNING", label: "Warning" },
  { value: "CRITICAL", label: "Critical (system only)" },
]

const ICONS: { value: AnnouncementIcon | "NONE"; label: string }[] = [
  { value: "NONE", label: "No icon" },
  { value: "SPARKLES", label: "Sparkles" },
  { value: "ZAP", label: "Zap" },
  { value: "MEGAPHONE", label: "Megaphone" },
  { value: "GIFT", label: "Gift" },
  { value: "ALERT_TRIANGLE", label: "Alert" },
  { value: "WRENCH", label: "Wrench" },
]

const AUDIENCES: { value: AnnouncementAudience; label: string; hint: string }[] = [
  { value: "EVERYONE", label: "Everyone", hint: "Server-rendered — no layout shift." },
  { value: "GUESTS_ONLY", label: "Signed-out visitors", hint: "The acquisition case." },
  { value: "AUTHENTICATED_ONLY", label: "Signed-in users", hint: "Where feature adoption happens." },
  { value: "NEW_USERS", label: "New accounts", hint: "Account younger than the window below." },
  { value: "MENTORS_ONLY", label: "Professional mentors", hint: "Supply-side messaging." },
  {
    value: "NEVER_BOOKED",
    label: "Never booked",
    hint: "Signed in with no completed purchase. The highest-intent segment.",
  },
]

const RESHOW_POLICIES: { value: AnnouncementReshowPolicy; label: string }[] = [
  { value: "NEVER", label: "Never — dismissed once, gone" },
  { value: "AFTER_HOURS", label: "After a delay" },
  { value: "EVERY_SESSION", label: "Every new session" },
  { value: "UNTIL_CLICKED", label: "Until the CTA is clicked" },
]

export interface AnnouncementEditorProps {
  existing?: AdminAnnouncement
  submitting: boolean
  onSubmit: (request: AnnouncementUpsertRequest) => void
  onCancel: () => void
}

export function AnnouncementEditor({
  existing,
  submitting,
  onSubmit,
  onCancel,
}: AnnouncementEditorProps) {
  const [rawForm, setForm] = useState(() => initialForm(existing))

  const set = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  // ── Category constraints, applied by derivation rather than by effect ──────
  //
  // Two fields are constrained by `category`, and both were originally corrected
  // with an effect that wrote back into state. That is a cascading render on
  // every keystroke in a form that already re-renders a live preview, and React
  // Compiler rejects it — correctly. Deriving instead means the constraint is
  // simply true at every moment rather than true one render later, and there is
  // never a frame in which the form holds a value the server would refuse.
  //
  // Everything downstream — the controls, validation, the preview and the
  // request — reads `form`, so none of them can observe the unconstrained value.
  const form = useMemo<EditorForm>(() => {
    const dismissible = rawForm.category === "MARKETING" ? true : rawForm.dismissible
    const appearance =
      rawForm.category !== "SYSTEM" && rawForm.appearance === "CRITICAL"
        ? "WARNING"
        : rawForm.appearance
    return { ...rawForm, dismissible, appearance }
  }, [rawForm])

  // MARKETING is always dismissible — the database enforces it too, and offering
  // a toggle the server silently overrides is worse than not offering one.
  const dismissLocked = form.category === "MARKETING"
  const isModal = form.surface === "MODAL"

  const overlap = useAnnouncementOverlap({
    announcementId: existing?.announcementId,
    surface: form.surface,
    startsAt: toIso(form.startsAt),
    endsAt: form.endsAt ? toIso(form.endsAt) : null,
    enabled: Boolean(form.startsAt),
  })

  const errors = useMemo(() => validate(form), [form])
  const canSubmit = errors.length === 0 && !submitting

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(toRequest(form, existing))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <Field
          label="Surface"
          hint={
            existing
              ? "Immutable after creation — a bar and a modal store different content, so switching would leave this one describing the wrong shape."
              : isModal
                ? "A dialog over the page. For major releases that genuinely warrant interrupting somebody."
                : "A strip above the navbar on every page. For anything that does not warrant an interruption."
          }
          required
        >
          <Select
            value={form.surface}
            disabled={Boolean(existing)}
            onValueChange={(value) => set("surface", value as AnnouncementSurface)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BAR">Bar</SelectItem>
              <SelectItem value="MODAL">Modal</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Internal name"
          hint="Admin-facing only. Never shown to a visitor."
          required
        >
          <Input
            value={form.internalName}
            onChange={(e) => set("internalName", e.target.value)}
            placeholder="August launch — AI resume review"
            maxLength={120}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <Select
              value={form.category}
              onValueChange={(value) => set("category", value as AnnouncementCategory)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {CATEGORIES.find((c) => c.value === form.category)?.hint}
            </p>
          </Field>

          <Field label="Priority" hint="Higher wins when two are live at once.">
            <Input
              type="number"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              min={-1000}
              max={1000}
            />
          </Field>
        </div>

        {!isModal ? (
          <>
        <Field
          label="Message"
          required
          counter={{ value: form.message.length, max: 90 }}
          hint="Plain text and emoji. The call-to-action is the only link."
        >
          <Input
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="New: AI resume review is live"
            maxLength={90}
          />
        </Field>

        <Field
          label="Short message"
          counter={{ value: form.shortMessage.length, max: 48 }}
          hint="Shown below 480px INSTEAD of truncating. Optional, but a long message without one wraps to three lines on a phone."
        >
          <Input
            value={form.shortMessage}
            onChange={(e) => set("shortMessage", e.target.value)}
            placeholder="AI resume review is live"
            maxLength={48}
          />
        </Field>
          </>
        ) : null}

        {isModal ? <ModalContentFields form={form} set={set} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Appearance">
            <Select
              value={form.appearance}
              onValueChange={(value) => set("appearance", value as AnnouncementAppearance)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {APPEARANCES.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === "CRITICAL" && form.category !== "SYSTEM"}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {!isModal ? (
          <Field label="Icon">
            <Select
              value={form.icon ?? "NONE"}
              onValueChange={(value) => set("icon", value === "NONE" ? null : (value as AnnouncementIcon))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          ) : null}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Call to action
          </legend>
          <p className="text-[11px] text-muted-foreground">
            {isModal
              ? "One primary, one optional secondary. A third is a decision the reader will not make."
              : "One only. Two buttons in a 44px bar are unusable at mobile width."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" counter={{ value: form.ctaLabel.length, max: 24 }}>
              <Input
                value={form.ctaLabel}
                onChange={(e) => set("ctaLabel", e.target.value)}
                placeholder="Try it now"
                maxLength={24}
              />
            </Field>
            <Field label="Style">
              <Select
                value={form.ctaStyle}
                onValueChange={(value) => set("ctaStyle", value as AnnouncementCtaStyle)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PILL">Pill (filled)</SelectItem>
                  <SelectItem value="LINK">Link (underlined)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label="Destination"
            hint="A path starting with / opens in the app. An https:// or mailto: link opens in a new tab."
          >
            <Input
              value={form.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="/tools/ats-resume-checker"
            />
          </Field>

          {isModal ? (
            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <Field
                label="Secondary label"
                counter={{ value: form.cta2Label.length, max: 24 }}
                hint="Optional. Always renders as a link, never a second button."
              >
                <Input
                  value={form.cta2Label}
                  onChange={(e) => set("cta2Label", e.target.value)}
                  placeholder="Read the notes"
                  maxLength={24}
                />
              </Field>
              <Field label="Secondary destination">
                <Input
                  value={form.cta2Href}
                  onChange={(e) => set("cta2Href", e.target.value)}
                  placeholder="/changelog"
                />
              </Field>
            </div>
          ) : null}
        </fieldset>

        {/* ── Schedule ────────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" required>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
            />
          </Field>
          <Field
            label="Ends"
            required={form.category !== "SYSTEM"}
            hint={
              form.category === "SYSTEM"
                ? "Optional for system announcements."
                : "Required. An announcement nobody remembers to remove is one that goes stale in public."
            }
          >
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
            />
          </Field>
        </div>

        {overlap.data?.hasOverlap ? (
          <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">
                This window overlaps {overlap.data.overlapping.length} other published{" "}
                {overlap.data.overlapping.length === 1 ? "announcement" : "announcements"}.
              </p>
              <p className="text-muted-foreground">
                Several announcements may be live at once — only one is ever shown. Right now that
                would be <strong>{overlap.data.winnerName}</strong> unless this one has a higher
                priority.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Targeting ───────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience">
            <Select
              value={form.audience}
              onValueChange={(value) => set("audience", value as AnnouncementAudience)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {AUDIENCES.find((a) => a.value === form.audience)?.hint}
            </p>
          </Field>

          {form.audience === "NEW_USERS" ? (
            <Field label="Account age (days)">
              <Input
                type="number"
                value={form.newUserDays}
                onChange={(e) => set("newUserDays", e.target.value)}
                min={1}
                max={365}
              />
            </Field>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Only on these paths"
            hint="Comma-separated globs, e.g. /tools/**. Empty means everywhere."
          >
            <Input
              value={form.includePaths}
              onChange={(e) => set("includePaths", e.target.value)}
              placeholder="/tools/**"
            />
          </Field>
          <Field label="Never on these paths" hint="Always beats the list on the left.">
            <Input
              value={form.excludePaths}
              onChange={(e) => set("excludePaths", e.target.value)}
              placeholder="/tools/money/**"
            />
          </Field>
        </div>

        <Field
          label="Countries"
          hint="Comma-separated ISO codes, e.g. US, GB. Empty means everywhere."
        >
          <Input
            value={form.countries}
            onChange={(e) => set("countries", e.target.value)}
            placeholder="US, GB"
          />
        </Field>

        {/* ── Dismissal ───────────────────────────────────────────────────── */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dismissal
          </legend>

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-sm">Visitors can dismiss it</Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {dismissLocked
                  ? "Marketing announcements are always dismissible. A banner somebody cannot close is a dark pattern and an accessibility failure."
                  : "Turn off only for a system notice that carries an action resolving it."}
              </p>
            </div>
            <Switch
              checked={form.dismissible}
              disabled={dismissLocked}
              onCheckedChange={(checked) => set("dismissible", checked)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Show again">
              <Select
                value={form.reshowPolicy}
                onValueChange={(value) => set("reshowPolicy", value as AnnouncementReshowPolicy)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESHOW_POLICIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.reshowPolicy === "AFTER_HOURS" || form.reshowPolicy === "UNTIL_CLICKED" ? (
              <Field label="Delay (hours)" required>
                <Input
                  type="number"
                  value={form.reshowAfterHours}
                  onChange={(e) => set("reshowAfterHours", e.target.value)}
                  min={1}
                  max={8760}
                />
              </Field>
            ) : null}
          </div>

          {isModal ? (
            <div className="flex items-start justify-between gap-4 border-t pt-4">
              <div>
                <Label className="text-sm">Allow another modal after this one</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Off by default. With it off, a visitor sees exactly one modal per visit and the
                  rest wait — a &ldquo;1 of 4&rdquo; carousel on a first visit is a wall. Turn it on
                  only for a deliberate two-part story.
                </p>
              </div>
              <Switch
                checked={form.allowChaining}
                onCheckedChange={(checked) => set("allowChaining", checked)}
              />
            </div>
          ) : null}

          {/* Changelog opt-out (Phase 3, master plan §11).
              Shown only for RELEASE, because that is the only category the
              /changelog query reads. The VALUE is kept across a category change —
              the backend stores it on every row — so retyping an announcement
              mid-edit does not silently discard the choice. */}
          {form.category === "RELEASE" ? (
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3.5">
              <div>
                <Label className="text-sm">List on the public changelog</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  On by default. The modal is ephemeral; /changelog is the permanent, linkable
                  record — support can send a URL, and the entry outlives the announcement. Turn
                  it off only for a note too minor to belong in the archive.
                </p>
              </div>
              <Switch
                checked={form.publishToChangelog}
                onCheckedChange={(checked) => set("publishToChangelog", checked)}
              />
            </div>
          ) : null}

          <Field
            label="Maximum times shown per person"
            hint="An absolute ceiling that overrides the rule above. Leave blank for no limit — but a re-show policy without a cap is how a re-show rule becomes a complaint."
          >
            <Input
              type="number"
              value={form.frequencyCap}
              onChange={(e) => set("frequencyCap", e.target.value)}
              min={1}
              max={1000}
              placeholder="No limit"
            />
          </Field>
        </fieldset>

        {errors.length > 0 ? (
          <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {existing ? "Save changes" : "Save draft"}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          {!existing ? (
            <p className="text-[11px] text-muted-foreground">
              Saved as a draft. Publishing is a separate, deliberate step.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Preview ───────────────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </p>
        {isModal ? (
          <ModalPreview form={form} />
        ) : (
          <AnnouncementPreview
            message={form.message}
            shortMessage={form.shortMessage}
            appearance={form.appearance}
            icon={form.icon}
            cta={
              form.ctaLabel
                ? { key: "primary", label: form.ctaLabel, href: form.ctaHref, style: form.ctaStyle }
                : null
            }
            dismissible={form.dismissible}
          />
        )}
      </div>
    </div>
  )
}

// ── Form model ───────────────────────────────────────────────────────────────
//
// Flat strings rather than the request shape, because every control here is a
// text input or a select and both speak strings. Converting once, at submit
// (`toRequest`), keeps the parsing in one place instead of scattering
// `Number(...)` and `.split(",")` through the JSX.

interface EditorForm {
  surface: AnnouncementSurface
  internalName: string
  category: AnnouncementCategory
  priority: string
  message: string
  shortMessage: string
  appearance: AnnouncementAppearance
  icon: AnnouncementIcon | null
  ctaLabel: string
  ctaHref: string
  ctaStyle: AnnouncementCtaStyle
  // Modal-only second CTA. A bar gets one; a modal gets a primary and an
  // optional secondary, and never more — a third is a decision the reader will
  // not make.
  cta2Label: string
  cta2Href: string
  // Modal payload
  eyebrow: string
  heading: string
  bodyHtml: string
  layout: AnnouncementLayout
  mediaAssetId: string | null
  mediaPosition: AnnouncementMediaPosition
  allowChaining: boolean
  publishToChangelog: boolean
  startsAt: string
  endsAt: string
  audience: AnnouncementAudience
  newUserDays: string
  includePaths: string
  excludePaths: string
  countries: string
  dismissible: boolean
  reshowPolicy: AnnouncementReshowPolicy
  reshowAfterHours: string
  frequencyCap: string
}

function initialForm(existing?: AdminAnnouncement): EditorForm {
  const cta = existing?.ctas?.[0]
  const cta2 = existing?.ctas?.[1]
  return {
    surface: existing?.surface ?? "BAR",
    internalName: existing?.internalName ?? "",
    category: existing?.category ?? "MARKETING",
    priority: String(existing?.priority ?? 0),
    message: existing?.message ?? "",
    shortMessage: existing?.shortMessage ?? "",
    appearance: existing?.appearance ?? "ACCENT",
    icon: existing?.icon ?? null,
    ctaLabel: cta?.label ?? "",
    ctaHref: cta?.href ?? "",
    ctaStyle: cta?.style ?? "PILL",
    cta2Label: cta2?.label ?? "",
    cta2Href: cta2?.href ?? "",
    eyebrow: existing?.eyebrow ?? "",
    heading: existing?.heading ?? "",
    bodyHtml: existing?.bodyHtml ?? "",
    layout: existing?.layout ?? "STACKED",
    mediaAssetId: existing?.mediaAssetId ?? null,
    mediaPosition: existing?.mediaPosition ?? "TOP",
    allowChaining: existing?.allowChaining ?? false,
    publishToChangelog: existing?.publishToChangelog ?? true,
    startsAt: existing ? toLocalInput(existing.startsAt) : toLocalInput(new Date().toISOString()),
    endsAt: existing?.endsAt ? toLocalInput(existing.endsAt) : "",
    audience: existing?.audience ?? "EVERYONE",
    newUserDays: String((existing?.audienceParams?.newUserDays as number | undefined) ?? 7),
    includePaths: (existing?.includePaths ?? []).join(", "),
    excludePaths: (existing?.excludePaths ?? []).join(", "),
    countries: (existing?.countries ?? []).join(", "),
    dismissible: existing?.dismissible ?? true,
    reshowPolicy: existing?.reshowPolicy ?? "NEVER",
    reshowAfterHours: existing?.reshowAfterHours ? String(existing.reshowAfterHours) : "24",
    frequencyCap: existing?.frequencyCap ? String(existing.frequencyCap) : "",
  }
}

/**
 * Client-side validation.
 *
 * Deliberately a subset of the server's rules, not a copy of them. This exists to catch mistakes
 * before a round trip; the server is the authority and re-checks all of it, plus the things only
 * it can know. Trying to mirror every rule here produces two validators that drift, and the drift
 * is always found by an admin whose valid input was rejected locally.
 */
function validate(form: EditorForm): string[] {
  const errors: string[] = []

  const isModal = form.surface === "MODAL"

  if (!form.internalName.trim()) errors.push("An internal name is required.")
  if (!form.startsAt) errors.push("A start time is required.")

  if (isModal) {
    if (!form.heading.trim()) errors.push("A modal needs a heading.")
    // Body OR image. A heading alone is a dialog that interrupts somebody to
    // show them a title.
    if (!hasBodyText(form.bodyHtml) && !form.mediaAssetId) {
      errors.push("A modal needs a body or an image.")
    }
    if (form.layout === "SPLIT" && !form.mediaAssetId) {
      errors.push("The split layout needs an image — otherwise 40% of the modal is empty.")
    }
  } else if (!form.message.trim()) {
    errors.push("A bar needs a message.")
  }

  if (form.category !== "SYSTEM" && !form.endsAt) {
    errors.push("Only system announcements may run without an end time.")
  }
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    errors.push("The end time must be after the start time.")
  }
  if (form.ctaLabel.trim() && !form.ctaHref.trim()) {
    errors.push("A call-to-action needs a destination.")
  }
  if (form.ctaHref.trim() && !form.ctaLabel.trim()) {
    errors.push("A call-to-action needs a label.")
  }
  if (form.ctaHref.startsWith("//")) {
    errors.push("Protocol-relative destinations are not allowed. Use https:// or a path.")
  }
  if (form.cta2Label.trim() && !form.cta2Href.trim()) {
    errors.push("The secondary call-to-action needs a destination.")
  }
  if (!form.dismissible && !form.ctaLabel.trim()) {
    errors.push(
      "A non-dismissible announcement must offer a call-to-action, otherwise there is no way for anyone to resolve it.",
    )
  }
  return errors
}

function toRequest(form: EditorForm, existing?: AdminAnnouncement): AnnouncementUpsertRequest {
  const isModal = form.surface === "MODAL"
  return {
    surface: form.surface,
    category: form.category,
    internalName: form.internalName.trim(),
    priority: Number(form.priority) || 0,
    startsAt: toIso(form.startsAt),
    endsAt: form.endsAt ? toIso(form.endsAt) : null,

    audience: form.audience,
    audienceParams:
      form.audience === "NEW_USERS" ? { newUserDays: Number(form.newUserDays) || 7 } : null,
    includePaths: splitList(form.includePaths),
    excludePaths: splitList(form.excludePaths),
    countries: splitList(form.countries).map((value) => value.toUpperCase()),

    message: isModal ? null : form.message.trim() || null,
    shortMessage: isModal ? null : form.shortMessage.trim() || null,
    appearance: form.appearance,
    icon: isModal ? null : form.icon,

    eyebrow: isModal ? form.eyebrow.trim() || null : null,
    heading: isModal ? form.heading.trim() || null : null,
    bodyHtml: isModal ? form.bodyHtml || null : null,
    layout: isModal ? form.layout : null,
    mediaAssetId: isModal ? form.mediaAssetId : null,
    // Position is only meaningful alongside an image, and the two must agree with
    // the layout — the server rejects TOP on a split modal and LEFT/RIGHT on a
    // stacked one, so derive rather than send whatever the control last held.
    mediaPosition: isModal && form.mediaAssetId
      ? (form.layout === "SPLIT" ? form.mediaPosition : "TOP")
      : null,
    allowChaining: isModal && form.allowChaining,
    // Sent for every category, not only RELEASE. The backend stores it on every
    // row precisely so a category change mid-edit does not discard the choice —
    // omitting it here for a MARKETING row would reset it to the default the
    // moment somebody retyped that row as a RELEASE.
    publishToChangelog: form.publishToChangelog,

    // Fixed keys: position, not label, identifies a CTA in analytics, so a copy
    // edit never splits one CTA's click history into two series.
    ctas: [
      ...(form.ctaLabel.trim()
        ? [{
            key: "primary",
            label: form.ctaLabel.trim(),
            href: form.ctaHref.trim(),
            style: form.ctaStyle,
          }]
        : []),
      ...(isModal && form.cta2Label.trim()
        ? [{
            key: "secondary",
            label: form.cta2Label.trim(),
            href: form.cta2Href.trim(),
            style: "LINK" as AnnouncementCtaStyle,
          }]
        : []),
    ],

    dismissible: form.category === "MARKETING" ? true : form.dismissible,
    reshowPolicy: form.reshowPolicy,
    reshowAfterHours:
      form.reshowPolicy === "AFTER_HOURS" || form.reshowPolicy === "UNTIL_CLICKED"
        ? Number(form.reshowAfterHours) || 24
        : null,
    frequencyCap: form.frequencyCap ? Number(form.frequencyCap) : null,

    ...(existing ? { version: existing.version } : {}),
  }
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

/** `datetime-local` value → ISO instant. The input is in the admin's local zone. */
function toIso(local: string): string {
  return local ? new Date(local).toISOString() : ""
}

/** ISO instant → `datetime-local` value, in the admin's own zone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

// ── Field shell ──────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  counter,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  counter?: { value: number; max: number }
  children: React.ReactNode
}) {
  // Amber at 80% rather than only at the cap: a counter that turns red the
  // instant it is too late has told the admin nothing they could act on.
  const near = counter ? counter.value >= counter.max * 0.8 : false

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <Label className="text-sm">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
        {counter ? (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              near ? "text-amber-600" : "text-muted-foreground",
            )}
          >
            {counter.max - counter.value}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/**
 * Whether a TipTap document has any actual words.
 *
 * An empty editor serialises to `<p></p>`, which is truthy as a string and would otherwise satisfy
 * "has a body". Strips tags and entities before deciding, mirroring what the server's sanitiser
 * concludes so the two agree on whether a save is valid.
 */
function hasBodyText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0
}

// ── Modal content fields ─────────────────────────────────────────────────────

/**
 * The modal's own payload.
 *
 * Extracted rather than inlined because the editor's render body was already long, and because
 * these fields are mutually exclusive with the bar's — keeping them in one place makes it obvious
 * that switching surface swaps a whole section rather than toggling a few inputs.
 */
function ModalContentFields({
  form,
  set,
}: {
  form: EditorForm
  set: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Field
          label="Eyebrow"
          counter={{ value: form.eyebrow.length, max: 40 }}
          hint="Optional label above the heading."
        >
          <Input
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="NEW"
            maxLength={40}
          />
        </Field>
        <Field label="Heading" required counter={{ value: form.heading.length, max: 120 }}>
          <Input
            value={form.heading}
            onChange={(e) => set("heading", e.target.value)}
            placeholder="AI resume review is here"
            maxLength={120}
          />
        </Field>
      </div>

      <Field
        label="Body"
        hint="Up to 4,000 characters of text. Formatting outside this toolbar is stripped on save — the modal is a fixed-size shell, not an article."
      >
        <TiptapEditor
          content={form.bodyHtml}
          onChange={(html) => set("bodyHtml", html)}
          placeholder="What changed, and why it matters…"
        />
      </Field>

      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Image
        </legend>

        <AnnouncementMediaPicker
          value={form.mediaAssetId}
          onChange={(assetId) => set("mediaAssetId", assetId)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Layout"
            hint={
              form.layout === "SPLIT"
                ? "Image beside the text, collapsing to stacked on a phone. Needs an image."
                : "Image on top at a fixed 16:9, text below. Whatever you upload is cropped to fit."
            }
          >
            <Select
              value={form.layout}
              onValueChange={(value) => set("layout", value as AnnouncementLayout)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STACKED">Stacked</SelectItem>
                <SelectItem value="SPLIT" disabled={!form.mediaAssetId}>
                  Split
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {form.layout === "SPLIT" && form.mediaAssetId ? (
            <Field label="Image side">
              <Select
                value={form.mediaPosition === "RIGHT" ? "RIGHT" : "LEFT"}
                onValueChange={(value) => set("mediaPosition", value as AnnouncementMediaPosition)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEFT">Left</SelectItem>
                  <SelectItem value="RIGHT">Right</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </div>
      </fieldset>
    </>
  )
}

/**
 * A scaled representation of the modal shell.
 *
 * Deliberately schematic rather than a pixel-accurate copy of the public component. The bar preview
 * next door IS pixel-accurate because a bar's failure mode is subtle — copy that wraps to three
 * lines at 360px. A modal's shell is fixed by construction: one width, one max height, two
 * arrangements. What an admin needs to check here is the arrangement and whether the body is the
 * right length, and both survive a schematic. Reproducing the real dialog would mean duplicating
 * its prose scale across repos and having the copy silently drift.
 */
function ModalPreview({ form }: { form: EditorForm }) {
  const isSplit = form.layout === "SPLIT" && Boolean(form.mediaAssetId)
  const mediaFirst = form.mediaPosition !== "RIGHT"

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border bg-background shadow-sm",
            isSplit ? "flex" : "",
            !mediaFirst && isSplit ? "flex-row-reverse" : "",
          )}
        >
          {form.mediaAssetId ? (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center bg-muted text-[10px] text-muted-foreground",
                isSplit ? "w-[40%]" : "aspect-video w-full",
              )}
            >
              Image
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="border-b px-3 py-2.5">
              {form.eyebrow ? (
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary">
                  {form.eyebrow}
                </p>
              ) : null}
              <p className="truncate text-sm font-semibold">
                {form.heading || "Your heading appears here"}
              </p>
            </div>
            <div className="px-3 py-2.5">
              <p className="line-clamp-4 text-[11px] leading-relaxed text-muted-foreground">
                {stripHtml(form.bodyHtml) || "Your body text appears here."}
              </p>
            </div>
            {form.ctaLabel || form.cta2Label ? (
              <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
                {form.cta2Label ? (
                  <span className="text-[10px] underline">{form.cta2Label}</span>
                ) : null}
                {form.ctaLabel ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                    {form.ctaLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The real modal is 880px wide and at most 85% of the viewport height, with the body scrolling
        between a pinned header and footer. Its size never changes with content.
      </p>
    </div>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}
