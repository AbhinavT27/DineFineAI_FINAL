import React from 'react';
import { DowngradeWarning } from '@/components/DowngradeWarning';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { ThemeProvider } from '@/components/ThemeProvider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isOverSavedRestaurantLimit } = useFeatureGates();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is over limit and not on allowed pages, redirect them to saved-list
  React.useEffect(() => {
    const allowedPaths = ['/saved-list', '/profile', '/current-plan'];
    const isOnAllowedPath = allowedPaths.some(path => location.pathname.includes(path));
    
    if (isOverSavedRestaurantLimit() && !isOnAllowedPath) {
      navigate('/saved-list', { replace: true });
    }
  }, [isOverSavedRestaurantLimit, location.pathname, navigate]);

  // If user is over their limit, only show the warning and allowed pages
  if (isOverSavedRestaurantLimit()) {
    const allowedPaths = ['/saved-list', '/profile', '/current-plan'];
    const isOnAllowedPath = allowedPaths.some(path => location.pathname.includes(path));
    
    return (
      <div className="min-h-screen">
        <DowngradeWarning />
        {isOnAllowedPath ? children : null}
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen pb-16 sm:pb-0">
        <DowngradeWarning />
        {children}
        <BottomNav />
      </div>
    </ThemeProvider>
  );
};