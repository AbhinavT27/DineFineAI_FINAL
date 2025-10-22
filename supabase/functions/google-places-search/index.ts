import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1/places';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google Places Search function called');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);
    
    // Check search throttling - 10 searches per day for all users
    // Get current date in UTC timezone
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's profile to check daily search requests
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_searchrequests, last_search_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to check search limits');
    }

    let currentSearchRequests = profile.daily_searchrequests || 0;
    const lastResetDate = profile.last_search_reset_date;

    // Reset count if it's a new day (UTC timezone)
    if (lastResetDate !== today) {
      currentSearchRequests = 0;
      await supabase
        .from('profiles')
        .update({
          daily_searchrequests: 0,
          last_search_reset_date: today
        })
        .eq('id', user.id);
      console.log(`Reset daily search count for user ${user.id} - new date: ${today}`);
    }
    
    // Check if user has exceeded the limit (10 searches per day for all users)
    if (currentSearchRequests >= 10) {
      console.log(`User ${user.id} has exceeded daily search limit (${currentSearchRequests}/10)`);
      return new Response(JSON.stringify({ 
        error: 'Daily search limit exceeded',
        message: 'You have reached your daily limit of 10 searches. Please try again tomorrow.',
        limit: 10,
        used: currentSearchRequests
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment search request count
    await supabase
      .from('profiles')
      .update({
        daily_searchrequests: currentSearchRequests + 1
      })
      .eq('id', user.id);

    console.log(`Search request logged for user ${user.id}: ${currentSearchRequests + 1}/10`);
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found');
      throw new Error('Google Places API key not configured');
    }

    console.log('Google Places API key found, proceeding with search');

    const { location, radius, query, type, partySize } = await req.json();
    
    // Convert miles/km to meters
    const radiusInMeters = radius || 8046.7; // Default 5 miles
    console.log('Search radius:', radiusInMeters, 'meters', `(${(radiusInMeters / 1609.34).toFixed(1)} miles)`);
    
    // Geocode the location to get coordinates
    let coordinates = null;
    if (location) {
      try {
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            const { lat, lng } = geocodeData.results[0].geometry.location;
            coordinates = { latitude: lat, longitude: lng };
            console.log('Geocoded location:', location, 'to coordinates:', coordinates);
          } else {
            console.error('No geocoding results for location:', location);
          }
        }
      } catch (error) {
        console.error('Error geocoding location:', error);
      }
    }
    
    console.log('Search parameters:', { location, radius: radiusInMeters, query, type, partySize });

    // Build request body for new Places API
    const requestBody: any = {
      textQuery: query,
      maxResultCount: 30,
      includedType: type,
      languageCode: "en"
    };
    
    // Add location bias if we have coordinates
    if (coordinates) {
      requestBody.locationBias = {
        circle: {
          center: coordinates,
          radius: radiusInMeters
        }
      };
    }

    console.log('Calling new Google Places API with request body:', JSON.stringify(requestBody));

    const response = await fetch(`${PLACES_API_BASE_URL}:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.types,places.businessStatus,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.reviews'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error('Google Places API HTTP error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google Places API response received');
    
    if (!data.places || data.places.length === 0) {
      console.log('No places found');
      return new Response(JSON.stringify({ status: 'ZERO_RESULTS', results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing', data.places.length, 'results');

    // Process results from new API format
    const processedResults = await Promise.all(
      data.places.slice(0, 25).map(async (place: any) => {
        try {
          // Calculate distance from user's location if coordinates are available
          let distance = 'Nearby';
          if (coordinates && place.location) {
            const distanceInKm = calculateDistance(
              coordinates.latitude,
              coordinates.longitude,
              place.location.latitude,
              place.location.longitude
            );
            
            // Format distance based on user's distance unit preference
            // We'll get this from the profile query earlier
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('distance_unit')
              .eq('id', user.id)
              .single();
            
            const distanceUnit = userProfile?.distance_unit || 'miles';
            
            if (distanceUnit === 'miles') {
              const distanceInMiles = distanceInKm * 0.621371;
              distance = `${distanceInMiles.toFixed(1)} mi away`;
            } else {
              distance = `${distanceInKm.toFixed(1)} km away`;
            }
          }

          // Convert photo references to actual URLs using new API
          const photos = [];
          if (place.photos && place.photos.length > 0) {
            const photoCount = Math.min(place.photos.length, 10);
            for (let i = 0; i < photoCount; i++) {
              const photoUrl = `https://places.googleapis.com/v1/${place.photos[i].name}/media?maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`;
              photos.push(photoUrl);
            }
          }

          // Get reviews (up to 5)
          const reviews = place.reviews ? place.reviews.slice(0, 5).map((review: any) => ({
            author_name: review.authorAttribution?.displayName || 'Anonymous',
            rating: review.rating || 0,
            text: review.text?.text || '',
            time: Math.floor(new Date(review.publishTime).getTime() / 1000),
            relative_time_description: review.relativePublishTimeDescription || ''
          })) : [];

          console.log(`Processed ${photos.length} photos and ${reviews.length} reviews for ${place.displayName?.text}`);

          // Analyze reviews for pros and cons using AI
          let pros = ['Quality dining experience', 'Good location', 'Recommended by diners'];
          let cons = ['Can be busy during peak hours'];
          let allergyInfo = ['Please check with restaurant for specific allergy information'];
          let groupDiningAvailable = true;

          // Consider party size for group dining suitability - only if party size is provided
          if (partySize && partySize > 6) {
            groupDiningAvailable = true; // Assume larger restaurants can handle big groups
            pros.push('Suitable for large groups');
          }

          if (reviews.length > 0) {
            try {
              const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-restaurant-reviews', {
                body: {
                  reviews: reviews,
                  restaurantName: place.displayName?.text || 'Unknown',
                  cuisineType: extractCuisineType(place.types) || 'Restaurant',
                  partySize: partySize || undefined // Don't default to 2, use undefined if not provided
                }
              });

              if (!analysisError && analysisData && analysisData.pros && analysisData.cons) {
                if (Array.isArray(analysisData.pros) && analysisData.pros.length > 0) {
                  pros = analysisData.pros.slice(0, 3);
                }
                if (Array.isArray(analysisData.cons) && analysisData.cons.length > 0) {
                  cons = analysisData.cons.slice(0, 3);
                }
                allergyInfo = analysisData.allergyInfo || allergyInfo;
                groupDiningAvailable = analysisData.groupDiningAvailable !== undefined ? analysisData.groupDiningAvailable : groupDiningAvailable;
              } else {
                // Generate meaningful pros/cons based on rating and review content
                const avgRating = place.rating || 0;
                if (avgRating >= 4.5) {
                  pros = ['Excellent customer reviews', 'Outstanding food quality', 'Highly recommended'];
                } else if (avgRating >= 4.0) {
                  pros = ['Great customer satisfaction', 'Quality food and service', 'Popular choice'];
                } else if (avgRating >= 3.5) {
                  pros = ['Good value for money', 'Decent food quality', 'Convenient location'];
                }
                
                if (avgRating < 4.0) {
                  cons = ['Mixed customer feedback', 'Service inconsistency reported', 'Room for improvement'];
                } else {
                  cons = ['High demand - book ahead', 'Can get crowded', 'Wait times during peak hours'];
                }
              }
            } catch (error) {
              console.error('Error analyzing reviews:', error);
              // Use rating-based fallback
              const avgRating = place.rating || 0;
              if (avgRating >= 4.0) {
                pros = ['Well-reviewed establishment', 'Quality dining experience', 'Customer favorite'];
                cons = ['Popular spot - expect crowds', 'Reservations recommended', 'Busy during peak times'];
              }
            }
          }

          return {
            id: place.id,
            name: place.displayName?.text || 'Unknown Restaurant',
            imageUrl: photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop',
            photos: photos,
            cuisineType: extractCuisineType(place.types) || 'Restaurant',
            rating: place.rating || 4.0,
            priceLevel: place.priceLevel ? ['$', '$$', '$$$', '$$$$'][place.priceLevel - 1] : '$$',
            address: place.formattedAddress || 'Address not available',
            distance,
            dietaryOptions: extractDietaryOptions(place.types, place.displayName?.text || '', extractCuisineType(place.types) || 'Restaurant'),
            pros,
            cons,
            phone: place.nationalPhoneNumber,
            website: place.websiteUri,
            hours: place.regularOpeningHours?.weekdayDescriptions || [],
            allergyInfo,
            coordinates: place.location ? {
              lat: place.location.latitude,
              lng: place.location.longitude
            } : undefined,
            groupDiningAvailable,
            place_id: place.id,
            photo_reference: place.photos?.[0]?.name,
            types: place.types || [],
            business_status: place.businessStatus || 'OPERATIONAL',
            opening_hours: place.regularOpeningHours,
            reviews: reviews,
            partySize: partySize || undefined
          };
        } catch (error) {
          console.error('Error processing place:', error);
          return null;
        }
      })
    );

    const validResults = processedResults.filter(result => result !== null);
    console.log('Successfully processed', validResults.length, 'detailed results');

    return new Response(JSON.stringify({
      status: 'OK',
      results: validResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-places-search function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
    'pizza_restaurant': 'Italian',
    'sushi_restaurant': 'Japanese',
    'barbecue_restaurant': 'American'
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  return null;
};

// Helper function to extract dietary options from types
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
