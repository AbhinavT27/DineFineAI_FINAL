
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
  let filteredRestaurants = restaurants;

  // Filter by search radius if coordinates are available
  if (preferences.coordinates && preferences.searchRadius) {
    console.log(`Filtering restaurants within ${preferences.searchRadius} ${userDistanceUnit} radius`);
    
    filteredRestaurants = filteredRestaurants.filter(restaurant => {
      if (!restaurant.coordinates) return true; // Keep restaurants without coordinates
      
      const distanceKm = calculateDistance(
        preferences.coordinates!.lat,
        preferences.coordinates!.lng,
        restaurant.coordinates.lat,
        restaurant.coordinates.lng
      );
      
      // Convert distance based on user's preferred unit
      const distanceInUserUnit = userDistanceUnit === 'miles' ? kmToMiles(distanceKm) : distanceKm;
      
      // Update restaurant distance display to user's preferred unit
      restaurant.distance = `${distanceInUserUnit.toFixed(1)} ${userDistanceUnit === 'miles' ? 'mi' : 'km'}`;
      
      // Check if restaurant is within the specified radius
      const isWithinRadius = distanceInUserUnit <= preferences.searchRadius!;
      
      console.log(`Restaurant: ${restaurant.name}, Distance: ${distanceInUserUnit.toFixed(1)} ${userDistanceUnit}, Within radius: ${isWithinRadius}`);
      
      return isWithinRadius;
    });
    
    console.log(`Filtered ${restaurants.length} restaurants to ${filteredRestaurants.length} within ${preferences.searchRadius} ${userDistanceUnit}`);
  } else {
    // If no radius filtering, still convert distance display to user's preferred unit
    filteredRestaurants.forEach(restaurant => {
      if (restaurant.coordinates && preferences.coordinates) {
        const distanceKm = calculateDistance(
          preferences.coordinates.lat,
          preferences.coordinates.lng,
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        );
        
        const distanceInUserUnit = userDistanceUnit === 'miles' ? kmToMiles(distanceKm) : distanceKm;
        restaurant.distance = `${distanceInUserUnit.toFixed(1)} ${userDistanceUnit === 'miles' ? 'mi' : 'km'} away`;
      }
    });
  }

  // Note: Dietary restrictions filtering removed because Google Places API 
  // doesn't provide comprehensive dietary options data for most restaurants.
  // This was causing all restaurants to be filtered out.
  // Dietary preferences are handled through menu analysis for individual restaurants.

  return filteredRestaurants;
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
