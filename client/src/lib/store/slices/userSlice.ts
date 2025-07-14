import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { UserInfo, UserState } from "@/types/user";

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<Omit<UserInfo, "id" | "createdAt" | "expiresAt">>,
    ) => {
      const now = Date.now();

      state.currentUser = {
        ...action.payload,
        id: nanoid(),
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
      };
      state.error = null;
    },

    updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
      if (state.currentUser)
        state.currentUser = { ...state.currentUser, ...action.payload };
    },

    clearUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
