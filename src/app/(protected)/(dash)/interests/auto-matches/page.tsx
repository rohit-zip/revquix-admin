"use client"

import PageGuard from "@/components/page-guard"
import InterestConsoleView from "@/features/interest/interest-console-view"

export default function InterestAutoMatchesPage() {
  return (
    <PageGuard>
      <InterestConsoleView screen="auto-matches" />
    </PageGuard>
  )
}
