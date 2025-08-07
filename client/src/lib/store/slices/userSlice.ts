import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { UserInfo, UserState } from "@/types/user";
import { WithOptional } from "@/types/util";

const initialState: UserState = {
  currentUser: null,
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setUser: (
      state,
      action: PayloadAction<
        WithOptional<UserInfo, "id" | "createdAt" | "expiresAt">
      >,
    ) => {
      const now = Date.now();

      state.currentUser = {
        ...action.payload,
        id: action.payload.id || nanoid(),
        createdAt: action.payload.createdAt || now,
        expiresAt: action.payload.expiresAt || now + 24 * 60 * 60 * 1000, // 24 hours
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

export const { setLoading, setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
