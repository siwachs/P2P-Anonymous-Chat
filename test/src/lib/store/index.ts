import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./slices/userSlice";
// import messagesReducer from "./slices/messagesSlice";
// import connectionsReducer from "./slices/connectionsSlice";
// import onlineUsersReducer from "./slices/onlineUsersSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    // messages: messagesReducer,
    // connections: connectionsReducer,
    // onlineUsers: onlineUsersReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
