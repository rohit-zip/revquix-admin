"use client"

/**
 * LeadMailCampaignsView — campaign history (requirement 6).
 *
 * The backend list endpoint, its response type and the `useLeadMailCampaignList` hook all existed
 * before this file and were imported by nothing: the page was simply never built, so there was no way
 * to see past campaigns at all. This is that page.
 *
 * Filters and the page index live in component state rather than the URL. That is a deliberate
 * limitation for now — it means a filtered view cannot be linked or bookmarked — and is the smaller
 * cost against pulling in URL-state plumbing that no other admin surface here uses.
 */

import { useMemo, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { Copy, FileText, Loader2, Plus, Search, Send, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useCloneLeadMailCampaign,
  useDeleteLeadMailDraft,
  useLeadMailCampaignList,
} from "./api/lead-mail.hooks"
import {
  LEAD_MAIL_CAMPAIGN_STATUS,
  LEAD_MAIL_SEND_METHOD,
  type LeadMailCampaignListFilters,
  type LeadMailCampaignListItemResponse,
  type LeadMailCampaignStatus,
  type LeadMailSendMethod,
} from "./api/lead-mail.types"
import { CampaignStatusBadge, formatDateTime } from "./components/lead-mail-badges"
import { TablePagination } from "./components/table-pagination"
import { useDebouncedValue } from "./use-debounced-value"

const PAGE_SIZE = 20

/** Sentinel for "no filter". Radix Select cannot hold an empty-string value. */
const ANY = "__any__"

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: ANY, label: "Any status" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.DRAFT, label: "Draft" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.QUEUED, label: "Queued" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.SENDING, label: "Sending" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.PAUSED, label: "Paused" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.COMPLETED, label: "Completed" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.PARTIAL_FAILURE, label: "Partial failure" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.CANCELLED, label: "Cancelled" },
  { value: LEAD_MAIL_CAMPAIGN_STATUS.INTERRUPTED, label: "Interrupted" },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "campaignName,asc", label: "Name A–Z" },
  { value: "recipientCount,desc", label: "Most recipients" },
  { value: "failedCount,desc", label: "Most failures" },
]

export function LeadMailCampaignsView() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ANY)
  const [sendMethod, setSendMethod] = useState<string>(ANY)
  const [sort, setSort] = useState("createdAt,desc")
  const [page, setPage] = useState(0)

  // Debounced so typing does not fire a request per keystroke. The backend ignores a `q` shorter than
  // two characters, so a single character is not sent as a filter at all.
  const debouncedSearch = useDebouncedValue(search, 300)

  const filters: LeadMailCampaignListFilters = useMemo(
    () => ({
      q: debouncedSearch.trim().length >= 2 ? debouncedSearch.trim() : undefined,
      status: status === ANY ? undefined : [status as LeadMailCampaignStatus],
      sendMethod: sendMethod === ANY ? undefined : (sendMethod as LeadMailSendMethod),
      sort,
    }),
    [debouncedSearch, status, sendMethod, sort],
  )

  const { data, isLoading, isFetching } = useLeadMailCampaignList(page, PAGE_SIZE, filters)
  const cloneCampaign = useCloneLeadMailCampaign()
  const deleteDraft = useDeleteLeadMailDraft()

  const hasFilters = search.trim().length > 0 || status !== ANY || sendMethod !== ANY
  const campaigns = data?.content ?? []

  // Any filter change invalidates the current page index — page 4 of an unfiltered list is rarely a
  // valid page of the filtered one, and leaving it would show an empty table for a non-empty result.
  const applyFilter = (apply: () => void) => {
    apply()
    setPage(0)
  }

  const openCampaign = (campaignId: string) => {
    router.push(`${PATH_CONSTANTS.ADMIN_LEAD_MAIL_CAMPAIGN_DETAIL}/${campaignId}`)
  }

  const handleClone = (campaignId: string) => {
    cloneCampaign.mutate(campaignId, {
      onSuccess: (draft) => openCampaign(draft.leadMailCampaignId),
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Campaign history</CardTitle>
            <Button size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_LEAD_MAIL_COMPOSE)}>
              <Plus className="size-4" /> New campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => applyFilter(() => setSearch(e.target.value))}
                placeholder="Search name, subject or campaign id"
                className="pl-8"
                aria-label="Search campaigns"
              />
            </div>

            <Select value={status} onValueChange={(v) => applyFilter(() => setStatus(v))}>
              <SelectTrigger className="w-[170px]" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sendMethod} onValueChange={(v) => applyFilter(() => setSendMethod(v))}>
              <SelectTrigger className="w-[150px]" aria-label="Filter by send method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any method</SelectItem>
                <SelectItem value={LEAD_MAIL_SEND_METHOD.ZEPTO_MAIL}>ZeptoMail</SelectItem>
                <SelectItem value={LEAD_MAIL_SEND_METHOD.SMTP}>SMTP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => applyFilter(() => setSort(v))}>
              <SelectTrigger className="w-[170px]" aria-label="Sort campaigns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  applyFilter(() => {
                    setSearch("")
                    setStatus(ANY)
                    setSendMethod(ANY)
                  })
                }
              >
                <X className="size-4" /> Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onCompose={() => router.push(PATH_CONSTANTS.ADMIN_LEAD_MAIL_COMPOSE)} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <CampaignRow
                        key={campaign.leadMailCampaignId}
                        campaign={campaign}
                        onOpen={() => openCampaign(campaign.leadMailCampaignId)}
                        onClone={() => handleClone(campaign.leadMailCampaignId)}
                        onDelete={() => deleteDraft.mutate(campaign.leadMailCampaignId)}
                        isBusy={cloneCampaign.isPending || deleteDraft.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                page={data?.number ?? 0}
                totalPages={data?.totalPages ?? 0}
                totalElements={data?.totalElements ?? 0}
                pageSize={data?.size ?? PAGE_SIZE}
                onPageChange={setPage}
                isLoading={isFetching}
                itemLabel="campaigns"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CampaignRow({
  campaign,
  onOpen,
  onClone,
  onDelete,
  isBusy,
}: {
  campaign: LeadMailCampaignListItemResponse
  onOpen: () => void
  onClone: () => void
  onDelete: () => void
  isBusy: boolean
}) {
  const isDraft = campaign.status === LEAD_MAIL_CAMPAIGN_STATUS.DRAFT
  const settled = campaign.sentCount + campaign.failedCount + (campaign.skippedCount ?? 0)

  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="max-w-[280px]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {campaign.campaignName ?? campaign.subject ?? "Untitled campaign"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {campaign.subject ?? <span className="italic">No subject yet</span>}
          </p>
        </div>
      </TableCell>

      <TableCell>
        <CampaignStatusBadge status={campaign.status} />
      </TableCell>

      <TableCell className="text-right text-xs">
        {isDraft ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="space-y-0.5">
            <p className="font-medium">
              {settled} / {campaign.recipientCount}
            </p>
            <p className="text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">{campaign.sentCount} sent</span>
              {campaign.failedCount > 0 && (
                <span className="text-rose-600 dark:text-rose-400"> · {campaign.failedCount} failed</span>
              )}
              {(campaign.skippedCount ?? 0) > 0 && <span> · {campaign.skippedCount} skipped</span>}
            </p>
          </div>
        )}
      </TableCell>

      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {campaign.sendMethod === LEAD_MAIL_SEND_METHOD.SMTP ? "SMTP" : "ZeptoMail"}
        </Badge>
      </TableCell>

      {/* The resolved name, never the raw USR id — an audit column nobody can read is not an audit
          column. Falls back to the id only when the account no longer resolves. */}
      <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
        {campaign.createdByName ?? campaign.createdBy}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {formatDateTime(campaign.createdAt)}
      </TableCell>

      <TableCell className="text-right">
        {/* stopPropagation, or every action click would also navigate to the detail page. */}
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {isDraft ? (
            <>
              <Button variant="ghost" size="sm" onClick={onOpen} title="Open draft">
                <FileText className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isBusy}
                title="Delete draft"
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onOpen} title="View send report">
                <Send className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClone} disabled={isBusy} title="Copy to a new draft">
                <Copy className="size-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyState({ hasFilters, onCompose }: { hasFilters: boolean; onCompose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Send className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{hasFilters ? "No matching campaigns" : "No campaigns yet"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasFilters
            ? "Try clearing the filters above."
            : "Campaigns you send will appear here with their delivery report."}
        </p>
      </div>
      {!hasFilters && (
        <Button size="sm" onClick={onCompose}>
          <Plus className="size-4" /> New campaign
        </Button>
      )}
    </div>
  )
}
