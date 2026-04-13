"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminApplicationDetailView from "@/features/mentor-application/admin-application-detail-view"

export default function MentorApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = use(params)
  return (
    <PageGuard>
      <AdminApplicationDetailView applicationId={applicationId} />
    </PageGuard>
  )
}

