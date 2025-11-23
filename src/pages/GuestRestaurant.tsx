import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GuestHeader from '@/components/GuestHeader';
import RestaurantDetails from '@/components/RestaurantDetails';
import { Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { toast } from '@/components/ui/sonner';

const GuestRestaurant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checkFeatureAccess, registerUsage, getRemainingTries } = useFreeTrial();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase.functions.invoke('google-places-details', {
          body: { placeId: id }
        });

        if (error) throw error;
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
        toast.error('Failed to load restaurant details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <GuestHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen">
        <GuestHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Restaurant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <GuestHeader />
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <p>Scraping: {getRemainingTries('scrape')} free uses left</p>
          <p>AI Analysis: {getRemainingTries('prosCons')} free uses left</p>
        </div>
      </div>
      <RestaurantDetails 
        restaurant={restaurant}
        onScrapeAttempt={() => checkFeatureAccess('scrape')}
        onScrapeSuccess={() => registerUsage('scrape')}
        onAIAnalysisAttempt={() => checkFeatureAccess('prosCons')}
        onAIAnalysisSuccess={() => registerUsage('prosCons')}
      />
    </div>
  );
};

export default GuestRestaurant;
