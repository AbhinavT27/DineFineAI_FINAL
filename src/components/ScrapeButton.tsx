import { Button } from '@/components/ui/button';
import { ChefHat, Loader2 } from 'lucide-react';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface ScrapeButtonProps {
  restaurant: Restaurant;
  className?: string;
}

const ScrapeButton: React.FC<ScrapeButtonProps> = ({ restaurant, className }) => {
  const { canScrapeRestaurant } = useFeatureGates();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleScrapeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canScrapeRestaurant()) {
      navigate('/pricing');
      return;
    }

    try {
      setIsLoading(true);
      
      // Extract location from restaurant data
      const location = (restaurant as any).vicinity || (restaurant as any).formatted_address || restaurant.address || 'Unknown location';
      
      console.log('Calling AI menu generation for:', restaurant.name, 'in', location);
      
      const { data, error } = await supabase.functions.invoke('generate-ai-menu', {
        body: {
          restaurantName: restaurant.name,
          location: location
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('AI Menu generation successful:', data);

      toast({
        title: "Menu Generated Successfully",
        description: `Generated ${data.totalItemsGenerated || data.menuItems?.length || 0} menu items for ${restaurant.name}`,
      });

      // Navigate to restaurant page to show the generated menu
      navigate(`/restaurant/${restaurant.id}`, {
        state: { 
          generatedMenu: data.menuItems,
          restaurantName: restaurant.name,
          location: location,
          cached: data.cached
        }
      });
      
    } catch (error) {
      console.error('Error generating AI menu:', error);
      toast({
        title: "Menu Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate menu items',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleScrapeClick}
      disabled={isLoading}
      className={`bg-foodRed hover:bg-foodRed/90 text-white ${className}`}
      size="sm"
    >
      {isLoading ? (
        <Loader2 size={14} className="mr-2 animate-spin" />
      ) : (
        <ChefHat size={14} className="mr-2" />
      )}
      {isLoading ? 'Generating...' : 'Generate Menu'}
    </Button>
  );
};

export default ScrapeButton;