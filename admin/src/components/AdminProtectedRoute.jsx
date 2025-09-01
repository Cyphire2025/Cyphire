import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("admin-token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
