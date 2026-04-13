"use client"

import PageGuard from "@/components/page-guard"
import AdminRolesPermissionsView from "@/features/admin/admin-roles-permissions-view"

export default function RolesPage() {
  return (
    <PageGuard>
      <AdminRolesPermissionsView />
    </PageGuard>
  )
}

