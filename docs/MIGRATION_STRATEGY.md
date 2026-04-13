# Revquix Admin — Migration Strategy

> **Status:** Draft — awaiting implementation approval  
> **Author:** GitHub Copilot  
> **Date:** April 13, 2026  
> **Scope:** Extracting the Admin workspace from `revquix-dashboard` into the standalone `revquix-admin` Next.js application.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Guiding Principles](#2-guiding-principles)
3. [Boundary Decision — What Moves, What Stays](#3-boundary-decision--what-moves-what-stays)
4. [Target Architecture — revquix-admin](#4-target-architecture--revquix-admin)
5. [Role & Permission Access Config](#5-role--permission-access-config)
6. [Auth Strategy](#6-auth-strategy)
7. [Unauthorized Access Screen](#7-unauthorized-access-screen)
8. [Dashboard Layout (Copy-paste Plan)](#8-dashboard-layout-copy-paste-plan)
9. [File-by-file Migration Map](#9-file-by-file-migration-map)
10. [Revquix-Dashboard Cleanup](#10-revquix-dashboard-cleanup)
11. [Environment Variables & Config](#11-environment-variables--config)
12. [Deployment & Port Strategy](#12-deployment--port-strategy)
13. [Step-by-step Implementation Order](#13-step-by-step-implementation-order)
14. [Open Questions / Future Work](#14-open-questions--future-work)

---

## 1. Executive Summary

`revquix-admin` will be a **separate, standalone Next.js application** that hosts every purely administrative function currently living inside the `Admin` workspace of `revquix-dashboard`.

The split is clean and deliberate:

| App | Who uses it | What it contains |
|---|---|---|
| `revquix-dashboard` | Any authenticated user | Professional Mentor section, Mentor Application, Mock Interview (browse/book/my-bookings), Personal Payments, Booking, Profile, Settings |
| `revquix-admin` | Admins & authorised staff only | Users & Roles management, Business Mentor management, Mock Interview admin (all bookings, mentor applications, coupons, reports), Payments admin (all payments, payouts, wallets, webhooks) |

**Professional Mentor** (Edit Profile, Manage Slots, My Bookings, Coupons, Payouts) remains in `revquix-dashboard` because it belongs to regular users who have been approved as professional mentors — NOT to application managers.

**Business Mentor** moves entirely to `revquix-admin` because it is managed by application admins/managers, not end users.

---

## 2. Guiding Principles

1. **No business logic duplication** — API clients, hooks, and types are copied once (not shared via a package yet). The backend contract is the same; both apps talk to the same Spring Boot server.
2. **Same layout DNA** — The sidebar / topbar shell is copy-pasted from `revquix-dashboard` and then simplified (no workspace switcher, no workspace onboarding modal).
3. **Role gate at the application level** — Access to the entire admin app is controlled by a single declarative config (`src/config/admin-access.config.ts`). Wrong role → `UnauthorizedScreen`.
4. **Route-level permission guard** — Individual pages inside the admin app still carry their own fine-grained `PageAccessRule` entries (same `anyOf` / `allOf` pattern already in `revquix-dashboard`).
5. **Same auth infrastructure** — Same `rv_session` cookie, same JWT refresh endpoint, same Redux auth slices. No new auth mechanism is introduced.
6. **Admin app is noindex by default** — All robots/SEO config blocks indexing.

---

## 3. Boundary Decision — What Moves, What Stays

### 3.1 Moves to `revquix-admin`

#### App Routes (pages)

| Current path in revquix-dashboard | New path in revquix-admin | Section |
|---|---|---|
| `/admin/users` | `/users` | Access Control |
| `/admin/users/[userId]` | `/users/[userId]` | Access Control |
| `/admin/roles` | `/roles` | Access Control |
| `/admin/roles/assign` | `/roles/assign` | Access Control |
| `/admin/mentor-applications` | `/mentor-applications` | Mock Interview Admin |
| `/admin/mentor-applications/[applicationId]` | `/mentor-applications/[applicationId]` | Mock Interview Admin |
| `/admin/mock-bookings` | `/mock-bookings` | Mock Interview Admin |
| `/admin/mock-bookings/[id]` | `/mock-bookings/[id]` | Mock Interview Admin |
| `/admin/coupons` | `/coupons` | Mock Interview Admin |
| `/admin/mentor-reports` | `/mentor-reports` | Mock Interview Admin |
| `/admin/payments` | `/payments` | Payments Admin |
| `/admin/payouts` | `/payouts` | Payments Admin |
| `/admin/wallets` | `/wallets` | Payments Admin |
| `/admin/wallets/[mentorUserId]` | `/wallets/[mentorUserId]` | Payments Admin |
| `/admin/webhooks` | `/webhooks` | Payments Admin |
| `/admin/webhooks/[id]` | `/webhooks/[id]` | Payments Admin |
| `/business-mentor/slots` | `/business-mentor/slots` | Business Mentor |
| `/business-mentor/bookings` | `/business-mentor/bookings` | Business Mentor |
| `/business-mentor/all-bookings` | `/business-mentor/all-bookings` | Business Mentor |
| `/business-mentor/intakes` | `/business-mentor/intakes` | Business Mentor |

> **Note:** The `/admin/` URL prefix is dropped in the admin app because the entire app is the admin panel. Cleaner URLs, less redundancy.

#### Feature Modules (code)

| Source (revquix-dashboard) | Destination (revquix-admin) | Notes |
|---|---|---|
| `src/features/admin/` | `src/features/admin/` | Full copy — api, hooks, types, components |
| `src/features/business-mentor/` | `src/features/business-mentor/` | Full copy |
| `src/features/payment/admin-payments-view.tsx` | `src/features/payment/` | Admin payment views only |
| `src/features/payment/admin-mentor-wallet*.tsx` | `src/features/payment/` | Admin wallet views |
| `src/features/payment/webhook-log*.tsx` | `src/features/payment/` | Webhook views |
| `src/features/professional-mentor/admin-mentor-reports-view.tsx` | `src/features/professional-mentor/` | Reports view only |
| `src/features/professional-mentor/admin-payouts-view.tsx` | `src/features/professional-mentor/` | Payouts management |
| `src/features/mock-interview/admin-mock-bookings-view.tsx` | `src/features/mock-interview/` | Admin bookings view |

#### Shared Infrastructure (full copy, then adapt)

| Source | Destination | Action |
|---|---|---|
| `src/core/` (entire) | `src/core/` | Full copy — Redux store, slices, query-client, provider |
| `src/components/ui/` | `src/components/ui/` | Full copy — shadcn components |
| `src/components/dashboard/` | `src/components/dashboard/` | Copy + simplify (remove workspace switcher) |
| `src/components/auth-*.tsx` | `src/components/` | Full copy |
| `src/components/page-guard.tsx` | `src/components/` | Full copy |
| `src/components/theme-provider.tsx` | `src/components/` | Full copy |
| `src/components/logo.tsx` | `src/components/` | Full copy |
| `src/hooks/` | `src/hooks/` | Full copy |
| `src/lib/` | `src/lib/` | Full copy |
| `src/config/page-access.config.ts` | `src/config/` | Admin-specific subset only |
| `src/app/auth/` | `src/app/auth/` | Full copy (login, register, verify-email, forgot-password, callback) |
| `src/app/globals.css` | `src/app/globals.css` | Full copy |
| `src/middleware.ts` | `src/middleware.ts` | Copy + extend with admin role check |

---

### 3.2 Stays in `revquix-dashboard`

| Route / Feature | Reason |
|---|---|
| `/professional-mentor/*` (Edit Profile, Manage Slots, My Bookings, Coupons, Payouts) | Belongs to the approved professional mentor user — user-facing |
| `/mentor-application/*` (Apply, status) | User submits their own application |
| `/mock-interview/*` (Browse, Book, My Bookings, Booking Detail) | End-user feature |
| `/booking/*` | User-facing bookings with business mentors |
| `/payments/history` | User's own payment history |
| `/profile`, `/settings`, `/notifications` | User account pages |
| All base workspaces: Professional, Business, Hiring | End-user workspaces |

---

## 4. Target Architecture — revquix-admin

```
revquix-admin/src/
├── app/
│   ├── layout.tsx                   # Root layout (fonts, metadata, NextTopLoader, Provider)
│   ├── globals.css                  # Copied from revquix-dashboard
│   ├── page.tsx                     # Redirects → /dashboard (or shows landing)
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── maintenance/
│   │   └── page.tsx
│   ├── unauthorized/
│   │   └── page.tsx                 # ← NEW: Unauthorized access screen
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx        # Optional — can be disabled in admin app
│   │   ├── forgot-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── callback/page.tsx
│   └── (protected)/
│       ├── layout.tsx               # Auth guard + Admin Role gate
│       └── (dash)/
│           ├── layout.tsx           # Sidebar + Topbar shell
│           ├── page.tsx             # Dashboard overview / landing
│           ├── loading.tsx
│           ├── users/
│           │   ├── page.tsx
│           │   └── [userId]/page.tsx
│           ├── roles/
│           │   ├── page.tsx
│           │   └── assign/page.tsx
│           ├── mentor-applications/
│           │   ├── page.tsx
│           │   └── [applicationId]/page.tsx
│           ├── mock-bookings/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── coupons/
│           │   └── page.tsx
│           ├── mentor-reports/
│           │   └── page.tsx
│           ├── payments/
│           │   └── page.tsx
│           ├── payouts/
│           │   └── page.tsx
│           ├── wallets/
│           │   ├── page.tsx
│           │   └── [mentorUserId]/page.tsx
│           ├── webhooks/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           └── business-mentor/
│               ├── slots/page.tsx
│               ├── bookings/page.tsx
│               ├── all-bookings/page.tsx
│               └── intakes/page.tsx
├── components/
│   ├── ui/                          # shadcn components (copied)
│   ├── dashboard/
│   │   ├── app-sidebar.tsx          # Copied + simplified (single workspace, no switcher)
│   │   └── dashboard-topbar.tsx     # Copied as-is
│   ├── auth-check-loader.tsx
│   ├── auth-initializer.tsx
│   ├── auth-route-guard.tsx
│   ├── page-guard.tsx
│   ├── admin-role-guard.tsx         # ← NEW: App-level role gate
│   ├── logo.tsx
│   └── theme-provider.tsx
├── config/
│   ├── admin-access.config.ts       # ← NEW: Which roles/permissions enter the app
│   └── page-access.config.ts        # Fine-grained per-page rules (admin subset)
│   └── dashboard/
│       └── nav.config.ts            # Admin-only nav (no workspace switcher)
├── core/                            # Copied from revquix-dashboard
│   ├── constants/
│   │   ├── path-constants.ts        # Admin-specific paths (no /admin/ prefix)
│   │   └── auth-constants.ts
│   ├── context/                     # No workspace-context needed
│   ├── filters/
│   ├── provider.tsx
│   ├── query-client.ts
│   ├── slices/
│   │   ├── auth.slice.ts
│   │   ├── authInitialization.slice.ts
│   │   └── userProfile.slice.ts
│   └── store.ts
├── features/
│   ├── admin/                       # Copied from revquix-dashboard
│   ├── auth/                        # Copied from revquix-dashboard
│   ├── business-mentor/             # Copied from revquix-dashboard
│   ├── mock-interview/
│   │   └── admin-mock-bookings-view.tsx
│   ├── payment/                     # Admin payment views only
│   └── professional-mentor/
│       ├── admin-mentor-reports-view.tsx
│       └── admin-payouts-view.tsx
├── hooks/                           # Copied from revquix-dashboard
├── lib/                             # Copied from revquix-dashboard
└── middleware.ts                    # Auth check + maintenance mode
```

---

## 5. Role & Permission Access Config

### 5.1 App-Level Entry Gate (`src/config/admin-access.config.ts`)

This is the **new file** that controls who is allowed to enter the admin app at all. Any authenticated user whose authorities do NOT satisfy this config is sent to `/unauthorized`.

```typescript
// src/config/admin-access.config.ts

/**
 * ─── ADMIN APP ACCESS CONFIGURATION ─────────────────────────────────────────
 *
 * Controls which roles/permissions are allowed to enter the revquix-admin app.
 * Any authenticated user that does NOT satisfy this gate is redirected to /unauthorized.
 *
 * Logic:
 *   - `allowedRoles`      → OR logic — user needs AT LEAST ONE of these roles
 *   - `allowedPermissions`→ OR logic — user needs AT LEAST ONE of these permissions
 *   - Combined with OR   → user passes if they satisfy roles OR permissions check
 *
 * To add a new allowed role, simply append to `allowedRoles`.
 */

export interface AdminAppAccessConfig {
  /** User must hold at least one of these roles to enter the app */
  allowedRoles: string[]
  /**
   * Optional: user may also enter with one of these fine-grained permissions
   * (without necessarily having a listed role).
   */
  allowedPermissions?: string[]
  /** URL to redirect unauthorised users to (default: /unauthorized) */
  unauthorizedRedirectPath?: string
}

export const ADMIN_APP_ACCESS: AdminAppAccessConfig = {
  allowedRoles: [
    "ROLE_ADMIN",             // Full admin
    "ROLE_BUSINESS_MENTOR",   // Can manage their own slots/bookings
    "ROLE_MENTOR",            // Legacy mentor role
  ],
  allowedPermissions: [
    // Fine-grained staff permissions — allows restricted staff without a full admin role
    "PERM_MANAGE_USERS",
    "PERM_MANAGE_ROLES",
    "PERM_MANAGE_PERMISSIONS",
    "PERM_VIEW_ALL_BOOKINGS",
    "PERM_VIEW_ALL_MOCK_BOOKINGS",
    "PERM_VIEW_MENTOR_APPLICATIONS",
    "PERM_MANAGE_PROFESSIONAL_MENTORS",
    "PERM_VIEW_ALL_PAYMENTS",
    "PERM_MANAGE_PAYOUTS",
    "PERM_VIEW_ALL_COUPONS",
    "PERM_VIEW_ALL_INTAKES",
  ],
  unauthorizedRedirectPath: "/unauthorized",
}
```

### 5.2 Page-Level Access Rules (`src/config/page-access.config.ts`)

The per-page `PageAccessRule` map from `revquix-dashboard` is copied and **trimmed to admin-only rules**. Since the entire app is the admin panel, paths no longer have the `/admin/` prefix.

```typescript
// Example entries (admin app paths have no /admin/ prefix)
export const PAGE_ACCESS_CONFIG: Record<string, PageAccessRule> = {
  "/roles": {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_ROLE", "PERM_MANAGE_PERMISSION"],
    label: "Roles & Permissions",
  },
  "/users": {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_USERS"],
    label: "Users",
  },
  "/mentor-applications": {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_MENTOR_APPLICATIONS", "PERM_MANAGE_PROFESSIONAL_MENTORS"],
    label: "Mentor Applications",
  },
  "/mock-bookings": {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_MOCK_BOOKINGS"],
    label: "All Mock Bookings",
  },
  "/coupons": {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_COUPONS"],
    label: "All Coupons",
  },
  "/payments": {
    anyOf: ["ROLE_ADMIN", "PERM_VIEW_ALL_PAYMENTS"],
    label: "All Payments",
  },
  "/payouts": {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Payouts",
  },
  "/wallets": {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_PAYOUTS"],
    label: "Mentor Wallets",
  },
  "/webhooks": {
    allOf: ["ROLE_ADMIN"],
    label: "Webhook Logs",
  },
  "/business-mentor/slots": {
    anyOf: ["ROLE_ADMIN", "PERM_MANAGE_OWN_SLOTS"],
    label: "Business Mentor - Slots",
  },
  // ... etc.
}
```

### 5.3 Nav Config (`src/config/dashboard/nav.config.ts`)

The admin app has a **single-workspace nav** — no workspace switcher, no `WorkspaceId` union. The sidebar shows all admin sections and dynamically hides items the user lacks permission for (same `access` guard pattern already in place).

---

## 6. Auth Strategy

### Same backend, same cookies, same token

`revquix-admin` uses the **exact same auth infrastructure** as `revquix-dashboard`:

- Cookie: `rv_session` (presence = logged in)
- JWT access token: obtained via `/auth/refresh-token` on app mount
- Redux slices: `auth.slice`, `authInitialization.slice`, `userProfile.slice` — **copied verbatim**
- `AuthInitializer` component: runs on mount, refreshes token, loads user profile — **copied verbatim**

### Additional Role Gate in Protected Layout

The `(protected)/layout.tsx` in `revquix-admin` adds one extra check **after** the standard auth check:

```
1. hasCheckedAuth? → No → show AuthCheckLoader
2. user? → No → redirect /auth/login
3. hasFetched && needsProfile → redirect /setup-profile (optional — can skip for admin app)
4. ← NEW → hasAdminAccess(authorities)? → No → redirect /unauthorized
5. Render children
```

The `hasAdminAccess()` function evaluates the user's `authorities` array against `ADMIN_APP_ACCESS`.

### Middleware

The `middleware.ts` in `revquix-admin` is largely the same as in `revquix-dashboard`. It does **cookie-based** gate only (not JWT-based — JWT is not available in Edge middleware). The real role check happens client-side in the protected layout.

```
Rules:
  0. Maintenance mode ON → /maintenance
  1. Logged-in + /auth/login or /auth/register → /
  2. /auth/* → pass through
  3. /_next, /static → pass through
  4. No rv_session cookie → /auth/login?from=<path>
  5. Has rv_session → pass through (role check happens client-side)
```

---

## 7. Unauthorized Access Screen

A dedicated `/unauthorized` page is shown when:
- A user is authenticated (valid session)
- But their role/permissions do not satisfy `ADMIN_APP_ACCESS`

### UX Design

```
┌─────────────────────────────────────────────────────────┐
│  [Revquix Logo]                               [Theme 🌙] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              🔒                                         │
│                                                         │
│       Unauthorised Access                               │
│                                                         │
│  You don't have permission to access the               │
│  Revquix Admin Panel.                                   │
│                                                         │
│  This area is restricted to administrators              │
│  and authorised staff only.                             │
│                                                         │
│  If you believe this is a mistake, please               │
│  contact your system administrator.                     │
│                                                         │
│  [← Back to Dashboard]    [Log out]                    │
│                                                         │
│  Logged in as: user@example.com                        │
│  Role: ROLE_USER                                        │
└─────────────────────────────────────────────────────────┘
```

- "Back to Dashboard" links to the `revquix-dashboard` URL (env var: `NEXT_PUBLIC_DASHBOARD_URL`)
- "Log out" calls the logout API and clears the session cookie
- Shows the user's current email and roles for transparency (helps support)

---

## 8. Dashboard Layout (Copy-paste Plan)

### What to copy exactly

| File | Copy action |
|---|---|
| `src/components/ui/**` | **Full copy** — all shadcn/radix components |
| `src/components/dashboard/dashboard-topbar.tsx` | **Copy as-is** |
| `src/components/dashboard/app-sidebar.tsx` | **Copy + modify** (see below) |
| `src/app/(protected)/(dash)/layout.tsx` | **Copy + modify** (remove WorkspaceProvider, remove WorkspaceOnboardingModal) |
| `src/app/globals.css` | **Copy as-is** |
| `src/app/auth/layout.tsx` | **Copy as-is** (same ambient glow design) |

### AppSidebar modifications

The `AppSidebar` component in the admin app is simplified:

1. **Remove** `WorkspaceId` / `WorkspaceMeta` / workspace switcher logic
2. **Remove** `WorkspaceOnboardingModal`
3. **Replace** the dynamic workspace section with a **fixed admin nav** that reads from the new single-workspace `nav.config.ts`
4. **Keep** the authority filtering logic (`anyOf` / `allOf` item hiding)
5. **Keep** the collapsible sidebar, tooltips, and dark/light theme toggle

### DashLayout modification

```tsx
// (protected)/(dash)/layout.tsx in revquix-admin
// No WorkspaceProvider. No workspace switcher.

export default function DashLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardTopbar notificationCount={3} />
        <div className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

---

## 9. File-by-file Migration Map

### 9.1 New files to CREATE in revquix-admin

| File | Purpose |
|---|---|
| `src/config/admin-access.config.ts` | App-level role gate config |
| `src/components/admin-role-guard.tsx` | React component that enforces `ADMIN_APP_ACCESS` |
| `src/app/unauthorized/page.tsx` | Unauthorized access screen |
| `src/app/(protected)/layout.tsx` | Auth guard + admin role gate |
| `src/app/(protected)/(dash)/layout.tsx` | Sidebar + topbar shell (simplified) |
| `src/app/(protected)/(dash)/page.tsx` | Admin dashboard landing/overview |

### 9.2 Files to COPY from revquix-dashboard → revquix-admin (verbatim or near-verbatim)

**Core infrastructure:**
```
src/core/constants/auth-constants.ts
src/core/slices/auth.slice.ts
src/core/slices/authInitialization.slice.ts
src/core/slices/userProfile.slice.ts
src/core/store.ts
src/core/query-client.ts
src/core/provider.tsx
src/core/filters/
src/hooks/useAuth.ts
src/hooks/useRedux.ts
src/hooks/usePermissions.ts   (if exists)
src/lib/utils.ts
src/lib/session-cookie.ts
src/lib/axios.ts
src/middleware.ts              (then adapt — rules unchanged, just different app name)
```

**Auth pages:**
```
src/app/auth/layout.tsx
src/app/auth/login/page.tsx
src/app/auth/register/page.tsx
src/app/auth/forgot-password/page.tsx
src/app/auth/verify-email/page.tsx
src/app/auth/callback/page.tsx
src/features/auth/                          (entire directory)
src/components/auth-check-loader.tsx
src/components/auth-initializer.tsx
src/components/auth-route-guard.tsx
src/components/social-auth-buttons.tsx
```

**UI components:**
```
src/components/ui/                          (entire directory)
src/components/theme-provider.tsx
src/components/logo.tsx
src/components/page-guard.tsx
src/components/user-avatar.tsx
src/components/centralized-loader.tsx
src/components/centralized-banner.tsx
```

**Dashboard shell:**
```
src/components/dashboard/dashboard-topbar.tsx    (verbatim)
src/components/dashboard/app-sidebar.tsx         (copy then modify)
```

**Admin feature modules:**
```
src/features/admin/                         (entire directory)
src/features/business-mentor/               (entire directory)
src/features/payment/admin-*.tsx            (admin-specific views)
src/features/payment/webhook-log*.tsx
src/features/payment/api/
src/features/mock-interview/admin-mock-bookings-view.tsx
src/features/professional-mentor/admin-mentor-reports-view.tsx
src/features/professional-mentor/admin-payouts-view.tsx
src/features/professional-mentor/api/       (shared API client)
src/features/user/api/                      (getCurrentUser etc.)
```

### 9.3 Files to CREATE (new page files in revquix-admin)

Each page in revquix-admin is a thin route file that imports the same view component as the corresponding page in revquix-dashboard:

| revquix-admin page | Reuses view from |
|---|---|
| `app/(protected)/(dash)/users/page.tsx` | `features/admin/admin-user-list-view.tsx` (equivalent) |
| `app/(protected)/(dash)/users/[userId]/page.tsx` | `features/admin/admin-user-detail-view.tsx` |
| `app/(protected)/(dash)/roles/page.tsx` | `features/admin/admin-roles-permissions-view.tsx` |
| `app/(protected)/(dash)/mentor-applications/page.tsx` | `features/admin/components/...` |
| `app/(protected)/(dash)/mock-bookings/page.tsx` | `features/mock-interview/admin-mock-bookings-view.tsx` |
| `app/(protected)/(dash)/coupons/page.tsx` | admin coupons view |
| `app/(protected)/(dash)/payments/page.tsx` | `features/payment/admin-payments-view.tsx` |
| `app/(protected)/(dash)/payouts/page.tsx` | `features/payment/admin-payouts-view.tsx` (from professional-mentor) |
| `app/(protected)/(dash)/wallets/page.tsx` | `features/payment/admin-mentor-wallets-view.tsx` |
| `app/(protected)/(dash)/webhooks/page.tsx` | `features/payment/webhook-logs-view.tsx` |
| `app/(protected)/(dash)/business-mentor/slots/page.tsx` | `features/business-mentor/mentor-slots-view.tsx` |
| `app/(protected)/(dash)/business-mentor/bookings/page.tsx` | `features/business-mentor/mentor-bookings-view.tsx` |
| `app/(protected)/(dash)/business-mentor/all-bookings/page.tsx` | `features/business-mentor/all-bookings-view.tsx` |
| `app/(protected)/(dash)/business-mentor/intakes/page.tsx` | `features/business-mentor/intake-management-view.tsx` |

---

## 10. Revquix-Dashboard Cleanup

After the admin app is stable and tested, the following should be **removed from `revquix-dashboard`**:

### Routes to remove
```
src/app/(protected)/(dash)/admin/            # Entire admin route tree
src/app/(protected)/(dash)/business-mentor/  # Business mentor routes
```

### Nav config changes
- Remove `admin` workspace from `WORKSPACE_CONFIGS` in `nav.config.ts`
- Remove `admin` from `WorkspaceId` union type
- Remove `ROLE_WORKSPACE_MAP` entries for `ROLE_ADMIN`, `ROLE_BUSINESS_MENTOR`, `ROLE_MENTOR` → `admin`
- Remove `Business Mentor` section from nav
- Remove `PROFESSIONAL_MENTOR_SECTION` reference from admin workspace (it stays in professional workspace)

### Feature module changes
- Remove `src/features/admin/` (only needed in revquix-admin)
- Remove `src/features/business-mentor/` (only needed in revquix-admin)
- Keep `src/features/professional-mentor/` but remove `admin-mentor-reports-view.tsx` and `admin-payouts-view.tsx`
- Keep `src/features/payment/` but remove `admin-payments-view.tsx`, `admin-mentor-wallet*.tsx`, `webhook-log*.tsx`
- Keep `src/features/mock-interview/` but remove `admin-mock-bookings-view.tsx`

### Page access config changes
- Remove all `ADMIN_*` and `BUSINESS_MENTOR_*` entries from `PAGE_ACCESS_CONFIG` in `page-access.config.ts`

### `nav.config.ts` `ROLE_WORKSPACE_MAP` — critical change
```typescript
// BEFORE (revquix-dashboard)
export const ROLE_WORKSPACE_MAP = {
  ROLE_ADMIN: "admin",
  ROLE_BUSINESS_MENTOR: "admin",
  ROLE_MENTOR: "admin",
  ROLE_PROFESSIONAL_MENTOR: "admin",   // stays — pro mentor still uses dashboard
}

// AFTER (revquix-dashboard) — admin roles no longer map to a workspace here
export const ROLE_WORKSPACE_MAP = {
  ROLE_PROFESSIONAL_MENTOR: "admin",   // admin workspace renamed to "mentor" or removed
}
// OR: simply remove admin workspace entirely and keep professional mentor in the professional workspace
```

> **Recommendation:** After the split, rename the `admin` workspace in revquix-dashboard to `mentor` (for Professional Mentors) or fold it into the `professional` workspace to avoid confusion.

---

## 11. Environment Variables & Config

### revquix-admin `.env.local`

```bash
# ── App ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=Revquix Admin
NEXT_PUBLIC_BASE_URL=https://admin.revquix.com

# ── Backend API ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=https://api.revquix.com

# ── Cross-app links ─────────────────────────────────────────────────────────
NEXT_PUBLIC_DASHBOARD_URL=https://app.revquix.com   # Used by UnauthorizedScreen "Back to Dashboard" button

# ── Maintenance mode ─────────────────────────────────────────────────────────
NEXT_PUBLIC_MAINTENANCE_MODE=false

# ── Analytics ────────────────────────────────────────────────────────────────
GA4_MEASUREMENT_ID=G-XXXXXXXXXX    # Optional — can omit for internal tool
```

### revquix-admin `next.config.ts`

```typescript
// Copy next.config.mjs from revquix-dashboard and adapt:
// - Remove www-redirect rule (admin.revquix.com doesn't need it)
// - Update Content-Security-Policy if needed
// - Keep image domains, headers, etc.
```

---

## 12. Deployment & Port Strategy

| App | Dev Port | Domain |
|---|---|---|
| `revquix-dashboard` | `:2000` | `app.revquix.com` |
| `revquix-admin` | `:2001` | `admin.revquix.com` |
| `revquix-backend-server` | `:8080` | `api.revquix.com` |

`revquix-admin/package.json` script update:
```json
"dev": "next dev --turbopack -p 2001"
```

---

## 13. Step-by-step Implementation Order

### Phase 1 — Bootstrap revquix-admin

1. **Update `package.json`** — copy all dependencies from revquix-dashboard (`axios`, `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`, `lucide-react`, `tailwind-merge`, `clsx`, `next-themes`, `sonner`, `framer-motion`, `shadcn`, `zod`, etc.)
2. **Copy `globals.css`** and Tailwind/PostCSS config
3. **Copy `src/lib/`** — `utils.ts`, `session-cookie.ts`, `axios.ts`
4. **Copy `src/hooks/`** — `useAuth.ts`, `useRedux.ts`
5. **Copy `src/core/`** — slices, store, query-client, provider (drop workspace-context)
6. **Copy `src/components/ui/`** — all shadcn components
7. **Copy `src/components/theme-provider.tsx`**, `logo.tsx`, `user-avatar.tsx`, `page-guard.tsx`, `auth-*.tsx`
8. **Install dependencies:** `npm install`

### Phase 2 — Auth Pages

9. **Copy `src/app/auth/`** — all auth pages and layout
10. **Copy `src/features/auth/`** — auth API, hooks, types
11. **Update `src/app/layout.tsx`** — admin-specific metadata (no index, admin title)
12. **Copy `src/middleware.ts`** — adapt (keep same rules, update app name in comments)
13. **Smoke test:** Login/register/logout works in admin app

### Phase 3 — Admin Role Gate

14. **Create `src/config/admin-access.config.ts`**
15. **Create `src/components/admin-role-guard.tsx`** — checks authorities against `ADMIN_APP_ACCESS`
16. **Create `src/app/unauthorized/page.tsx`** — unauthorized access screen
17. **Create `src/app/(protected)/layout.tsx`** — standard auth guard + admin role check
18. **Smoke test:** Non-admin user is redirected to `/unauthorized`

### Phase 4 — Dashboard Shell

19. **Copy `src/components/dashboard/dashboard-topbar.tsx`** (verbatim)
20. **Create `src/config/dashboard/nav.config.ts`** — admin-only single-workspace nav
21. **Create `src/components/dashboard/app-sidebar.tsx`** — copy + remove workspace switcher
22. **Create `src/app/(protected)/(dash)/layout.tsx`** — simplified shell (no WorkspaceProvider)
23. **Create `src/app/(protected)/(dash)/page.tsx`** — admin dashboard landing page
24. **Smoke test:** Admin user sees sidebar + topbar

### Phase 5 — Admin Feature Modules

25. **Copy `src/features/admin/`** — all admin API, hooks, types, components
26. **Copy `src/features/business-mentor/`** — all business mentor views
27. **Copy admin-specific payment/mock-interview/professional-mentor views**
28. **Copy `src/features/user/api/`** — for `getCurrentUser` 
29. **Create all route pages** under `src/app/(protected)/(dash)/`
30. **Create `src/config/page-access.config.ts`** — admin-only subset with updated paths

### Phase 6 — Update `path-constants.ts`

31. **Create `src/core/constants/path-constants.ts`** in revquix-admin
    - All admin paths drop the `/admin/` prefix (e.g., `/admin/users` → `/users`)
    - Add `NEXT_PUBLIC_DASHBOARD_URL` cross-app link

### Phase 7 — Integration Testing

32. Verify all admin pages load correctly
33. Verify permission-denied watermarks appear for restricted pages
34. Verify unauthorized users cannot access the admin app
35. Verify cross-app navigation (links pointing to revquix-dashboard)

### Phase 8 — Revquix-Dashboard Cleanup (after admin app is stable)

36. Remove `src/app/(protected)/(dash)/admin/` route tree
37. Remove `src/app/(protected)/(dash)/business-mentor/` route tree
38. Remove admin workspace from `nav.config.ts`
39. Remove admin feature modules from revquix-dashboard
40. Trim `page-access.config.ts` to user-only rules
41. Regression test revquix-dashboard

---

## 14. Open Questions / Future Work

### Resolved in this strategy

| Question | Decision |
|---|---|
| Does Professional Mentor stay in dashboard? | ✅ YES — it's user-facing |
| Does Business Mentor move to admin? | ✅ YES — managed by admins/staff |
| Can non-admin users register on revquix-admin? | Configurable — register page can be hidden or disabled |
| Should admin app have workspace switcher? | ❌ NO — single flat admin nav |
| Same auth backend? | ✅ YES — same Spring Boot, same cookies, same JWT |

### Open / Deferred

| Question | Notes |
|---|---|
| **Setup Profile in admin app?** | Admins may not need `/setup-profile`. Consider redirecting admin users who lack a profile to the dashboard's `/setup-profile` URL instead |
| **Shared UI library?** | Currently code is duplicated. Long-term, extract shared components into a `revquix-ui` internal package (npm workspace). Not in scope now |
| **Admin app registration** | Should the admin `/auth/register` page be hidden? Admin accounts should be provisioned server-side, not self-registered. Consider replacing register page with a "Contact your admin to get access" message |
| **Cross-app notifications** | Notifications/messages may need to be visible in both apps. Consider a shared notification API with per-app polling |
| **`revquix-dashboard` workspace rename** | After removing the admin workspace, consider renaming the "admin" workspace to "mentor" for professional mentor users to avoid confusion |
| **CSP / CORS** | Update Content-Security-Policy and backend CORS config to allow `admin.revquix.com` as a trusted origin |

---

*End of migration strategy document. Awaiting implementation approval.*

