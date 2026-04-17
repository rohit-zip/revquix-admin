"use client"

import { useResumeReviewAnalytics } from "./api/resume-review.hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, IndianRupee, Star, FileCheck, Users } from "lucide-react"

export default function AdminResumeReviewAnalyticsView() {
  const { data: analytics, isLoading } = useResumeReviewAnalytics()

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!analytics) return <div className="text-center p-12 text-muted-foreground">No analytics data</div>

  const statCards = [
    { label: "Total Reviews", value: analytics.totalReviews, icon: Users, color: "text-blue-500" },
    { label: "Completed", value: analytics.completedReviews, icon: FileCheck, color: "text-green-500" },
    { label: "Avg Score", value: `${analytics.avgOverallScore.toFixed(1)}/100`, icon: Star, color: "text-yellow-500" },
    { label: "Avg Turnaround", value: `${analytics.avgTurnaroundHours.toFixed(1)}h`, icon: Clock, color: "text-purple-500" },
    { label: "Total Revenue", value: `₹${(analytics.totalRevenueMinor / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Review Analytics</h1>
        <p className="text-muted-foreground">Overview of resume review performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* By Plan */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Reviews by Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.reviewsByPlan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm font-medium">{plan}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${analytics.totalReviews > 0 ? ((count as number) / analytics.totalReviews) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Reviews by Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(analytics.reviewsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 rounded-lg border p-3 min-w-[140px]">
                <div>
                  <p className="text-xs text-muted-foreground">{status.replace(/_/g, " ")}</p>
                  <p className="text-xl font-bold">{count as number}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

