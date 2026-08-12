"use client"

import PageGuard from "@/components/page-guard"
import InterestConsoleView from "@/features/interest/interest-console-view"

export default function InterestUnmappedPage() {
  return (
    <PageGuard>
      <InterestConsoleView screen="unmapped" />
    </PageGuard>
  )
}
