
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

    if (!userInput || typeof userInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'User input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
            content: `You are a location suggestion assistant. Your job is to understand user input for locations and suggest the most likely correct location they meant.

Rules:
1. Handle common abbreviations (NYC -> New York City, LA -> Los Angeles, SF -> San Francisco, etc.)
2. Fix obvious spelling mistakes
3. Provide the full, proper city name with state/country if applicable
4. If the input is already a clear, correct location, return it as-is with high confidence
5. If you're unsure, provide your best guess with lower confidence
6. Focus on the most specific and relevant location match

Respond ONLY with a JSON object in this exact format:
{
  "originalText": "user's original input",
  "suggestedLocation": "your suggested full location name",
  "confidence": "high|medium|low",
  "explanation": "brief explanation of what you interpreted"
}

Examples:
- "nyc" -> {"originalText": "nyc", "suggestedLocation": "New York City, NY", "confidence": "high", "explanation": "Common abbreviation for New York City"}
- "nw york cit" -> {"originalText": "nw york cit", "suggestedLocation": "New York City, NY", "confidence": "high", "explanation": "Corrected spelling of New York City"}
- "New Brunswick" -> {"originalText": "New Brunswick", "suggestedLocation": "New Brunswick, NJ", "confidence": "high", "explanation": "Most likely New Brunswick, New Jersey"}
- "paris" -> {"originalText": "paris", "suggestedLocation": "Paris, France", "confidence": "medium", "explanation": "Most likely Paris, France (could also be Paris, TX)"}
- "San Francisco" -> {"originalText": "San Francisco", "suggestedLocation": "San Francisco, CA", "confidence": "high", "explanation": "Location is already correct"}
`
          },
          {
            role: 'user',
            content: `Suggest the correct location for: "${userInput}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const suggestion = JSON.parse(content);
      
      // Validate the response structure
      if (!suggestion.originalText || !suggestion.suggestedLocation || !suggestion.confidence) {
        throw new Error('Invalid response structure from AI');
      }

      return new Response(JSON.stringify(suggestion), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in suggest-location function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
