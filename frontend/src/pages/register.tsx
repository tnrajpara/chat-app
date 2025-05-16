import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/users`, formData);

      if (res.status === 201) {
        toast.success("User has been created successfully.");
        navigate("/login");
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.status === 500) {
          toast.error("Internal server error");
          return;
        }
        if (err.status === 401) {
          toast.error("Invalid email or password");
          return;
        }
        if (err.status === 409) {
          toast.error("User already exists");
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6 mt-10">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          name="name"
          id="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          name="bio"
          id="bio"
          placeholder="Tell us about yourself"
          value={formData.bio}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" className="w-full">
        Register
      </Button>
    </form>
  );
}
