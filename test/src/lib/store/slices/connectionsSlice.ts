import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { PeerConnectionState } from "@/lib/webrtc/PeerConnection";
import type { ConnectionInfo, ConnectionState } from "@/types/connection";

const initialState: ConnectionState = {
  connections: {},
  activeConnection: null,
};

const connectionSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    addConnection: (state, action: PayloadAction<ConnectionInfo>) => {
      state.connections[action.payload.username] = action.payload;
    },

    updateConnectionState: (
      state,
      action: PayloadAction<{ username: string; state: PeerConnectionState }>
    ) => {
      if (state.connections[action.payload.username]) {
        state.connections[action.payload.username].state = action.payload.state;

        if (action.payload.state === "connected")
          state.connections[action.payload.username].connectedAt = Date.now();
      }
    },

    removeConnection: (state, action: PayloadAction<string>) => {
      delete state.connections[action.payload];

      if (state.activeConnection === action.payload)
        state.activeConnection = null;
    },

    setActiveConnection: (state, action: PayloadAction<string | null>) => {
      state.activeConnection = action.payload;
    },

    clearConnection: (state) => {
      state.connections = {};
      state.activeConnection = null;
    },
  },
});

export const {
  addConnection,
  updateConnectionState,
  removeConnection,
  setActiveConnection,
  clearConnection,
} = connectionSlice.actions;
export default connectionSlice.reducer;
