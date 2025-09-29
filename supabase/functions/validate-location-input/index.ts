
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
    const { userLocation } = await req.json();

    if (!userLocation || typeof userLocation !== 'string') {
      return new Response(
        JSON.stringify({ error: 'User location is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are helping a restaurant app verify if a typed location is a real city. A user has typed a location, possibly misspelled or abbreviated. Your job is to check if the input is a real city name.

If it is a correct city name, respond like this:
Correct City: [City, State]

If it is incorrect or abbreviated, respond like this:
Suggestion: [Corrected City, State]

If it's completely unrecognizable, respond like this:
Invalid location. Please try again.

User Input: "${userLocation}"`;

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
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    console.log('AI Response for location validation:', aiResponse);

    // Parse the AI response
    let result;
    if (aiResponse.startsWith('Correct City:')) {
      const correctedLocation = aiResponse.replace('Correct City:', '').trim();
      result = {
        isCorrect: true,
        originalInput: userLocation,
        correctedLocation: correctedLocation
      };
    } else if (aiResponse.startsWith('Suggestion:')) {
      const suggestion = aiResponse.replace('Suggestion:', '').trim();
      result = {
        isCorrect: false,
        originalInput: userLocation,
        suggestion: suggestion
      };
    } else if (aiResponse.includes('Invalid location')) {
      result = {
        isCorrect: false,
        originalInput: userLocation,
        isInvalid: true
      };
    } else {
      // Fallback - assume correct if response format is unexpected
      result = {
        isCorrect: true,
        originalInput: userLocation
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in validate-location-input function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
