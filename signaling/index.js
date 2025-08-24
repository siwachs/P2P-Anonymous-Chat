import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { config } from "./config/environment.js";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === "development" ? "*" : config.CORS_URL,
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
const rooms = new Map(); // roomId -> Set of usernames
const typingUsers = new Map(); // username -> set of target username

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
    const age = data.age;
    const gender = data.gender;
    const country = data.country;
    const interests = data.interests || [];

    if (!username || username.length > 20)
      return clientSocket.emit("register-error", {
        message: "Invalid username",
      });

    const existingUser = users.get(username);
    if (existingUser)
      users.set(username, {
        ...existingUser,
        socketId: clientSocket.id,
        status: "online",
      });
    else
      users.set(username, {
        username,
        age,
        gender,
        country,
        interests,
        socketId: clientSocket.id,
        status: "online",
        joinedAt: Date.now(),
      });

    currentUsername = username;

    clientSocket.emit("register-success", {
      username,
    });

    // Broadcast new user only if first time
    const onlineUser = users.get(username);
    if (!existingUser) clientSocket.broadcast.emit("user-online", onlineUser);

    // Send current online users
    const onlineUsers = Array.from(users.entries()).map(([username, data]) => ({
      username,
      ...data,
    }));
    clientSocket.emit("users-list", onlineUsers);
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

    typingUsers.get(currentUsername)?.delete(targetUsername);

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
    if (user) users.set(currentUsername, { ...user, status: "offline" });

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

    // Clean up completely after timeout (5 minutes)
    setTimeout(() => {
      const user = users.get(currentUsername);
      if (user && user.status === "offline") {
        users.delete(currentUsername);

        // Notify everyone user is offline
        io.emit("user-offline", {
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
    if (user.status === "offline" && now - user.joinedAt > fiveMinutes) {
      users.delete(username);
    }
  });
}, 60000); // Every minute

httpServer.listen(config.PORT, () => {
  console.log(`🚀 Signaling server running on port ${config.PORT}`);
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
