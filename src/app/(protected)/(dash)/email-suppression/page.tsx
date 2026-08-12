"use client"

import PageGuard from "@/components/page-guard"
import SuppressionConsoleView from "@/features/suppression/suppression-console-view"

export default function EmailSuppressionPage() {
  return (
    <PageGuard>
      <SuppressionConsoleView />
    </PageGuard>
  )
}
