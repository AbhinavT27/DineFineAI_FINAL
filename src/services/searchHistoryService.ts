
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/lib/types';

export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  search_query: string;
  cuisine_type?: string;
  price_range?: string;
  dietary_restrictions?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
  created_at: string;
  saved?: boolean;
}

export const addSearchToHistory = async (preferences: UserPreferences, userId: string) => {
  try {
    // Validate that preferences contain meaningful data
    const hasSearchQuery = preferences.searchQuery && preferences.searchQuery.trim().length > 0;
    const hasCuisineType = preferences.cuisineType && preferences.cuisineType.trim().length > 0;
    const hasPriceRange = preferences.priceRange && preferences.priceRange.trim().length > 0;
    const hasLocation = preferences.location && preferences.location.trim().length > 0;
    const hasDietaryRestrictions = preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0;

    // Only add to history if there's meaningful search data
    if (!hasSearchQuery && !hasCuisineType && !hasPriceRange && !hasLocation && !hasDietaryRestrictions) {
      console.log('No meaningful search data to add to history');
      return;
    }

    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        search_query: preferences.searchQuery || '',
        cuisine_type: preferences.cuisineType || null,
        price_range: preferences.priceRange || null,
        dietary_restrictions: preferences.dietaryRestrictions,
        location: preferences.location || null,
        coordinates: preferences.coordinates
      });

    if (error) {
      console.error('Error adding search to history:', error);
    } else {
      console.log('Successfully added search to history');
    }
  } catch (error) {
    console.error('Error adding search to history:', error);
  }
};

export const getSearchHistory = async (userId: string): Promise<SearchHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }

    const transformedData: SearchHistoryEntry[] = (data || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      search_query: entry.search_query,
      cuisine_type: entry.cuisine_type || undefined,
      price_range: entry.price_range || undefined,
      dietary_restrictions: entry.dietary_restrictions || undefined,
      location: entry.location || undefined,
      coordinates: entry.coordinates ? entry.coordinates as { lat: number; lng: number } : undefined,
      created_at: entry.created_at,
      saved: entry.saved || false
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching search history:', error);
    return [];
  }
};

export const clearSearchHistory = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing search history:', error);
    }
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};
