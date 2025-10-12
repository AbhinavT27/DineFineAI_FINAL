import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

interface GeocodeRequest {
  location: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Check if this is a reverse geocoding request (has lat/lng)
    if (requestBody.lat && requestBody.lng) {
      // Handle reverse geocoding
      const { lat, lng }: ReverseGeocodeRequest = requestBody;
      
      const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
      if (!apiKey) {
        console.error('Google Places API key not configured, using fallback');
        // Fallback to OpenStreetMap for reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          const fallbackAddress = data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              address: fallbackAddress,
              fallback: true 
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else {
          throw new Error('Fallback geocoding failed');
        }
      }
      
      if (!lat || !lng) {
        return new Response(
          JSON.stringify({ error: 'Latitude and longitude are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Reverse geocoding coordinates:', { lat, lng });
      
      // Use Google Geocoding API for detailed address information
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      if (!response.ok) {
        console.error('Google Geocoding API request failed');
        throw new Error('Google Geocoding API request failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components || [];
        
        // Extract city/locality from address components
        let city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
        
        // Fallback to sublocality or administrative_area_level_3
        if (!city) {
          city = addressComponents.find((c: any) => c.types.includes('sublocality'))?.long_name;
        }
        if (!city) {
          city = addressComponents.find((c: any) => c.types.includes('administrative_area_level_3'))?.long_name;
        }
        
        // Get state/region
        const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name;
        
        // Return city and state for better search results
        const locationString = city && state ? `${city}, ${state}` : city || result.formatted_address;
        console.log('Extracted location:', locationString);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            address: locationString 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        throw new Error('No results from Google Geocoding API');
      }
      
    } else if (requestBody.location) {
      // Handle forward geocoding
      const { location }: GeocodeRequest = requestBody;
      
      if (!location) {
        return new Response(
          JSON.stringify({ error: 'Location is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Geocoding location:', location);
      
      const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
      
      // Try Google Geocoding API first
      if (apiKey) {
        console.log('[GEOCODE] Geocoding location with Google API:', location);
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
        console.log('[GEOCODE] Making request to Google Geocoding API');
        
        const response = await fetch(googleUrl);
        const data = await response.json();
        
        console.log('[GEOCODE] Google API response status:', response.status);
        console.log('[GEOCODE] Google API data status:', data.status);
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          console.log('[GEOCODE] Successfully geocoded to:', result.geometry.location);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              coordinates: {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
              }
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else {
          console.error('[GEOCODE] Google Geocoding error:', data.status, data.error_message || 'No error message');
          // Don't return error here, fall through to Nominatim
        }
      } else {
        console.log('[GEOCODE] No Google API key found, using Nominatim fallback');
      }
      
      // Fallback to Nominatim (OpenStreetMap)
      console.log('Using Nominatim fallback for geocoding:', location);
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'User-Agent': 'DineFineAI/1.0'
          }
        }
      );
      
      if (!nominatimResponse.ok) {
        console.error('Nominatim request failed with status:', nominatimResponse.status);
        return new Response(
          JSON.stringify({ 
            success: false, 
            coordinates: null,
            error: `Could not find coordinates for "${location}"`
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const nominatimData = await nominatimResponse.json();
      
      if (nominatimData && nominatimData.length > 0) {
        const result = nominatimData[0];
        console.log('Successfully geocoded with Nominatim:', { lat: result.lat, lon: result.lon });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            coordinates: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            },
            fallback: true
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // No results from either service
      console.error('No results from Google or Nominatim for location:', location);
      return new Response(
        JSON.stringify({ 
          success: false, 
          coordinates: null,
          error: `Could not find coordinates for "${location}"`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Expected lat/lng for reverse geocoding or location for forward geocoding' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Geocoding error:', error);

    return new Response(
      JSON.stringify({ error: 'Geocoding service unavailable' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});