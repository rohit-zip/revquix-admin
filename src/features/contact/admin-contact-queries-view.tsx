"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { Inbox, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useContactQueriesList } from "./api/contact.hooks"
import { SlaSummaryCard } from "./sla-summary-card"
import {
  CONTACT_QUERY_STATUS,
  AWAITING_LABELS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_OPTIONS,
  SOURCE_LABELS,
  type AwaitingParty,
  type ContactInquiryType,
  type ContactQueryResponse,
  type ContactQueryStatus,
  type SupportSource,
} from "./api/contact.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

function getStatusBadge(status: ContactQueryStatus) {
  const map: Record<
    ContactQueryStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    NEW: { variant: "destructive", label: "New" },
    IN_PROGRESS: { variant: "secondary", label: "In Progress" },
    COMPLETED: { variant: "outline", label: "Completed" },
    SPAM: { variant: "outline", label: "Spam" },
    ARCHIVED: { variant: "outline", label: "Archived" },
  }
  const info = map[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_TABS: { label: string; value: ContactQueryStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: CONTACT_QUERY_STATUS.NEW },
  { label: "In Progress", value: CONTACT_QUERY_STATUS.IN_PROGRESS },
  { label: "Completed", value: CONTACT_QUERY_STATUS.COMPLETED },
  { label: "Spam", value: CONTACT_QUERY_STATUS.SPAM },
  { label: "Archived", value: CONTACT_QUERY_STATUS.ARCHIVED },
]

const ALL_INQUIRY = "ALL"
const ALL_AWAITING = "ALL"
const ALL_SOURCE = "ALL"

export function AdminContactQueriesView() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState<ContactQueryStatus | "ALL">("ALL")
  const [inquiryType, setInquiryType] = useState<ContactInquiryType | typeof ALL_INQUIRY>(ALL_INQUIRY)
  const [awaiting, setAwaiting] = useState<AwaitingParty | typeof ALL_AWAITING>(ALL_AWAITING)
  const [source, setSource] = useState<SupportSource | typeof ALL_SOURCE>(ALL_SOURCE)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(handle)
  }, [searchInput])

  const statusFilter = activeTab === "ALL" ? undefined : activeTab
  const inquiryFilter = inquiryType === ALL_INQUIRY ? undefined : inquiryType

  const { data, isLoading, refetch, isRefetching } = useContactQueriesList({
    page,
    size: 20,
    status: statusFilter,
    inquiryType: inquiryFilter,
    awaitingParty: awaiting === ALL_AWAITING ? undefined : awaiting,
    source: source === ALL_SOURCE ? undefined : source,
    q: search || undefined,
  })

  const queries = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Contact Queries
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Triage, reply to, and resolve contact and support desk submissions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ContactQueryStatus | "ALL"); setPage(0) }}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ticket, or subject…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={inquiryType} onValueChange={(v) => { setInquiryType(v as ContactInquiryType | typeof ALL_INQUIRY); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All inquiry types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_INQUIRY}>All inquiry types</SelectItem>
            {INQUIRY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* The work queue. "Waiting on us" is every ticket where the member spoke last and
            nobody has answered — including replies that arrive on a ticket somebody already
            considered handled, which before Phase 2 simply landed in an inbox and were noticed
            or not. */}
        <Select value={awaiting} onValueChange={(v) => { setAwaiting(v as AwaitingParty | typeof ALL_AWAITING); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Anyone waiting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_AWAITING}>Anyone waiting</SelectItem>
            {(Object.keys(AWAITING_LABELS) as AwaitingParty[]).map((value) => (
              <SelectItem key={value} value={value}>
                {AWAITING_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sales leads and support tickets share this table. Without this the inbox is one
            undifferentiated queue and the SLA cannot be reported for the audience we promised
            it to. */}
        <Select value={source} onValueChange={(v) => { setSource(v as SupportSource | typeof ALL_SOURCE); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Any source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SOURCE}>Any source</SelectItem>
            {(Object.keys(SOURCE_LABELS) as SupportSource[]).map((value) => (
              <SelectItem key={value} value={value}>
                {SOURCE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* The report sits above the queue: how we are doing, then what there is to do. */}
      <SlaSummaryCard />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {data?.totalElements ?? 0} quer{data?.totalElements === 1 ? "y" : "ies"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : queries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No contact queries found
                  </TableCell>
                </TableRow>
              ) : (
                queries.map((query: ContactQueryResponse) => (
                  <TableRow
                    key={query.contactQueryId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      router.push(`${PATH_CONSTANTS.ADMIN_CONTACT_QUERIES}/${query.contactQueryId}`)
                    }
                  >
                    <TableCell className="font-mono text-xs">{query.ticketRef}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{query.name}</p>
                        <p className="text-xs text-muted-foreground">{query.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{INQUIRY_TYPE_LABELS[query.inquiryType]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">
                      {query.subject ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(query.status)}</TableCell>
                    <TableCell className="text-sm">{query.repliesCount}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(query.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
