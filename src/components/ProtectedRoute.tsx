
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isNewUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is authenticated but is a new user, redirect to profile
    // unless they're already on the profile page
    if (user && isNewUser && !location.pathname.includes('/profile')) {
      navigate('/profile?newUser=true', { replace: true });
    }
    
    // If not authenticated and not loading, redirect to auth
    if (!user && !isLoading) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate, isNewUser, location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, render children
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
