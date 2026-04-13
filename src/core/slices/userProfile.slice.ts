import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { CurrentUserResponse } from "@/features/user/api/user.types"

interface UserProfileState {
  currentUser: CurrentUserResponse | null
  isFetching: boolean
  hasFetched: boolean
  fetchError: string | null
}

const initialState: UserProfileState = {
  currentUser: null,
  isFetching: false,
  hasFetched: false,
  fetchError: null,
}

export const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    fetchUserProfileStart(state) {
      state.isFetching = true
      state.fetchError = null
    },
    setUserProfile(state, action: PayloadAction<CurrentUserResponse>) {
      state.currentUser = action.payload
      state.isFetching = false
      state.hasFetched = true
      state.fetchError = null
    },
    clearUserProfile(state) {
      state.currentUser = null
      state.isFetching = false
      state.hasFetched = false
      state.fetchError = null
    },
    fetchUserProfileFailed(state, action: PayloadAction<string>) {
      state.isFetching = false
      state.hasFetched = true
      state.fetchError = action.payload
    },
  },
})

export const {
  fetchUserProfileStart,
  setUserProfile,
  clearUserProfile,
  fetchUserProfileFailed,
} = userProfileSlice.actions

export default userProfileSlice.reducer

