const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const { verifyAccessToken } = require("./utils/jwtUtils");
const Chat = require("./models/chat");

const app = express();
app.use(morgan("combined"));
app.use(
  cors({
    // origin: "https://chat-app-eight-rouge-53.vercel.app",
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
// REST API routes
app.use("/api/users", require("./routes/user.route"));
app.use("/api/rooms", require("./routes/room.route"));
app.use("/api/chats", require("./routes/chat.route"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "https://chat-app-eight-rouge-53.vercel.app",
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie;

    if (!cookieHeader) {
      console.log("No cookie header found");
      return next(new Error("Authentication error: No cookies provided"));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.accessToken;

    if (!token) {
      console.log("No access token found in cookies");
      return next(
        new Error("Authentication error: No access token in cookies")
      );
    }

    const decoded = await verifyAccessToken(token);

    socket.user = decoded;

    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    next(new Error(err.message));
  }
});

io.on("connection", async (socket) => {
  let userId = socket.user?.payload?.email;
  let username = socket.user?.payload?.name;

  if (!userId || !username) {
    console.error("Invalid user data structure:", socket.user);
    userId = userId || "anonymous-" + socket.id.substring(0, 6);
    username = username || "Anonymous User";
  }

  if (onlineUsers.has(userId)) {
    const oldSocketId = onlineUsers(userId);
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) oldSocket.disconnect();
  }

  onlineUsers.set(userId, socket.id);

  io.emit("user_online", { userId });
  socket.emit("online_users", {
    onlineUsers: Array.from(onlineUsers.keys()),
  });

  socket.on("join_channel", async (channelName) => {
    if (socket.rooms.has(channelName)) {
      return;
    }

    socket.join(channelName);

    console.log(`User ${userId} joined channel: ${channelName}`);

    try {
      const recentChats = await Chat.find({ room_id: channelName })
        .sort({ created_at: -1 })
        .limit(50)
        .lean();

      socket.emit("chat_history", {
        channel: channelName,
        chats: recentChats.map((chat) => ({
          channel: channelName,
          sender: chat.sender,
          content: chat.content,
          created_at: Math.floor(new Date(chat.created_at).getTime() / 1000),
        })),
      });

      socket.to(channelName).emit("user_joined", {
        channel: channelName,
        userId: userId,
        username: username,
        message: `${username} has joined ${channelName}`,
        timestamp: Math.floor(Date.now() / 1000),
      });

      socket.emit("user_joined", {
        channel: channelName,
        userId: userId,
        username: username,
        message: `You joined ${channelName}`,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      console.error("Error fetching chat history:", err);
      socket.emit("chat_error", {
        message: "Failed to load chat history",
        error: err.message,
      });
    }
  });

  socket.on("request_chat_history", async (data) => {
    const channelName = data.channel;
    if (!channelName) {
      socket.emit("chat_error", { message: "Channel name is required" });
      return;
    }
    try {
      const recentChats = await Chat.find({ room_id: channelName })
        .sort({ created_at: -1 })
        .limit(50)
        .lean();

      socket.emit("chat_history", {
        channel: channelName,
        chats: recentChats.map((chat) => ({
          channel: channelName,
          sender: chat.sender,
          content: chat.content,
          created_at: Math.floor(new Date(chat.created_at).getTime() / 1000),
        })),
      });
    } catch (err) {
      console.error("Error fetching chat history:", err);
      socket.emit("chat_error", {
        message: "Failed to load chat history",
        error: err.message,
      });
    }
  });

  socket.on("chat", async (data) => {
    try {
      const newChat = new Chat({
        room_id: data.channel,
        sender: userId,
        content: data.content,
      });

      await newChat.save();

      io.to(data.channel).emit("chat", {
        channel: data.channel,
        sender: userId,
        username: username,
        content: data.content,
        created_at: Math.floor(Date.now() / 1000),
      });

      console.log(
        `Message sent to channel ${
          data.channel
        } by ${userId}: ${data.content.substring(0, 50)}...`
      );
    } catch (err) {
      console.error("Error saving chat:", err);
      socket.emit("chat_error", {
        message: "Failed to send message",
        error: err.message,
      });
    }
  });

  let typingUsers = {};
  socket.on("typing_start", (roomId) => {
    if (!typingUsers[roomId]) typingUsers[roomId] = new Set();
    typingUsers[roomId].add(socket.user?.payload?.name || "Anonymous");

    socket.to(roomId).emit("user_typing", {
      roomId,
      usersTyping: Array.from(typingUsers[roomId]),
    });
  });

  socket.on("typing_stop", (roomId) => {
    if (!typingUsers[roomId]) return;
    typingUsers[roomId].delete(socket.user?.payload?.name || "Anonymous");

    socket.to(roomId).emit("user_typing", {
      roomId,
      usersTyping: Array.from(typingUsers[roomId]),
    });
  });

  socket.on("leave_channel", (channelName) => {
    socket.leave(channelName);
    console.log(`User ${userId} left channel: ${channelName}`);

    socket.to(channelName).emit("user_left", {
      channel: channelName,
      userId: userId,
      username: username,
      message: `${username} has left ${channelName}`,
      timestamp: Math.floor(Date.now() / 1000),
    });
  });

  socket.on("disconnect", () => {
    Object.keys(typingUsers).forEach((roomId) => {
      typingUsers[roomId].delete(socket.user?.payload?.name);
    });

    if (onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);
      io.emit("user_offline", { userId });
    }

    io.emit("user_offline", { userId });

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        io.to(room).emit("user_left", {
          channel: room,
          userId: userId,
          username: username,
          message: `${username} has disconnected`,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
