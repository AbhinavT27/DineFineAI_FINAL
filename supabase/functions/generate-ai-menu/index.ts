// import "https://deno.land/x/xhr@0.1.0/mod.ts";
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
// };

// const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
// const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// serve(async (req) => {
//   // CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response(null, { headers: corsHeaders });
//   }

//   if (req.method !== "POST") {
//     return new Response(JSON.stringify({ error: "Only POST is allowed" }), {
//       status: 405,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }

//   try {
//     console.log("AI Menu retrieval function called");

//     // Require Authorization header (Supabase user JWT)
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader) {
//       console.error("Missing Authorization header");
//       return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
//         status: 401,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     if (!OPENAI_API_KEY) {
//       console.error("OpenAI API key not found");
//       return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
//         status: 500,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Supabase clients
//     const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
//     const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//       global: { headers: { Authorization: authHeader } },
//     });

//     // Authenticate caller
//     const { data: { user }, error: authError } = await supabase.auth.getUser();
//     if (authError || !user) {
//       console.error("Authentication failed:", authError);
//       return new Response(JSON.stringify({ error: "Authentication failed" }), {
//         status: 401,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Parse input
//     const { restaurantName, location } = await req.json();
//     if (!restaurantName || !location) {
//       return new Response(JSON.stringify({ error: "restaurantName and location are required" }), {
//         status: 400,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }
//     console.log("Processing menu retrieval for:", restaurantName, "in", location);

//     // Cache check
//     const { data: existingMenu } = await supabaseService
//       .from("ai_generated_menus")
//       .select("*")
//       .eq("restaurant_name", restaurantName)
//       .eq("location", location)
//       .single();

//     if (existingMenu) {
//       console.log("Found existing menu, returning cached result");
//       return new Response(JSON.stringify({
//         menuItems: existingMenu.menu_items ?? [],
//         status: "success",
//         cached: true,
//         restaurantName,
//         location,
//       }), {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Use OpenAI API directly with fetch
//     const systemPrompt = 
//       "You are a menu generator that creates realistic menu items for restaurants. " +
//       "Generate 8-12 menu items that would typically be found at this type of restaurant. " +
//       "For each item, provide: name, ingredients, price, and estimated calories. " +
//       "Return only a JSON array with no additional text.";

//     const userPrompt = 
//       `Generate a menu for ${restaurantName} located at ${location}. ` +
//       `Return a JSON array where each item has: menu_item (string), ingredients (string), ` +
//       `price (string like "$12.99"), calories (string like "650"), sources (array with one URL), ` +
//       `ingredients_estimated (true), price_estimated (true), calories_estimated (true).`;

//     const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: userPrompt }
//         ],
//         max_tokens: 2000,
//         temperature: 0.7,
//       }),
//     });

//     if (!openaiResponse.ok) {
//       const errorText = await openaiResponse.text();
//       console.error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
//       throw new Error(`OpenAI API error: ${openaiResponse.status}`);
//     }

//     const openaiData = await openaiResponse.json();
//     const content = openaiData.choices[0]?.message?.content;
    
//     if (!content) {
//       throw new Error('No content received from OpenAI');
//     }

//     let menuItems: any[] = [];
//     try {
//       // Clean the response and parse JSON
//       const cleanedContent = content
//         .replace(/^```(?:json)?/i, '')
//         .replace(/```$/i, '')
//         .trim();
      
//       menuItems = JSON.parse(cleanedContent);
//       if (!Array.isArray(menuItems)) {
//         menuItems = [];
//       }
//     } catch (parseError) {
//       console.error("Failed to parse JSON from OpenAI:", parseError);
//       console.error("Raw content:", content?.slice(0, 300));
      
//       // Fallback: create a simple menu
//       menuItems = [
//         {
//           menu_item: "House Special",
//           ingredients: "Fresh seasonal ingredients",
//           price: "$18.99",
//           calories: "650",
//           sources: [`https://example.com/${restaurantName.toLowerCase().replace(/\s+/g, '-')}-menu`],
//           ingredients_estimated: true,
//           price_estimated: true,
//           calories_estimated: true
//         }
//       ];
//     }

//     // Ensure all items have required fields
//     menuItems = menuItems.map((item: any) => ({
//       menu_item: item.menu_item || "Menu Item",
//       ingredients: item.ingredients || "Various ingredients",
//       price: item.price || "$12.99",
//       calories: item.calories || "500",
//       sources: item.sources || [`https://example.com/menu`],
//       ingredients_estimated: item.ingredients_estimated ?? true,
//       price_estimated: item.price_estimated ?? true,
//       calories_estimated: item.calories_estimated ?? true,
//     }));

//     // Store in DB
//     const { error: insertError } = await supabaseService.from("ai_generated_menus").insert({
//       restaurant_name: restaurantName,
//       location,
//       menu_items: menuItems,
//     });

//     if (insertError) {
//       console.error("Error storing menu in database:", insertError);
//     } else {
//       console.log("Menu stored successfully in database");
//     }

//     return new Response(JSON.stringify({
//       menuItems,
//       status: "success",
//       cached: false,
//       restaurantName,
//       location,
//       totalItemsGenerated: menuItems.length,
//     }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (error) {
//     console.error("Error in generate-ai-menu function:", error);
//     return new Response(JSON.stringify({
//       error: error instanceof Error ? error.message : String(error),
//       menuItems: [],
//     }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });

// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

/** Strict JSON schema for output (no URLs, no flags) */
const MenuItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    menu_item: { type: "string" },
    ingredients: { type: "string" },
    price: { type: "string" },    // "$12.99"
    calories: { type: "string" }  // "650"
  },
  required: ["menu_item", "ingredients", "price", "calories"]
};

const ResponseSchema = {
  name: "menu_items_array",
  schema: {
    type: "array",
    items: MenuItemSchema,
    minItems: 6,
    maxItems: 24
  },
  strict: true
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST is allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    console.log("[AI MENU] Function called");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Supabase clients
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Input
    const { restaurantName, location } = await req.json();
    if (!restaurantName || !location) {
      return new Response(JSON.stringify({ error: "restaurantName and location are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("[AI MENU] Processing:", restaurantName, "in", location);

    // Cache
    const { data: existingMenu } = await supabaseService
      .from("ai_generated_menus")
      .select("*")
      .eq("restaurant_name", restaurantName)
      .eq("location", location)
      .single();

    if (existingMenu?.menu_items?.length) {
      return new Response(JSON.stringify({
        menuItems: existingMenu.menu_items,
        status: "success",
        cached: true,
        restaurantName,
        location
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // OpenAI Responses API + web_search tool
    const systemText =
      "You are a precise restaurant-menu extractor. " +
      "Use web_search to find the official, current menu. " +
      "Return only a JSON array of menu items with: menu_item, ingredients, price, calories. " +
      "If a value is missing, infer sensibly (e.g., ingredients using common preparation) and still provide a single string; do not include URLs or flags. " +
      "No prose, no explanations.";

    const userText =
      `Restaurant: ${restaurantName}\n` +
      `Location: ${location}\n` +
      `Task: Return ONLY a JSON array. Each object has exactly:\n` +
      `- menu_item (string)\n- ingredients (string)\n- price (string like "$12.99")\n- calories (string like "650")\n` +
      `Rules:\n` +
      `1) Use web_search to identify items/prices.\n` +
      `2) If calories are not published, provide a reasonable single-number estimate as a string.\n` +
      `3) Ingredients should be a concise comma-separated list (AI-inferred if needed).\n` +
      `4) Do NOT include URLs or any extra fields.\n` +
      `5) 8–20 items total is fine.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "tools=true" // enables hosted tools like web_search
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: [{ type: "text", text: systemText }] },
          { role: "user",   content: [{ type: "text", text: userText }] }
        ],
        tools: [{ type: "web_search" }],
        response_format: { type: "json_schema", json_schema: ResponseSchema },
        temperature: 0.2,
        max_output_tokens: 3000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[OPENAI] ${response.status}: ${errText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openaiData = await response.json();

    // Prefer output_text with json_schema format
    let raw = openaiData.output_text as string | undefined;
    if (!raw) {
      try {
        const first = openaiData.output?.[0]?.content?.[0];
        if (first?.type === "output_text") raw = first.text;
      } catch { /* noop */ }
    }
    if (!raw || typeof raw !== "string") {
      throw new Error("No JSON text returned from OpenAI");
    }

    let menuItems: any[] = [];
    try {
      menuItems = JSON.parse(raw);
      if (!Array.isArray(menuItems)) throw new Error("Not an array");
    } catch {
      console.error("[AI MENU] JSON parse failed; sample:", raw.slice(0, 400));
      throw new Error("Failed to parse model JSON");
    }

    // Minimal normalization / safety
    menuItems = menuItems.map((item: any) => ({
      menu_item: item.menu_item ?? "Menu Item",
      ingredients: item.ingredients ?? "Ingredients unavailable",
      price: item.price ?? "$12.99",
      calories: item.calories ?? "500"
    }));

    // Store result
    const { error: insertError } = await supabaseService.from("ai_generated_menus").insert({
      restaurant_name: restaurantName,
      location,
      menu_items: menuItems
    });
    if (insertError) console.warn("[AI MENU] DB insert warning:", insertError);

    return new Response(JSON.stringify({
      menuItems,
      status: "success",
      cached: false,
      restaurantName,
      location,
      totalItemsGenerated: menuItems.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[AI MENU] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      menuItems: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
