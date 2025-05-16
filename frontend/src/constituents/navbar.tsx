import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const res = await api.post(`/api/users/logout`);
    if (res.status === 200) {
      navigate("/login");
    }
  };

  const handleCreateRoom = () => {
    navigate("/create-room");
  };

  return (
    <nav className="w-full px-4 sm:px-6 py-4 flex justify-between items-center border-b">
      <div className="text-xl font-bold">Chat Application</div>

      <div className="hidden md:flex space-x-4">
        <Button variant="ghost" onClick={handleCreateRoom}>
          Create Room
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 w-full md:hidden bg-background border-b shadow-lg z-50">
          <div className="flex flex-col space-y-2 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                handleCreateRoom();
                setMobileMenuOpen(false);
              }}
            >
              Create Room
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/");
                setMobileMenuOpen(false);
              }}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
