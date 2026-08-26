import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { ProblemQueueView } from "@/features/coding-problems/problem-queue-view"

export const metadata = {
  title: "Coding problems",
}

export default function ProblemsPage() {
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_PUBLISH_PROBLEM]}
      label="Coding Problems"
    >
      <div className="container mx-auto max-w-6xl p-4">
        <ProblemQueueView />
      </div>
    </PageGuard>
  )
}
