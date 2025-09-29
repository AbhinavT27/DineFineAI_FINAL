
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    console.log('Place summaries function called');
    
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

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { restaurant, reviews, userPreferences } = await req.json();
    console.log('Generating summaries for:', restaurant.name);

    // Generate place summary
    const placeSummaryPrompt = `Generate a concise, engaging summary for this restaurant based on the following information:

Restaurant: ${restaurant.name}
Cuisine: ${restaurant.cuisineType}
Address: ${restaurant.address}
Rating: ${restaurant.rating}/5
Price Level: ${restaurant.priceLevel}
Types: ${restaurant.types?.join(', ') || 'N/A'}

Create a 2-3 sentence summary that highlights what makes this restaurant special and appealing to diners. Focus on atmosphere, cuisine quality, and unique features.`;

    // Generate review summary
    const reviewTexts = reviews.slice(0, 20).map((review: any) => `Rating: ${review.rating}/5 - ${review.text}`).join('\n\n');
    const reviewSummaryPrompt = `Analyze these customer reviews and provide a balanced summary:

${reviewTexts}

Create a comprehensive review summary that includes:
1. Overall customer sentiment
2. Most praised aspects (3-4 points)
3. Common concerns or areas for improvement (2-3 points)
4. Recommendations for different types of diners

Keep the summary informative but concise.`;

    // Generate both summaries
    const [placeSummaryResponse, reviewSummaryResponse] = await Promise.all([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: placeSummaryPrompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: reviewSummaryPrompt }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      })
    ]);

    if (!placeSummaryResponse.ok || !reviewSummaryResponse.ok) {
      throw new Error('Failed to generate summaries');
    }

    const [placeSummaryData, reviewSummaryData] = await Promise.all([
      placeSummaryResponse.json(),
      reviewSummaryResponse.json()
    ]);

    const placeSummary = placeSummaryData.choices[0].message.content;
    const reviewSummary = reviewSummaryData.choices[0].message.content;

    // Generate personalized recommendations based on user preferences
    let personalizedRecommendation = '';
    if (userPreferences && (userPreferences.dietaryRestrictions?.length > 0 || userPreferences.allergies?.length > 0)) {
      const personalizedPrompt = `Based on this restaurant and user preferences, provide a personalized recommendation:

Restaurant: ${restaurant.name}
Cuisine: ${restaurant.cuisineType}
User Dietary Restrictions: ${userPreferences.dietaryRestrictions?.join(', ') || 'None'}
User Allergies: ${userPreferences.allergies?.join(', ') || 'None'}

Provide a 1-2 sentence personalized recommendation addressing their specific needs.`;

      const personalizedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: personalizedPrompt }],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (personalizedResponse.ok) {
        const personalizedData = await personalizedResponse.json();
        personalizedRecommendation = personalizedData.choices[0].message.content;
      }
    }

    console.log('Successfully generated summaries for:', restaurant.name);

    return new Response(JSON.stringify({
      placeSummary,
      reviewSummary,
      personalizedRecommendation,
      reviewCount: reviews.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-place-summaries function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
