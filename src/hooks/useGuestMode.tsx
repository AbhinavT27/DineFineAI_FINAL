import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

export type GuestFeature = 'search' | 'scrape' | 'ai_analysis' | 'comparison';

interface GuestUsage {
  date: string;
  count: number;
}

const DAILY_LIMIT = 3;
const STORAGE_PREFIX = 'guestUsage:';

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
};

export const useGuestMode = () => {
  const [usageCounts, setUsageCounts] = useState<Record<GuestFeature, number>>({
    search: 0,
    scrape: 0,
    ai_analysis: 0,
    comparison: 0,
  });

  // Load usage from localStorage on mount
  useEffect(() => {
    const today = getTodayDate();
    const newUsageCounts = { ...usageCounts };

    (['search', 'scrape', 'ai_analysis', 'comparison'] as GuestFeature[]).forEach((feature) => {
      const storageKey = `${STORAGE_PREFIX}${feature}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const usage: GuestUsage = JSON.parse(stored);
          // Reset if date is different
          if (usage.date === today) {
            newUsageCounts[feature] = usage.count;
          } else {
            // Old date, reset to 0
            newUsageCounts[feature] = 0;
            localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
          }
        } catch {
          // Invalid JSON, reset
          newUsageCounts[feature] = 0;
          localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
        }
      } else {
        // No stored data, initialize
        localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
      }
    });

    setUsageCounts(newUsageCounts);
  }, []);

  const canUseFeature = useCallback((feature: GuestFeature): boolean => {
    return usageCounts[feature] < DAILY_LIMIT;
  }, [usageCounts]);

  const getRemainingUses = useCallback((feature: GuestFeature): number => {
    return Math.max(0, DAILY_LIMIT - usageCounts[feature]);
  }, [usageCounts]);

  const incrementFeatureUsage = useCallback((feature: GuestFeature): boolean => {
    const today = getTodayDate();
    const storageKey = `${STORAGE_PREFIX}${feature}`;
    
    if (usageCounts[feature] >= DAILY_LIMIT) {
      return false;
    }

    const newCount = usageCounts[feature] + 1;
    const usage: GuestUsage = { date: today, count: newCount };
    
    localStorage.setItem(storageKey, JSON.stringify(usage));
    setUsageCounts(prev => ({ ...prev, [feature]: newCount }));
    
    return true;
  }, [usageCounts]);

  const showLimitReachedModal = useCallback((feature: GuestFeature, onSignUp: () => void) => {
    const featureNames: Record<GuestFeature, string> = {
      search: 'Restaurant Search',
      scrape: 'Menu Scraping',
      ai_analysis: 'AI Analysis',
      comparison: 'Restaurant Comparison',
    };

    toast.error(
      `You've reached today's free limit for ${featureNames[feature]}. Create a free account to continue!`,
      {
        position: 'top-center',
        duration: 5000,
        action: {
          label: 'Sign Up',
          onClick: onSignUp,
        },
      }
    );
  }, []);

  return {
    usageCounts,
    canUseFeature,
    getRemainingUses,
    incrementFeatureUsage,
    showLimitReachedModal,
  };
};
