import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getWebsiteFromPlaceId(place_id: string): Promise<string> {
  const endpoint =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      place_id
    )}&fields=website,url&key=${GOOGLE_PLACES_API_KEY}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Places Details fetch failed: ${res.status} ${errorText}`);
  }
  
  const json = await res.json();

  if (json.status !== "OK") {
    throw new Error(
      `Places Details error: ${json.status} (${json.error_message ?? "no message"})`
    );
  }

  const website: string | undefined = json.result?.website;
  if (website && /^https?:\/\//i.test(website)) {
    return website;
  }

  throw new Error("No website found for this place.");
}

function stripCodeFences(content: string): string {
  return content
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("GPT-5 Scraper function invoked");
    
    const body = await req.json();
    const place_id: string | undefined = body.place_id;
    const url: string | undefined = body.url;
    const rawText: string | undefined = body.rawText; // For direct text processing

    let targetUrl = url;

    // Step 1: Receive request and determine processing method
    if (rawText) {
      // Direct text processing mode
      console.log("Processing raw menu text directly");
      
      const prompt = `Extract menu items from this raw text and return ONLY JSON in this schema:
[
  {
    "dish": string,
    "price": string,
    "ingredients": string[],
    "contains_restricted": string[],
    "category": string,
    "description": string
  }
]

Raw menu text:
${rawText}`;

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-2025-08-07",
          messages: [
            {
              role: "system",
              content: "You are a precise menu extraction agent. Respond with valid JSON only. Extract dish names, prices, ingredients, and categorize items properly.",
            },
            { role: "user", content: prompt },
          ],
          max_completion_tokens: 4000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
        throw new Error(`OpenAI error ${aiResponse.status}: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData?.choices?.[0]?.message?.content?.trim();
      
      if (!rawContent) {
        throw new Error("No response from GPT-5");
      }

      // Step 4: Validate GPT-5's JSON output
      const cleanedContent = stripCodeFences(rawContent);
      let menuItems;
      
      try {
        menuItems = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error("Failed to parse GPT-5 output as JSON:", cleanedContent);
        throw new Error("Invalid JSON returned by GPT-5");
      }

      if (!Array.isArray(menuItems)) {
        throw new Error("Model did not return a JSON array");
      }

      console.log(`Successfully extracted ${menuItems.length} menu items from raw text`);
      
      // Step 5: Respond with valid JSON menu
      return new Response(
        JSON.stringify({ 
          success: true, 
          menuItems,
          totalItemsFound: menuItems.length,
          source: 'raw_text_processing'
        }), 
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        }
      );
    }

    // Step 2: Resolve website URL from Google Places API if place_id is provided
    if (place_id) {
      console.log(`Resolving website URL for place_id: ${place_id}`);
      targetUrl = await getWebsiteFromPlaceId(place_id);
    }

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      throw new Error("No valid website URL. Provide a valid place_id or a direct url.");
    }

    console.log(`Processing website URL: ${targetUrl}`);

    // Step 3: Send the website URL to GPT-5 with instructions to extract menu info
    const prompt = `Scrape this restaurant website for menu items, their ingredients, prices, and details. 
Return ONLY JSON in this schema:
[
  {
    "dish": string,
    "price": string,
    "ingredients": string[],
    "contains_restricted": string[],
    "category": string,
    "description": string
  }
]

Extract as many menu items as possible. Focus on food items, their prices, ingredients, and any dietary restrictions mentioned.

Website: ${targetUrl}`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "system",
            content: "You are a precise menu extraction agent. Respond with valid JSON only. Extract comprehensive menu information including dishes, prices, ingredients, and categories.",
          },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI error ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData?.choices?.[0]?.message?.content?.trim();
    
    if (!rawContent) {
      throw new Error("No response from GPT-5");
    }

    // Step 4: Validate GPT-5's JSON output before returning it
    const cleanedContent = stripCodeFences(rawContent);
    let menuItems;
    
    try {
      menuItems = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse GPT-5 output as JSON:", cleanedContent);
      throw new Error("Invalid JSON returned by GPT-5");
    }

    if (!Array.isArray(menuItems)) {
      throw new Error("Model did not return a JSON array");
    }

    console.log(`Successfully extracted ${menuItems.length} menu items from ${targetUrl}`);

    // Step 5: Respond with either a valid JSON menu or an error
    return new Response(
      JSON.stringify({ 
        success: true, 
        url: targetUrl, 
        menuItems,
        totalItemsFound: menuItems.length,
        source: 'website_scraping'
      }), 
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("GPT-5 Scraper error:", error);
    
    // Step 5: Respond with error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }), 
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});