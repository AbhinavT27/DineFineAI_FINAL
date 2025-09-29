
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Menu analysis function called');
    
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

    const { restaurantWebsite, searchQuery, allergies, dietaryRestrictions } = await req.json();
    console.log('Analyzing menu for:', restaurantWebsite, 'Query:', searchQuery);

    const prompt = `You are an assistant for a food discovery app. Your task is to extract and analyze restaurant menu items from a given website.

Context:
- Restaurant website: ${restaurantWebsite}
- User search query: ${searchQuery}
- User allergies: ${allergies.join(', ')} (e.g., peanuts, shellfish)
- User dietary restrictions: ${dietaryRestrictions.join(', ')} (e.g., vegetarian, halal, gluten-free)

Instructions:

1. Visit the restaurant website provided.
2. Extract the list of menu items and include any available ingredient descriptions.
3. If the user's search query refers to a specific **dish or food item** (e.g., "ramen" or "chicken tikka"):
   - Find menu items matching that food.
   - List each item, include its ingredient list.
   - Highlight in **red** any ingredients that the user **cannot eat** based on allergies or restrictions.
4. If the user's query is a **cuisine** (e.g., "Thai", "Mexican"):
   - Select the **most popular items** from the restaurant's menu.
   - Only show menu items that do **not contain any restricted ingredients**.
   - Display the item name and ingredients clearly.

Output Format:
[
  {
    "dish": "Dish Name",
    "ingredients": ["ingredient1", "ingredient2", "..."],
    "contains_restricted": ["<highlighted ingredients>"] // this field is only used if restricted ingredients are found
  }
]

Return only valid JSON. If no menu information is available, return an empty array.`;

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
            content: 'You are a helpful assistant that analyzes restaurant menus and extracts ingredient information. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response received');
    
    let menuItems = [];
    try {
      menuItems = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          menuItems = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError);
          menuItems = [];
        }
      }
    }

    console.log('Successfully analyzed menu items:', menuItems.length);

    return new Response(JSON.stringify(menuItems), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-menu-items function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
