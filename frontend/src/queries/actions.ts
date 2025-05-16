import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface RoomDetail {
  _id: string;
  room_name: string;
  room_description: string;
  email: string;
  is_private: boolean;
}
export interface OtherRoom {
  authorized?: boolean;
}
export interface Room {
  room?: RoomDetail;
}

export const fetchRoom = async (roomId: string) => {
  const res = await api.get(`api/rooms/${roomId}`);
  return res.data;
};

export const useRoomQuery = (roomId: string | null) => {
  const query = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => {
      if (!roomId) {
        return Promise.reject(
          new Error("Room ID is required but was not provided.")
        );
      }
      return fetchRoom(roomId);
    },
    enabled: !!roomId,
  });

  return query;
};
