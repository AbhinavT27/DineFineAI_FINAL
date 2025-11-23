import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: 'free' | 'pro' | 'premium';
  subscription_end: string | null;
}

interface UsageLimits {
  dailyRestaurantScrapes: number;
  maxSavedRestaurants: number;
  canCreateTags: boolean;
  comparisonTool: boolean;
  detailedCalories: boolean;
  aiAnalysis: boolean;
  exclusiveDiscounts: boolean;
  prioritySupport: boolean;
  advancedFilters: boolean;
}

const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    dailyRestaurantScrapes: 5,
    maxSavedRestaurants: 5,
    canCreateTags: false,
    comparisonTool: false,
    detailedCalories: true, // Customer reviews available on free
    aiAnalysis: false,
    exclusiveDiscounts: false,
    prioritySupport: false,
    advancedFilters: false,
  },
  pro: {
    dailyRestaurantScrapes: 15,
    maxSavedRestaurants: 20,
    canCreateTags: false, // Smart tagging is premium only
    comparisonTool: true, // 2-restaurant comparison
    detailedCalories: true, // Customer reviews available on pro
    aiAnalysis: false,
    exclusiveDiscounts: false,
    prioritySupport: false,
    advancedFilters: true,
  },
  premium: {
    dailyRestaurantScrapes: -1, // unlimited
    maxSavedRestaurants: -1, // unlimited
    canCreateTags: true, // Smart tagging system
    comparisonTool: true, // 3-restaurant comparison
    detailedCalories: true, // Customer reviews and AI-powered pros & cons
    aiAnalysis: true, // AI-powered analysis
    exclusiveDiscounts: true,
    prioritySupport: true,
    advancedFilters: true,
  },
};

// Normalize different tier labels to app's canonical tiers
const normalizeSubscriptionTier = (tier: any): 'free' | 'pro' | 'premium' => {
  const s = String(tier ?? '').trim().toLowerCase();
  if (['premium', 'enterprise', 'plus', 'ultimate'].includes(s)) return 'premium';
  if (['pro', 'professional', 'basic', 'starter', 'standard'].includes(s)) return 'pro';
  // Treat anything else (including empty) as free
  return 'free';
};

const CACHE_KEY = 'subscription_status';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSubscription = () => {
  const { user, session } = useAuth();
  const location = useLocation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(() => {
    // Initialize with cached data if available and not expired
    if (user?.email) {
      const cached = localStorage.getItem(`${CACHE_KEY}_${user.email}`);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
          }
        } catch (e) {
          // Invalid cache, will fallback to default
        }
      }
    }
    return {
      subscribed: false,
      subscription_tier: 'free',
      subscription_end: null,
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<number>(0);

  const checkSubscription = useCallback(async (forceRefresh = false) => {
    if (!user || !session) {
      const defaultStatus = {
        subscribed: false,
        subscription_tier: 'free' as const,
        subscription_end: null,
      };
      setSubscriptionStatus(defaultStatus);
      return;
    }

    // Check if we recently checked and don't need to refresh
    const now = Date.now();
    if (!forceRefresh && now - lastChecked < CACHE_DURATION) {
      return;
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem(`${CACHE_KEY}_${user.email}`);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (now - timestamp < CACHE_DURATION) {
            setSubscriptionStatus(data);
            setLastChecked(now);
            return;
          }
        } catch (e) {
          // Invalid cache, will continue to API call
        }
      }
    }

    setIsLoading(true);
    try {
      // First try to get subscription from edge function (Stripe API)
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // If edge function fails, try to read from Stripe tables directly
        console.warn('Edge function failed, trying direct database query:', error);
        
        // Get subscription info from subscribers table
        const { data: subscriptionData } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', user.email)
          .single();

        if (subscriptionData) {
          if (subscriptionData.subscribed && subscriptionData.subscription_end && new Date(subscriptionData.subscription_end) > new Date()) {
            setSubscriptionStatus({
              subscribed: true,
              subscription_tier: normalizeSubscriptionTier(subscriptionData.subscription_tier || 'free'),
              subscription_end: subscriptionData.subscription_end,
            });
          } else {
            setSubscriptionStatus({
              subscribed: false,
              subscription_tier: normalizeSubscriptionTier(subscriptionData.subscription_tier || 'free'),
              subscription_end: subscriptionData.subscription_end,
            });
          }
        } else {
          throw error;
        }
      } else {
        const rawTier = data?.subscription_tier ?? data?.tier ?? data?.plan ?? data?.subscriptionTier ?? data?.current_tier;
        const normalizedTier = data?.subscribed ? normalizeSubscriptionTier(rawTier) : 'free';
        const newStatus = {
          subscribed: !!data?.subscribed,
          subscription_tier: normalizedTier,
          subscription_end: data?.subscription_end ?? null,
        };
        
        setSubscriptionStatus(newStatus);
        
        // Cache the result
        try {
          localStorage.setItem(`${CACHE_KEY}_${user.email}`, JSON.stringify({
            data: newStatus,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache subscription status:', e);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Try to use cached data as fallback if API fails
      if (!forceRefresh) {
        const cached = localStorage.getItem(`${CACHE_KEY}_${user.email}`);
        if (cached) {
          try {
            const { data } = JSON.parse(cached);
            setSubscriptionStatus(data);
            console.log('Using cached subscription data due to API error');
          } catch (e) {
            // Cache is invalid, fall back to free tier
            setSubscriptionStatus({
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null,
            });
          }
        } else {
          // No cache available, default to free
          setSubscriptionStatus({
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: null,
          });
        }
      } else {
        // Force refresh failed, default to free
        setSubscriptionStatus({
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null,
        });
      }
    } finally {
      setIsLoading(false);
      setLastChecked(Date.now());
    }
  }, [user, session, lastChecked, subscriptionStatus.subscribed, subscriptionStatus.subscription_tier]);

  const createCheckout = useCallback(async (planType: 'pro' | 'premium' = 'pro') => {
    if (!user || !session) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('Stripe-checkout-pages', {
        body: { plan_type: planType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe checkout in the same tab
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    }
  }, [user, session]);

  const openCustomerPortal = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please log in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to customer portal in the same tab
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
    }
  }, [user, session]);

  // Check subscription only when user changes or on first mount
  useEffect(() => {
    if (user && session) {
      // Only check if we don't have recent data
      const now = Date.now();
      if (now - lastChecked > CACHE_DURATION) {
        checkSubscription();
      }
    }
  }, [user?.email, session?.access_token]); // Only depend on user email and session token

  // Set up realtime subscription for immediate updates
  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers',
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log('Subscription updated via realtime:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            const normalizedTier = normalizeSubscriptionTier(newData.subscription_tier);
            
            const updatedStatus: SubscriptionStatus = {
              subscribed: newData.subscribed ?? false,
              subscription_tier: normalizedTier,
              subscription_end: newData.subscription_end,
            };

            // Update state immediately
            setSubscriptionStatus(updatedStatus);

            // Update cache
            localStorage.setItem(
              `${CACHE_KEY}_${user.email}`,
              JSON.stringify({ data: updatedStatus, timestamp: Date.now() })
            );

            // Show toast notification only if user is authenticated and not in guest mode
            if (user?.email && !location.pathname.startsWith('/app/guest')) {
              toast.success('Subscription updated', {
                description: `Your plan has been updated to ${normalizedTier}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email]);

  // Get current plan limits
  const limits = PLAN_LIMITS[subscriptionStatus.subscription_tier] || PLAN_LIMITS.free;

  return {
    ...subscriptionStatus,
    limits,
    isLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};