
import { Restaurant, UserPreferences } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { extractCuisineType, extractDietaryOptions } from './cuisineHelpers';
import { calculateDistance } from './locationHelpers';

export const mapGooglePlaceToRestaurant = async (
  place: any, 
  preferences: any
): Promise<Restaurant> => {
  // Get photo URLs if available - these should already be full URLs from the Edge Function
  let imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop';
  let photos: string[] = [];
  
  if (place.photos && place.photos.length > 0) {
    // Use the photo URLs directly as they should already be processed by the Edge Function
    photos = place.photos.slice(0, 10);
    imageUrl = photos[0];
    
    console.log(`Using ${photos.length} Google Places photos for gallery:`, place.name);
  }

  // Extract cuisine type from Google Places types
  const cuisineType = extractCuisineType(place.types) || preferences.cuisineType || 'Restaurant';

  // Convert price level to our format with proper type checking
  let priceLevel: '$' | '$$' | '$$$' | '$$$$' | undefined;
  if (place.price_level !== undefined && place.price_level !== null) {
    const priceLevels: ('$' | '$$' | '$$$' | '$$$$')[] = ['$', '$$', '$$$', '$$$$'];
    const index = place.price_level - 1;
    if (index >= 0 && index < priceLevels.length) {
      priceLevel = priceLevels[index];
    }
  }

  // Calculate distance if coordinates are available
  let distance = 'Unknown';
  if (preferences.coordinates && place.geometry?.location) {
    const distanceKm = calculateDistance(
      preferences.coordinates.lat,
      preferences.coordinates.lng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );
    
    // Get user's preferred distance unit - default to miles
    const userDistanceUnit = 'miles'; // Default for now
    
    if (userDistanceUnit === 'miles') {
      const distanceMiles = distanceKm * 0.621371;
      distance = `${distanceMiles.toFixed(1)} mi away`;
    } else {
      distance = `${distanceKm.toFixed(1)} km away`;
    }
  }

  // Enhanced AI analysis with actual review processing
  let pros = ['Popular with diners', 'Good location', 'Consistent service'];
  let cons = ['Limited information available'];
  let allergyInfo = ['Please check with restaurant for specific allergy information'];
  let groupDiningAvailable = true;

  if (place.reviews && place.reviews.length > 0) {
    console.log(`Analyzing ${place.reviews.length} reviews for ${place.name}`);
    try {
      // Create the detailed prompt for OpenAI analysis
      const reviewTexts = place.reviews.map((review: any) => review.text).join('\n\n');
      const prompt = `You are given a list of user reviews for a restaurant called "${place.name}". Analyze the reviews and summarize them into a maximum of three bullet points each for the following:

What People Love – highlight specific aspects that are consistently praised
Areas for Improvement – highlight common complaints or suggestions

Make each bullet concise and based only on trends or repeated sentiments in the reviews. Do not include generic or vague statements.

Reviews:
${reviewTexts}

Please respond with JSON in this exact format:
{
  "whatPeopleLove": ["point 1", "point 2", "point 3"],
  "areasForImprovement": ["point 1", "point 2", "point 3"],
  "pros": ["point 1", "point 2", "point 3"],
  "cons": ["point 1", "point 2", "point 3"],
  "allergyInfo": ["allergy info or Please check with restaurant for specific allergy information"],
  "groupDiningAvailable": true
}`;

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-restaurant-reviews', {
        body: {
          reviews: place.reviews,
          restaurantName: place.name,
          cuisineType: cuisineType,
          prompt: prompt,
          userDietaryRestrictions: preferences.dietary_preferences || [],
          userAllergies: preferences.allergies || []
        }
      });

      if (!analysisError && analysisData) {
        // Use AI-generated pros and cons (5 each)
        if (analysisData.pros && Array.isArray(analysisData.pros) && analysisData.pros.length > 0) {
          pros = analysisData.pros.slice(0, 5);
        }

        if (analysisData.cons && Array.isArray(analysisData.cons) && analysisData.cons.length > 0) {
          cons = analysisData.cons.slice(0, 5);
        }

        if (analysisData.allergyInfo) {
          allergyInfo = analysisData.allergyInfo;
        }
        if (analysisData.groupDiningAvailable !== undefined) {
          groupDiningAvailable = analysisData.groupDiningAvailable;
        }
        console.log(`AI analysis completed for ${place.name}:`, { pros: pros.length, cons: cons.length });
      } else {
        console.log('AI analysis failed or returned incomplete data, using fallback data');
        // Generate basic pros/cons from review ratings and common themes
        const avgRating = place.rating || 0;
        if (avgRating >= 4.0) {
          pros = ['Highly rated by customers', 'Quality food and service', 'Popular dining spot'];
        } else if (avgRating >= 3.0) {
          pros = ['Decent food quality', 'Reasonable prices', 'Accessible location'];
        }
        
        // Generate cons based on common restaurant issues
        if (avgRating < 4.0) {
          cons = ['Mixed customer reviews', 'Service can be inconsistent', 'May have busy periods'];
        } else {
          cons = ['Can get crowded during peak hours', 'Reservations recommended', 'Popular spot - expect wait times'];
        }
      }
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      // Fallback based on rating
      const avgRating = place.rating || 0;
      if (avgRating >= 4.0) {
        pros = ['Well-reviewed restaurant', 'Quality dining experience', 'Recommended by customers'];
        cons = ['High demand - book ahead', 'Can be busy', 'Popular location'];
      }
    }
  }

  // Check if restaurant has scraped menu data
  let menuScraped = false;
  try {
    const { data: menuAnalysis } = await supabase
      .from('menu_analysis')
      .select('scraped')
      .eq('restaurant_id', place.place_id)
      .single();
    
    if (menuAnalysis) {
      menuScraped = menuAnalysis.scraped;
    }
  } catch (error) {
    // If no menu analysis found, default to false
    menuScraped = false;
  }

  return {
    id: place.place_id,
    name: place.name || 'Unknown Restaurant',
    imageUrl,
    photos,
    cuisineType,
    rating: place.rating || 4.0,
    priceLevel,
    address: place.formatted_address || place.vicinity || 'Address not available',
    distance,
    dietaryOptions: extractDietaryOptions(place.types, place.name, cuisineType),
    pros,
    cons,
    phone: place.formatted_phone_number,
    website: place.website,
    hours: place.opening_hours?.weekday_text || [],
    allergyInfo,
    coordinates: place.geometry?.location ? {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    } : undefined,
    groupDiningAvailable,
    place_id: place.place_id,
    photo_reference: place.photos?.[0]?.photo_reference,
    types: place.types || [],
    business_status: place.business_status || 'OPERATIONAL',
    opening_hours: place.opening_hours,
    reviews: place.reviews || [],
    menuScraped
  };
};
