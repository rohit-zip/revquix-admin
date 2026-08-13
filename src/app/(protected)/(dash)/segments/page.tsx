"use client"

import PageGuard from "@/components/page-guard"
import SegmentsConsoleView from "@/features/segments/segments-console-view"

export default function SegmentsPage() {
  return (
    <PageGuard>
      <SegmentsConsoleView />
    </PageGuard>
  )
}
