import { createSlice } from "@reduxjs/toolkit"

// ─── State ────────────────────────────────────────────────────────────────────
interface AuthInitializationState {
  /** true while checking auth status on app init; false once complete */
  isAuthChecking: boolean
  /** true once auth check has been attempted (success or failure) */
  hasCheckedAuth: boolean
}

const initialState: AuthInitializationState = {
  isAuthChecking: true,
  hasCheckedAuth: false,
}

// ─── Slice ────────────────────────────────────────────────────────────────────
export const authInitializationSlice = createSlice({
  name: "authInitialization",
  initialState,
  reducers: {
    /** Called when auth check starts */
    startAuthCheck(state) {
      state.isAuthChecking = true
    },
    /** Called when auth check completes (success or failure) */
    completeAuthCheck(state) {
      state.isAuthChecking = false
      state.hasCheckedAuth = true
    },
  },
})

export const { startAuthCheck, completeAuthCheck } = authInitializationSlice.actions
export default authInitializationSlice.reducer
