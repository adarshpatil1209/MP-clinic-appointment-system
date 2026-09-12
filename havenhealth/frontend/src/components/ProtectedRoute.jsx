import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-forest-700">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
