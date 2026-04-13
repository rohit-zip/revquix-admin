import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle,
  ChevronRight,
  Circle,
  Edit,
  FileText,
  Star,
  Users,
  Video,
} from "lucide-react"

const PROFESSIONAL_DATA = {
  profileChecklist: [
    { label: "Basic info added", done: true },
    { label: "Resume uploaded", done: true },
    { label: "LinkedIn connected", done: false },
    { label: "Portfolio published", done: false },
    { label: "Career goal selected", done: true },
  ],
  upcomingBookings: [
    {
      type: "Mock Interview",
      mentor: "Priya Sharma",
      role: "SDE III @ Google",
      date: "Today, 4:00 PM",
      tag: "In 2 hrs",
    },
    {
      type: "Career Mentorship",
      mentor: "Rahul Gupta",
      role: "Eng. Manager @ Flipkart",
      date: "Thu, 22 Mar · 11:00 AM",
      tag: "3 days",
    },
  ],
  portfolio: {
    status: "draft",
    views: 0,
    lastUpdated: "3 days ago",
    domain: "akash.revquix.io",
  },
  mentors: [
    { name: "Priya Sharma", title: "SDE III @ Google", rating: 4.9, price: 799, domain: "Frontend", available: "Tomorrow" },
    { name: "Arjun Mehta", title: "Product Manager @ Microsoft", rating: 4.8, price: 999, domain: "Product", available: "Thu, 22 Mar" },
    { name: "Sneha Reddy", title: "Data Scientist @ Amazon", rating: 4.7, price: 699, domain: "Data", available: "Fri, 23 Mar" },
  ],
  careerTools: [
    { label: "Mock Interview", Icon: Video, href: "/mentorship/explore" },
    { label: "Resume Review", Icon: FileText, href: "/mentorship/explore" },
    { label: "LinkedIn Review", Icon: Users, href: "/mentorship/explore" },
    { label: "Career Mentorship", Icon: Award, href: "/mentorship/explore" },
  ],
  activities: [
    { text: "Session booked with Priya Sharma", time: "2 hours ago", color: "bg-primary" },
    { text: "Payment of ₹799 completed", time: "2 hours ago", color: "bg-green-500" },
    { text: "Portfolio draft saved", time: "3 days ago", color: "bg-yellow-500" },
    { text: "Profile 75% complete", time: "5 days ago", color: "bg-primary/50" },
  ],
}

const ProfessionalDashboardView = () => {
  const completedCount = PROFESSIONAL_DATA.profileChecklist.filter((i) => i.done).length
  const totalCount = PROFESSIONAL_DATA.profileChecklist.length
  const completionPct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl border bg-card p-5 lg:p-6">
        <h2 className="text-xl font-semibold">Welcome back, Akash 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your profile, book a mock interview, and publish your portfolio.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm"><Calendar className="h-3.5 w-3.5" /> Book a Session</Button>
          <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /> Edit Portfolio</Button>
          <Button size="sm" variant="outline"><Users className="h-3.5 w-3.5" /> Explore Mentors</Button>
        </div>
      </div>

      {/* Profile Completion + Upcoming Bookings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>Complete your profile to get the most out of Revquix.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{completionPct}%</span>
              <span className="mb-0.5 text-sm text-muted-foreground">{completedCount}/{totalCount} complete</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${completionPct}%` }} />
            </div>
            <ul className="space-y-2">
              {PROFESSIONAL_DATA.profileChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done
                    ? <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your next scheduled sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROFESSIONAL_DATA.upcomingBookings.map((b, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{b.type}</p>
                    <p className="text-xs text-muted-foreground">{b.mentor} · {b.role}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{b.tag}</span>
                </div>
                <p className="text-xs text-muted-foreground">{b.date}</p>
                <div className="flex gap-2 pt-0.5">
                  <Button size="xs">Join</Button>
                  <Button size="xs" variant="outline">Reschedule</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>Your public portfolio status.</CardDescription>
            </div>
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium",
              PROFESSIONAL_DATA.portfolio.status === "live"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")}>
              {PROFESSIONAL_DATA.portfolio.status === "live" ? "Live" : "Draft"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 divide-x rounded-lg border">
            <div className="py-3 text-center">
              <p className="text-xl font-bold">{PROFESSIONAL_DATA.portfolio.views}</p>
              <p className="text-xs text-muted-foreground">Views this month</p>
            </div>
            <div className="px-2 py-3 text-center">
              <p className="truncate text-sm font-medium">{PROFESSIONAL_DATA.portfolio.domain}</p>
              <p className="text-xs text-muted-foreground">Domain</p>
            </div>
            <div className="py-3 text-center">
              <p className="text-sm font-medium">{PROFESSIONAL_DATA.portfolio.lastUpdated}</p>
              <p className="text-xs text-muted-foreground">Last updated</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /> Edit</Button>
            <Button size="sm"><ArrowUpRight className="h-3.5 w-3.5" /> Publish</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Mentors */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recommended Mentors</h3>
          <Link href="/mentorship/explore" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROFESSIONAL_DATA.mentors.map((m) => (
            <Card key={m.name} size="sm">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{m.rating}
                  </span>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-secondary-foreground">{m.domain}</span>
                  <span>₹{m.price}/hr</span>
                </div>
                <p className="text-xs text-muted-foreground">Next: {m.available}</p>
                <Button size="xs" className="w-full">Book Session</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Career Tools + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Career Tools</CardTitle>
            <CardDescription>Quick shortcuts to get help.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {PROFESSIONAL_DATA.careerTools.map((tool) => {
                const ToolIcon = tool.Icon
                return (
                  <Link key={tool.label} href={tool.href}
                        className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center hover:bg-muted transition-colors">
                    <ToolIcon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{tool.label}</span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PROFESSIONAL_DATA.activities.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.color)} />
                  <div>
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
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

export default ProfessionalDashboardView