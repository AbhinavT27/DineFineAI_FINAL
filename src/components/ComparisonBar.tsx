
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/contexts/ComparisonContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Link, useLocation } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ComparisonBar: React.FC = () => {
  const { comparisonRestaurants, removeFromComparison, clearComparison } = useComparison();
  const { subscription_tier } = useSubscription();
  const location = useLocation();

  // Get max comparisons based on subscription tier
  const getMaxComparisons = () => {
    if (subscription_tier === 'premium') return 3;
    if (subscription_tier === 'pro') return 2;
    return 0; // Free users can't compare
  };

  // Clear comparison when on home page
  useEffect(() => {
    if (location.pathname === '/home' || location.pathname === '/') {
      clearComparison();
    }
  }, [location.pathname]); // Removed clearComparison dependency to prevent infinite loop

  // Don't show comparison bar on home page
  if (location.pathname === '/home' || location.pathname === '/') {
    return null;
  }

  // Get current search state to pass to comparison page
  const searchResults = location.state?.searchResults || [];
  const searchPreferences = location.state?.searchPreferences || {};

  if (comparisonRestaurants.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-white shadow-lg border-2 border-foodRed/20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-foodRed" />
          <span className="font-medium">Compare Restaurants ({comparisonRestaurants.length}/{getMaxComparisons()})</span>
        </div>
        
        <div className="flex gap-2">
          {comparisonRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <span className="text-sm truncate max-w-20">{restaurant.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromComparison(restaurant.id)}
                className="h-4 w-4 p-0"
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="default" className="bg-foodRed hover:bg-foodRed/90">
            <Link 
              to="/comparison"
              state={{
                searchResults: searchResults,
                searchPreferences: searchPreferences
              }}
            >
              Compare Now
            </Link>
          </Button>
          <Button variant="outline" onClick={clearComparison}>
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ComparisonBar;
