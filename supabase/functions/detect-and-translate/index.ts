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
            content: `You are a language detection and translation assistant for a restaurant search app. Your job is to:

1. Detect the language of the user's input
2. If the input is not in English, translate it to English for better restaurant search results
3. Extract any dietary preferences, allergies, or food-related terms
4. Preserve the intent while making it searchable in English

Respond ONLY with a JSON object in this exact format:
{
  "originalText": "user's original input",
  "detectedLanguage": "language code (en, es, fr, de, it, pt, ja, ko, zh, etc.)",
  "translatedText": "English translation (or original if already English)",
  "confidence": "high|medium|low",
  "extractedDietaryInfo": {
    "preferences": ["vegetarian", "vegan", "gluten-free", etc.],
    "allergies": ["nuts", "dairy", "shellfish", etc.],
    "cuisineType": "Italian|Chinese|Mexican|etc.",
    "foodItems": ["pizza", "sushi", "tacos", etc.]
  },
  "searchIntent": "restaurant search intent in English"
}

Examples:
- "Je veux de la pizza végétalienne" -> {"originalText": "Je veux de la pizza végétalienne", "detectedLanguage": "fr", "translatedText": "I want vegan pizza", "confidence": "high", "extractedDietaryInfo": {"preferences": ["vegan"], "foodItems": ["pizza"]}, "searchIntent": "Find vegan pizza restaurants"}
- "寿司が食べたい" -> {"originalText": "寿司が食べたい", "detectedLanguage": "ja", "translatedText": "I want to eat sushi", "confidence": "high", "extractedDietaryInfo": {"cuisineType": "Japanese", "foodItems": ["sushi"]}, "searchIntent": "Find sushi restaurants"}
- "pizza without nuts" -> {"originalText": "pizza without nuts", "detectedLanguage": "en", "translatedText": "pizza without nuts", "confidence": "high", "extractedDietaryInfo": {"allergies": ["nuts"], "foodItems": ["pizza"]}, "searchIntent": "Find pizza restaurants that are nut-free"}
`
          },
          {
            role: 'user',
            content: `Detect language and translate if needed: "${userInput}"`
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
      if (!result.originalText || !result.detectedLanguage || !result.translatedText) {
        throw new Error('Invalid response structure from AI');
      }

      return new Response(JSON.stringify(result), {
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
    console.error('Error in detect-and-translate function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});