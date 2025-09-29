
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/lib/types';

export const filterRestaurantsByTags = async (
  restaurants: Restaurant[], 
  selectedTagIds: string[], 
  userId: string
): Promise<Restaurant[]> => {
  if (selectedTagIds.length === 0) {
    return restaurants;
  }

  try {
    // Get all restaurants that have ANY of the selected tags
    const { data: taggedRestaurantIds, error } = await supabase
      .from('restaurant_tags')
      .select('restaurant_id')
      .eq('user_id', userId)
      .in('tag_id', selectedTagIds);

    if (error) throw error;

    // Include restaurants that have ANY of the selected tags
    const filteredRestaurantIds = new Set((taggedRestaurantIds || []).map(item => item.restaurant_id));

    // Filter the restaurants array to only include those with matching IDs (ANY match)
    return restaurants.filter(restaurant => filteredRestaurantIds.has(restaurant.id));
  } catch (error) {
    console.error('Error filtering restaurants by tags:', error);
    return restaurants;
  }
};

export const getRestaurantTags = async (restaurantId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_tags')
      .select(`
        id,
        tag_id,
        user_tags (
          id,
          tag_name,
          color
        )
      `)
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching restaurant tags:', error);
    return [];
  }
};
