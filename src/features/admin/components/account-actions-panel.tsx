/**
 * ─── ACCOUNT ACTIONS PANEL (ADMIN) ────────────────────────────────────────────
 *
 * Permission-gated admin actions on a user account:
 *   • Enable / Disable            (PERM_EDIT_USER)
 *   • Lock (temporary) / Block (indefinite) / Unlock   (PERM_EDIT_USER)
 *   • Force logout                (PERM_EDIT_USER)
 *   • Force password reset        (PERM_EDIT_USER)
 *   • Soft-delete / Restore       (PERM_DELETE_USER)
 *
 * Destructive actions require a reason and, on the backend, sign the user out of
 * all devices. Calls PATCH /admin/users/{userId}/status via useUpdateUserStatus.
 */

"use client"

import React from "react"
import {
  Ban,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  LogOut,
  KeyRound,
  Loader2,
  ShieldAlert,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useAuthorization } from "@/hooks/useAuthorization"
import { useUpdateUserStatus } from "@/features/admin/api/admin-user.hooks"
import type {
  AccountStatusAction,
  UpdateAccountStatusRequest,
} from "@/features/admin/api/admin-user.types"

// ─── Action metadata ────────────────────────────────────────────────────────

interface ActionMeta {
  label: string
  title: string
  description: string
  destructive: boolean
  confirmLabel: string
  icon: React.ElementType
  /** true → requires PERM_DELETE_USER; false → requires PERM_EDIT_USER */
  needsDeletePermission: boolean
}

const ACTION_META: Record<AccountStatusAction, ActionMeta> = {
  DISABLE: {
    label: "Disable",
    title: "Disable account",
    description:
      "The user will be signed out of all devices and blocked from signing in until the account is re-enabled.",
    destructive: true,
    confirmLabel: "Disable account",
    icon: Ban,
    needsDeletePermission: false,
  },
  ENABLE: {
    label: "Enable",
    title: "Enable account",
    description: "Re-enable this account so the user can sign in again.",
    destructive: false,
    confirmLabel: "Enable account",
    icon: CheckCircle2,
    needsDeletePermission: false,
  },
  LOCK: {
    label: "Lock / Block",
    title: "Lock account",
    description:
      "Lock the account. Set a future unlock time for a temporary lock, or block indefinitely. The user is signed out of all devices.",
    destructive: true,
    confirmLabel: "Lock account",
    icon: Lock,
    needsDeletePermission: false,
  },
  UNLOCK: {
    label: "Unlock",
    title: "Unlock account",
    description: "Clear the lock/block and reset the failed-login counter.",
    destructive: false,
    confirmLabel: "Unlock account",
    icon: Unlock,
    needsDeletePermission: false,
  },
  SOFT_DELETE: {
    label: "Delete",
    title: "Soft-delete account",
    description:
      "Mark the account as deleted and disable it. The user is signed out of all devices. This can be reversed with Restore.",
    destructive: true,
    confirmLabel: "Delete account",
    icon: Trash2,
    needsDeletePermission: true,
  },
  RESTORE: {
    label: "Restore",
    title: "Restore account",
    description: "Restore a soft-deleted account and re-enable it.",
    destructive: false,
    confirmLabel: "Restore account",
    icon: RotateCcw,
    needsDeletePermission: true,
  },
  FORCE_LOGOUT: {
    label: "Force logout",
    title: "Force logout",
    description: "Sign the user out of every device immediately. They can sign back in afterwards.",
    destructive: true,
    confirmLabel: "Force logout",
    icon: LogOut,
    needsDeletePermission: false,
  },
  FORCE_PASSWORD_RESET: {
    label: "Force password reset",
    title: "Force password reset",
    description:
      "Require the user to set a new password on next sign-in and sign them out of all devices now.",
    destructive: true,
    confirmLabel: "Force password reset",
    icon: KeyRound,
    needsDeletePermission: false,
  },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountActionsPanelProps {
  userId: string
  isEnabled: boolean
  isAccountNonLocked: boolean
  isDeleted: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AccountActionsPanel({
  userId,
  isEnabled,
  isAccountNonLocked,
  isDeleted,
}: AccountActionsPanelProps) {
  const { hasAnyAuthority } = useAuthorization()
  const canEdit = hasAnyAuthority(["PERM_EDIT_USER"])
  const canDelete = hasAnyAuthority(["PERM_DELETE_USER"])

  const updateStatus = useUpdateUserStatus(userId)

  const [dialogAction, setDialogAction] = React.useState<AccountStatusAction | null>(null)
  const [reason, setReason] = React.useState("")
  const [blockIndefinite, setBlockIndefinite] = React.useState(false)
  const [lockUntil, setLockUntil] = React.useState("")

  // ── Determine the visible actions based on current state + permissions ──────
  const actions: AccountStatusAction[] = []
  if (isDeleted) {
    if (canDelete) actions.push("RESTORE")
  } else {
    if (canEdit) {
      actions.push(isEnabled ? "DISABLE" : "ENABLE")
      actions.push(isAccountNonLocked ? "LOCK" : "UNLOCK")
      actions.push("FORCE_LOGOUT")
      actions.push("FORCE_PASSWORD_RESET")
    }
    if (canDelete) actions.push("SOFT_DELETE")
  }

  if (actions.length === 0) return null

  const meta = dialogAction ? ACTION_META[dialogAction] : null

  function openDialog(action: AccountStatusAction) {
    setReason("")
    setBlockIndefinite(false)
    setLockUntil("")
    setDialogAction(action)
  }

  function closeDialog() {
    if (updateStatus.isPending) return
    setDialogAction(null)
  }

  // ── Confirm-button enablement ───────────────────────────────────────────────
  const reasonMissing = !!meta?.destructive && reason.trim().length === 0
  const lockTimeMissing =
    dialogAction === "LOCK" && !blockIndefinite && lockUntil.trim().length === 0
  const confirmDisabled = updateStatus.isPending || reasonMissing || lockTimeMissing

  function handleConfirm() {
    if (!dialogAction || !meta) return

    const payload: UpdateAccountStatusRequest = { action: dialogAction }
    if (meta.destructive || reason.trim().length > 0) {
      payload.reason = reason.trim()
    }
    if (dialogAction === "LOCK") {
      payload.lockUntil = blockIndefinite ? null : new Date(lockUntil).toISOString()
    }

    updateStatus.mutate(payload, {
      onSuccess: () => setDialogAction(null),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Account Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const m = ACTION_META[action]
            const Icon = m.icon
            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className={`gap-1.5 ${m.destructive ? "text-destructive hover:text-destructive" : ""}`}
                onClick={() => openDialog(action)}
              >
                <Icon className="size-4" />
                {m.label}
              </Button>
            )
          })}
        </div>
      </CardContent>

      {/* ── Confirm dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogAction !== null} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent className="sm:max-w-md">
          {meta && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      meta.destructive ? "bg-destructive/10" : "bg-muted"
                    }`}
                  >
                    <meta.icon
                      className={`size-4 ${meta.destructive ? "text-destructive" : "text-foreground"}`}
                    />
                  </div>
                  <DialogTitle>{meta.title}</DialogTitle>
                </div>
                <DialogDescription>{meta.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-1">
                {/* Lock options */}
                {dialogAction === "LOCK" && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="block-indefinite" className="text-sm">
                        Block indefinitely
                      </Label>
                      <Switch
                        id="block-indefinite"
                        checked={blockIndefinite}
                        onCheckedChange={setBlockIndefinite}
                      />
                    </div>
                    {!blockIndefinite && (
                      <div className="space-y-1.5">
                        <Label htmlFor="lock-until" className="text-xs text-muted-foreground">
                          Locked until
                        </Label>
                        <Input
                          id="lock-until"
                          type="datetime-local"
                          value={lockUntil}
                          onChange={(e) => setLockUntil(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label htmlFor="action-reason" className="text-sm">
                    Reason {meta.destructive ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optional)</span>}
                  </Label>
                  <Textarea
                    id="action-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Recorded in the audit log"
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={updateStatus.isPending}>
                  Cancel
                </Button>
                <Button
                  variant={meta.destructive ? "destructive" : "default"}
                  onClick={handleConfirm}
                  disabled={confirmDisabled}
                >
                  {updateStatus.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  {meta.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
