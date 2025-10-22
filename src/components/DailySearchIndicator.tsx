import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DailySearchIndicator: React.FC = () => {
  const { user } = useAuth();
  const [dailySearches, setDailySearches] = useState(0);
  const DAILY_SEARCH_LIMIT = 10;

  useEffect(() => {
    const fetchDailySearches = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_searchrequests')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDailySearches(profile.daily_searchrequests || 0);
      }
    };

    fetchDailySearches();

    // Subscribe to changes with unique channel name to avoid conflicts
    const channel = supabase
      .channel(`profile-search-updates-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Daily search count updated:', payload.new.daily_searchrequests);
          setDailySearches(payload.new.daily_searchrequests || 0);
        }
      )
      .subscribe();

    // Also set up a polling fallback to ensure updates are caught
    const pollInterval = setInterval(fetchDailySearches, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user]);

  const remainingSearches = Math.max(0, DAILY_SEARCH_LIMIT - dailySearches);
  
  const getCircleColor = () => {
    if (remainingSearches >= 7) return 'stroke-green-500';
    if (remainingSearches >= 4) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const usagePercentage = (dailySearches / DAILY_SEARCH_LIMIT) * 100;
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (usagePercentage / 100) * circumference;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">Searches:</span>
      <div className="relative w-10 h-10 sm:w-12 sm:h-12">
        <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            strokeWidth="2"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${getCircleColor()} transition-all duration-300 ease-in-out`}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-foreground font-semibold text-sm">{remainingSearches}</span>
        </div>
      </div>
    </div>
  );
};

export default DailySearchIndicator;
