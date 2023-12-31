"use client";
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Page = () => {
  const [roomNames, setRoomNames] = useState([]);

  useEffect(() => {
    const roomRef = ref(database, "rooms");
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomNamesArray = Object.keys(data);
        setRoomNames(roomNamesArray);
      }
    });
  }, []);

  return (
    <div className="px-5 py-7 h-screen w-screen bg-gray-800">
      <div className="bg-gray-800 p-4 flex justify-between items-center space-x-2 lg:mb-10">
        <h1 className="text-center font-bold text-2xl">All Rooms</h1>
        <p className="font-semibold text-gray-200"> </p>

        <Link className="text-center" href={`/CreateRoom`}>
          <button className="bg-blue-500 text-white px-3 py-3 flex items-center justify-center text-2xl font-bold rounded-lg">
            Create Room
          </button>
        </Link>
      </div>
      <ul className="flex space-x-5">
        {roomNames.map((roomName, index) => (
          <li
            key={index}
            className="bg-cyan-500 text-white w-52 h-52 flex items-center justify-center text-2xl font-bold rounded-lg"
          >
            <Link className="text-center" href={`/${roomName}`}>
              {roomName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;
