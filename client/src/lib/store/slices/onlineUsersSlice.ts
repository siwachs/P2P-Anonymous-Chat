import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { OnlineUser, OnlineUsersState } from "@/types/onlineUser";

const initialState: OnlineUsersState = {
  users: {},
  isConnected: false,
  lastUpdated: 0,
};

const onlineUsersSlice = createSlice({
  name: "onlineUsers",
  initialState,
  reducers: {
    setOnlineUsers: (state, action: PayloadAction<OnlineUser[]>) => {
      state.users = {};
      for (const user of action.payload) {
        state.users[user.username] = user;
      }
      state.lastUpdated = Date.now();
    },

    addOnlineUser: (state, action: PayloadAction<OnlineUser>) => {
      state.users[action.payload.username] = action.payload;
    },

    removeOnlineUser: (state, action: PayloadAction<string>) => {
      delete state.users[action.payload];
    },

    updateUserStatus: (
      state,
      action: PayloadAction<{ username: string; status: OnlineUser["status"] }>
    ) => {
      if (state.users[action.payload.username])
        state.users[action.payload.username].status = action.payload.status;
    },

    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    clearOnlineUsers: (state) => {
      state.users = {};
      state.isConnected = false;
    },
  },
});

export const {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateUserStatus,
  setConnectionStatus,
  clearOnlineUsers,
} = onlineUsersSlice.actions;
export default onlineUsersSlice.reducer;

// Selectors
export const selectOnlineUsers = (state: { onlineUsers: OnlineUsersState }) =>
  Object.values(state.onlineUsers.users);

export const selectOnlineUser = (
  state: { onlineUsers: OnlineUsersState },
  username: string
) => state.onlineUsers.users[username];

export const selectIsuserOnline = (
  state: { onlineUsers: OnlineUsersState },
  username: string
) => !!state.onlineUsers.users[username];
