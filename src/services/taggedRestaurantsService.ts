
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/lib/types';

export interface TaggedRestaurant {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_data: Restaurant;
  created_at: string;
  updated_at: string;
}

export const addTaggedRestaurant = async (restaurant: Restaurant, userId: string) => {
  try {
    console.log('Adding tagged restaurant:', { restaurant: restaurant.name, userId });
    
    const { data, error } = await supabase
      .from('tagged_restaurants')
      .upsert({
        user_id: userId,
        restaurant_id: restaurant.id,
        restaurant_data: restaurant as any
      }, {
        onConflict: 'user_id,restaurant_id'
      })
      .select();

    if (error) {
      console.error('Error adding tagged restaurant:', error);
      throw error;
    }

    console.log('Successfully added tagged restaurant:', data);
    return data;
  } catch (error) {
    console.error('Error adding tagged restaurant:', error);
    throw error;
  }
};

export const getTaggedRestaurants = async (userId: string): Promise<TaggedRestaurant[]> => {
  try {
    console.log('Fetching tagged restaurants for user:', userId);
    
    const { data, error } = await supabase
      .from('tagged_restaurants')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching tagged restaurants:', error);
      throw error;
    }

    console.log('Fetched tagged restaurants data:', data);

    const transformedData = (data || []).map(item => ({
      ...item,
      restaurant_data: item.restaurant_data as unknown as Restaurant
    })) as TaggedRestaurant[];

    return transformedData;
  } catch (error) {
    console.error('Error fetching tagged restaurants:', error);
    return [];
  }
};

export const removeTaggedRestaurant = async (restaurantId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('tagged_restaurants')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error removing tagged restaurant:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error removing tagged restaurant:', error);
    throw error;
  }
};
