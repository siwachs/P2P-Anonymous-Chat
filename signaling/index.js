import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "development" ? "*" : process.env.CORS_URL,
    methods: ["GET", "POST"],
  },

  // Optimize for low memory usage
  transports: ["websocket"],
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
});

const users = new Map(); // username -> {socketId, status, joinedAt}
const socketToUsername = new Map(); // socketId -> username
const rooms = new Map(); // roomId -> Set of usernames
const typingUsers = new Map(); // username -> set of target username
const connections = new Map(); // username -> set of connected usernames

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    users: users.size,
    rooms: rooms.size,
    memory: `${process.memoryUsage().heapUsed / 1024 / 1024} MB`,
  });
});

io.on("connection", (clientSocket) => {
  let currentUsername = null;

  clientSocket.on("register", (data) => {
    const username = data.username?.trim();

    if (!username || username.length > 20)
      return clientSocket.emit("register-error", {
        message: "Invalid username",
      });

    const existingUser = users.get(username);
    if (existingUser) {
      users.set(username, {
        ...existingUser,
        socketId: clientSocket.id,
        status: "online",
      });

      socketToUsername.delete(existingUser.socketId);
    } else {
      users.set(username, {
        socketId: clientSocket.id,
        status: "online",
        joinedAt: Date.now(),
      });
    }

    socketToUsername.set(clientSocket.id, username);
    currentUsername = username;

    // Get user's active connections
    const activeConnections = connections.get(username) || new set();
    clientSocket.emit("register-success", {
      username,
      activeConnections: Array.from(activeConnections),
    });

    // Notify reconnection to active connections
    activeConnections.forEach((connectedUsername) => {
      const connectedUser = users.get(connectedUsername);

      if (connectedUsername)
        io.to(connectedUser.socketId).emit("user-reconnected", {
          username,
        });
    });

    // Brodcast new user only if first time
    if (!existingUser) clientSocket.broadcast.emit("user-online", { username });

    // Send current online users
    const onlineUsers = Array.from(users.entries()).map(([username, data]) => ({
      username,
      status: data.status,
    }));
    clientSocket.emit("user-list", onlineUsers);
  });

  // 1-to-1 signaling using username ie private message
  clientSocket.on("signal-private", ({ toUsername, signal }) => {
    if (!currentUsername)
      return clientSocket.emit("error", { message: "Not Registered" });

    const targetUser = users.get(toUsername);
    if (!targetUser)
      return clientSocket.emit("signal-error", {
        message: "User offline",
        username: toUsername,
      });

    // Track connection
    if (!connections.has(currentUsername))
      connections.set(currentUsername, new Set());
    if (!connections.has(toUsername)) connections.set(toUsername, new Set());

    connections.get(currentUsername).add(toUsername);
    connections.get(toUsername).add(currentUsername);

    // Send signal
    io.to(targetUser.socketId).emit("signal-private", {
      fromUsername: currentUsername,
      signal,
    });
  });

  // Join room with username
  clientSocket.on("join-room", (roomId) => {
    if (!currentUsername)
      return clientSocket.emit("error", { message: "Not Registered" });

    clientSocket.join(roomId);

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(currentUsername);

    clientSocket.to(roomId).emit("user-joined-room", {
      username: currentUsername,
    });

    const members = Array.from(rooms.get(roomId) || []);
    clientSocket.emit("room-members", members);
  });

  // Leave room
  clientSocket.on("leave-room", (roomId) => {
    if (!currentUsername) return;

    clientSocket.leave(roomId);
    rooms.get(roomId)?.delete(currentUsername);

    if (rooms.get(roomId)?.size === 0) rooms.delete(roomId);

    clientSocket
      .to(roomId)
      .emit("user-left-room", { username: currentUsername });
  });

  // Typing Indicators with username
  clientSocket.on("typing-start", (targetUsername) => {
    if (!currentUsername) return;

    const targetUser = users.get(targetUsername);
    if (!targetUser) return;

    if (!typingUsers.has(currentUsername))
      typingUsers.set(currentUsername, new Set());
    typingUsers.get(currentUsername).add(targetUsername);

    io.to(targetUser.socketId).emit("typing-start", {
      fromUsername: currentUsername,
    });
  });

  clientSocket.on("typing-stop", (targetUsername) => {
    if (!currentUsername) return;

    const targetUser = users.get(targetUsername);
    if (!targetUser) return;

    typingUsers.get(currentUsername)?.delete(targetUser);

    if (typingUsers.get(currentUsername)?.size === 0)
      typingUsers.delete(currentUsername);

    io.to(targetUser.socketId).emit("typing-stop", {
      fromUsername: currentUsername,
    });
  });

  // Disconnects
  clientSocket.on("disconnect", () => {
    if (!currentUsername) return;

    // Mark as offline and keep username reserved for reconnection
    const user = users.get(currentUsername);
    if (user) user.set(currentUsername, { ...user, status: "offline" });

    socketToUsername.delete(clientSocket.id);

    // Notify connected users abot disconnect
    const userConnections = connections.get(currentUsername) || new Set();
    userConnections.forEach((connectedUsername) => {
      const connectedUser = users.get(connectedUsername);
      if (connectedUser && connectedUser.status === "online")
        io.emit(connectedUser.socketId).emit("user-disconnect", {
          username: currentUsername,
        });
    });

    // Remove from rooms
    rooms.forEach((members, roomId) => {
      if (members.has(currentUsername)) {
        members.delete(currentUsername);
        clientSocket
          .to(roomId)
          .emit("user-left-room", { username: currentUsername });
      }
    });

    // Clear typing status
    typingUsers.delete(currentUsername);

    // Clean up completly after timeout (5 minutes)
    setTimeout(() => {
      const user = users.get(currentUsername);
      if (user && user.status === "offline") {
        users.delete(currentUsername);
        connections.delete(currentUsername);

        clientSocket.broadcast.emit("user-ooline", {
          username: currentUsername,
        });
      }
    }, 300000);
  });
});

// Cleanup inactive users periodically
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  users.forEach((user, username) => {
    if (user.status === "offline" && now - users.joinedAt > fiveMinutes) {
      users.delete(username);
      connections.delete(username);
    }
  });
}, 60000); // Every minute

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(
    `📊 Memory usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
