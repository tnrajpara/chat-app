"use client";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { ref, push, onValue } from "firebase/database";
import { database } from "../firebase";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

const ChatPage = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [cookies, setCookie] = useCookies(["user", "roomName"]);

  const socket = io("http://localhost:8000");

  const roomName = useParams().ChatBoard.toString();
  const router = useRouter();

  useEffect(() => {
    // Fetch initial chat messages from the server

    const messagesRef = ref(database, `rooms/${roomName}/messages`);

    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      if (messages) {
        const messageList = Object.keys(messages).map((key) => ({
          id: key,
          ...messages[key],
        }));
        setChatMessages(messageList);
      }
    });
  }, []);

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== "") {
      const newMessage = {
        id: uuidv4(),
        roomName: roomName,
        sender: cookies.user,
        message: inputMessage,
      };
      setInputMessage("");
      socket.emit("chatMessage", newMessage);

      // Store the message in the Firebase database
      const messagesRef = ref(
        database,
        `rooms/${newMessage.roomName}/messages`
      );
      push(messagesRef, newMessage);
      console.log(cookies.user, "sent a message:", newMessage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleMessageSubmit(e);
    }
  };

  return (
    <div className="bg-gray-900 h-screen flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center space-x-2">
        <h1 className="text-center font-bold">ChatBoard:</h1>
        <p className="font-semibold text-gray-200"> {roomName}</p>

        <button
          className="bg-blue-500 text-white p-2"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            router.push("/Allrooms");
          }}
        >
          All Rooms
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div id="chatMessages" className="flex flex-col space-y-4">
          {chatMessages.map((chat) => (
            <div key={chat.id} className="text-white h-12 flex items-center">
              <span className="font-bold">{chat.sender} :</span>
              <span
                className="
                bg-sky-600 
                px-4
                py-2
                rounded-md
                text-white
                text-sm
                
                ml-2

              "
              >
                {chat.message}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 flex items-center">
        <form className="w-full flex" onSubmit={handleMessageSubmit}>
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-grow bg-gray-800 text-white p-2 rounded-l-md outline-none"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-r-md ml-2"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
