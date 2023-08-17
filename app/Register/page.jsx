"use client";
import React, { useEffect, useState } from "react";
import { ref, push, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { database } from "../firebase";
import Link from "next/link";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false); // New state to control message visibility

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === confirmPassword) {
      const userRef = ref(database, "/users");
      get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        const users = Object.values(userData);
        const user = users.find((u) => u.username === username);
        if (user) {
          setUsernameExists(true);
          setShowErrorMessage(true); // Show the error message
          setTimeout(() => {
            setShowErrorMessage(false); // Hide the error message after 10 seconds
          }, 5000);
        } else {
          setUsernameExists(false);
          push(userRef, {
            username: username,
            password: password,
          }).then((newUserRef) => {
            console.log("Document written with ID: ", newUserRef.key);
            router.push("/Login");
          });
        }
      });
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen w-screen flex justify-center items-center">
      <form
        className="flex flex-col items-center justify-center border border-white rounded-lg py-5 px-4"
        onSubmit={handleSubmit}
      >
        <h1 className="text-4xl font-bold mb-10">Register</h1>
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
        <input
          className="bg-gray-800 text-white rounded-lg p-2 m-2"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          className="bg-cyan-700 text-white rounded-lg p-2 m-2"
          type="submit"
        >
          Register
        </button>
        {/* Display an error message if username exists */}
        {showErrorMessage && (
          <p className="text-red-500 mt-2">
            Username already exists. Please choose a different username.
          </p>
        )}
        <Link
          href="/Login"
          className="text-sm  text-cyan-700 underline rounded-lg p-2 m-2"
        >
          Login
        </Link>
      </form>
    </div>
  );
};

export default Register;
