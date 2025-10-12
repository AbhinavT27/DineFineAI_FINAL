
import { Restaurant, UserPreferences } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export const searchGooglePlacesRestaurants = async (preferences: UserPreferences): Promise<Restaurant[]> => {
  console.log('Searching Google Places with preferences:', preferences);
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in to search restaurants');
    }

    let location: string;
    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusInMiles = preferences.searchRadius || 5;
    const radius = Math.round(radiusInMiles * 1609.34);
    
    console.log(`Search radius: ${radiusInMiles} miles (${radius} meters)`);
    
    // Use location as city name directly
    if (!preferences.location) {
      throw new Error('Location is required for restaurant search');
    }
    
    location = preferences.location;
    console.log('Using location:', location);
    
    // Create more flexible search query - be more permissive
    let query = 'restaurant';
    let searchType = 'restaurant';
    
    // Handle specific food items and categories with broader matching
    if (preferences.searchQuery) {
      const lowerQuery = preferences.searchQuery.toLowerCase();
      
      // Ice cream and frozen treats
      if (lowerQuery.includes('ice cream') || lowerQuery.includes('gelato') || lowerQuery.includes('frozen yogurt')) {
        query = `${preferences.searchQuery} OR ice cream`;
        searchType = 'store';
      }
      // Coffee shops
      else if (lowerQuery.includes('coffee') || lowerQuery.includes('cafe')) {
        query = `${preferences.searchQuery} OR coffee OR cafe`;
        searchType = 'cafe';
      }
      // Bakeries
      else if (lowerQuery.includes('bakery') || lowerQuery.includes('bakeries')) {
        query = `${preferences.searchQuery} OR bakery`;
        searchType = 'bakery';
      }
      // Bars
      else if (lowerQuery.includes('bar') || lowerQuery.includes('pub')) {
        query = `${preferences.searchQuery} OR bar OR pub`;
        searchType = 'bar';
      }
      // For any other search, include both the specific query and general restaurant search
      else {
        query = `${preferences.searchQuery} restaurant OR ${preferences.searchQuery}`;
        searchType = 'restaurant';
      }
    } else if (preferences.cuisineType) {
      query = `${preferences.cuisineType.toLowerCase()} restaurant`;
    }

    console.log('Search parameters:', { location, radius, query, type: searchType });

    // Call the Google Places search edge function with proper authentication
    const { data, error } = await supabase.functions.invoke('google-places-search', {
      body: {
        location,
        radius,
        query,
        type: searchType
      }
    });

    if (error) {
      console.error('Google Places search error:', error);
      
      // Handle API key restriction errors specifically
      if (error.message.includes('REQUEST_DENIED') || error.message.includes('not authorized')) {
        throw new Error('Google Places API access is restricted. The API key needs to be configured with the following APIs enabled: Places API (New), Places API, Geocoding API, and Maps JavaScript API. Please contact support or check your Google Cloud Console API restrictions.');
      } else if (error.message.includes('OVER_QUERY_LIMIT')) {
        throw new Error('Google Places API quota exceeded. Please try again later.');
      } else if (error.message.includes('INVALID_REQUEST')) {
        throw new Error('Invalid search request parameters.');
      } else {
        throw new Error(`Search failed: ${error.message}`);
      }
    }

    if (!data || data.status === 'ERROR') {
      console.error('Google Places API error:', data?.error);
      throw new Error(data?.error || 'Search failed');
    }

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      console.log('No results found from Google Places API');
      
      // If no results with specific query, try a broader search
      if (preferences.searchQuery) {
        console.log('Trying broader search without specific query...');
        const broadQuery = 'restaurant';
        
        const { data: broadData, error: broadError } = await supabase.functions.invoke('google-places-search', {
          body: {
            location,
            radius,
            query: broadQuery,
            type: 'restaurant'
          }
        });

        if (!broadError && broadData?.results && broadData.results.length > 0) {
          console.log('Found results with broader search:', broadData.results.length);
          return broadData.results;
        }
      }
      
      return [];
    }

    console.log(`Processing ${data.results.length} results from Google Places API`);
    return data.results;

  } catch (error) {
    console.error('Error in searchGooglePlacesRestaurants:', error);
    throw error;
  }
};

// Helper function to extract cuisine type from Google Places types
const extractCuisineType = (types: string[]): string | null => {
  if (!types || types.length === 0) return null;

  const cuisineMap: { [key: string]: string } = {
    'italian_restaurant': 'Italian',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'indian_restaurant': 'Indian',
    'thai_restaurant': 'Thai',
    'french_restaurant': 'French',
    'american_restaurant': 'American',
    'mediterranean_restaurant': 'Mediterranean',
    'pizza': 'Italian',
    'sushi': 'Japanese',
    'barbecue': 'American'
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  return null;
};

// Helper function to extract dietary options from types - FIXED to not default to Vegetarian
const extractDietaryOptions = (types: string[], name: string = '', cuisineType: string = ''): string[] => {
  const options: string[] = [];
  
  // Check types for specific dietary options
  if (types) {
    if (types.includes('vegan_restaurant')) {
      options.push('Vegan');
    }
    if (types.includes('vegetarian_restaurant')) {
      options.push('Vegetarian');
    }
  }
  
  // Check name and cuisine type for dietary indicators
  const searchText = `${name} ${cuisineType}`.toLowerCase();
  
  if (searchText.includes('vegan')) {
    options.push('Vegan');
  }
  if (searchText.includes('vegetarian')) {
    options.push('Vegetarian');
  }
  if (searchText.includes('halal')) {
    options.push('Halal');
  }
  if (searchText.includes('kosher')) {
    options.push('Kosher');
  }
  if (searchText.includes('gluten free') || searchText.includes('gluten-free')) {
    options.push('Gluten-Free');
  }
  
  // Only return options if we actually found some, otherwise return empty array
  return options.length > 0 ? options : [];
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};
