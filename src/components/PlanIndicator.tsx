import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';

const PlanIndicator: React.FC = () => {
  const { subscription_tier } = useSubscription();

  const getPlanDisplay = () => {
    switch (subscription_tier) {
      case 'free':
        return <span className="text-muted-foreground text-xl font-bold">Free</span>;
      case 'pro':
        return <span className="text-red-500 text-xl font-bold">Pro</span>;
      case 'premium':
        return (
          <span className="bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent text-xl font-bold">
            Premium
          </span>
        );
      default:
        return <span className="text-muted-foreground text-xl font-bold">Free</span>;
    }
  };

  return (
    <div className="flex items-center ml-3">
      {getPlanDisplay()}
    </div>
  );
};

export default PlanIndicator;