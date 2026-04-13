import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { LoginResponse } from "@/features/auth/api/auth.types"

// ─── State ────────────────────────────────────────────────────────────────────
interface AuthState {
  /** JWT access token — attached to every authenticated request via axios interceptor */
  accessToken: string | null
  /** Core user info from the login response */
  user: {
    userId: string
    email: string
    username: string | null
    name: string | null
  } | null
  /** Seconds until the access token expires (from login response) */
  expiresIn: number | null
  tokenType: string
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  expiresIn: null,
  tokenType: "Bearer",
}

// ─── Slice ────────────────────────────────────────────────────────────────────
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called on successful login — stores token + user info */
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      const { accessToken, expiresIn, tokenType, userId, email, username, name } =
        action.payload
      state.accessToken = accessToken
      state.expiresIn = expiresIn
      state.tokenType = tokenType
      state.user = { userId, email, username, name }
    },
    /** Called on logout or token expiry */
    clearCredentials(state) {
      state.accessToken = null
      state.user = null
      state.expiresIn = null
      state.tokenType = "Bearer"
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
