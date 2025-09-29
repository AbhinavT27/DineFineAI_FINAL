
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, PlaceSummary, UserPreferences } from '@/lib/types';

export const generatePlaceSummaries = async (
  restaurant: Restaurant,
  userPreferences?: UserPreferences
): Promise<PlaceSummary | null> => {
  try {
    console.log('Generating place summaries for:', restaurant.name);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in');
    }

    // Only generate summaries if we have reviews
    const reviews = restaurant.reviews || [];
    if (reviews.length === 0) {
      console.log('No reviews available for summary generation');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('generate-place-summaries', {
      body: {
        restaurant,
        reviews,
        userPreferences
      }
    });

    if (error) {
      console.error('Failed to generate place summaries:', error);
      return null;
    }

    console.log('Successfully generated place summaries');
    return data;

  } catch (error) {
    console.error('Error generating place summaries:', error);
    return null;
  }
};
