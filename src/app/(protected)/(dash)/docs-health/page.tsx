import { DocsHealthView } from "@/features/docs-health/docs-health-view"

/**
 * `/docs-health` — read-only oversight for the documentation.
 *
 * The console's entire role in `docs/REVQUIX_DOCS_MASTER_PLAN.md`: authoring lives in revquix-web
 * (§8.1), oversight lives here. Gated in `nav.config.ts` on ROLE_ADMIN or PERM_MANAGE_DOCS.
 */
export default function DocsHealthPage() {
  return <DocsHealthView />
}
