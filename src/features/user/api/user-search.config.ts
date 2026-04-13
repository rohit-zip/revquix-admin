/**
 * ─── USER SEARCH FILTER CONFIG ────────────────────────────────────────────────
 *
 * Declares the filter fields, operators, and metadata for the user search
 * endpoint. This config drives the DataExplorer UI automatically.
 *
 * @see /docs/FRONTEND_FILTER_INTEGRATION.md for backend field reference
 */

import type { FilterConfig } from "@/core/filters/filter.types"

export const USER_FILTER_CONFIG: FilterConfig = {
  key: "user-search",
  entityLabel: "Users",
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,

  filterFields: [
    {
      field: "email",
      label: "Email",
      type: "STRING",
      operators: ["EQUALS", "LIKE", "IN"],
      isSearchable: true,
      allowSort: true,
    },
    {
      field: "username",
      label: "Username",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
      isSearchable: true,
      allowSort: true,
    },
    {
      field: "name",
      label: "Name",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
      isSearchable: true,
      allowSort: true,
    },
    {
      field: "isEmailVerified",
      label: "Email Verified",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Verified", value: true },
        { label: "Unverified", value: false },
      ],
    },
    {
      field: "isAccountNonLocked",
      label: "Account Locked",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Unlocked", value: true },
        { label: "Locked", value: false },
      ],
    },
    {
      field: "isEnabled",
      label: "Account Status",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Active", value: true },
        { label: "Disabled", value: false },
      ],
    },
    {
      field: "isDeleted",
      label: "Deleted",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Deleted", value: true },
        { label: "Not Deleted", value: false },
      ],
    },
  ],

  rangeFields: [
    {
      field: "createdAt",
      label: "Created At",
      type: "INSTANT",
      operators: [],
      allowRange: true,
      allowSort: true,
    },
    {
      field: "updatedAt",
      label: "Updated At",
      type: "INSTANT",
      operators: [],
      allowRange: true,
    },
    {
      field: "lastLoginAt",
      label: "Last Login",
      type: "INSTANT",
      operators: [],
      allowRange: true,
    },
    {
      field: "failedLoginAttempts",
      label: "Failed Logins",
      type: "INTEGER",
      operators: [],
      allowRange: true,
      allowSort: true,
    },
  ],

  joinFields: [
    {
      association: "roles",
      field: "role",
      label: "Role",
      operators: ["IN"],
      // Options are populated dynamically from GET /api/v1/admin/roles
      // See admin-user-search-view.tsx for the dynamic config builder
      options: [],
    },
  ],
}

