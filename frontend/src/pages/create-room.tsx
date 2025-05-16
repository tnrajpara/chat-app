import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock, LockOpen, Hash, Pencil } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { API_URL } from "@/constants";
import { useNavigate } from "react-router";

export function CreateRoom() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    password: "",
  });
  const { userData } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPrivate: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    if (formData.isPrivate && !formData.password.trim()) {
      toast.error("Password is required for private rooms");
      return;
    }

    try {
      const body = {
        ...formData,
        email: userData?.email,
      };
      const res = await axios.post(`${API_URL}/api/rooms`, body, {
        withCredentials: true,
      });

      if (res.status === 403) {
        toast.warning(`Room ${formData.name} already exists.`);
      } else if (res.status === 201) {
        setFormData((prev) => ({
          ...prev,
          name: "",
          description: "",
          password: "",
        }));
        toast.success(`Room ${formData.name} created successfully!`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error(
          <div>
            Session expired. Please
            <span
              onClick={() => navigate("/login")}
              style={{
                color: "#3b82f6",
                textDecoration: "underline",
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              login again
            </span>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error("Could not create room. Please try again.");
      }
    }
  };
  return (
    <div className="flex min-h-screen justify-center items-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Pencil className="h-5 w-5" />
            Create New Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="name">Room Name</Label>
              </div>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Awesome Chat Room"
                className="text-base"
                required
              />
              <p className="text-sm text-muted-foreground">
                Choose a descriptive name that represents your room's purpose.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What will people discuss in this room?"
                className="resize-none min-h-[100px] text-base"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                {formData.isPrivate ? (
                  <Lock className="h-5 w-5 text-foreground" />
                ) : (
                  <LockOpen className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="isPrivate">Private Room</Label>
              </div>
              <Switch
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={handleSwitchChange}
              />
            </div>

            {formData.isPrivate && (
              <div className="space-y-3">
                <Label htmlFor="password">Room Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter a secure password"
                  className="text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Members will need this password to join the room.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Create Room
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
