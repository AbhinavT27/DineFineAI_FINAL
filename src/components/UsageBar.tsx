import React from 'react';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Infinity } from 'lucide-react';

const UsageBar: React.FC = () => {
  const { dailyUsage } = useFeatureGates();
  const { subscription_tier, limits } = useSubscription();

  const dailyScrapesUsed = dailyUsage.restaurant_scrapes;
  const dailyScrapesLimit = limits.dailyRestaurantScrapes;

  const remainingScrapesUsed = dailyScrapesUsed;
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

  const getPlanColor = () => {
    if (subscription_tier === 'premium') return 'from-orange-500 to-orange-600';
    if (subscription_tier === 'pro') return 'from-blue-500 to-blue-600';
    return 'from-gray-500 to-gray-600';
  };

  const usagePercentage = dailyScrapesLimit === -1 ? 0 : (dailyScrapesUsed / dailyScrapesLimit) * 100;
  const circumference = 2 * Math.PI * 20; // radius of 20
  const strokeDashoffset = dailyScrapesLimit === -1 ? circumference : circumference - (usagePercentage / 100) * circumference;

  return (
    <div className={`bg-gradient-to-r ${getPlanColor()} border-b`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-3 text-white">
            {subscription_tier === 'premium' && <Crown className="h-5 w-5" />}
            <span className="text-sm font-medium">
              {subscription_tier === 'premium' ? 'Premium Plan' : `${subscription_tier.charAt(0).toUpperCase() + subscription_tier.slice(1)} Plan`} - Daily Scrapes
            </span>
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 50 50">
              {/* Background circle */}
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`${getCircleColor()} transition-all duration-300`}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {dailyScrapesLimit === -1 ? (
                <Infinity className="h-6 w-6 text-white" />
              ) : (
                <span className="text-white font-bold text-sm">{remainingScrapes}</span>
              )}
            </div>
          </div>
          
          <div className="text-white text-xs">
            {dailyScrapesLimit === -1 ? (
              <span className="font-medium">Unlimited scrapes</span>
            ) : (
              <span>{remainingScrapes} remaining today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageBar;