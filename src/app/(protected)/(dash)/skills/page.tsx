import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { SkillsView } from "@/features/skills/skills-view"

export const metadata = {
  title: "Skill Registry | Revquix Admin",
}

export default function SkillsPage() {
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_SKILL_REGISTRY]}
      label="Skill Registry"
    >
      <div className="container mx-auto max-w-6xl p-4">
        <SkillsView />
      </div>
    </PageGuard>
  )
}
