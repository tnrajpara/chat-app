import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DoorOpen, Hash, Loader2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router";
import { useState } from "react";
import { PasswordModal } from "./ask-password-modal";
import { API_URL } from "@/constants";
import axios from "axios";
import {
  fetchRoom,
  useRoomQuery,
  type OtherRoom,
  type Room,
} from "@/queries/actions";
import { toast } from "sonner";

export interface RoomSummary {
  _id: string;
  room_name: string;
  room_description: string;
  email: string;
  is_private: boolean;
}

async function fetchRooms(): Promise<RoomSummary[]> {
  const response = await api.get(`/api/rooms`);
  return response.data.rooms;
}

export default function HomeCards() {
  const {
    data: rooms,
    isLoading: isLoadingRooms,
    isError: isErrorRooms,
  } = useQuery<RoomSummary[]>({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isProcessingJoin, setIsProcessingJoin] = useState(false);
  const { userData } = useAuthStore();

  // const { data: _selectedRoomDataFromHook } = useRoomQuery(selectedRoomId);

  if (isLoadingRooms) {
    return <LoadingSpinner text="Loading rooms..." />;
  }

  if (isErrorRooms) {
    return <div className="text-center py-8">Failed to load rooms</div>;
  }

  const handleJoinRoom = async (room_id: string, is_private: boolean) => {
    if (!is_private) {
      navigate(`/room/${room_id}`);
    } else {
      setIsProcessingJoin(true);
      try {
        const roomDetails: Room | OtherRoom = await queryClient.fetchQuery({
          queryKey: ["room", room_id],
          queryFn: () => fetchRoom(room_id),
        });

        function isRoom(obj: any): obj is Room {
          return obj && typeof obj === "object" && "room" in obj;
        }

        if (isRoom(roomDetails) && roomDetails.room) {
          navigate(`/room/${room_id}`);
          setSelectedRoomId(null);
        } else {
          setSelectedRoomId(room_id);
          setIsModalOpen(true);
        }
      } catch (error) {
        if (typeof error === "string") {
          toast.error(error);
        }
        console.error(error);
      } finally {
        setIsProcessingJoin(false);
      }
    }
  };

  const handleSubmitPassword = async () => {
    if (password.trim() && selectedRoomId) {
      try {
        const res = await axios.post(
          `${API_URL}/api/rooms/${selectedRoomId}`,
          {
            email: userData?.email,
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
        console.error("Error submitting password:", error);
        alert(
          "An error occurred while trying to join the room. Please try again."
        );
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {rooms?.map((room) => (
          <Card
            key={room._id}
            className="hover:shadow-md transition-all duration-200 border border-zinc-200 hover:border-zinc-300 relative overflow-hidden"
          >
            {/* Private room badge */}
            {room.is_private && (
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Private
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <Hash className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-zinc-900 truncate">
                    {room.room_name}
                  </CardTitle>
                  <CardDescription className="text-sm text-zinc-500 mt-1">
                    {userData?.email === room.email ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> Your room
                      </span>
                    ) : (
                      `${room.email.split("@")[0]}'s room`
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm text-zinc-600 line-clamp-3 mb-4">
                {room.room_description || "No description provided"}
              </p>

              <div className="flex justify-between items-center">
                {/* <div className="text-xs text-zinc-500">
                  {room.member_count || 0} members
                </div> */}

                <Button
                  size="sm"
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                  onClick={() => handleJoinRoom(room._id, room.is_private)}
                  disabled={isProcessingJoin && selectedRoomId === room._id}
                >
                  {isProcessingJoin && selectedRoomId === room._id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <DoorOpen className="h-3 w-3" />
                      Join Room
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PasswordModal
        isModalOpen={isModalOpen}
        setIsModalOpen={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) {
            setSelectedRoomId(null);
            setPassword("");
          }
        }}
        password={password}
        setPassword={setPassword}
        handleSubmit={handleSubmitPassword}
      />
    </>
  );
}
