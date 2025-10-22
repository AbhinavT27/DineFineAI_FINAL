import React from 'react';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useSubscription } from '@/hooks/useSubscription';
import { Infinity } from 'lucide-react';

const HeaderUsageIndicator: React.FC = () => {
  const { dailyUsage } = useFeatureGates();
  const { subscription_tier, limits } = useSubscription();

  const dailyScrapesUsed = dailyUsage.restaurant_scrapes;
  const dailyScrapesLimit = limits.dailyRestaurantScrapes;
  const remainingScrapes = dailyScrapesLimit === -1 ? -1 : dailyScrapesLimit - dailyScrapesUsed;
  
  const getCircleColor = () => {
    if (dailyScrapesLimit === -1) return 'stroke-green-500'; // Premium always green
    
    if (subscription_tier === 'free') {
      if (remainingScrapes >= 4) return 'stroke-green-500';
      if (remainingScrapes >= 2) return 'stroke-yellow-500';
      return 'stroke-red-500';
    }
    
    if (subscription_tier === 'pro') {
      if (remainingScrapes >= 11) return 'stroke-green-500';
      if (remainingScrapes >= 5) return 'stroke-yellow-500';
      return 'stroke-red-500';
    }
    
    return 'stroke-green-500';
  };

  const usagePercentage = dailyScrapesLimit === -1 ? 0 : (dailyScrapesUsed / dailyScrapesLimit) * 100;
  const circumference = 2 * Math.PI * 16; // radius of 16
  const strokeDashoffset = dailyScrapesLimit === -1 ? circumference : circumference - (usagePercentage / 100) * circumference;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">Scrapes:</span>
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
        {dailyScrapesLimit === -1 ? (
          <Infinity className="h-4 w-4 text-green-500" />
        ) : (
          <span className="text-foreground font-semibold text-sm">{remainingScrapes}</span>
        )}
      </div>
    </div>
    </div>
  );
};

export default HeaderUsageIndicator;