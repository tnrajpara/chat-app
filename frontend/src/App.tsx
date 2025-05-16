import { Routes, Route } from "react-router";
import RegisterForm from "./pages/register";
import LoginForm from "./pages/login";
import HomePage from "./pages/home";
import { ProtectedRoute } from "./constituents/protected-route";
import { CreateRoom } from "./pages/create-room";
import RoomPage from "./pages/room";

const App = () => {
  return (
    <Routes>
      <Route element={<LoginForm />} path="/login" />
      <Route element={<RegisterForm />} path="/register" />
      <Route element={<CreateRoom />} path="/create-room" />
      <Route element={<RoomPage />} path="/room/:room_id" />
      <Route
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
        path="/"
      />
    </Routes>
  );
};

export default App;
