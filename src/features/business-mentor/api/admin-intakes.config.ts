/**
 * ─── ADMIN INTAKES FILTER CONFIG ─────────────────────────────────────────────
 */

import type { FilterConfig } from "@/core/filters/filter.types"

export const ADMIN_INTAKES_FILTER_CONFIG: FilterConfig = {
  key: "admin-intakes-search",
  entityLabel: "Intakes",
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,

  filterFields: [
    {
      field: "category",
      label: "Category",
      type: "STRING",
      operators: ["EQUALS", "IN"],
      allowSort: false,
      options: [
        { label: "Business / Startup",      value: "BUSINESS_STARTUP" },
        { label: "Professional / Developer", value: "PROFESSIONAL_DEVELOPER" },
        { label: "Hiring / Recruitment",     value: "HIRING_RECRUITMENT" },
      ],
    },
    {
      field: "isActionTaken",
      label: "Action Taken",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: "true" },
        { label: "No",  value: "false" },
      ],
    },
    {
      field: "intakeId",
      label: "Intake ID",
      type: "STRING",
      operators: ["EQUALS"],
    },
    {
      field: "fullName",
      label: "Full Name",
      type: "STRING",
      operators: ["LIKE"],
    },
    {
      field: "email",
      label: "Email",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
  ],

  rangeFields: [
    {
      field: "createdAt",
      label: "Submitted At",
      type: "INSTANT",
      operators: ["EQUALS"],
      allowRange: true,
      allowSort: true,
    },
  ],

  joinFields: [],
}




