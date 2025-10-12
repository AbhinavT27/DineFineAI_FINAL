import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Schema note: documented for reference; not enforced at runtime
const MenuItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    menu_item: { type: "string" },
    price: { type: "string" },        // only if stated on source
    ingredients: { type: "string" },  // AI-generated from name + description
    calories: { type: "string" },     // AI-estimated if not stated on source
    citation: { type: "string" }      // direct URL to item/section
  },
  required: ["menu_item", "ingredients", "calories", "citation"]
};

const ResponseSchema = {
  name: "menu_items_array",
  schema: { type: "array", items: MenuItemSchema, minItems: 1, maxItems: 100 },
  strict: true
};

// Utility: always return 200 with CORS, embedding ok/error flags
function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") return ok(null);

  // Enforce POST but keep 200 status
  if (req.method !== "POST") {
    return ok({ ok: false, error: "Only POST is allowed" });
  }

  try {
    console.log("[AI MENU - PERPLEXITY] Function called");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return ok({ ok: false, error: "Missing Authorization header" });
    }

    if (!PERPLEXITY_API_KEY) {
      return ok({ ok: false, error: "PERPLEXITY_API_KEY not configured" });
    }

    // Supabase setup
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Auth check (still return 200 on failure)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return ok({ ok: false, error: "Authentication failed" });
    }

    // Input
    let bodyJson: any = {};
    try {
      bodyJson = await req.json();
    } catch {
      return ok({ ok: false, error: "Invalid JSON body" });
    }
    const { restaurantName, location } = bodyJson || {};
    if (!restaurantName || !location) {
      return ok({ ok: false, error: "restaurantName and location are required" });
    }

    console.log("[AI MENU] Processing:", restaurantName, "in", location);

    // Cache check
    const { data: existingMenu, error: cacheErr } = await supabaseService
      .from("ai_generated_menus")
      .select("*")
      .eq("restaurant_name", restaurantName)
      .eq("location", location)
      .single();

    if (!cacheErr && existingMenu?.menu_items?.length) {
      return ok({
        ok: true,
        status: "success",
        cached: true,
        restaurantName,
        location,
        menuItems: existingMenu.menu_items,
        totalItemsGenerated: existingMenu.menu_items.length
      });
    }

    // Use Perplexity Chat Completions API with sonar-pro model for menu extraction
    console.log("[AI MENU] Calling Perplexity Chat Completions API");
    
    const systemPrompt = `You are a menu extraction assistant. Extract menu items from web search results and return them as a valid JSON array. 

CRITICAL REQUIREMENTS:
- You MUST estimate calories for every item (use nutritional knowledge)
- You MUST infer ingredients from item names and descriptions
- Never leave ingredients or calories empty
- Provide realistic calorie estimates based on typical portion sizes`;
    
    const userPrompt = `Find all menu items for "${restaurantName}" in "${location}". 

Return ONLY a valid JSON array (no markdown, no explanations) where each entry contains:
- "menu_item": the dish/menu item name (REQUIRED)
- "price": the price in dollars (use "" if not found)
- "ingredients": comma-separated ingredient list inferred from item name/description (REQUIRED - use your knowledge to estimate if not stated)
- "calories": estimated calories as a number string (REQUIRED - estimate based on typical portions and ingredients, e.g. "450")
- "citation": URL where this item was found (REQUIRED)

IMPORTANT: 
- DO NOT leave ingredients or calories empty
- Use nutritional knowledge to estimate calories realistically
- Infer likely ingredients from dish names (e.g., "Caesar Salad" → "romaine lettuce, parmesan cheese, croutons, caesar dressing")
- Return ONLY the JSON array, no explanations`;

    const chatResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!chatResponse.ok) {
      const errText = await chatResponse.text();
      console.error(`[PERPLEXITY] ${chatResponse.status}: ${errText}`);
      return ok({
        ok: false,
        error: `Perplexity API error: ${chatResponse.status}`,
        debug: { errorBody: errText }
      });
    }

    const chatData = await chatResponse.json();
    let raw = chatData?.choices?.[0]?.message?.content || "";
    
    if (!raw) {
      return ok({
        ok: false,
        error: "No response from Perplexity Chat API"
      });
    }

    console.log("[AI MENU] Received response, parsing JSON...");

    // Attempt to parse raw as JSON; also try to extract a JSON block if wrapped
    const tryParse = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        // Remove markdown code blocks if present
        let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        try {
          return JSON.parse(cleaned);
        } catch {
          // try to find the first JSON array block
          const m = cleaned.match(/\[[\s\S]*\]/);
          if (m) {
            try { return JSON.parse(m[0]); } catch { /* ignore */ }
          }
          return null;
        }
      }
    };

    let menuItems: any[] | null = tryParse(raw);
    if (!Array.isArray(menuItems)) {
      console.error("[AI MENU] JSON parse failed; sample:", String(raw).slice(0, 400));
      return ok({
        ok: false,
        error: "Failed to parse Perplexity Search JSON answer.",
        debug: { sample: String(raw).slice(0, 400) }
      });
    }

    // Normalize output and validate required fields
    menuItems = menuItems.map((item: any) => ({
      menu_item: typeof item.menu_item === "string" ? item.menu_item : "",
      price: typeof item.price === "string" ? item.price : "",
      ingredients: typeof item.ingredients === "string" ? item.ingredients : "",
      calories: typeof item.calories === "string" ? item.calories : "",
      citation: typeof item.citation === "string" ? item.citation : ""
    })).filter(item => 
      // Filter out items missing critical fields
      item.menu_item && item.ingredients && item.calories
    );

    // Store result
    const { error: insertError } = await supabaseService
      .from("ai_generated_menus")
      .insert({
        restaurant_name: restaurantName,
        location,
        menu_items: menuItems
      });

    if (insertError) {
      console.warn("[AI MENU] DB insert warning:", insertError);
      // Still 200, but communicate the warning
      return ok({
        ok: true,
        status: "partial_success",
        cached: false,
        restaurantName,
        location,
        menuItems,
        totalItemsGenerated: menuItems.length,
        dbWarning: insertError
      });
    }

    // Success
    return ok({
      ok: true,
      status: "success",
      cached: false,
      restaurantName,
      location,
      menuItems,
      totalItemsGenerated: menuItems.length
    });

  } catch (error) {
    console.error("[AI MENU] Error:", error);
    // Always 200; surface error details in body
    return ok({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      menuItems: []
    });
  }
});
