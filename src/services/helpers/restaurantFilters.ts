
import { Restaurant, UserPreferences } from '@/lib/types';
import { checkMenuItemsSafety } from '@/services/allergenScanner';
import { calculateDistance } from './locationHelpers';

// Helper function to convert km to miles
const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

// Helper function to convert miles to km  
const milesToKm = (miles: number): number => {
  return miles / 0.621371;
};

export const filterRestaurants = (
  restaurants: Restaurant[], 
  preferences: UserPreferences,
  userDistanceUnit: string = 'miles'
): Restaurant[] => {
  // Distance filtering is now handled by the Google Places API based on location
  // Just return the restaurants as-is
  console.log(`Returning ${restaurants.length} restaurants (distance filtering handled by API)`);

  // Note: Dietary restrictions filtering removed because Google Places API 
  // doesn't provide comprehensive dietary options data for most restaurants.
  // This was causing all restaurants to be filtered out.
  // Dietary preferences are handled through menu analysis for individual restaurants.

  return restaurants;
};

export const sortRestaurantsByPricePreference = (
  restaurants: Restaurant[],
  preferredPriceRange?: '$' | '$$' | '$$$' | '$$$$'
): Restaurant[] => {
  if (!preferredPriceRange) {
    return restaurants;
  }

  // Sort restaurants to show preferred price range first
  return [...restaurants].sort((a, b) => {
    const aMatchesPreference = a.priceLevel === preferredPriceRange;
    const bMatchesPreference = b.priceLevel === preferredPriceRange;
    
    if (aMatchesPreference && !bMatchesPreference) return -1;
    if (!aMatchesPreference && bMatchesPreference) return 1;
    
    // If both match or both don't match, maintain original order
    return 0;
  });
};

// New function to filter restaurants based on menu compatibility
export const filterRestaurantsByMenuSafety = async (
  restaurants: Restaurant[],
  userAllergies: string[],
  userDietaryRestrictions: string[]
): Promise<Restaurant[]> => {
  if (!userAllergies.length && !userDietaryRestrictions.length) {
    return restaurants; // No filtering needed if no restrictions
  }

  // For now, return all restaurants as we need menu data to properly filter
  // This will be enhanced when we have comprehensive menu analysis for all restaurants
  console.log('Menu safety filtering requested but not fully implemented yet');
  return restaurants;
};
