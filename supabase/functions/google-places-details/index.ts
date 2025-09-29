
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google Places Details function called');
    
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found in environment variables');
      throw new Error('Google Places API key not configured');
    }

    console.log('Google Places API key found, proceeding with details request');

    const { place_id } = await req.json();
    console.log('Fetching details for place_id:', place_id);

    if (!place_id) {
      throw new Error('Place ID is required');
    }

    console.log('Calling new Google Places Details API');

    const response = await fetch(`${PLACES_API_BASE_URL}/${place_id}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,rating,priceLevel,photos,regularOpeningHours,types,businessStatus,reviews'
      }
    });
    
    if (!response.ok) {
      console.error('Google Places API HTTP error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const place = await response.json();
    console.log('Google Places Details API response received for:', place.displayName?.text);
    
    // Convert photo references to actual Google Places Photo API URLs using new API
    const photos = [];
    if (place.photos && place.photos.length > 0) {
      const photoCount = Math.min(place.photos.length, 10);
      for (let i = 0; i < photoCount; i++) {
        const photoUrl = `https://places.googleapis.com/v1/${place.photos[i].name}/media?maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`;
        photos.push(photoUrl);
      }
    }

    // Convert reviews to our format
    const reviews = place.reviews ? place.reviews.slice(0, 5).map((review: any) => ({
      author_name: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating || 0,
      text: review.text?.text || '',
      time: Math.floor(new Date(review.publishTime).getTime() / 1000),
      relative_time_description: review.relativePublishTimeDescription || ''
    })) : [];

    // Analyze reviews for better pros/cons
    let pros = ['Quality establishment', 'Good customer service', 'Recommended dining spot'];
    let cons = ['May be busy during peak hours'];
    let allergyInfo = ['Please check with restaurant for specific allergy information'];
    let groupDiningAvailable = true;

    if (reviews.length > 0) {
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-restaurant-reviews', {
          body: {
            reviews: reviews,
            restaurantName: place.displayName?.text || 'Unknown',
            cuisineType: 'Restaurant'
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
          // Generate meaningful pros/cons based on rating
          const avgRating = place.rating || 0;
          if (avgRating >= 4.5) {
            pros = ['Excellent reviews', 'Outstanding quality', 'Highly rated by customers'];
          } else if (avgRating >= 4.0) {
            pros = ['Great customer satisfaction', 'Quality service', 'Popular with diners'];
          } else if (avgRating >= 3.5) {
            pros = ['Good value', 'Decent experience', 'Convenient location'];
          }
          
          if (avgRating < 4.0) {
            cons = ['Mixed reviews', 'Inconsistent service', 'Areas for improvement'];
          } else {
            cons = ['High demand', 'Can get crowded', 'Reservations recommended'];
          }
        }
      } catch (error) {
        console.error('Error analyzing reviews:', error);
      }
    }
    
    const restaurant = {
      id: place_id,
      name: place.displayName?.text || 'Unknown Restaurant',
      imageUrl: photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop',
      photos: photos,
      cuisineType: 'Restaurant', // Would need to extract from types
      rating: place.rating || 4.0,
      priceLevel: place.priceLevel ? ['$', '$$', '$$$', '$$$$'][place.priceLevel - 1] : '$$',
      address: place.formattedAddress || 'Address not available',
      distance: 'Calculating...',
      dietaryOptions: [], // Would need AI analysis
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
      place_id: place_id,
      photo_reference: place.photos?.[0]?.name,
      types: place.types || [],
      business_status: place.businessStatus || 'OPERATIONAL',
      opening_hours: place.regularOpeningHours,
      reviews: reviews
    };

    console.log('Successfully processed restaurant details for:', restaurant.name);

    return new Response(JSON.stringify(restaurant), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-places-details function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
