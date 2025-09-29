
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyze search query function called');
    
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

    // Check search throttling - 10 searches per day for all users
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create daily usage record
    const { data: usageData, error: usageError } = await supabase
      .from('daily_usage')
      .select('search_requests')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching usage data:', usageError);
      throw new Error('Failed to check usage limits');
    }

    const currentSearchRequests = usageData?.search_requests || 0;
    
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
      .from('daily_usage')
      .upsert({
        user_id: user.id,
        usage_date: today,
        search_requests: currentSearchRequests + 1
      }, {
        onConflict: 'user_id,usage_date'
      });

    console.log(`Search request logged for user ${user.id}: ${currentSearchRequests + 1}/10`);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const { query } = await req.json();
    console.log('Analyzing query:', query);

    const prompt = `You are a food and restaurant search assistant. Your job is to analyze ANY query and determine if it's related to food, dining, or restaurants. Be VERY GENEROUS in your interpretation - almost anything food-related should be considered valid.

Query: "${query}"

IMPORTANT RULES:
1. Single food items like "ice cream", "pizza", "donuts", "burrito" are ALWAYS restaurant-related searches
2. Any cuisine type like "italian", "mexican", "chinese" is ALWAYS restaurant-related
3. Any meal-related terms like "breakfast", "lunch", "dinner" are restaurant-related
4. Any cooking method or food descriptor is likely restaurant-related
5. Even vague food references should be considered restaurant-related
6. ONLY reject queries that are clearly NOT about food (like "car repair", "dentist", "movies")

When someone searches for a food item, they want to find places that serve that food.
Examples:
- "ice cream" → find ice cream shops
- "donuts" → find donut shops  
- "burrito" → find Mexican restaurants
- "pizza" → find pizza places
- "italian" → find Italian restaurants
- "sushi" → find sushi restaurants

Please respond with a JSON object containing:
1. isRestaurantRelated (boolean): true unless clearly NOT about food/dining
2. intent (string): one of ["search_restaurants", "find_cuisine", "dietary_request", "location_based", "general_food", "specific_item", "not_food_related"]
3. extractedPreferences (object): extract any preferences like:
   - cuisineType: specific cuisine mentioned (Italian, Chinese, Mexican, etc.)
   - dietaryRestrictions: array of dietary needs (Vegetarian, Vegan, Gluten-Free, etc.)
   - allergies: array of allergies mentioned
   - priceRange: $ | $$ | $$$ | $$$$
   - location: any location mentioned
   - searchQuery: cleaned up version of the original query
   - specificFoodItem: specific food items mentioned (pizza, tacos, ice cream, etc.)
   - establishmentType: type of establishment (cafe, bakery, bar, ice cream shop, etc.)
4. confidence (number): 0-1 confidence in the analysis
5. suggestedSearch (string): a better search query if needed
6. displayCategory (string): user-friendly category for display
7. googlePlacesType (string): specific type for Google Places API (restaurant, cafe, bakery, store, bar)

Examples of GOOD restaurant-related analysis:
- "ice cream" → isRestaurantRelated: true, intent: "specific_item", specificFoodItem: "ice cream", displayCategory: "Ice Cream Shops", googlePlacesType: "store"
- "pizza" → isRestaurantRelated: true, intent: "specific_item", specificFoodItem: "pizza", displayCategory: "Pizza Places", googlePlacesType: "restaurant"
- "mexican" → isRestaurantRelated: true, intent: "find_cuisine", cuisineType: "Mexican", displayCategory: "Mexican Restaurants", googlePlacesType: "restaurant"
- "donuts" → isRestaurantRelated: true, intent: "specific_item", specificFoodItem: "donuts", displayCategory: "Donut Shops", googlePlacesType: "bakery"
- "burrito" → isRestaurantRelated: true, intent: "specific_item", specificFoodItem: "burrito", cuisineType: "Mexican", displayCategory: "Mexican Restaurants", googlePlacesType: "restaurant"

Be generous and helpful - when in doubt, treat it as food-related!

Respond with valid JSON only.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes search queries for restaurant and food-related intent. Always respond with valid JSON and be VERY generous in identifying food-related queries. Almost any mention of food should be considered restaurant-related.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 600
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('OpenAI analysis response:', analysis);

    try {
      const parsedAnalysis = JSON.parse(analysis);
      
      const result = {
        isRestaurantRelated: parsedAnalysis.isRestaurantRelated || true, // Default to true for food queries
        intent: parsedAnalysis.intent || 'specific_item',
        extractedPreferences: parsedAnalysis.extractedPreferences || { searchQuery: query },
        confidence: parsedAnalysis.confidence || 0.8,
        suggestedSearch: parsedAnalysis.suggestedSearch || query,
        displayCategory: parsedAnalysis.displayCategory || 'Restaurants',
        googlePlacesType: parsedAnalysis.googlePlacesType || 'restaurant'
      };

      console.log('Parsed analysis result:', result);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Fallback: assume most queries are food-related
      return new Response(JSON.stringify({
        isRestaurantRelated: true,
        intent: 'specific_item',
        extractedPreferences: { searchQuery: query },
        confidence: 0.6,
        suggestedSearch: query,
        displayCategory: 'Food Places',
        googlePlacesType: 'restaurant'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in analyze-search-query function:', error);
    
    // Fallback: assume food-related
    return new Response(JSON.stringify({
      isRestaurantRelated: true,
      intent: 'specific_item',
      extractedPreferences: { searchQuery: 'restaurants' },
      confidence: 0.4,
      suggestedSearch: 'restaurants',
      displayCategory: 'Restaurants',
      googlePlacesType: 'restaurant'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
