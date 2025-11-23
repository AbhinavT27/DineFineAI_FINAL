import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FreeTrialFeature,
  getRemainingTriesFor,
  hasFreeTriesFor,
  registerFreeTryFor,
  getAllUsage,
} from '@/utils/freeTrial';
import { toast } from '@/components/ui/sonner';

export type { FreeTrialFeature };

/**
 * Hook for managing free trial feature usage for guest users
 */
export function useFreeTrial() {
  const navigate = useNavigate();
  const [usage, setUsage] = useState(getAllUsage());

  // Refresh usage state
  const refreshUsage = useCallback(() => {
    setUsage(getAllUsage());
  }, []);

  // Check on mount and refresh
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  /**
   * Check if user can use a feature, show modal if not
   * Returns true if user can proceed, false if blocked
   */
  const checkFeatureAccess = useCallback(
    (feature: FreeTrialFeature): boolean => {
      if (!hasFreeTriesFor(feature)) {
        const featureNames: Record<FreeTrialFeature, string> = {
          search: 'Search',
          scrape: 'Menu Scraping',
          prosCons: 'AI Analysis',
          compare: 'Restaurant Comparison',
        };

        toast.error(
          `You've used all your free ${featureNames[feature]} tries. Sign up to continue!`,
          {
            position: 'top-center',
            duration: 5000,
            action: {
              label: 'Sign Up',
              onClick: () => navigate('/auth'),
            },
          }
        );
        return false;
      }
      return true;
    },
    [navigate]
  );

  /**
   * Register feature usage after successful backend call
   */
  const registerUsage = useCallback(
    (feature: FreeTrialFeature) => {
      registerFreeTryFor(feature);
      refreshUsage();
    },
    [refreshUsage]
  );

  /**
   * Get remaining tries for a specific feature
   */
  const getRemainingTries = useCallback((feature: FreeTrialFeature): number => {
    return getRemainingTriesFor(feature);
  }, []);

  return {
    usage,
    checkFeatureAccess,
    registerUsage,
    getRemainingTries,
    refreshUsage,
  };
}
