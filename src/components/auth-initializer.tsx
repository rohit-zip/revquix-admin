"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch } from "@/hooks/useRedux"
import { completeAuthCheck, startAuthCheck } from "@/core/slices/authInitialization.slice"
import { setCredentials } from "@/core/slices/auth.slice"
import { fetchUserProfileFailed, fetchUserProfileStart, setUserProfile, } from "@/core/slices/userProfile.slice"
import { refreshToken } from "@/features/auth/api/auth.api"
import { getCurrentUser } from "@/features/user/api/user.api"
import { clearSessionCookie, setSessionCookie } from "@/lib/session-cookie"

export default function AuthInitializer() {
  const dispatch = useAppDispatch()

  // ─── One-shot guard ────────────────────────────────────────────────────────
  // React Strict Mode intentionally double-invokes effects in development to
  // surface side-effect bugs.  Without this guard, two concurrent calls to
  // POST /auth/refresh are fired on every app start, triggering the backend's
  // refresh-token-reuse detection and immediately invalidating the session.
  // A ref is used instead of state because it must survive the double-invoke
  // without causing a re-render.
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const performAuthCheck = async () => {
      dispatch(startAuthCheck())

      try {
        const response = await refreshToken()
        dispatch(setCredentials(response))
        setSessionCookie()

        try {
          dispatch(fetchUserProfileStart())
          const profile = await getCurrentUser()
          dispatch(setUserProfile(profile))
        } catch {
          dispatch(fetchUserProfileFailed("Failed to load profile"))
        }
      } catch {
        clearSessionCookie()
      } finally {
        dispatch(completeAuthCheck())
      }
    }

    performAuthCheck()
  }, [dispatch])

  return null
}
