/**
 * ─── MENTORSHIP V2 (PHASE 6) PACKAGE ADMIN API ───────────────────────────────
 *
 * Backs AdminMentorshipV2PackageController. Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`;
 * the sweep needs `PERM_MANAGE_MENTORSHIP_V2_COMMERCE` (admin-only) — it can auto-pause a
 * mentor's service, apply a reliability penalty, and unlock a buyer's self-serve refund.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminPackageSnapshot,
  PackageEntitlementRow,
  PackageSweepReport,
} from "./packages.types"

const BASE = "/admin/mentorship-v2/packages"

export const getPackageSnapshot = (): Promise<AdminPackageSnapshot> =>
  apiClient.get<AdminPackageSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const inspectEntitlement = (entitlementId: string): Promise<PackageEntitlementRow> =>
  apiClient.get<PackageEntitlementRow>(`${BASE}/entitlements/${entitlementId}`).then((r) => r.data)

export const runPackageLifecycleSweep = (): Promise<PackageSweepReport> =>
  apiClient.post<PackageSweepReport>(`${BASE}/sweeps/lifecycle`).then((r) => r.data)
