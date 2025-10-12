import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';

interface DailyUsage {
  restaurant_scrapes: number;
  feedback_requests: number;
}

interface UserTotals {
  saved_restaurants_count: number;
  tags_count: number;
}

export const useFeatureGates = () => {
  const { user, session } = useAuth();
  const { limits, subscription_tier } = useSubscription();
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ restaurant_scrapes: 0, feedback_requests: 0 });
  const [userTotals, setUserTotals] = useState<UserTotals>({ 
    saved_restaurants_count: 0, 
    tags_count: 0 
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current usage
  const fetchUsage = useCallback(async () => {
    if (!user || !session) return;

    setIsLoading(true);
    try {
      // Use UTC date to ensure consistent reset at midnight UTC
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString().split('T')[0];

      // Fetch daily usage
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_usage')
        .select('restaurant_scrapes, feedback_requests')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      if (dailyError && dailyError.code !== 'PGRST116') {
        console.error('Error fetching daily usage:', dailyError);
      } else {
        setDailyUsage(dailyData || { restaurant_scrapes: 0, feedback_requests: 0 });
      }

      // Fetch user totals
      const { data: totalsData, error: totalsError } = await supabase
        .from('user_totals')
        .select('saved_restaurants_count, tags_count')
        .eq('user_id', user.id)
        .single();

      if (totalsError && totalsError.code !== 'PGRST116') {
        console.error('Error fetching user totals:', totalsError);
      } else {
        setUserTotals(totalsData || { saved_restaurants_count: 0, tags_count: 0 });
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Feature gate functions
  const canScrapeRestaurant = useCallback(() => {
    if (limits.dailyRestaurantScrapes === -1) return true; // unlimited
    return dailyUsage.restaurant_scrapes < limits.dailyRestaurantScrapes;
  }, [limits.dailyRestaurantScrapes, dailyUsage.restaurant_scrapes]);

  const canSaveRestaurant = useCallback(() => {
    if (limits.maxSavedRestaurants === -1) return true; // unlimited
    return userTotals.saved_restaurants_count < limits.maxSavedRestaurants;
  }, [limits.maxSavedRestaurants, userTotals.saved_restaurants_count]);

  const isOverSavedRestaurantLimit = useCallback(() => {
    if (limits.maxSavedRestaurants === -1) return false; // unlimited
    return userTotals.saved_restaurants_count > limits.maxSavedRestaurants;
  }, [limits.maxSavedRestaurants, userTotals.saved_restaurants_count]);

  const canCreateTag = useCallback(() => {
    return limits.canCreateTags;
  }, [limits.canCreateTags]);

  const canUseComparison = useCallback(() => {
    return limits.comparisonTool;
  }, [limits.comparisonTool]);

  const canSendFeedback = useCallback(() => {
    return dailyUsage.feedback_requests < 3;
  }, [dailyUsage.feedback_requests]);

  // Increment usage functions
  const incrementRestaurantScrape = useCallback(async () => {
    if (!user || !session) return false;

    // Check if user is over their current plan's limit (due to downgrade)
    if (isOverSavedRestaurantLimit()) {
      toast.error(`You have exceeded your plan's limit of ${limits.maxSavedRestaurants} saved restaurants. Please remove some restaurants to continue.`);
      return false;
    }

    if (!canScrapeRestaurant()) {
      const upgradeMessage = limits.dailyRestaurantScrapes === 5 
        ? `Daily scraping limit reached (${limits.dailyRestaurantScrapes}). Upgrade to Pro for more!`
        : `Daily scraping limit reached (${limits.dailyRestaurantScrapes}). Upgrade to Premium for unlimited scrapes!`;
      toast.error(upgradeMessage);
      return false;
    }

    try {
      // Use UTC date to ensure consistent reset at midnight UTC
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_usage')
        .upsert({
          user_id: user.id,
          usage_date: today,
          restaurant_scrapes: dailyUsage.restaurant_scrapes + 1,
          feedback_requests: dailyUsage.feedback_requests,
        }, {
          onConflict: 'user_id,usage_date'
        });

      if (error) throw error;

      setDailyUsage(prev => ({
        ...prev,
        restaurant_scrapes: prev.restaurant_scrapes + 1
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing restaurant scrape:', error);
      toast.error('Failed to track usage');
      return false;
    }
  }, [user, session, canScrapeRestaurant, limits.dailyRestaurantScrapes, dailyUsage.restaurant_scrapes]);

  const incrementSavedRestaurant = useCallback(async () => {
    if (!user || !session) return false;

    // Check if user is over their current plan's limit (due to downgrade)
    if (isOverSavedRestaurantLimit()) {
      toast.error(`You have exceeded your plan's limit of ${limits.maxSavedRestaurants} saved restaurants. Please remove some restaurants to continue.`);
      return false;
    }

    if (!canSaveRestaurant()) {
      const planType = limits.maxSavedRestaurants === 5 ? 'Pro' : 'Premium';
      toast.error(`Saved restaurants limit reached (${limits.maxSavedRestaurants}). Upgrade to ${planType} for more saves!`);
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_totals')
        .upsert({
          user_id: user.id,
          saved_restaurants_count: userTotals.saved_restaurants_count + 1,
          tags_count: userTotals.tags_count,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setUserTotals(prev => ({
        ...prev,
        saved_restaurants_count: prev.saved_restaurants_count + 1
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing saved restaurant:', error);
      toast.error('Failed to track usage');
      return false;
    }
  }, [user, session, canSaveRestaurant, limits.maxSavedRestaurants, userTotals.saved_restaurants_count]);

  const decrementSavedRestaurant = useCallback(async () => {
    if (!user || !session) return;

    try {
      const newCount = Math.max(0, userTotals.saved_restaurants_count - 1);
      const { error } = await supabase
        .from('user_totals')
        .upsert({
          user_id: user.id,
          saved_restaurants_count: newCount,
          tags_count: userTotals.tags_count,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setUserTotals(prev => ({
        ...prev,
        saved_restaurants_count: newCount
      }));
    } catch (error) {
      console.error('Error decrementing saved restaurant:', error);
    }
  }, [user, session, userTotals]);

  const decrementRestaurantScrape = useCallback(async () => {
    if (!user || !session) return;

    try {
      // Use UTC date to ensure consistent reset at midnight UTC
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString().split('T')[0];
      const newCount = Math.max(0, dailyUsage.restaurant_scrapes - 1);
      
      const { error } = await supabase
        .from('daily_usage')
        .upsert({
          user_id: user.id,
          usage_date: today,
          restaurant_scrapes: newCount,
          feedback_requests: dailyUsage.feedback_requests,
        }, {
          onConflict: 'user_id,usage_date'
        });

      if (error) throw error;

      setDailyUsage(prev => ({
        ...prev,
        restaurant_scrapes: newCount
      }));

      console.log('Refunded 1 scrape due to failed extraction');
    } catch (error) {
      console.error('Error decrementing restaurant scrape:', error);
    }
  }, [user, session, dailyUsage.restaurant_scrapes]);

  const incrementFeedbackRequest = useCallback(async () => {
    if (!user || !session) return false;

    if (dailyUsage.feedback_requests >= 3) {
      toast.error('Daily feedback limit reached (3 per day). Try again tomorrow!');
      return false;
    }

    try {
      // Use UTC date to ensure consistent reset at midnight UTC
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_usage')
        .upsert({
          user_id: user.id,
          usage_date: today,
          restaurant_scrapes: dailyUsage.restaurant_scrapes,
          feedback_requests: dailyUsage.feedback_requests + 1,
        }, {
          onConflict: 'user_id,usage_date'
        });

      if (error) throw error;

      setDailyUsage(prev => ({
        ...prev,
        feedback_requests: prev.feedback_requests + 1
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing feedback request:', error);
      toast.error('Failed to track usage');
      return false;
    }
  }, [user, session, dailyUsage]);

  // Get usage stats for display
  const getUsageStats = useCallback(() => {
    return {
      dailyScrapesUsed: dailyUsage.restaurant_scrapes,
      dailyScrapesLimit: limits.dailyRestaurantScrapes,
      savedRestaurantsUsed: userTotals.saved_restaurants_count,
      savedRestaurantsLimit: limits.maxSavedRestaurants,
      tagsUsed: userTotals.tags_count,
      planName: subscription_tier,
    };
  }, [dailyUsage, userTotals, limits, subscription_tier]);

  return {
    // Usage data
    dailyUsage,
    userTotals,
    isLoading,
    
    // Feature gates
    canScrapeRestaurant,
    canSaveRestaurant,
    canCreateTag,
    canUseComparison,
    canSendFeedback,
    isOverSavedRestaurantLimit,
    
    // Usage incrementers
    incrementRestaurantScrape,
    incrementSavedRestaurant,
    decrementSavedRestaurant,
    decrementRestaurantScrape,
    incrementFeedbackRequest,
    
    // Stats
    getUsageStats,
    
    // Refresh
    refreshUsage: fetchUsage,
  };
};