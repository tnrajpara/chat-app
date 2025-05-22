import { useState, useEffect, useRef } from "react";
import {
  Send,
  Users,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Hash,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PasswordModal } from "@/constituents/ask-password-modal";
import { useAuthStore } from "@/store/authStore";
import {
  fetchRoom,
  type Room,
  type OtherRoom,
  type RoomDetail,
} from "@/queries/actions";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { useMediaQuery } from "@/hooks/use-media-query";
import { API_URL } from "@/constants";
import api from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/spinner";
import type { RoomSummary } from "@/constituents/homecards";
import { useChatStore } from "@/store/chatStore";

type GroupedMessage = {
  sender: string;
  isCurrentUser: boolean;
  messages: {
    content: string;
    created_at?: string;
  }[];
};

function RoomPage() {
  const room_id = useParams().room_id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [chat, setChat] = useState("");
  const { userData, verifyAuth } = useAuthStore();
  const queryClient = new QueryClient();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [activeRoom, setActiveRoom] = useState("");
  const [roomInfo, setRoomInfo] = useState<RoomDetail | OtherRoom | null>(null);
  const hasLoadedRoom = useRef(false);
  const hasAuthLoaded = useRef(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add this state to track when user sends a message
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  async function fetchUsers() {
    return (await api.get(`/api/users`)).data;
  }

  async function fetchRooms() {
    return (await api.get("/api/rooms")).data.rooms;
  }
  const {
    data: users,
    error: userError,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    data: rooms,
    isLoading: isLoadingRooms,
    isError: isErrorRooms,
  } = useQuery<RoomSummary[]>({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });

  const {
    socket,
    isConnected,
    chats,
    currentChannel,
    onlineUsers,
    hasMoreMessages,
    isLoadingMore,
    connectSocket,
    disconnectSocket,
    joinChannel,
    leaveChannel,
    sendChat,
    loadMoreMessages,
  } = useChatStore();

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (room_id && isConnected) {
      joinChannel(room_id);
    }
    return () => {
      if (currentChannel) {
        leaveChannel();
      }
    };
  }, [room_id, isConnected]);

  useEffect(() => {
    if (hasAuthLoaded.current) return;

    const verifyAuthentication = async () => {
      setIsLoading(true);
      hasAuthLoaded.current = true;
      try {
        await verifyAuth();
        setIsAuthVerified(true);
      } catch (error) {
        toast.error("Authentication required. Please log in.");
        hasAuthLoaded.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthVerified && userData && room_id && !hasLoadedRoom.current) {
      hasLoadedRoom.current = true;
      fetchRoomDetails(room_id);
    }

    return () => {
      if (room_id) {
        hasLoadedRoom.current = false;
      }
    };
  }, [isAuthVerified, userData, room_id]);

  async function fetchRoomDetails(room_id: string) {
    if (!room_id) return;

    try {
      const roomDetails: Room | OtherRoom | null = await queryClient.fetchQuery(
        {
          queryKey: ["room", room_id],
          queryFn: () => fetchRoom(room_id),
        }
      );

      function isRoom(obj: any): obj is Room {
        return obj && typeof obj === "object" && "room" in obj;
      }
      function isOtherRoom(obj: any): obj is OtherRoom {
        return "authorized" in obj;
      }

      if (isRoom(roomDetails) && roomDetails.room) {
        setRoomInfo(roomDetails.room);
        setIsModalOpen(false);
        setActiveRoom(roomDetails.room.room_name);
      } else if (
        isRoom(roomDetails) &&
        !(roomDetails as Room)?.room?.is_private &&
        roomDetails.room
      ) {
        setRoomInfo(roomDetails.room);
        setIsModalOpen(false);
        setActiveRoom(roomDetails.room.room_name);
      } else if (
        isOtherRoom(roomDetails) &&
        !roomDetails.authorized &&
        userData
      ) {
        setSelectedRoomId(room_id);
        setIsModalOpen(true);
      } else if (isOtherRoom(roomDetails) && !roomDetails?.authorized) {
        toast.error("Authentication required. Please log in.");
        navigate("/login", { state: { from: `/room/${room_id}` } });
      }
    } catch (error) {
      toast.error("Failed to fetch room details.");
      console.error("Error fetching room details:", error);
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!socket || !room_id) return;

    const handleTypingUpdate = (data: {
      roomId: string;
      usersTyping: string[];
    }) => {
      if (data.roomId === room_id) {
        setUsersTyping(data.usersTyping);
      }
    };

    socket.on("user_typing", handleTypingUpdate);

    return () => {
      socket.off("user_typing", handleTypingUpdate);
    };
  }, [socket, room_id]);

  // Updated useEffect - only scroll to bottom when shouldScrollToBottom is true
  useEffect(() => {
    if (shouldScrollToBottom) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false); // Reset the flag
    }
  }, [chats, shouldScrollToBottom]);

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const handleSubmitPassword = async () => {
    if (password.trim() && selectedRoomId && userData?.email) {
      try {
        const res = await axios.post(
          `${API_URL}/api/rooms/${selectedRoomId}`,
          {
            email: userData.email,
            password,
          },
          {
            withCredentials: true,
          }
        );

        if (res.status === 200) {
          navigate(`/room/${selectedRoomId}`);
          setSelectedRoomId(null);
          setIsModalOpen(false);
          setPassword("");
        }
      } catch (error) {
        toast.error(
          "Failed to join room. Please check the password and try again."
        );
      }
    } else if (!userData?.email) {
      toast.error("User email is missing. Please log in again.");
    }
  };

  const handleSendMessage = () => {
    if (chat.trim()) {
      if (!userData?.email) {
        toast.error("You must be logged in to send messages");
        return;
      }

      sendChat(chat, userData?.email);
      setChat("");

      // Set flag to scroll to bottom after sending message
      setShouldScrollToBottom(true);
    }
  };

  const groupedMessages: GroupedMessage[] = chats.reduce(
    (acc: GroupedMessage[], message, index) => {
      if (!message.content) return acc;

      const prevMessage = chats[index - 1];
      const isSameSender = prevMessage && prevMessage.sender === message.sender;

      const formattedCreatedAt = (() => {
        if (!message.created_at) return undefined;

        if (typeof message.created_at === "string") {
          return message.created_at;
        }

        // Handle Date objects or numeric timestamps
        const date = new Date(message.created_at);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        return undefined;
      })();

      if (isSameSender && prevMessage.content) {
        const lastGroup = acc[acc.length - 1];

        lastGroup.messages.push({
          content: message.content,
          created_at: formattedCreatedAt,
        });
        return acc;
      } else {
        acc.push({
          sender: message.sender,
          isCurrentUser:
            message.sender === (userData?.email || "you@example.com"),
          messages: [
            {
              content: message.content,
              created_at: formattedCreatedAt,
            },
          ],
        });
        return acc;
      }
    },
    []
  );

  if (isLoading || userLoading || isLoadingRooms) {
    return (
      <div className="h-[calc(100vh-64px)] flex">
        {/* Keep sidebar rendered during loading */}
        <aside className="bg-zinc-950 text-zinc-100 w-72">
          <div className="h-full flex flex-col p-3">
            {/* Simplified loading sidebar */}
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-zinc-800 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-zinc-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Loading..." />
        </main>
      </div>
    );
  }

  if (userError) {
    toast.error("Error fetching user data");
    return;
  }

  if (isErrorRooms) {
    toast.error("Error fetching user data");
    window.location.href = "/login";
    return;
  }
  return (
    <div className="h-[calc(100vh-64px)] flex bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-zinc-950 text-zinc-100 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? "w-0" : "w-72"
        }`}
      >
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-semibold text-zinc-100">Rooms</h2>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-full"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 -mx-3">
              <div className="px-3 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-2">
                    Channels
                  </h3>
                  {rooms?.map((channel) => (
                    <Button
                      key={channel._id}
                      variant="ghost"
                      className={`w-full justify-start font-normal rounded-lg px-3 ${
                        activeRoom === channel.room_name
                          ? "bg-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-950"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      }`}
                      onClick={() => {
                        setActiveRoom(channel.room_name);
                        navigate(`/room/${channel._id}`);
                      }}
                    >
                      <Hash className="h-4 w-4 mr-2 " />
                      <span className="truncate">
                        {channel.room_name.toLowerCase()}
                      </span>
                    </Button>
                  ))}
                </div>

                <Separator className="bg-zinc-800/50" />

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-2">
                    Direct Messages
                  </h3>
                  <div className="space-y-1">
                    {users &&
                      users.map((user: any) => (
                        <Button
                          key={user._id}
                          variant="ghost"
                          className="w-full justify-start font-normal hover:bg-zinc-800/50 rounded-lg px-3 py-2 transition-colors duration-150"
                        >
                          <div className="flex items-center w-full">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-zinc-700 text-zinc-100 text-sm font-medium">
                                {user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-zinc-100 truncate">
                                {user.email === userData?.email
                                  ? "You"
                                  : user.name}
                              </p>
                              <p className="text-xs text-zinc-400 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="ml-2 flex items-center">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  onlineUsers?.includes(user.email)
                                    ? "bg-green-500"
                                    : "bg-zinc-600"
                                }`}
                              />
                            </div>
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <Separator className="my-4 bg-zinc-800/50" />

            <div className="mt-auto">
              <div className="flex items-center p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarFallback className="bg-emerald-600 text-zinc-100">
                    {userData?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-zinc-100 truncate">
                    {userData?.name || "User"}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                    Online
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Toggle sidebar button */}
      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-2 top-[72px] z-10 bg-zinc-950 text-zinc-100 hover:bg-zinc-800 h-9 w-9 p-0 rounded-full shadow-sm"
          onClick={() => setSidebarCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-white">
        {/* Room header */}
        <header className="sticky top-0 z-10 h-16 min-h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Hash className="h-5 w-5 text-zinc-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                {(roomInfo as RoomDetail)?.room_name}
              </h1>
              {usersTyping.length > 0 && (
                <p className="text-xs text-zinc-500">
                  {usersTyping.length === 1
                    ? `${usersTyping[0]} is typing...`
                    : `${usersTyping.length} people typing...`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-zinc-200 hover:bg-zinc-50"
            >
              <Users className="h-4 w-4 text-zinc-600" />
              <span className="text-zinc-700">Participants</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-600 hover:bg-zinc-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden bg-zinc-50">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-6 pb-4">
              {hasMoreMessages && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span>Load older messages</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {groupedMessages.map((group, groupIndex) => (
                <div
                  key={`group-${groupIndex}`}
                  className={`flex ${
                    group.isCurrentUser ? "justify-end" : "justify-start"
                  } gap-3`}
                >
                  {!group.isCurrentUser && (
                    <Avatar className="h-9 w-9 mt-1 flex-shrink-0 text-sm">
                      <AvatarFallback className="bg-white border border-zinc-200 text-zinc-700">
                        {group.sender.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] flex flex-col ${
                      group.isCurrentUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!group.isCurrentUser && (
                        <span className="font-medium text-sm text-zinc-800">
                          {group.sender.split("@")[0]}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">
                        {group.messages[0].created_at}
                      </span>
                    </div>
                    <div
                      className={`space-y-2 ${
                        group.isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      {group.messages.map((msg, msgIdx) => (
                        <div
                          key={`${groupIndex}-${msgIdx}`}
                          className={`px-4 py-2 rounded-2xl ${
                            group.isCurrentUser
                              ? "bg-emerald-600 text-white rounded-tr-none"
                              : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none"
                          } shadow-sm`}
                        >
                          <div className="text-sm">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messageEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message input */}
        <footer className="sticky bottom-0 p-4 bg-white border-t border-zinc-200">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={chat}
                onChange={(e) => {
                  setChat(e.target.value);

                  if (typingTimeout.current) {
                    clearTimeout(typingTimeout.current);
                  }

                  if (!e.target.value.trim()) {
                    socket?.emit("typing_stop", room_id);
                    typingTimeout.current = null;
                    return;
                  }

                  if (!typingTimeout.current) {
                    socket?.emit("typing_start", room_id);
                  }

                  typingTimeout.current = setTimeout(() => {
                    socket?.emit("typing_stop", room_id);
                    typingTimeout.current = null;
                  }, 2000);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (typingTimeout.current) {
                      clearTimeout(typingTimeout.current);
                      typingTimeout.current = null;
                    }
                    socket?.emit("typing_stop", room_id);
                    handleSendMessage();
                  }
                }}
                className="pl-4 pr-12 py-5 rounded-xl border-zinc-300 "
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!chat.trim()}
              size="default"
              className="rounded-xl h-11 w-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </main>

      {/* Password Modal */}
      {isModalOpen && (
        <PasswordModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmitPassword}
        />
      )}
    </div>
  );
}

export default RoomPage;
