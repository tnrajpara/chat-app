"use client";
import React from "react";
import Register from "../app/Register/page";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AllRooms from "./Allrooms/page";
const Page = () => {
  const [user, setUser] = React.useState(false);

  React.useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(false);
      }
    });
  });

  return (
    <div>
      {user ? (
        <AllRooms />
      ) : (
        <div>
          <Register />
        </div>
      )}
    </div>
  );
};

export default Page;
