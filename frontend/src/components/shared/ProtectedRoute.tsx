import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export default function ProtectedRoute({ 
  children, 
  fallback = "/register" 
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to register page, but save the location they tried to access
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
