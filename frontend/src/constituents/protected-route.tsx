import { useEffect, useRef } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, verifyAuth } = useAuthStore();
  const requestMadeRef = useRef(false);

  useEffect(() => {
    if (requestMadeRef.current || isAuthenticated !== null) return;
    requestMadeRef.current = true;
    verifyAuth();
  }, [isAuthenticated, verifyAuth]);

  if (isAuthenticated === null) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
};
