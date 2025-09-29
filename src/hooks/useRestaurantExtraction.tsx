import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRestaurantExtraction = (restaurantId: string) => {
  const [hasMenuExtraction, setHasMenuExtraction] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMenuExtraction = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_analysis')
          .select('menu_items, scraped')
          .eq('restaurant_id', restaurantId)
          .single();

        if (error || !data) {
          setHasMenuExtraction(false);
        } else {
          // Check if menu items were successfully extracted
          const menuItems = data.menu_items as any[];
          setHasMenuExtraction(data.scraped && menuItems && menuItems.length > 0);
        }
      } catch (error) {
        console.error('Error checking menu extraction:', error);
        setHasMenuExtraction(false);
      } finally {
        setLoading(false);
      }
    };

    checkMenuExtraction();
  }, [restaurantId]);

  return { hasMenuExtraction, loading };
};