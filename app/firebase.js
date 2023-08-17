import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCB43q0GG33zl8FovhgiU-P6WO3zwYeuOk",
  authDomain: "chat-application-b750f.firebaseapp.com",
  projectId: "chat-application-b750f",
  storageBucket: "chat-application-b750f.appspot.com",
  messagingSenderId: "405667301575",
  appId: "1:405667301575:web:c14681bc54831f9b5356e2",
  measurementId: "G-DL5HDD9CYN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
