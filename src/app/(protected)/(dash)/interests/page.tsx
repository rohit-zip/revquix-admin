"use client"

import PageGuard from "@/components/page-guard"
import InterestConsoleView from "@/features/interest/interest-console-view"

export default function InterestOverviewPage() {
  return (
    <PageGuard>
      <InterestConsoleView screen="overview" />
    </PageGuard>
  )
}
