import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./slices/userSlice";
import messagesReducer from "./slices/messagesSlice";
import connectionsReducer from "./slices/connectionsSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      user: userReducer,
      messages: messagesReducer,
      connections: connectionsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
