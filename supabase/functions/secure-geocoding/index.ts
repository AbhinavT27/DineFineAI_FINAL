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
        console.log('Google Geocoding result:', result.formatted_address);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            address: result.formatted_address 
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
      if (!apiKey) {
        console.error('Google Places API key not configured, using fallback');
        // Use OpenStreetMap as fallback
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        
        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: 'Geocoding request failed' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        const data = await response.json();
        console.log('Geocoding response:', data);
        
        if (data.length === 0) {
          return new Response(
            JSON.stringify({ success: false, coordinates: null }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            coordinates: {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Use Google Places API for better accuracy
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Geocoding request failed' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const data = await response.json();
      console.log('Google Geocoding response:', data);
      
      if (!data.results || data.results.length === 0) {
        return new Response(
          JSON.stringify({ success: false, coordinates: null }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const result = data.results[0];
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