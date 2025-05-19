import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/users/login`, formData, {
        withCredentials: true,
      });

      toast.success("Login successful");
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 500) {
          toast.error("Internal server error");
        } else if (status === 401) {
          toast.error("Invalid email or password");
        } else if (status === 400) {
          toast.warning("Missing required fields");
        } else {
          toast.error("Login failed. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6  rounded-lg border border-zinc-200 dark:border-zinc-900">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 " />
            <Input
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 " />
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 "
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full py-2 mt-6" disabled={loading}>
          {loading ? <LoadingSpinner text="Logging in..." /> : "Sign in"}
        </Button>

        <p className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <a
            href="/register"
            className=" hover:underline "
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
          >
            Create account
          </a>
        </p>
      </form>
    </div>
  );
}
