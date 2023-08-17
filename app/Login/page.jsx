"use client";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { database } from "../firebase";
import { useCookies } from "react-cookie";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cookie, setCookie] = useCookies(["user"]);

  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const usersRef = ref(database, "/users");
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const users = Object.values(userData);
        const user = users.find(
          (u) => u.username === username && u.password === password
        );

        if (user) {
          setCookie("user", username);
          router.push("/CreateRoom");
        } else {
          console.log("Invalid username or password");
        }
      } else {
        console.log("User not found");
      }
    } catch (error) {
      console.error("Error retrieving user data:", error);
    }
  };

  return (
    <div>
      <div className="bg-gray-900 text-white h-screen w-screen">
        <div className="flex flex-col items-center justify-center h-full">
          <form
            className="flex flex-col items-center justify-center border border-white rounded-lg py-5 px-4"
            onSubmit={handleSubmit}
          >
            <h1 className="text-4xl font-bold mb-10">Login</h1>
            <input
              className="bg-gray-800 text-white rounded-lg p-2 m-2"
              type="text"
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="bg-gray-800 text-white rounded-lg p-2 m-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="bg-cyan-700 text-white rounded-lg p-2 m-2"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
