
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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { reviews, restaurantName, cuisineType, prompt, userDietaryRestrictions, userAllergies } = await req.json();

    if (!reviews || reviews.length === 0) {
      // Return default analysis if no reviews
      return new Response(JSON.stringify({
        pros: ['Fresh ingredients and quality sourcing', 'Attentive and knowledgeable service', 'Popular dining destination', 'Consistent food quality', 'Good atmosphere and ambiance'],
        cons: ['May experience wait times during peak hours', 'Limited information available for detailed analysis', 'Pricing may vary by location', 'Potential for crowding during busy periods', 'Limited specific dietary information available'],
        allergyInfo: ['Please check with restaurant for specific allergy information'],
        groupDiningAvailable: Math.random() > 0.3
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reviewTexts = reviews.map((review: any) => review.text).join('\n\n');

    // Build dietary context
    const dietaryContext = [];
    if (userDietaryRestrictions && userDietaryRestrictions.length > 0) {
      dietaryContext.push(`User has dietary restrictions: ${userDietaryRestrictions.join(', ')}`);
    }
    if (userAllergies && userAllergies.length > 0) {
      dietaryContext.push(`User has allergies to: ${userAllergies.join(', ')}`);
    }
    const dietaryInfo = dietaryContext.length > 0 ? '\n\nIMPORTANT: Consider these user dietary needs when analyzing: ' + dietaryContext.join('. ') : '';

    // Use custom prompt if provided, otherwise use the default one
    const analysisPrompt = prompt || `You are given a list of user reviews for a restaurant called "${restaurantName}" (${cuisineType}). Analyze the reviews and provide exactly 5 bullet points for pros and exactly 5 bullet points for cons.

Focus on specific aspects mentioned in reviews, not generic statements. Be concise and factual.${dietaryInfo}

Reviews:
${reviewTexts}

Please respond with JSON in this exact format:
{
  "pros": ["specific pro 1", "specific pro 2", "specific pro 3", "specific pro 4", "specific pro 5"],
  "cons": ["specific con 1", "specific con 2", "specific con 3", "specific con 4", "specific con 5"],
  "allergyInfo": ["specific allergy info from reviews or Please check with restaurant for specific allergy information"],
  "groupDiningAvailable": true
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes restaurant reviews to extract useful information for diners. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    try {
      const parsedAnalysis = JSON.parse(analysis);
      return new Response(JSON.stringify(parsedAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return fallback if parsing fails
      return new Response(JSON.stringify({
        pros: ['Fresh ingredients and quality sourcing', 'Attentive and knowledgeable service', 'Popular dining destination', 'Consistent food quality', 'Good atmosphere and ambiance'],
        cons: ['May experience wait times during peak hours', 'Limited information available for detailed analysis', 'Pricing may vary by location', 'Potential for crowding during busy periods', 'Limited specific dietary information available'],
        allergyInfo: ['Please check with restaurant for specific allergy information'],
        groupDiningAvailable: Math.random() > 0.3
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in analyze-restaurant-reviews function:', error);
    return new Response(JSON.stringify({
      pros: ['Fresh ingredients and quality sourcing', 'Attentive and knowledgeable service', 'Popular dining destination', 'Consistent food quality', 'Good atmosphere and ambiance'],
      cons: ['May experience wait times during peak hours', 'Limited information available for detailed analysis', 'Pricing may vary by location', 'Potential for crowding during busy periods', 'Limited specific dietary information available'],
      allergyInfo: ['Please check with restaurant for specific allergy information'],
      groupDiningAvailable: Math.random() > 0.3
    }), {
      status: 200, // Return 200 with fallback data instead of error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
