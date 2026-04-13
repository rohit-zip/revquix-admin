"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getMentorReport, type MentorReportResponse } from "@/features/professional-mentor/api/admin-reports.api"
import { Search, Star, Calendar, Video, CheckCircle, XCircle, AlertCircle, Wifi } from "lucide-react"
import { toast } from "sonner"

export default function AdminMentorReportsView() {
  const [mentorUserId, setMentorUserId] = useState("")
  const [report, setReport] = useState<MentorReportResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!mentorUserId.trim()) {
      toast.error("Please enter a mentor user ID")
      return
    }
    setLoading(true)
    try {
      const data = await getMentorReport(mentorUserId.trim())
      setReport(data)
    } catch {
      toast.error("Failed to load mentor report. Check the user ID.")
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentor Performance Reports</h1>
        <p className="text-muted-foreground">
          View detailed performance metrics for professional mentors.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Mentor</CardTitle>
          <CardDescription>Enter a mentor&apos;s user ID to view their performance report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter mentor user ID..."
              value={mentorUserId}
              onChange={(e) => setMentorUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Loading..." : "View Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Mentor Info */}
          <Card>
            <CardHeader>
              <CardTitle>{report.mentorName ?? "Unknown Mentor"}</CardTitle>
              <CardDescription>{report.mentorEmail}</CardDescription>
            </CardHeader>
          </Card>

          {/* Session Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <p className="text-3xl font-bold mt-2">{report.totalSessions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <p className="text-3xl font-bold mt-2">{report.completedSessions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
                <p className="text-3xl font-bold mt-2">{report.cancelledSessions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">No-Shows</p>
                </div>
                <p className="text-3xl font-bold mt-2">{report.noShowSessions}</p>
              </CardContent>
            </Card>
          </div>

          {/* Join Rate & Ratings */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Join Rate
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {report.sessionsWithMentorJoinEvent} of {report.totalSessions} sessions
                    </span>
                    <span className="text-sm font-medium">{report.mentorJoinRatePercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={report.mentorJoinRatePercent} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Ratings
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{report.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">/ 5.0</span>
                  <span className="text-sm text-muted-foreground">({report.totalRatingsReceived} ratings)</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{star} ★</span>
                      <Progress
                        value={report.totalRatingsReceived > 0
                          ? ((report.ratingDistribution[star] ?? 0) / report.totalRatingsReceived) * 100
                          : 0}
                        className="h-2"
                      />
                      <span className="w-6 text-right text-muted-foreground">
                        {report.ratingDistribution[star] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Google Calendar Integration
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Connection Status:</span>
                <Badge variant={report.googleCalendarConnected ? "default" : "secondary"}>
                  {report.googleCalendarConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">OAuth Sessions</p>
                  <p className="text-xl font-semibold">{report.oauthMeetingSessions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manual Sessions</p>
                  <p className="text-xl font-semibold">{report.manualMeetingSessions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OAuth Adoption</p>
                  <p className="text-xl font-semibold">{report.oauthAdoptionPercent.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

