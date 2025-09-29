
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

  let userInput = '';
  try {
    const body = await req.json();
    userInput = body.userInput;

    if (!userInput || typeof userInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'User input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are helping a restaurant search app decide if a user's search input is related to food, drinks, dining, restaurants, or cuisines.

Be VERY PERMISSIVE and liberal in your validation. If there's any doubt, assume it's food-related.

Instructions:
- If the input **is relevant** or **could be relevant** to food, restaurants, dining, or if you're unsure, respond with:
  Valid: [user's original input]

- Only if the input is **clearly and obviously not food-related** (like "politics", "math homework", "car repair"), respond with:
  Invalid

Examples of VALID inputs (be this permissive):
- Any food name, cuisine, restaurant type
- Single letters or short words (could be abbreviations)
- Any cooking method or ingredient
- Any restaurant-related term
- Ambiguous terms that could relate to food

User Input: "${userInput}"`;

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
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    console.log('AI Response for search validation:', aiResponse);

    // Parse the AI response - be very permissive
    let result;
    if (aiResponse.startsWith('Valid:')) {
      const validatedInput = aiResponse.replace('Valid:', '').trim();
      result = {
        isValid: true,
        originalInput: userInput,
        validatedInput: validatedInput
      };
    } else if (aiResponse === 'Invalid') {
      result = {
        isValid: false,
        originalInput: userInput
      };
    } else {
      // Fallback - if response format is unexpected, assume valid (be permissive)
      console.log('Unexpected AI response format, defaulting to valid');
      result = {
        isValid: true,
        originalInput: userInput,
        validatedInput: userInput
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in validate-search-input function:', error);
    // Be permissive even on errors - assume valid
    return new Response(
      JSON.stringify({ 
        isValid: true, 
        originalInput: userInput || '',
        validatedInput: userInput || ''
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
