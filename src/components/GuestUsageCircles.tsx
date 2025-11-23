import React from 'react';
import { useGuestMode } from '@/hooks/useGuestMode';

const GuestUsageCircles = () => {
  const { getRemainingUses } = useGuestMode();
  
  const features = [
    { name: 'Searches', feature: 'search' as const, limit: 3 },
    { name: 'Scrapes', feature: 'scrape' as const, limit: 3 },
    { name: 'AI Analysis', feature: 'ai_analysis' as const, limit: 3 },
    { name: 'Compare', feature: 'comparison' as const, limit: 3 },
  ];

  const getCircleColor = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100;
    if (percentage >= 67) return 'stroke-green-500';
    if (percentage >= 34) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {features.map(({ name, feature, limit }) => {
        const remaining = getRemainingUses(feature);
        const used = limit - remaining;
        const usagePercentage = (used / limit) * 100;
        const circumference = 2 * Math.PI * 16;
        const strokeDashoffset = circumference - (usagePercentage / 100) * circumference;

        return (
          <div key={feature} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{name}</span>
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
                  className={`${getCircleColor(remaining, limit)} transition-all duration-300 ease-in-out`}
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-foreground font-semibold text-sm">{remaining}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuestUsageCircles;
