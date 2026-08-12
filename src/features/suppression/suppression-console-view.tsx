"use client"

/**
 * ─── EMAIL SUPPRESSION CONSOLE ────────────────────────────────────────────────
 *
 * The marketing do-not-mail list.
 *
 * ─── What this screen is for, and what it is NOT ───
 * It is a window onto a guarantee that is enforced elsewhere. Suppression is applied in three
 * places in the backend — audience resolution, `persistRecipients`, and a per-message re-check in
 * the campaign worker — and none of them consults this page. Nothing an operator does or fails to
 * do here can cause a suppressed address to be mailed.
 *
 * So the screen exists for the two jobs the enforcement cannot do by itself:
 *
 *   1. Honouring opt-outs that arrive OUTSIDE the product — someone replying "take me off this
 *      list" to a campaign, or asking in a support ticket. Without a way to record those, the list
 *      only respects the opt-outs that happen to come through the button.
 *   2. Answering "why is this person not receiving our email?" with a date, a reason and a source.
 *
 * ─── Reactivation is the dangerous action and is treated as one ───
 * It is the only control here that lets Revquix mail somebody who asked it not to. It sits behind a
 * confirmation that names the address and states the consequence, the API audits it with the
 * admin's id, and nothing is ever deleted — the history is the evidence that an address was
 * suppressed between two dates, which is the only artefact that matters if a complaint is raised.
 *
 * ⚠ The note column is untrusted free text from an unauthenticated public endpoint. Rendered as
 *   text, always. The CSV export additionally defuses spreadsheet-formula prefixes server-side.
 */

import React from "react"
import {
  AlertTriangle,
  Download,
  History,
  MailX,
  Plus,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/features/lead-mail/components/table-pagination"

import {
  useAddSuppression,
  useDownloadSuppressionCsv,
  useReactivateSuppression,
  useSuppressionHistory,
  useSuppressions,
} from "./api/suppression.hooks"
import type {
  EmailSuppression,
  EmailSuppressionReason,
  EmailSuppressionSource,
} from "./api/suppression.types"

const PAGE_SIZE = 50

/**
 * Reason → how it reads and how alarming it looks.
 *
 * `HARD_BOUNCE` and `SPAM_COMPLAINT` are destructive variants because they are signals about the
 * sending domain's health, not just about one person: a rising bounce count is the early warning
 * before deliverability collapses. `UNSUBSCRIBED` is a normal, healthy outcome and is styled as one
 * — an operator should not read a working opt-out as a problem.
 */
const REASON_META: Record<
  EmailSuppressionReason,
  { label: string; variant: "secondary" | "destructive" | "outline" }
> = {
  UNSUBSCRIBED: { label: "Unsubscribed", variant: "secondary" },
  HARD_BOUNCE: { label: "Hard bounce", variant: "destructive" },
  SPAM_COMPLAINT: { label: "Spam complaint", variant: "destructive" },
  MANUAL: { label: "Added by admin", variant: "outline" },
}

const SOURCE_LABEL: Record<EmailSuppressionSource, string> = {
  EMAIL_LINK: "Unsubscribe page",
  ONE_CLICK_HEADER: "One-click (mail client)",
  ADMIN: "Admin",
  PROVIDER_WEBHOOK: "Provider webhook",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export default function SuppressionConsoleView() {
  const [page, setPage] = React.useState(0)
  const [addOpen, setAddOpen] = React.useState(false)
  const [historyFor, setHistoryFor] = React.useState<string | null>(null)
  const [reactivating, setReactivating] = React.useState<EmailSuppression | null>(null)

  const { data, isLoading } = useSuppressions(page, PAGE_SIZE)
  const exportCsv = useDownloadSuppressionCsv()
  const reactivate = useReactivateSuppression()

  const rows = data?.content ?? []

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Email suppression</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Addresses that will never receive marketing email. Enforced automatically on every
            campaign — this list is the record, not the switch.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exportCsv.isPending}
            onClick={() => exportCsv.mutate()}
          >
            <Download className="h-3.5 w-3.5" />
            {exportCsv.isPending ? "Exporting…" : "Export CSV"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add address
          </Button>
        </div>
      </div>

      {/*
        Stated on the screen rather than left to tribal knowledge. "Does unsubscribing stop their
        receipts?" is the question every operator asks once, and getting it wrong in either
        direction causes real harm — someone who thinks it blocks OTPs will avoid using it.
      */}
      <div className="flex items-start gap-2.5 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Suppression applies to marketing and outreach email only. Sign-in codes, receipts and
          booking notifications still reach these addresses — that split is standard and
          deliberate.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Active suppressions
            {typeof data?.totalElements === "number" && (
              <span className="ml-2 font-normal text-muted-foreground">
                ({data.totalElements})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : rows.length === 0 ? (
            <div className="py-10 text-center">
              <MailX className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Nobody has unsubscribed yet.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Their note</TableHead>
                    <TableHead className="text-right">Suppressed</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.emailSuppressionId}>
                      <TableCell className="font-mono text-xs">{row.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={REASON_META[row.reason]?.variant ?? "outline"}
                          className="text-[10px]"
                        >
                          {REASON_META[row.reason]?.label ?? row.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {SOURCE_LABEL[row.source] ?? row.source}
                      </TableCell>
                      {/*
                        Plain text interpolation. This is unauthenticated public input and must
                        never reach dangerouslySetInnerHTML. Truncated because a 500-character
                        rant would blow the row height out; the full text is in the CSV.
                      */}
                      <TableCell
                        className="max-w-[18rem] truncate text-xs text-muted-foreground"
                        title={row.note ?? undefined}
                      >
                        {row.note || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => setHistoryFor(row.email)}
                          >
                            <History className="h-3 w-3" />
                            History
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                            onClick={() => setReactivating(row)}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <TablePagination
                  page={page}
                  totalPages={data?.totalPages ?? 1}
                  totalElements={data?.totalElements ?? rows.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  isLoading={isLoading}
                  itemLabel="addresses"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddSuppressionDialog open={addOpen} onOpenChange={setAddOpen} />

      <HistoryDialog email={historyFor} onClose={() => setHistoryFor(null)} />

      <AlertDialog
        open={!!reactivating}
        onOpenChange={(open) => !open && setReactivating(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Let this address receive marketing email again?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="font-mono text-xs">{reactivating?.email}</span> asked not to be
                  mailed
                  {reactivating ? ` on ${formatDate(reactivating.createdAt)}` : ""}
                  {reactivating?.reason
                    ? ` (${(REASON_META[reactivating.reason]?.label ?? reactivating.reason).toLowerCase()})`
                    : ""}
                  .
                </p>
                {/*
                  Named plainly. Reactivating without the recipient having asked is the action most
                  likely to produce a spam complaint, and a complaint costs the sending domain far
                  more than one recipient is worth.
                */}
                <p>
                  Only do this if they have asked to be re-subscribed. Your name and the time are
                  recorded against the entry.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={reactivate.isPending}
              onClick={() => {
                if (reactivating) {
                  reactivate.mutate(reactivating.emailSuppressionId)
                }
                setReactivating(null)
              }}
            >
              {reactivate.isPending ? "Reactivating…" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Add by hand ──────────────────────────────────────────────────────────────

function AddSuppressionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [email, setEmail] = React.useState("")
  const [note, setNote] = React.useState("")
  const add = useAddSuppression()

  // Cleared on close rather than on open, so a failed submit keeps what was typed and the operator
  // does not have to retype an address to correct one character of it.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEmail("")
      setNote("")
    }
    onOpenChange(next)
  }

  const submit = () => {
    if (!email.trim()) return
    add.mutate(
      { email: email.trim(), note: note.trim() || undefined },
      { onSuccess: () => handleOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an address to the suppression list</DialogTitle>
          <DialogDescription>
            For opt-outs that arrived outside the product — a reply to a campaign, or a support
            ticket. They will stop receiving marketing email immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="suppression-email">Email address</Label>
            <Input
              id="suppression-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="someone@example.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suppression-note">
              Why <span className="text-muted-foreground">(recommended)</span>
            </Label>
            <Textarea
              id="suppression-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              placeholder="Replied to the July campaign asking to be removed"
            />
            {/*
              Optional in the schema, pressed for here. A manual suppression with no note is
              indistinguishable six months later from somebody's mistake.
            */}
            <p className="text-xs text-muted-foreground">
              Without a note, nobody will be able to tell later whether this was deliberate.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!email.trim() || add.isPending} onClick={submit}>
            {add.isPending ? "Adding…" : "Add to list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * Every row for one address, active or not.
 *
 * Reactivated entries are included on purpose: showing only the active one would present an
 * address that was suppressed and later re-subscribed as one that was never on the list, which is
 * exactly the question this drawer exists to answer.
 */
function HistoryDialog({ email, onClose }: { email: string | null; onClose: () => void }) {
  const { data, isLoading } = useSuppressionHistory(email)

  return (
    <Dialog open={!!email} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Suppression history</DialogTitle>
          <DialogDescription className="font-mono text-xs">{email}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No suppression history for this address.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Suppressed</TableHead>
                <TableHead>Reactivated</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.emailSuppressionId}>
                  <TableCell>
                    <Badge
                      variant={REASON_META[row.reason]?.variant ?? "outline"}
                      className="text-[10px]"
                    >
                      {REASON_META[row.reason]?.label ?? row.reason}
                    </Badge>
                    {row.active && (
                      <Badge variant="default" className="ml-1.5 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {SOURCE_LABEL[row.source] ?? row.source}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {formatDate(row.reactivatedAt)}
                  </TableCell>
                  {/*
                    `self:<address>` for a recipient who used the "this was a mistake" link, an
                    admin id otherwise. The distinction matters: reading a self-service resubscribe
                    as an administrator overriding an opt-out would be the wrong conclusion.
                  */}
                  <TableCell className="text-xs text-muted-foreground">
                    {row.reactivatedBy?.startsWith("self:")
                      ? "Themselves"
                      : row.reactivatedBy || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
