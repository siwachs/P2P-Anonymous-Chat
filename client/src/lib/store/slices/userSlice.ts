import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { isDeepEqual } from "@/lib/utils";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserInfo, UserState, WithOptional } from "@/types";
import { USER_EXPIRES_IN } from "@/lib/constants";

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
      >
    ) => {
      const now = Date.now();
      const newUser = {
        ...action.payload,
        id: action.payload.id || nanoid(),
        createdAt: action.payload.createdAt || now,
        expiresAt: action.payload.expiresAt || now + USER_EXPIRES_IN,
      };

      if (!state.currentUser || !isDeepEqual(state.currentUser, newUser))
        state.currentUser = newUser;
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
