# Website Builder — Admin Implementation

## Overview

The admin panel (`revquix-admin`) provides full management over the No-Code Website Builder platform: templates, components, pricing, watermark, user websites, subscriptions, and stats.

## Feature Module Structure

```
src/features/website/
└── api/
    ├── website-admin.types.ts    — TypeScript types for admin DTOs
    ├── website-admin.api.ts      — All admin API functions (axios)
    └── website-admin.hooks.ts    — React Query hooks + mutations
```

## Route Map

| Route | Permission | Description |
|-------|-----------|-------------|
| `/website/templates` | `PERM_MANAGE_TEMPLATES` | List all templates |
| `/website/templates/new` | `PERM_MANAGE_TEMPLATES` | Create new template |
| `/website/templates/[id]` | `PERM_MANAGE_TEMPLATES` | Edit template + pricing |
| `/website/components` | `PERM_MANAGE_COMPONENTS` | List all components |
| `/website/components/new` | `PERM_MANAGE_COMPONENTS` | Register new component |
| `/website/components/[id]` | `PERM_MANAGE_COMPONENTS` | Edit component |
| `/website/pricing` | `PERM_MANAGE_PLATFORM_PRICING` | Platform add-on pricing |
| `/website/watermark` | `PERM_MANAGE_WATERMARK_CONFIG` | Watermark config |
| `/website/websites` | `PERM_VIEW_ALL_WEBSITES` | Search + manage all sites |
| `/website/subscriptions` | `PERM_VIEW_ALL_SUBSCRIPTIONS` | All subscriptions |
| `/website/stats` | `ROLE_ADMIN` | Platform stats dashboard |

## Admin Capabilities

### Templates

- **Create**: Define name, slug, type, pricing, content schema, default layout
- **Edit**: Update display name, description, pricing
- **Toggle**: Enable/disable (hides from user template picker)
- **Featured**: Mark as featured (shown first in catalog)
- **Pricing override**: Set per-template INR/USD monthly price + yearly discount %
- **Free with watermark**: Free templates always show watermark (watermark cannot be removed unless paid)

### Components

- **Create**: Register by slug (must match `COMPONENT_REGISTRY` key in revquix-sites)
- **Edit**: Update name, description, pricing
- **Toggle**: Enable/disable
- **Categories**: HERO, NAVIGATION, CONTENT, FORM, FOOTER, DECORATION, ADVANCED
- **Pricing**: Free or paid (per add-on, per month)

### Platform Pricing

Configurable pricing keys (stored in `website_platform_pricing` table):
- `WATERMARK_REMOVAL` — Remove "Powered by Revquix" footer
- `CUSTOM_DOMAIN` — Connect a custom domain
- `ANALYTICS` — Enable analytics tracking
- `CONTACT_FORM` — Enable contact form

### Watermark Configuration

- Set watermark text (default: "Powered by Revquix")
- Set logo URL (optional)
- Set link URL
- Enable/disable globally
- Preview shows exactly how it appears on user sites

### Website Management

- Search by subdomain, user email, status
- Filter by status: DRAFT / PUBLISHED / SUSPENDED / EXPIRED
- Suspend a website (with required reason) — sets status to SUSPENDED
- Unsuspend — restores to PUBLISHED

### Subscription Management

- View all subscriptions with plan, amount, period dates
- Filter by status: ACTIVE / PAST_DUE / EXPIRED / CANCELLED
- **Extend**: Add X days to current period (manual override for support)
- Subscriptions support both MONTHLY and YEARLY plans
- Admin can configure yearly discount % per template

### Platform Stats

Real-time platform metrics:
- Total / Published / Suspended / Expired websites
- MRR in INR
- Active subscriptions
- Custom domains connected
- Watermark removals (paid)
- Page views (last 30d)
- Cloudflare hostname slots used/free

## Key Hooks Reference

```ts
import {
  useAdminTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useUpdateTemplatePricing,
  useToggleTemplate,
  useAdminComponents,
  useCreateComponent,
  useUpdateComponent,
  useToggleComponent,
  usePlatformPricing,
  useUpdatePlatformPricing,
  useWatermarkConfig,
  useUpdateWatermarkConfig,
  useAdminWebsites,
  useSuspendWebsite,
  useUnsuspendWebsite,
  useAdminSubscriptions,
  useExtendSubscription,
  usePlatformStats,
} from "@/features/website/api/website-admin.hooks"
```

## Navigation

Website Builder section in admin sidebar (gated by permissions):
```
Website Builder
├── Templates        →  /website/templates
├── Components       →  /website/components
├── Pricing          →  /website/pricing
├── Watermark        →  /website/watermark
├── All Websites     →  /website/websites
├── Subscriptions    →  /website/subscriptions
└── Platform Stats   →  /website/stats  (ROLE_ADMIN only)
```

## Important: Template/Component Deployment Workflow

1. Developer creates component/template code in `revquix-sites`
2. Developer adds it to the registry (`TEMPLATE_REGISTRY` or `COMPONENT_REGISTRY`)
3. Admin goes to **New Template** or **New Component** page
4. Admin fills in metadata, pricing, schema
5. Admin keeps `isActive = false` until code is deployed
6. Developer deploys `revquix-sites` to VPS
7. Admin toggles `isActive = true` → it appears in user picker

## Free vs Paid Templates

Free templates (isFree = true):
- No cost to users
- Watermark is always shown (cannot remove unless user pays for watermark removal add-on)
- Admin can decide which templates are free via the edit page

Paid templates:
- Users must subscribe with monthly/yearly plan
- Subscription covers template + any selected add-ons
- Admin sets price in paise (INR) and cents (USD)

