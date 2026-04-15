"use client"

import { usePlatformStats } from "@/features/website/api/website-admin.hooks"
import { Loader2, Globe, TrendingUp, DollarSign, Shield, Eye, Users, Wifi, Droplets } from "lucide-react"

export default function AdminWebsiteStatsPage() {
  const { data: stats, isLoading } = usePlatformStats()

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!stats) return null

  const statCards = [
    { label: "Total Websites", value: stats.totalWebsites.toLocaleString(), icon: Globe, color: "text-blue-500" },
    { label: "Published", value: stats.publishedWebsites.toLocaleString(), icon: TrendingUp, color: "text-green-500" },
    { label: "Suspended", value: stats.suspendedWebsites.toLocaleString(), icon: Shield, color: "text-red-500" },
    { label: "MRR (INR)", value: `₹${(stats.totalMrrInrPaise / 100).toLocaleString()}`, icon: DollarSign, color: "text-yellow-500" },
    { label: "Active Subscriptions", value: stats.totalActiveSubscriptions.toLocaleString(), icon: Users, color: "text-purple-500" },
    { label: "Custom Domains", value: stats.totalCustomDomains.toLocaleString(), icon: Globe, color: "text-cyan-500" },
    { label: "Watermark Removals", value: stats.totalWatermarkRemovals.toLocaleString(), icon: Eye, color: "text-orange-500" },
    { label: "Page Views (30d)", value: stats.totalPageViews30d.toLocaleString(), icon: Eye, color: "text-teal-500" },
    { label: "Cloudflare Slots Used", value: `${stats.cloudflareSlotsUsed} / ${stats.cloudflareSlotsUsed + stats.cloudflareSlotsFree}`, icon: Wifi, color: "text-indigo-500" },
    { label: "Watermark Click-throughs", value: stats.watermarkClickThroughs.toLocaleString(), icon: Droplets, color: "text-pink-500" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Website Builder Stats</h1>
        <p className="text-sm text-muted-foreground">Platform-wide metrics for the website builder feature</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border bg-card p-5">
              <Icon className={`mb-3 h-6 w-6 ${card.color}`} />
              <p className="text-xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

