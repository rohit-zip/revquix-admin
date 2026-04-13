"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/hooks/useRedux"
import { completeAuthCheck, startAuthCheck } from "@/core/slices/authInitialization.slice"
import { setCredentials } from "@/core/slices/auth.slice"
import { fetchUserProfileFailed, fetchUserProfileStart, setUserProfile, } from "@/core/slices/userProfile.slice"
import { refreshToken } from "@/features/auth/api/auth.api"
import { getCurrentUser } from "@/features/user/api/user.api"
import { clearSessionCookie, setSessionCookie } from "@/lib/session-cookie"

export default function AuthInitializer() {
  const dispatch = useAppDispatch()

  useEffect(() => {
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


