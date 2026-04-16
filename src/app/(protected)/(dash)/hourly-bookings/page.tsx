"use client"

import PageGuard from "@/components/page-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function AdminHourlyBookingsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Hourly Sessions
            </CardTitle>
            <CardDescription>
              Admin view of all hourly mentoring sessions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Admin hourly sessions list view coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageGuard>
  )
}

