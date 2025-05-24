import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/constants";
import api from "@/lib/api";
import { getHoursMinutes } from "@/lib/formatDate";

type Chat = {
  room_id: string;
  sender: string;
  content: string;
  created_at: string;
  original_timestamp: number;
};

type ChatStore = {
  socket: Socket | null;
  isConnected: boolean;

  currentChannel: string | null;
  chats: Chat[];
  chatUsers: string[];

  onlineUsers: string[];

  connectSocket: () => void;
  disconnectSocket: () => void;

  joinChannel: (channelName: string) => void;
  leaveChannel: () => void;

  sendChat: (content: string, sender: string | undefined) => void;
  loadInitialChats: (channelName: string) => Promise<void>;

  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setOnlineUsers: (users: string[]) => void;

  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  nextBefore: number | null;
  loadMoreMessages: () => Promise<void>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  socket: null,
  isConnected: false,
  currentChannel: null,
  chats: [],
  chatUsers: [],
  onlineUsers: [],
  hasMoreMessages: false,
  isLoadingMore: false,
  nextBefore: null,

  connectSocket: () => {
    const socket = io(API_URL, {
      withCredentials: true,
      autoConnect: false,
    });

    socket.on("connect", () => {
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    socket.on("chat", (data) => {
      const timestamp = data.created_at ? getHoursMinutes(data.created_at) : "";
      const originalTimestamp =
        data.created_at || Math.floor(new Date().getTime() / 1000);

      const existingChat = get().chats.find(
        (chat) =>
          chat.content === data.content &&
          chat.sender === data.sender &&
          chat.original_timestamp === originalTimestamp
      );

      if (!existingChat) {
        set((state) => ({
          chats: [
            ...state.chats,
            {
              room_id: data.channel || state.currentChannel || "",
              sender: data.sender,
              content: data.content,
              created_at: timestamp,
              original_timestamp: originalTimestamp,
            },
          ],
        }));
      }
    });

    socket.on("online_users", ({ onlineUsers }) => {
      set({ onlineUsers });
    });

    socket.on("user_online", ({ userId }) => {
      set((state) => ({
        onlineUsers: [...new Set([...state.onlineUsers, userId])],
      }));
    });

    socket.on("user_offline", ({ userId }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((u) => u !== userId),
      }));
    });

    // Other chat events
    socket.on("chat_history", (data) => {
      if (data?.chats?.length) {
        const formattedChats = data.chats.map((chat: any) => ({
          room_id: chat.channel || get().currentChannel || "",
          sender: chat.sender,
          content: chat.content,
          created_at: chat.created_at ? getHoursMinutes(chat.created_at) : "",
          original_timestamp: chat.created_at || 0,
        }));
        set({ chats: formattedChats });
      }
    });

    socket.on("user_joined", (data) => {
      console.log("User joined event:", data);
    });

    socket.on("user_left", (data) => {
      console.log("User left event:", data);
    });

    socket.connect();
    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        currentChannel: null,
        chats: [],
        chatUsers: [],
        onlineUsers: [],
        hasMoreMessages: false,
        nextBefore: null,
      });
    }
  },

  joinChannel: (channelName) => {
    const { socket } = get();
    if (socket) {
      socket.emit("join_channel", channelName);
      set({
        currentChannel: channelName,
        chats: [],
        chatUsers: [],
        hasMoreMessages: false,
        nextBefore: null,
      });
      get().loadInitialChats(channelName);
    }
  },

  leaveChannel: () => {
    const { socket, currentChannel } = get();
    if (socket && currentChannel) {
      socket.emit("leave_channel", currentChannel);
      set({
        currentChannel: null,
        chats: [],
        chatUsers: [],
        hasMoreMessages: false,
        nextBefore: null,
      });
    }
  },

  sendChat: (content: string, sender: string | undefined) => {
    const { socket, currentChannel } = get();
    if (socket && currentChannel && content.trim()) {
      const originalTimestamp = Math.floor(new Date().getTime() / 1000);
      const timestamp = getHoursMinutes(originalTimestamp);

      set((state) => ({
        chats: [
          ...state.chats,
          {
            room_id: currentChannel,
            sender: sender || "You",
            content: content.trim(),
            created_at: timestamp,
            original_timestamp: originalTimestamp,
          },
        ],
      }));

      socket.emit("chat", {
        channel: currentChannel,
        content: content.trim(),
        sender: sender,
      });
    }
  },

  loadInitialChats: async (channelName: string) => {
    try {
      console.log(`Loading initial chats for channel: ${channelName}`);

      const res = await api.get(`/api/chats/${channelName}?limit=50`);

      console.log("API Response:", res.data);

      if (res.data?.success && res.data?.chats) {
        const formattedChats = res.data.chats.map((chat: any) => ({
          room_id: chat.room_id,
          sender: chat.sender.email || chat.sender,
          content: chat.content,
          created_at: getHoursMinutes(chat.created_at),
          original_timestamp: chat.created_at,
        }));

        console.log("Formatted chats:", formattedChats);

        set({
          chats: formattedChats,
          hasMoreMessages: res.data.hasMore || false,
          nextBefore: res.data.nextBefore || null,
        });
      }
    } catch (err) {
      console.error("Error loading initial chats:", err);
      const { socket, currentChannel } = get();
      if (socket?.connected && currentChannel) {
        socket.emit("request_chat_history", { channel: currentChannel });
      }
    }
  },

  loadMoreMessages: async () => {
    const { currentChannel, isLoadingMore, nextBefore } = get();

    if (!currentChannel || isLoadingMore || !nextBefore) {
      console.log("Cannot load more messages:", {
        currentChannel,
        isLoadingMore,
        nextBefore,
      });
      return;
    }

    set({ isLoadingMore: true });

    try {
      console.log(`Loading more messages before timestamp: ${nextBefore}`);

      const res = await api.get(
        `/api/chats/${currentChannel}?limit=50&before=${nextBefore}`
      );

      console.log("Load more API response:", res.data);

      if (res.data?.success && res.data?.chats?.length) {
        const formattedChats = res.data.chats.map((chat: any) => ({
          room_id: chat.room_id,
          sender: chat.sender.email || chat.sender,
          content: chat.content,
          created_at: getHoursMinutes(chat.created_at),
          original_timestamp: chat.created_at,
        }));

        set((state) => ({
          chats: [...formattedChats, ...state.chats], // Prepend older messages
          hasMoreMessages: res.data.hasMore || false,
          nextBefore: res.data.nextBefore || null,
          isLoadingMore: false,
        }));
      } else {
        set({
          isLoadingMore: false,
          hasMoreMessages: false,
          nextBefore: null,
        });
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      set({
        isLoadingMore: false,
        hasMoreMessages: false,
        nextBefore: null,
      });
    }
  },

  // Online users methods
  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: [...new Set([...state.onlineUsers, userId])],
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u !== userId),
    })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
