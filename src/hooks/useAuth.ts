"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/core/store"

export function useAuth() {
  const user = useSelector((state: RootState) => state.auth.user)
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const isAuthChecking = useSelector(
    (state: RootState) => state.authInitialization.isAuthChecking,
  )
  const hasCheckedAuth = useSelector(
    (state: RootState) => state.authInitialization.hasCheckedAuth,
  )
  const currentUser = useSelector((state: RootState) => state.userProfile.currentUser)
  const hasFetched = useSelector((state: RootState) => state.userProfile.hasFetched)
  const isFetchingProfile = useSelector((state: RootState) => state.userProfile.isFetching)

  return {
    user,
    accessToken,
    isChecking: isAuthChecking,
    hasCheckedAuth,
    isLoggedIn: !!user && !!accessToken,
    isAuthInitializing: isAuthChecking && !hasCheckedAuth,
    currentUser,
    hasFetched,
    isFetchingProfile,
    needsProfile: !!user && hasFetched && currentUser?.name === null,
  }
}

