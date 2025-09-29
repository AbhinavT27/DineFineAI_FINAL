
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
    console.log('Menu compatibility analysis function called');
    
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
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const { restaurantName, cuisineType, dietaryRestrictions, allergies, reviews } = await req.json();
    console.log('Analyzing menu compatibility for:', restaurantName);

    // Create a comprehensive prompt for menu analysis
    const menuAnalysisPrompt = `You are a restaurant menu analyzer. Based on the restaurant information provided, analyze the menu compatibility for users with specific dietary restrictions and allergies.

Restaurant: ${restaurantName}
Cuisine Type: ${cuisineType}
User's Dietary Restrictions: ${dietaryRestrictions.join(', ') || 'None'}
User's Allergies: ${allergies.join(', ') || 'None'}

Recent Reviews: ${reviews?.map((r: any) => r.text).join('\n') || 'No reviews available'}

Please analyze this restaurant's likely menu options and provide:

1. **compatibilityScore** (0-100): How well this restaurant accommodates the user's dietary needs
2. **safeMenuItems** (array): List of likely menu items that would be safe for this user
3. **riskFactors** (array): Potential issues or allergens the user should be aware of
4. **recommendations** (string): Specific advice for dining at this restaurant
5. **allergyWarning** (boolean): Whether this restaurant poses high risk for the user's allergies

Consider the cuisine type, common ingredients used, typical preparation methods, and any information from reviews that mentions dietary accommodations, allergens, or food preparation.

Respond with a valid JSON object only.`;

    console.log('Calling OpenAI for menu analysis');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert nutritionist and food safety analyst who specializes in restaurant menu analysis for people with dietary restrictions and allergies. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: menuAnalysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', analysisText);

    // Parse the JSON response
    let menuAnalysis;
    try {
      menuAnalysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback response
      menuAnalysis = {
        compatibilityScore: 50,
        safeMenuItems: ['Please check with restaurant staff'],
        riskFactors: ['Unknown menu items - verification needed'],
        recommendations: 'Contact the restaurant directly to discuss your dietary needs and allergies.',
        allergyWarning: allergies.length > 0
      };
    }

    console.log('Menu analysis completed for:', restaurantName);
    return new Response(JSON.stringify(menuAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-menu-compatibility function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      compatibilityScore: 0,
      safeMenuItems: [],
      riskFactors: ['Analysis unavailable'],
      recommendations: 'Please contact the restaurant directly about dietary accommodations.',
      allergyWarning: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
