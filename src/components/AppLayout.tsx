import React from 'react';
import { DowngradeWarning } from '@/components/DowngradeWarning';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isOverSavedRestaurantLimit } = useFeatureGates();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is over limit and not on saved-list page, redirect them
  React.useEffect(() => {
    if (isOverSavedRestaurantLimit() && !location.pathname.includes('/saved-list')) {
      navigate('/saved-list', { replace: true });
    }
  }, [isOverSavedRestaurantLimit, location.pathname, navigate]);

  // If user is over their limit, only show the warning and saved restaurants page
  if (isOverSavedRestaurantLimit()) {
    return (
      <div className="min-h-screen">
        <DowngradeWarning />
        {location.pathname.includes('/saved-list') ? children : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DowngradeWarning />
      {children}
    </div>
  );
};