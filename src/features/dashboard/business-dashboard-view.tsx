import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Settings,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

const BUSINESS_DATA = {
  projects: [
    { name: "E-Commerce Platform", status: "Development", progress: 60, milestone: "API Integration", delivery: "Apr 15, 2026", pm: "Sudhanshu V." },
    { name: "Mobile App (iOS/Android)", status: "Design", progress: 35, milestone: "UI Prototyping", delivery: "May 30, 2026", pm: "Rohit P." },
    { name: "Marketing Website", status: "QA", progress: 85, milestone: "Final Testing", delivery: "Mar 28, 2026", pm: "Sudhanshu V." },
  ],
  services: [
    { label: "Software Development", Icon: Zap },
    { label: "Mobile App Dev", Icon: Video },
    { label: "Website Development", Icon: Activity },
    { label: "AI Automation", Icon: TrendingUp },
    { label: "DevOps Consulting", Icon: Settings },
    { label: "UI/UX Design", Icon: Edit },
    { label: "Digital Marketing", Icon: BarChart3 },
    { label: "Corporate Training", Icon: Award },
  ],
  documents: [
    { name: "Service Proposal – E-Commerce", type: "Proposal", date: "Mar 10, 2026" },
    { name: "Invoice #INV-2026-001", type: "Invoice", date: "Mar 15, 2026" },
    { name: "Non-Disclosure Agreement", type: "NDA", date: "Mar 5, 2026" },
    { name: "Requirements Document v2", type: "Spec", date: "Mar 12, 2026" },
  ],
  updates: [
    { text: "Sprint 3 update posted for E-Commerce Platform", time: "1 hour ago", color: "bg-primary" },
    { text: "Invoice #INV-2026-001 generated (₹1,20,000)", time: "2 days ago", color: "bg-green-500" },
    { text: "Design milestone approved for Mobile App", time: "3 days ago", color: "bg-yellow-500" },
    { text: "Marketing Website moved to QA stage", time: "4 days ago", color: "bg-primary/50" },
  ],
}

const STATUS_COLORS: Record<string, string> = {
  Discovery: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Design: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Development: "bg-primary/10 text-primary",
  QA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

const BusinessDashboardView = () => {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl border bg-card p-5 lg:p-6">
        <h2 className="text-xl font-semibold">Welcome back, Acme Corp 🏢</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your projects, request services, and collaborate with the Revquix team.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Start New Project</Button>
          <Button size="sm" variant="outline"><Calendar className="h-3.5 w-3.5" /> Book Consultation</Button>
          <Button size="sm" variant="outline"><MessageSquare className="h-3.5 w-3.5" /> Contact Team</Button>
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Active Projects</h3>
          <Link href="/business/projects" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {BUSINESS_DATA.projects.map((project) => (
            <Card key={project.name}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm leading-snug">{project.name}</p>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                    STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground")}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.progress}% complete</span>
                    <span>Due {project.delivery}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Next: {project.milestone}</p>
                <Separator />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {project.pm.charAt(0)}
                  </span>
                  <span>{project.pm}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Request Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Request a Service</CardTitle>
          <CardDescription>Start a new service engagement with Revquix.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUSINESS_DATA.services.map((s) => {
              const ServiceIcon = s.Icon
              return (
                <Link key={s.label} href="/business/new-request"
                      className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center hover:bg-muted transition-colors">
                  <ServiceIcon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents + Updates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Link href="/business/documents" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {BUSINESS_DATA.documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px]">{doc.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Updates</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {BUSINESS_DATA.updates.map((u, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", u.color)} />
                  <div>
                    <p className="text-sm">{u.text}</p>
                    <p className="text-xs text-muted-foreground">{u.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BusinessDashboardView