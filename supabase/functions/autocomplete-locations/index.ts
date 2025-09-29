import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a location autocomplete assistant. Given a partial location input, provide up to 5 relevant city/location suggestions that match or could complete the input.

Rules:
1. Provide full city names with state/country (e.g., "San Francisco, CA")
2. Prioritize major cities and common locations
3. Handle partial inputs intelligently (e.g., "san" -> San Francisco, San Diego, San Jose, etc.)
4. Include state abbreviations for US cities
5. Return results in order of relevance/popularity
6. Only return actual, real locations

Respond ONLY with a JSON object in this exact format:
{
  "suggestions": [
    "City Name, State/Country",
    "Another City, State/Country",
    ...
  ]
}

Examples:
- "san" -> {"suggestions": ["San Francisco, CA", "San Diego, CA", "San Jose, CA", "San Antonio, TX", "Santa Monica, CA"]}
- "new y" -> {"suggestions": ["New York, NY", "New Haven, CT", "New Orleans, LA", "New Brunswick, NJ"]}
- "los" -> {"suggestions": ["Los Angeles, CA", "Louisville, KY", "Los Gatos, CA"]}
- "palo" -> {"suggestions": ["Palo Alto, CA", "Palo Verde, AZ"]}
`
          },
          {
            role: 'user',
            content: `Provide location suggestions for: "${userInput.trim()}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const result = JSON.parse(content);
      
      // Validate the response structure
      if (!result.suggestions || !Array.isArray(result.suggestions)) {
        throw new Error('Invalid response structure from AI');
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in autocomplete-locations function:', error);
    return new Response(
      JSON.stringify({ suggestions: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});