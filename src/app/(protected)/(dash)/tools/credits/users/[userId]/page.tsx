"use client"

import { useParams } from "next/navigation"
import PageGuard from "@/components/page-guard"
import AdminToolCreditUserView from "@/features/tools-admin/admin-tool-credit-user-view"

export default function Page() {
  // `useParams` rather than the server `params` promise, because this route is a client component: the
  // whole surface is React Query over an authenticated API, so there is nothing for a server render to do
  // except send a shell that immediately refetches.
  const params = useParams<{ userId: string }>()
  const userId = typeof params?.userId === "string" ? params.userId : ""

  return (
    <PageGuard>
      <AdminToolCreditUserView userId={userId} />
    </PageGuard>
  )
}
