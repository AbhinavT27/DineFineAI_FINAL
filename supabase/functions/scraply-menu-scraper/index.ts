import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCRAPLY_API_KEY = Deno.env.get('SCRAPLY_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Scraply menu scraper function invoked');
    
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    if (!SCRAPLY_API_KEY) {
      throw new Error('SCRAPLY_API_KEY not configured');
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Scraping URL with Scrapfly:', url);

    // Step 1: Scrape the website using Scrapfly
    const scrapflyUrl = new URL('https://api.scrapfly.io/scrape');
    scrapflyUrl.searchParams.set('key', SCRAPLY_API_KEY);
    scrapflyUrl.searchParams.set('url', url);
    scrapflyUrl.searchParams.set('format', 'text');
    scrapflyUrl.searchParams.set('wait', '6000');
    scrapflyUrl.searchParams.set('render_js', 'true');
    // Optional: attempt English content where supported
    scrapflyUrl.searchParams.set('country', 'us');
    
    const scraplyResponse = await fetch(scrapflyUrl.toString(), {
      method: 'GET',
    });

    if (!scraplyResponse.ok) {
      const errorText = await scraplyResponse.text();
      console.error(`Scraply API error: ${scraplyResponse.status} - ${errorText}`);
      throw new Error(`Scraply scraping failed: ${scraplyResponse.status}`);
    }

    const scraplyData = await scraplyResponse.json();
    const scrapedContent = scraplyData?.result?.content || scraplyData?.content || scraplyData?.data?.content || scraplyData?.text || '';
    
    if (!scrapedContent) {
      throw new Error('No content scraped from the website');
    }

    console.log('Successfully scraped content, length:', scrapedContent.length);

    // Step 2: Process with ChatGPT to extract menu items
    // Heuristic fallback extractor for price-like lines
    const heuristicExtract = (text: string) => {
      try {
        const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
        const items: Array<{name: string; price: string; calories: string; ingredients: string[]}> = [];
        const seen = new Set<string>();
        const priceRe = /^(.*?)[\s\-–—]*((?:[$€£]\s?\d{1,3}(?:[.,]\d{2})?)|(?:\d{2,4}\s?(?:cal|kcal)))/i;
        for (const l of lines) {
          const m = l.match(priceRe);
          if (m) {
            const name = m[1].replace(/[:•\-–—]+$/, '').trim();
            const priceOrCal = m[2].trim();
            if (name.length >= 3 && name.split(' ').length <= 12) {
              const key = name.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                const price = /[$€£]/.test(priceOrCal) ? priceOrCal : '';
                const calories = /cal/i.test(priceOrCal) ? priceOrCal : '';
                items.push({ name, price, calories, ingredients: [] });
                if (items.length >= 25) break;
              }
            }
          }
        }
        return items;
      } catch { return []; }
    };

    const prompt = `Analyze the restaurant website content below and extract menu items. Return ONLY a JSON array with objects of the form:\n\n[\n  {\n    \"name\": \"Menu item name\",\n    \"ingredients\": [\"ingredient1\", \"ingredient2\"],\n    \"price\": \"$X.XX\",\n    \"calories\": \"XXX cal\"\n  }\n]\n\nGuidelines:\n- Focus on food dishes. Include drinks only if they have detailed descriptions.\n- If calories unavailable use \"N/A\". If ingredients unknown use an empty array.\n- Prefer sections titled: menu, our menu, entrees, mains, starters, appetizers, desserts, specials, doughnuts, sushi, pizza, pasta, burgers, etc.\n- Use price patterns like $, €, £, or numbers followed by cal/kcal to help identify items.\n- Do NOT return an empty array if there are plausible items—make best-effort from priced lines.\n\nWebsite content (truncated):\n${scrapedContent.substring(0, 15000)}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a precise menu extraction agent. Respond with valid JSON only. Extract menu items with names, ingredients, prices, and calories when available.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI processing failed: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData?.choices?.[0]?.message?.content?.trim();
    
    if (!rawContent) {
      throw new Error('No response from ChatGPT');
    }

    // Clean and parse the JSON response
    const cleanedContent = rawContent
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    let usedFallback = false;
    let menuItems: any[] = [];
    try {
      const parsed = JSON.parse(cleanedContent);
      if (Array.isArray(parsed)) {
        menuItems = parsed;
      }
    } catch (parseError) {
      console.error('Failed to parse ChatGPT output as JSON, attempting heuristic extraction');
    }

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      const heur = heuristicExtract(scrapedContent).map(i => ({
        name: i.name,
        ingredients: i.ingredients || [],
        price: i.price || '',
        calories: i.calories || 'N/A',
      }));
      if (heur.length > 0) {
        usedFallback = true;
        menuItems = heur;
      } else {
        console.warn('Heuristic extraction also found 0 items');
        menuItems = [];
      }
    }

    console.log(`Successfully extracted ${menuItems.length} menu items${usedFallback ? ' (heuristic fallback)' : ''}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        menuItems,
        totalItemsFound: menuItems.length,
        source: usedFallback ? 'scraply_heuristic' : 'scraply_scraping'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Scraply menu scraper error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});