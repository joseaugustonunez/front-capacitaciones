import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const isAuthenticated = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isAdmin = userData?.rol === 'admin';
  const isUser = userData?.rol === 'estudiante';

  if (!isAuthenticated) return <Navigate to="/" />;

  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  if (userOnly && !isUser) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;