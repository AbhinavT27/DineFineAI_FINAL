
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Restaurant } from '@/lib/types';
import { addToHistory } from '@/services/historyService';
import { saveComparisonHistory } from '@/services/comparisonHistoryService';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface ComparisonContextType {
  comparisonRestaurants: Restaurant[];
  addToComparison: (restaurant: Restaurant) => void;
  removeFromComparison: (restaurantId: string) => void;
  clearComparison: () => void;
  isInComparison: (restaurantId: string) => boolean;
  canAddMore: boolean;
  saveCurrentComparison: () => Promise<void>;
  setComparisonFromHistory: (restaurants: Restaurant[]) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

interface ComparisonProviderProps {
  children: ReactNode;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [comparisonRestaurants, setComparisonRestaurants] = useState<Restaurant[]>([]);
  const [lastSavedComparison, setLastSavedComparison] = useState<string>('');
  const { user } = useAuth();
  
  // Use optional chaining and provide a fallback to avoid issues with useSubscription
  let subscription_tier = 'free';
  try {
    const subscriptionHook = useSubscription();
    subscription_tier = subscriptionHook.subscription_tier;
  } catch (error) {
    console.warn('useSubscription not available in ComparisonProvider, defaulting to free tier');
  }

  const getMaxComparisons = () => {
    // Guests and free users can compare 2 restaurants
    // Pro users can compare 2 restaurants
    // Premium users can compare 3 restaurants
    if (subscription_tier === 'premium') return 3;
    if (subscription_tier === 'pro') return 2;
    return 2; // Guests can compare 2 restaurants
  };

  const addToComparison = (restaurant: Restaurant) => {
    const maxComparisons = getMaxComparisons();
    setComparisonRestaurants(prev => {
      if (prev.length >= maxComparisons || prev.some(r => r.id === restaurant.id)) {
        return prev;
      }
      
      const newRestaurants = [...prev, restaurant];
      
      // Add to history when restaurant is added to comparison (async but not blocking)
      if (user?.id) {
        addToHistory(restaurant, 'compared', user.id)
          .then(result => {
            if (result?.error) {
              console.error('Error adding to comparison history:', result.error);
            } else {
              console.log('Added restaurant to comparison history:', restaurant.name);
            }
          })
          .catch(error => {
            console.error('Error adding to comparison history:', error);
          });
      }
      
      return newRestaurants;
    });
  };

  const removeFromComparison = (restaurantId: string) => {
    setComparisonRestaurants(prev => prev.filter(r => r.id !== restaurantId));
  };

  const clearComparison = () => {
    setComparisonRestaurants([]);
    setLastSavedComparison('');
  };

  const isInComparison = (restaurantId: string) => {
    return comparisonRestaurants.some(r => r.id === restaurantId);
  };

  const canAddMore = comparisonRestaurants.length < getMaxComparisons();

  const saveCurrentComparison = async () => {
    if (comparisonRestaurants.length > 1 && user?.id) {
      try {
        // Create a unique key for this comparison
        const comparisonKey = comparisonRestaurants.map(r => r.id).sort().join(',');
        
        // Only save if this exact comparison hasn't been saved recently
        if (comparisonKey !== lastSavedComparison) {
          const result = await saveComparisonHistory(comparisonRestaurants, user.id);
          if (result.error) {
            console.error('Failed to save comparison history:', result.error);
          } else {
            setLastSavedComparison(comparisonKey);
            console.log('Successfully saved comparison history for', comparisonRestaurants.length, 'restaurants');
          }
        }
      } catch (error) {
        console.error('Error saving comparison history:', error);
      }
    }
  };

  const setComparisonFromHistory = (restaurants: Restaurant[]) => {
    setComparisonRestaurants(restaurants);
    const comparisonKey = restaurants.map(r => r.id).sort().join(',');
    setLastSavedComparison(comparisonKey);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonRestaurants,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
        saveCurrentComparison,
        setComparisonFromHistory,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};
