"use client"

import { useState } from "react"
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useDeleteSkill,
  useSkillGroupLabels,
  useSkills,
} from "./api/skill.hooks"
import type { AdminSkill } from "./api/skill.types"
import { SkillFormDialog } from "./skill-form"

const PAGE_SIZE = 20
/** No-value sentinel for the group-label <Select>, since Radix Select rejects an empty-string item value. */
const ALL_GROUPS = "__all__"

export function SkillsView() {
  const [page, setPage] = useState(0)
  const [nameFilter, setNameFilter] = useState("")
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS)

  const { data, isLoading, isFetching } = useSkills({
    page,
    size: PAGE_SIZE,
    name: nameFilter || undefined,
    groupLabel: groupFilter === ALL_GROUPS ? undefined : groupFilter,
  })
  const { data: groupLabels } = useSkillGroupLabels()
  const deleteMutation = useDeleteSkill()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSkill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminSkill | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (skill: AdminSkill) => {
    setEditing(skill)
    setFormOpen(true)
  }

  const skills = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Sparkles className="h-5 w-5" /> Skill registry
          </h1>
          <p className="text-sm text-muted-foreground">
            The platform&rsquo;s sole dynamic taxonomy — skill id is derived from name on
            creation and never changes.
          </p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New skill
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name…"
          value={nameFilter}
          onChange={(e) => {
            setNameFilter(e.target.value)
            setPage(0)
          }}
          className="max-w-xs"
        />
        <Select
          value={groupFilter}
          onValueChange={(v) => {
            setGroupFilter(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GROUPS}>All groups</SelectItem>
            {groupLabels?.map((g) => (
              <SelectItem key={g.categoryId} value={g.categoryId}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFetching && !isLoading && (
          <span className="text-xs text-muted-foreground">Refreshing…</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No skills match this filter.
        </div>
      ) : (
        <>
          <div className="rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((s) => (
                  <TableRow key={s.skillId}>
                    <TableCell className="font-medium">
                      {s.name}
                      {s.description && (
                        <p className="max-w-md truncate text-xs font-normal text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.skillId}
                    </TableCell>
                    <TableCell>
                      {s.groupLabelName ? (
                        <Badge variant="outline">{s.groupLabelName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title="Total references across every table that tags against this skill"
                    >
                      {s.totalUsageCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {totalPages} — {data?.totalElements} skill
                {data?.totalElements === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <SkillFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        groupLabels={groupLabels ?? []}
      />

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be soft-deleted — hidden from every
              user-facing and admin-list view, but{" "}
              {deleteTarget && deleteTarget.totalUsageCount > 0 ? (
                <>
                  its {deleteTarget.totalUsageCount} existing reference
                  {deleteTarget.totalUsageCount === 1 ? "" : "s"} (user profiles, blog
                  posts, and so on) are preserved, not removed.
                </>
              ) : (
                <>it is currently unreferenced anywhere.</>
              )}{" "}
              There is no hard-delete option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.skillId)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
