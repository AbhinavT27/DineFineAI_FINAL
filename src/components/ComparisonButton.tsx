
import React from 'react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/contexts/ComparisonContext';
import { Restaurant } from '@/lib/types';
import { GitCompare } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGate from './FeatureGate';

interface ComparisonButtonProps {
  restaurant: Restaurant;
  className?: string;
}

const ComparisonButton: React.FC<ComparisonButtonProps> = ({ restaurant, className }) => {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useComparison();
  const { limits } = useSubscription();

  const handleToggleComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInComparison(restaurant.id)) {
      removeFromComparison(restaurant.id);
      toast.success('Removed from comparison');
    } else if (canAddMore) {
      addToComparison(restaurant);
      toast.success('Added to comparison');
    } else {
      toast.error('You can only compare up to 3 restaurants');
    }
  };

  const isSelected = isInComparison(restaurant.id);

  // Show blurred button for non-pro users
  if (!limits.comparisonTool) {
    const handleProFeatureClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Comparison tool is a Pro feature. Upgrade to Pro to unlock this feature!');
    };

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleProFeatureClick}
        className={`${className} blur-sm`}
      >
        <GitCompare size={16} className="mr-1" />
        Compare
      </Button>
    );
  }

  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggleComparison}
      className={`${className} ${isSelected ? 'bg-foodRed hover:bg-foodRed/90' : ''}`}
      disabled={!canAddMore && !isSelected}
    >
      <GitCompare size={16} className="mr-1" />
      {isSelected ? 'Remove' : 'Compare'}
    </Button>
  );
};

export default ComparisonButton;
