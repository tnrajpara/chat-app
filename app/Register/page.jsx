"use client";
import React, { useEffect, useState } from "react";
import { ref, push, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import Link from "next/link";
import { createUser } from "../config";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (password === confirmPassword) {
        const user = await createUser(username, password);
        console.log(user);
        if (user) {
          router.push("/Login");
        } else {
          setShowErrorMessage(true);
        }
      }
    } catch (err) {
      console.log("Error creating user :: handSubmit-register.jsx", err);
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
