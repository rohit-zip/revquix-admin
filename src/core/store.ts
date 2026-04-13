import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/core/slices/auth.slice"
import authInitializationReducer from "@/core/slices/authInitialization.slice"
import userProfileReducer from "@/core/slices/userProfile.slice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    authInitialization: authInitializationReducer,
    userProfile: userProfileReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
