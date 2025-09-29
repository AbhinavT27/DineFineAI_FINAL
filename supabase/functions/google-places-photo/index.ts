
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const url = new URL(req.url);
    const photoName = url.searchParams.get('photo_name');
    const maxWidthPx = url.searchParams.get('maxWidthPx') || '800';

    if (!photoName) {
      throw new Error('Photo name is required');
    }

    // Use new Places API photo endpoint
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600'
      },
    });

  } catch (error) {
    console.error('Error in google-places-photo function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
