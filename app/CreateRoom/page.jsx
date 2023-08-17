"use client";
import { useEffect, useState } from "react";
import { ref, set, push } from "firebase/database";
import { database } from "../firebase";
import { io } from "socket.io-client";
import { useCookies } from "react-cookie";
import Link from "next/link";

const CreateRoomPage = () => {
  const [roomName, setRoomName] = useState("");
  const [cookies] = useCookies(["user"]);
  const [roomCookie, setRoomCookie] = useCookies(["roomName"]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (roomName.trim() === "") {
      alert("Please enter a valid room name");
      return;
    }
    try {
      let user = cookies.user;
      const socket = io("http://localhost:8000");
      let room = roomName.trim();
      socket.emit("join-room", room, user);
      socket.on("room-users", (room, user) => {
        console.log(`User ${user} joined room ${room}`);
      });

      const roomsRef = ref(database, "rooms");
      const newRoomRef = push(roomsRef);

      await set(newRoomRef, { roomName });
      setRoomCookie("roomName", roomName.toLowerCase());
    } catch (error) {
      console.error("Error retrieving user data:", error);
    }
  };

  return (
    <div className="bg-gray-900 flex text-gray-100 w-screen h-screen items-center justify-center flex-col space-y-5 ">
      <h1>Create a Room</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="bg-gray-800 text-white p-2 rounded-md outline-none"
        />
        <Link className=" bg-cyan-600 p-2" href={`/${roomName}`}>
          Create or Join Room
        </Link>
      </form>
    </div>
  );
};

export default CreateRoomPage;
