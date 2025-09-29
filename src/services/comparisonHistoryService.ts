
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/lib/types';

export interface ComparisonHistory {
  id: string;
  user_id: string;
  comparison_data: Restaurant[];
  restaurant_ids: string[];
  created_at: string;
  updated_at: string;
  saved?: boolean;
}

export const saveComparisonHistory = async (
  restaurants: Restaurant[],
  userId: string
): Promise<{ error?: string }> => {
  try {
    if (!restaurants || restaurants.length < 2) {
      console.log('No meaningful comparison data to save');
      return {};
    }

    console.log('Saving comparison history:', { restaurantCount: restaurants.length, userId });
    
    // Sort restaurant IDs and create a unique comparison key string
    const sortedRestaurantIds = restaurants.map(r => r.id).sort();
    const comparisonKey = sortedRestaurantIds.join(',');

    // Use upsert with comparison_key to prevent duplicates
    const { data, error } = await supabase
      .from('comparison_history')
      .upsert({
        user_id: userId,
        comparison_key: comparisonKey,
        comparison_data: restaurants as any,
        restaurant_ids: sortedRestaurantIds,
      }, {
        onConflict: 'user_id,comparison_key'
      })
      .select();

    if (error) {
      console.error('Error saving comparison history:', error);
      return { error: error.message };
    }

    console.log('Successfully saved comparison history:', data);
    return {};
  } catch (error) {
    console.error('Error saving comparison history:', error);
    return { error: 'Failed to save comparison history' };
  }
};

export const getComparisonHistory = async (
  userId: string
): Promise<{ data?: ComparisonHistory[]; error?: string }> => {
  try {
    console.log('Fetching comparison history for user:', userId);
    
    const { data, error } = await supabase
      .from('comparison_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comparison history:', error);
      return { error: error.message };
    }

    console.log('Fetched comparison history data:', data);

    return { data: (data || []) as unknown as ComparisonHistory[] };
  } catch (error) {
    console.error('Error fetching comparison history:', error);
    return { error: 'Failed to fetch comparison history' };
  }
};

export const deleteComparisonHistory = async (
  comparisonId: string
): Promise<{ error?: string }> => {
  try {
    console.log('Deleting comparison history:', comparisonId);
    
    const { error } = await supabase
      .from('comparison_history')
      .delete()
      .eq('id', comparisonId);

    if (error) {
      console.error('Error deleting comparison history:', error);
      return { error: error.message };
    }

    console.log('Successfully deleted comparison history:', comparisonId);
    return {};
  } catch (error) {
    console.error('Error deleting comparison history:', error);
    return { error: 'Failed to delete comparison history' };
  }
};
