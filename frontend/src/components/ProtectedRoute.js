import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccessPage } from "../utils/roles";

const ProtectedRoute = ({ children, page }) => {
  const { user } = useAuth();

  if (!user) {
    console.error("Usuario no autenticado, redirigiendo al inicio.");
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPage(user.rol, page)) {
    console.error(`Acceso denegado al rol "${user.rol}" para la página "${page}".`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
