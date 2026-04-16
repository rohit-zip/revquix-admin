"use client"

import { useState } from "react"
import { useAdminWebsites, useSuspendWebsite, useUnsuspendWebsite } from "@/features/website/api/website-admin.hooks"
import { Loader2, Search, Ban, CheckCircle2 } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export default function AdminWebsitesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminWebsites({ page, size: 20, status: statusFilter || undefined, search: search || undefined })
  const { mutate: suspend } = useSuspendWebsite()
  const { mutate: unsuspend } = useUnsuspendWebsite()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All Websites</h1>
        <p className="text-sm text-muted-foreground">View and manage all user websites on the platform</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search subdomain, user..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Site</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Template</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.content || []).map((site) => (
                  <tr key={site.websiteId}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{site.siteTitle || site.subdomain}</p>
                      <p className="text-xs text-muted-foreground">{site.subdomain}.revquix.com</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{site.userName}</p>
                      <p className="text-xs text-muted-foreground">{site.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{site.templateName || "Custom"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[site.status]}`}>{site.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(site.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {site.status === "SUSPENDED" ? (
                        <button onClick={() => unsuspend(site.websiteId)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Unsuspend
                        </button>
                      ) : site.status !== "EXPIRED" ? (
                        <button
                          onClick={() => {
                            const reason = prompt("Suspension reason:")
                            if (reason) suspend({ id: site.websiteId, request: { reason } })
                          }}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Ban className="h-3.5 w-3.5" /> Suspend
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">{data?.totalElements} total sites</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50">Previous</button>
                <span className="px-3 py-1.5 text-xs">Page {page + 1}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages || 1) - 1} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

