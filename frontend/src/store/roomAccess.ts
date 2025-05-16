import { create } from "zustand";

interface Room {
  _id: string;
  room_name: string;
  room_description: string;
  email: string;
  is_private: boolean;
  room_password: string;
  created_at: string;
}

interface RoomAccessState {
  isUserRoomAuthenticated: boolean | null;
  room: Room | null;
  setAuthStatus: (status: boolean) => void;
  setRoom: (room: Room | null) => void;
}

export const userRoomAuthStore = create<RoomAccessState>((set) => ({
  isUserRoomAuthenticated: null,
  room: null,
  setAuthStatus: (status) => set({ isUserRoomAuthenticated: status }),
  setRoom: (room) => set({ room }),
}));
