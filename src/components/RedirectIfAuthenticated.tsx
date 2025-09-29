
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { session, isNewUser } = useAuth();

  // If authenticated and is a new user, redirect to profile with newUser flag
  if (session?.user && isNewUser) {
    return <Navigate to="/profile?newUser=true" replace />;
  }

  // If authenticated but not a new user, redirect to home
  if (session?.user) {
    return <Navigate to="/home" replace />;
  }

  // Not authenticated, show the children (auth page)
  return <>{children}</>;
};

export default RedirectIfAuthenticated;
