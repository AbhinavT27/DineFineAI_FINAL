import { Restaurant, UserPreferences } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { searchGooglePlacesRestaurants } from './googlePlacesApi';

// Get saved restaurants for the user
const getSavedRestaurants = async (userId: string): Promise<Restaurant[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('restaurant_data')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching saved restaurants:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert restaurant data to Restaurant objects
    const restaurants: Restaurant[] = [];
    
    for (const item of data) {
      if (item.restaurant_data && typeof item.restaurant_data === 'object') {
        const rawData = item.restaurant_data as any;
        
        // Validate essential properties exist
        if (rawData.id && rawData.name) {
          const restaurant: Restaurant = {
            id: String(rawData.id || ''),
            name: String(rawData.name || ''),
            imageUrl: String(rawData.imageUrl || ''),
            cuisineType: String(rawData.cuisineType || 'Unknown'),
            rating: Number(rawData.rating || 0),
            priceLevel: (rawData.priceLevel || '$$') as '$' | '$$' | '$$$' | '$$$$',
            address: String(rawData.address || ''),
            distance: String(rawData.distance || ''),
            dietaryOptions: Array.isArray(rawData.dietaryOptions) ? rawData.dietaryOptions : [],
            pros: Array.isArray(rawData.pros) ? rawData.pros : [],
            cons: Array.isArray(rawData.cons) ? rawData.cons : [],
            phone: rawData.phone ? String(rawData.phone) : undefined,
            website: rawData.website ? String(rawData.website) : undefined,
            hours: Array.isArray(rawData.hours) ? rawData.hours : [],
            allergyInfo: Array.isArray(rawData.allergyInfo) ? rawData.allergyInfo : [],
            coordinates: rawData.coordinates || undefined,
            groupDiningAvailable: Boolean(rawData.groupDiningAvailable),
            place_id: rawData.place_id ? String(rawData.place_id) : undefined,
            photo_reference: rawData.photo_reference ? String(rawData.photo_reference) : undefined,
            photos: Array.isArray(rawData.photos) ? rawData.photos : [],
            types: Array.isArray(rawData.types) ? rawData.types : [],
            business_status: rawData.business_status ? String(rawData.business_status) : undefined,
            opening_hours: rawData.opening_hours || undefined
          };
          
          restaurants.push(restaurant);
        }
      }
    }

    return restaurants;

  } catch (error) {
    console.error('Error in getSavedRestaurants:', error);
    return [];
  }
};

// Get most common cuisine from saved restaurants only (no search history)
const getPreferredCuisines = async (savedRestaurants: Restaurant[]): Promise<string[]> => {
  const cuisineCounts: { [key: string]: number } = {};
  
  // Count cuisines from saved restaurants
  savedRestaurants.forEach(restaurant => {
    const cuisine = restaurant.cuisineType;
    cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 2; // Weight saved restaurants
  });

  // Return top 3 cuisines
  return Object.keys(cuisineCounts)
    .sort((a, b) => cuisineCounts[b] - cuisineCounts[a])
    .slice(0, 3);
};

// Get different cuisine types (excluding user's preferred ones)
const getDifferentCuisines = (excludeCuisines: string[]): string[] => {
  const allCuisines = [
    'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'Thai', 
    'French', 'American', 'Mediterranean', 'Korean', 'Vietnamese', 'Greek'
  ];
  
  return allCuisines.filter(cuisine => !excludeCuisines.includes(cuisine));
};

// Generate recommendations based on saved restaurants only
export const generateRecommendations = async (
  userPreferences: UserPreferences,
  userId: string
): Promise<{ forYou: Restaurant[], tryNew: Restaurant[] }> => {
  console.log('Generating recommendations for user:', userId, 'with location:', userPreferences.location);

  try {
    // Ensure we have user location
    if (!userPreferences.location) {
      console.log('No user location available for recommendations');
      return { forYou: [], tryNew: [] };
    }

    // Get user's saved restaurants and preferred cuisines
    const savedRestaurants = await getSavedRestaurants(userId);
    const preferredCuisines = await getPreferredCuisines(savedRestaurants);
    
    console.log('Preferred cuisines from saved restaurants:', preferredCuisines);

    const forYouRestaurants: Restaurant[] = [];
    const tryNewRestaurants: Restaurant[] = [];
    const savedIds = new Set(savedRestaurants.map(r => r.id));

    // Generate "For You" recommendations based on preferred cuisines
    if (preferredCuisines.length > 0) {
      for (const cuisine of preferredCuisines) {
        try {
          const forYouPreferences: UserPreferences = {
            ...userPreferences,
            cuisineType: cuisine,
            searchQuery: `${cuisine} restaurant`
          };

          const cuisineRestaurants = await searchGooglePlacesRestaurants(forYouPreferences);
          const filteredCuisineRestaurants = cuisineRestaurants
            .filter(restaurant => !savedIds.has(restaurant.id))
            .slice(0, 4); // 4 restaurants per preferred cuisine

          forYouRestaurants.push(...filteredCuisineRestaurants);
        } catch (error) {
          console.error(`Error fetching ${cuisine} restaurants for "For You":`, error);
        }
      }
    } else {
      // If no preferred cuisines, get popular restaurants nearby
      try {
        const popularPreferences: UserPreferences = {
          ...userPreferences,
          searchQuery: 'popular restaurants'
        };

        const popularRestaurants = await searchGooglePlacesRestaurants(popularPreferences);
        const filteredPopular = popularRestaurants
          .filter(restaurant => !savedIds.has(restaurant.id))
          .slice(0, 8);

        forYouRestaurants.push(...filteredPopular);
      } catch (error) {
        console.error('Error fetching popular restaurants:', error);
      }
    }

    // Generate "Try Something New" recommendations with different cuisines
    const differentCuisines = getDifferentCuisines(preferredCuisines);
    
    for (const cuisine of differentCuisines.slice(0, 3)) {
      try {
        const tryNewPreferences: UserPreferences = {
          ...userPreferences,
          cuisineType: cuisine,
          searchQuery: `${cuisine} restaurant`
        };

        const cuisineRestaurants = await searchGooglePlacesRestaurants(tryNewPreferences);
        const filteredCuisineRestaurants = cuisineRestaurants
          .filter(restaurant => !savedIds.has(restaurant.id))
          .slice(0, 3); // 3 restaurants per new cuisine

        tryNewRestaurants.push(...filteredCuisineRestaurants);
      } catch (error) {
        console.error(`Error fetching ${cuisine} restaurants for "Try New":`, error);
      }
    }

    console.log('Generated recommendations:', {
      forYou: forYouRestaurants.length,
      tryNew: tryNewRestaurants.length
    });

    return {
      forYou: forYouRestaurants.slice(0, 12), // Limit to 12 total
      tryNew: tryNewRestaurants.slice(0, 9) // Limit to 9 total
    };

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return { forYou: [], tryNew: [] };
  }
};
