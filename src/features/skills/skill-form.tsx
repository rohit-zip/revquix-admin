"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCreateSkill, useUpdateSkill } from "./api/skill.hooks"
import type { AdminSkill, AdminSkillRequest, SkillGroupLabel } from "./api/skill.types"

/** No-value sentinel for the group-label <Select>, since Radix Select rejects an empty-string item value. */
const NO_GROUP = "__none__"

const EMPTY: AdminSkillRequest = {
  name: "",
  description: "",
  iconUrl: "",
  groupLabel: null,
  displayOrder: 0,
  isActive: true,
}

interface SkillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: AdminSkill | null
  groupLabels: SkillGroupLabel[]
}

export function SkillFormDialog({ open, onOpenChange, editing, groupLabels }: SkillFormDialogProps) {
  const create = useCreateSkill()
  const update = useUpdateSkill()
  const [form, setForm] = useState<AdminSkillRequest>(
    editing
      ? {
          name: editing.name,
          description: editing.description ?? "",
          iconUrl: editing.iconUrl ?? "",
          groupLabel: editing.groupLabel,
          displayOrder: editing.displayOrder,
          isActive: editing.isActive,
        }
      : EMPTY,
  )
  // Tracks which target the form was last seeded for, so the form re-seeds exactly
  // once per distinct "open for X" transition (switching from editing skill A to
  // editing skill B, or from edit to create, while the dialog re-renders) without
  // needing a setState-in-effect (which triggers avoidable cascading renders — see
  // https://react.dev/learn/you-might-not-need-an-effect). This mirrors deriving
  // state during render rather than syncing it after the fact.
  const [seededFor, setSeededFor] = useState<string | null>(editing?.skillId ?? null)

  const seedKey = editing?.skillId ?? null
  if (open && seedKey !== seededFor) {
    setSeededFor(seedKey)
    setForm(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? "",
            iconUrl: editing.iconUrl ?? "",
            groupLabel: editing.groupLabel,
            displayOrder: editing.displayOrder,
            isActive: editing.isActive,
          }
        : EMPTY,
    )
  }

  const onSubmit = () => {
    if (!form.name?.trim()) return
    if (editing) {
      update.mutate(
        { skillId: editing.skillId, request: form },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      create.mutate(form, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit skill" : "New skill"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Editing "${editing.name}" (${editing.skillId}). Renaming only changes ` +
                "the display name — the skill id never changes."
              : "The skill id is derived from the name on creation and is frozen forever after."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Spring Boot"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="skill-desc">Description</Label>
            <Textarea
              id="skill-desc"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="skill-group">
                Group{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (admin-only, optional)
                </span>
              </Label>
              <Select
                value={form.groupLabel ?? NO_GROUP}
                onValueChange={(v) => setForm((f) => ({ ...f, groupLabel: v === NO_GROUP ? null : v }))}
              >
                <SelectTrigger id="skill-group">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>No group</SelectItem>
                  {groupLabels.map((g) => (
                    <SelectItem key={g.categoryId} value={g.categoryId}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="skill-sort">Display order</Label>
              <Input
                id="skill-sort"
                type="number"
                value={form.displayOrder ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="skill-icon">Icon URL</Label>
            <Input
              id="skill-icon"
              value={form.iconUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="skill-active">Active</Label>
            <Switch
              id="skill-active"
              checked={form.isActive ?? true}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!form.name?.trim() || isPending}>
            {editing ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
