
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/lib/types';

export interface HistoryEntry {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_data: Restaurant;
  action_type: 'viewed' | 'compared';
  created_at: string;
  saved?: boolean;
}

export const addToHistory = async (restaurant: Restaurant, actionType: 'viewed' | 'compared', userId: string) => {
  try {
    console.log('Adding to history:', { 
      restaurantId: restaurant.id, 
      restaurantName: restaurant.name, 
      actionType, 
      userId 
    });
    
    // Ensure we have a valid restaurant ID - use the restaurant's actual ID or place_id
    const restaurantId = restaurant.id || restaurant.place_id || `${restaurant.name.replace(/\s+/g, '-')}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('user_restaurant_history')
      .upsert({
        user_id: userId,
        restaurant_id: restaurantId,
        restaurant_data: restaurant as any,
        action_type: actionType
      }, {
        onConflict: 'user_id,restaurant_id,action_type'
      })
      .select();

    if (error) {
      console.error('Error adding to history:', error);
      return { error: error.message };
    }

    console.log('Successfully added to history:', data);
    return { data };
  } catch (error) {
    console.error('Error adding to history:', error);
    return { error: 'Failed to add to history' };
  }
};

export const getHistory = async (userId: string): Promise<HistoryEntry[]> => {
  try {
    console.log('Fetching history for user:', userId);
    
    const { data, error } = await supabase
      .from('user_restaurant_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      throw error;
    }

    console.log('Fetched history data:', data);

    const transformedData = (data || []).map(item => ({
      ...item,
      restaurant_data: item.restaurant_data as unknown as Restaurant
    })) as HistoryEntry[];

    return transformedData;
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

export const clearHistory = async (userId: string) => {
  try {
    console.log('Clearing history for user:', userId);
    
    const { error } = await supabase
      .from('user_restaurant_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
    
    console.log('Successfully cleared history for user:', userId);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};
