
import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Restaurant } from '@/lib/types';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useSubscription } from '@/hooks/useSubscription';

interface SaveButtonProps {
  restaurant: Restaurant;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ restaurant, className = '' }) => {
  const { user } = useAuth();
  const { canSaveRestaurant, incrementSavedRestaurant, decrementSavedRestaurant, isOverSavedRestaurantLimit } = useFeatureGates();
  const { limits } = useSubscription();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if restaurant is already saved
  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, restaurant.id]);

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking if restaurant is saved:', error);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save restaurants');
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        // Remove from saved list
        const { error } = await supabase
          .from('saved_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurant.id);

        if (error) throw error;

        await decrementSavedRestaurant();
        setIsSaved(false);
        toast.success('Restaurant removed from saved list');
      } else {
        // Check if user is over their current plan's limit (due to downgrade)
        if (isOverSavedRestaurantLimit()) {
          toast.error(`You have exceeded your plan's limit of ${limits.maxSavedRestaurants} saved restaurants. Please remove some restaurants to continue.`);
          return;
        }

        // Check current saved count from Supabase before allowing save
        const { count, error: countError } = await supabase
          .from('saved_restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        if (count !== null && count >= limits.maxSavedRestaurants) {
          const planType = limits.maxSavedRestaurants === 5 ? 'Pro' : 'Premium';
          toast.error(`Saved restaurants limit reached (${limits.maxSavedRestaurants}). Upgrade to ${planType} for more saves!`);
          return;
        }

        // Add to saved list - convert Restaurant to Json
        const { error } = await supabase
          .from('saved_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurant.id,
            restaurant_data: restaurant as any
          });

        if (error) throw error;

        await incrementSavedRestaurant();
        setIsSaved(true);
        toast.success('Restaurant saved successfully!');
      }
    } catch (error: any) {
      console.error('Error toggling save status:', error);
      toast.error('Failed to update saved status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSaveToggle}
      disabled={isLoading}
      className={`${className} ${isSaved ? 'text-foodRed' : 'text-gray-400'} hover:text-foodRed`}
    >
      <Bookmark 
        className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} 
      />
    </Button>
  );
};

export default SaveButton;
