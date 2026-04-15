"use client"

import { useState } from "react"
import { useAdminSubscriptions, useExtendSubscription } from "@/features/website/api/website-admin.hooks"
import { Loader2, Calendar, Plus } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PAST_DUE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PENDING_PAYMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
}

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminSubscriptions({ page, size: 20, status: statusFilter || undefined })
  const { mutate: extend } = useExtendSubscription()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage all website builder subscriptions</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
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
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Period End</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.content || []).map((sub) => (
                  <tr key={sub.subscriptionId}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{sub.subdomain}.revquix.com</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{sub.userName}</p>
                      <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{sub.planType}</td>
                    <td className="px-4 py-3 text-sm">₹{(sub.totalAmountInrPaise / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sub.status] || ""}`}>{sub.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const days = prompt("Extend by how many days?")
                          if (days && !isNaN(Number(days))) {
                            extend({ id: sub.subscriptionId, days: Number(days) })
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:text-blue-400"
                      >
                        <Plus className="h-3.5 w-3.5" /> Extend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

