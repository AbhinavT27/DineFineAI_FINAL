import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export const DowngradeWarning = () => {
  const { isOverSavedRestaurantLimit, userTotals } = useFeatureGates();
  const { limits } = useSubscription();
  const navigate = useNavigate();

  if (!isOverSavedRestaurantLimit()) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          You have {userTotals.saved_restaurants_count} saved restaurants, but your current plan only allows {limits.maxSavedRestaurants}. 
          Please remove {userTotals.saved_restaurants_count - limits.maxSavedRestaurants} restaurants to continue using the app.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/saved-list')}
        >
          Manage Saved
        </Button>
      </AlertDescription>
    </Alert>
  );
};