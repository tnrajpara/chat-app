import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Eye, EyeOff, User, Mail, Lock, FileText } from "lucide-react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check password strength when password field changes
    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    // Simple password strength check
    let score = 0;
    let message = "";

    if (password.length === 0) {
      setPasswordStrength({ score: 0, message: "" });
      return;
    }

    if (password.length > 6) score += 1;
    if (password.length > 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score < 2) message = "Weak password";
    else if (score < 4) message = "Medium strength password";
    else message = "Strong password";

    setPasswordStrength({ score, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/users`, formData);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 500) {
          toast.error("Internal server error");
        } else if (status === 409) {
          toast.error("Email already in use");
        } else if (status === 400) {
          toast.error("Please check your information and try again");
        } else {
          toast.error("Registration failed. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return "";
    if (passwordStrength.score < 2) return "text-red-500";
    if (passwordStrength.score < 4) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6  rounded-lg border border-zinc-200 dark:border-zinc-900">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 " />
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

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
          {passwordStrength.message && (
            <p className={`text-xs ${getPasswordStrengthColor()}`}>
              {passwordStrength.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">
            Bio (Optional)
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 " />
            <Textarea
              name="bio"
              id="bio"
              placeholder="Tell us about yourself"
              value={formData.bio}
              onChange={handleChange}
              className="pl-10 min-h-24"
            />
          </div>
        </div>

        <Button type="submit" className="w-full py-2" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <a
            href="/login"
            className=" hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
