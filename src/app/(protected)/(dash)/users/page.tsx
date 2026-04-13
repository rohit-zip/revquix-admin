"use client"

import PageGuard from "@/components/page-guard"
import AdminUserSearchView from "@/features/user/admin-user-search-view"

export default function UsersPage() {
  return (
    <PageGuard>
      <AdminUserSearchView />
    </PageGuard>
  )
}

