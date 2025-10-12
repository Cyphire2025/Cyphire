import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// Simple hook to check for authentication token
const useAuth = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return { isAuthenticated: !!token };
};

// If the user is not logged in, redirect them to the sign-in page.
// Otherwise, show the page they were trying to access.
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.SIGN_IN} replace />;
};

// If the user IS logged in, redirect them away from public-only pages (like sign-in).
// Otherwise, show the public page.
export const PublicOnlyRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
};