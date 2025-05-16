import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/api/users/login`, formData, {
        withCredentials: true,
      });

      if (res.status === 200) {
        toast.success("Login successfull");
        navigate("/");
      }

      if (res.status === 400) {
        toast.warning("Something is missing");
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
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6 mt-10">
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

      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  );
}
