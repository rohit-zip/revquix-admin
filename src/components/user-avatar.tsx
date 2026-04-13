"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { CurrentUserResponse } from "@/features/user/api/user.types"

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarUser = {
  name: string | null
  username: string | null
  email: string
} | null

type UserAvatarSize = "sm" | "md" | "lg"

interface UserAvatarProps {
  /** Basic auth-store user (name, username, email) */
  user: AvatarUser
  /** Full profile fetched from the API — supplies avatarUrl */
  currentUser?: CurrentUserResponse | null
  /** Preset sizes: sm = 8 (32px), md = 9 (36px), lg = 10 (40px). Defaults to "sm". */
  size?: UserAvatarSize
  /** Extra class names forwarded to the <Avatar> wrapper */
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive up to two initials from the best available display name. */
export function getInitials(user: AvatarUser): string {
  if (!user) return "U"
  const source = user.name ?? user.username ?? user.email
  return source
    .split(" ")
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("")
}

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Reusable user avatar that shows a profile picture when available,
 * falling back to initials derived from name / username / email.
 *
 * @example
 * // Basic usage
 * <UserAvatar user={user} currentUser={currentUser} />
 *
 * @example
 * // Larger variant
 * <UserAvatar user={user} currentUser={currentUser} size="md" />
 */
export function UserAvatar({
  user,
  currentUser,
  size = "sm",
  className,
}: UserAvatarProps) {
  const initials = getInitials(user)

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "border border-primary-200 dark:border-primary-800",
        className,
      )}
    >
      {currentUser?.avatarUrl && (
        <AvatarImage src={currentUser.avatarUrl} alt={initials} />
      )}
      <AvatarFallback className="bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

