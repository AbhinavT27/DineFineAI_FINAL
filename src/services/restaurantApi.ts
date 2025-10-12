import { UserPreferences, Restaurant } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { filterRestaurants, sortRestaurantsByPricePreference } from './helpers/restaurantFilters';

export const searchRestaurants = async (preferences: UserPreferences): Promise<Restaurant[]> => {
  try {
    console.log('Starting restaurant search with preferences:', preferences);
    
    if (!preferences.location) {
      throw new Error('Location is required for restaurant search');
    }

    // Get user's distance unit preference
    const { data: { user } } = await supabase.auth.getUser();
    let userDistanceUnit = 'miles'; // default
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('distance_unit')
        .eq('id', user.id)
        .single();
      
      if (profile?.distance_unit) {
        userDistanceUnit = profile.distance_unit;
      }
    }

    // Convert search radius to meters for Google Places API (which expects meters)
    const radiusInMeters = preferences.searchRadius 
      ? (userDistanceUnit === 'miles' 
          ? preferences.searchRadius * 1609.34  // miles to meters
          : preferences.searchRadius * 1000)     // km to meters
      : 8000; // default 5 miles in meters

    console.log(`Search radius: ${preferences.searchRadius} ${userDistanceUnit} = ${radiusInMeters} meters`);

    // Call Google Places API through our edge function
    const { data, error } = await supabase.functions.invoke('google-places-search', {
      body: {
        location: preferences.location,
        radius: radiusInMeters,
        query: preferences.searchQuery || preferences.cuisineType || 'restaurant',
        type: 'restaurant',
        partySize: preferences.partySize
      }
    });

    if (error) {
      console.error('Error calling Google Places API:', error);
      
      // Check if this is a rate limit error and provide a user-friendly message
      if (error.message === 'Edge Function returned a non-2xx status code') {
        // This is likely a 429 rate limit error
        throw new Error('Daily Max Searches Reached');
      }
      
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data || data.results.length === 0) {
      console.log('No restaurants found');
      return [];
    }

    console.log(`Google Places API returned ${data.results.length} restaurants`);

    // Apply additional filtering with user's distance unit preference
    let filteredResults = filterRestaurants(data.results, preferences, userDistanceUnit);
    
    // Apply price sorting if specified
    if (preferences.priceRange) {
      filteredResults = sortRestaurantsByPricePreference(filteredResults, preferences.priceRange);
    }

    console.log(`Final filtered results: ${filteredResults.length} restaurants`);
    return filteredResults;

  } catch (error) {
    console.error('Error in searchRestaurants:', error);
    throw error;
  }
};

export const getRestaurantDetails = async (restaurantId: string): Promise<Restaurant | null> => {
  try {
    console.log('Fetching restaurant details for ID:', restaurantId);
    
    // Call Google Places Details API through our edge function
    const { data, error } = await supabase.functions.invoke('google-places-details', {
      body: {
        place_id: restaurantId
      }
    });

    if (error) {
      console.error('Error calling Google Places Details API:', error);
      throw new Error(`Failed to fetch restaurant details: ${error.message}`);
    }

    if (!data) {
      console.log('No restaurant details found');
      return null;
    }

    // The edge function returns the restaurant data directly, not nested in result
    console.log('Restaurant details received:', data.name);
    return data as Restaurant;
  } catch (error) {
    console.error('Error in getRestaurantDetails:', error);
    throw error;
  }
};
