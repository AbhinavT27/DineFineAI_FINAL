
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const allergenKeywords = {
  'Peanuts': ['peanut', 'peanuts', 'groundnut', 'arachis oil', 'peanut oil', 'peanut butter'],
  'Tree Nuts': ['almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'brazil nut', 'macadamia', 'pine nut'],
  'Milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey'],
  'Eggs': ['egg', 'eggs', 'albumin', 'mayonnaise', 'meringue'],
  'Fish': ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'fish sauce'],
  'Shellfish': ['shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'shellfish'],
  'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'gluten', 'semolina', 'bulgur'],
  'Soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame', 'lecithin', 'soy sauce'],
  'Vegetarian': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'bacon', 'ham'],
  'Vegan': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'dairy', 'milk', 'cheese', 'butter', 'egg', 'honey', 'gelatin'],
  'Gluten-Free': ['wheat', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'flour', 'beer'],
  'Dairy-Free': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey']
};

async function deepScrapeWebsite(url: string, searchQuery: string = ''): Promise<string[]> {
  try {
    console.log('Starting deep scrape of website:', url, 'with query:', searchQuery);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch website:', response.status);
      return [];
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc) {
      console.error('Failed to parse HTML');
      return [];
    }

    const lines: string[] = [];
    
    // Enhanced selectors for deep menu scraping
    const deepMenuSelectors = [
      // Comprehensive menu selectors
      '[class*="menu"]', '[id*="menu"]', '[data-testid*="menu"]', '[data-cy*="menu"]',
      '[class*="food"]', '[class*="dish"]', '[class*="item"]', '[class*="product"]',
      '[class*="meal"]', '[class*="course"]', '[class*="entree"]', '[class*="appetizer"]',
      '[class*="dessert"]', '[class*="beverage"]', '[class*="drink"]',
      // Price and description selectors
      '[class*="price"]', '[class*="cost"]', '[class*="dollar"]', '[class*="$"]',
      '[class*="description"]', '[class*="ingredient"]', '[class*="detail"]',
      '[class*="info"]', '[class*="about"]',
      // Category and section selectors
      '[class*="category"]', '[class*="section"]', '[class*="group"]',
      '[class*="tab"]', '[class*="header"]',
      // Common HTML elements
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'span', 'div', 'td', 'th',
      'article', 'section', 'aside',
      // Specific menu classes
      '.menu-item', '.food-item', '.dish-name', '.item-name', '.product-name',
      '.menu-section', '.category-header', '.menu-category', '.food-category',
      '.dish-description', '.item-description', '.food-description'
    ];
    
    // Extract text from all potential menu elements
    deepMenuSelectors.forEach(selector => {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 2 && text.length < 800 && 
              !text.includes('©') && !text.includes('javascript') && 
              !text.includes('function') && !text.includes('var ') &&
              !text.toLowerCase().includes('cookie') &&
              !text.toLowerCase().includes('privacy') &&
              !text.toLowerCase().includes('terms') &&
              !text.toLowerCase().includes('policy')) {
            
            const lowerText = text.toLowerCase();
            
            // Enhanced food-related keywords for better detection
            const foodKeywords = [
              'served', 'grilled', 'fried', 'roasted', 'baked', 'sauteed', 'steamed',
              'braised', 'poached', 'seared', 'marinated', 'seasoned', 'glazed',
              'with', 'and', 'sauce', 'dressing', 'topped', 'stuffed',
              'cheese', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
              'pasta', 'rice', 'noodles', 'bread', 'salad', 'soup', 'bowl',
              'appetizer', 'entree', 'main', 'dessert', 'drink', 'beverage',
              'fresh', 'organic', 'local', 'homemade', 'house', 'specialty',
              'crispy', 'tender', 'juicy', 'creamy', 'spicy', 'mild'
            ];
            
            const hasPrice = /\$\d+(\.\d{2})?/.test(text);
            const hasFoodKeyword = foodKeywords.some(keyword => lowerText.includes(keyword));
            const hasMenuCategory = /\b(appetizer|entree|main|side|dessert|drink|beverage|starter|soup|salad)\b/i.test(text);
            
            // Query-specific filtering for targeted extraction
            const matchesQuery = searchQuery ? 
              lowerText.includes(searchQuery.toLowerCase()) ||
              searchQuery.toLowerCase().split(' ').some(word => lowerText.includes(word.toLowerCase())) :
              true;
            
            if ((hasPrice || hasFoodKeyword || hasMenuCategory || lowerText.includes('menu')) && matchesQuery) {
              lines.push(text);
            }
          }
        });
      } catch (selectorError) {
        console.log('Error with selector:', selector, selectorError);
      }
    });

    console.log(`Deep scrape extracted ${lines.length} menu-related text lines from website`);
    
    // Remove duplicates and prioritize query-relevant content
    const uniqueLines = [...new Set(lines)];
    
    // If search query provided, prioritize matching content
    if (searchQuery) {
      const queryWords = searchQuery.toLowerCase().split(' ');
      const prioritized = uniqueLines.sort((a, b) => {
        const aMatches = queryWords.filter(word => a.toLowerCase().includes(word)).length;
        const bMatches = queryWords.filter(word => b.toLowerCase().includes(word)).length;
        return bMatches - aMatches;
      });
      
      return prioritized.slice(0, 1500); // Increased limit for deep scraping
    }
    
    return uniqueLines.slice(0, 1200);
    
  } catch (error) {
    console.error('Error in deep website scraping:', error);
    return [];
  }
}

function buildDeepScrapingPrompt(url: string, query: string, allergies: string[], restrictions: string[], lines: string[], querySpecific: boolean): string {
  const allRestrictions = [...allergies, ...restrictions];
  
  return `You are an advanced AI menu extraction specialist with deep scraping capabilities.

Context:
• Website: ${url}
• User query: "${query}"
• User allergies: [${allergies.join(', ')}] - CRITICAL: These are life-threatening
• User dietary restrictions: [${restrictions.join(', ')}]
• Query-specific extraction: ${querySpecific ? 'YES - Focus on query matches' : 'NO - General extraction'}

DEEP EXTRACTION OBJECTIVES:
1. ${querySpecific ? 'PRIORITIZE items matching the search query' : 'Extract ALL available menu items'}
2. Provide comprehensive ingredient analysis for allergen detection
3. Include detailed descriptions and preparation methods
4. Categorize items properly (appetizers, mains, sides, desserts, beverages)
5. Extract accurate pricing information
6. Identify dietary compatibility (vegetarian, vegan, gluten-free, etc.)

ENHANCED ALLERGEN DETECTION:
${Object.entries(allergenKeywords).map(([allergen, keywords]) => 
  `• ${allergen}: ${keywords.join(', ')}`
).join('\n')}

DEEP SCRAPING INSTRUCTIONS:
1. Process all scraped content thoroughly
2. ${querySpecific ? `Focus on items containing: "${query}" - ingredients, dish names, or descriptions` : 'Extract every identifiable menu item'}
3. Include preparation methods (grilled, fried, baked, etc.) in ingredients
4. Detect hidden allergens in sauces, batters, and cooking methods
5. Provide detailed nutritional and dietary information
6. Cross-reference ingredients with allergen database

For each item, provide:
- Complete ingredient list including preparation methods
- All potential allergens and dietary restrictions
- Accurate categorization and pricing
- Detailed descriptions when available

Output ONLY valid JSON:
[
  {
    "dish": "Complete Dish Name",
    "ingredients": ["detailed_ingredient1", "preparation_method", "sauce_component"],
    "contains_restricted": ["allergen1", "restriction1"],
    "price": "$X.XX",
    "category": "specific_category",
    "description": "complete menu description including preparation"
  }
]

Scraped content (${lines.length} items - ${querySpecific ? 'query-focused' : 'comprehensive'}):
${lines.slice(0, 1000).map(line => `- ${line}`).join('\n')}`;
}

async function storeDeepAnalysisResults(
  supabase: any,
  restaurantWebsite: string,
  restaurantName: string,
  menuItems: any[],
  scraped: boolean,
  searchQuery: string
) {
  try {
    const url = new URL(restaurantWebsite);
    const restaurantId = url.hostname.replace('www.', '');

    console.log(`Storing deep analysis for ${restaurantName} - ${menuItems.length} items (query: "${searchQuery}")`);

    // Store with query information for cache management
    const analysisData = {
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      restaurant_website: restaurantWebsite,
      menu_items: menuItems,
      scraped: scraped,
      updated_at: new Date().toISOString(),
      search_query: searchQuery || null
    };

    const { error } = await supabase
      .from('menu_analysis')
      .upsert(analysisData, {
        onConflict: 'restaurant_website'
      });

    if (error) {
      console.error('Error storing deep analysis results:', error);
    } else {
      console.log('Deep analysis results stored successfully');
    }
  } catch (error) {
    console.error('Error in storeDeepAnalysisResults:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Deep menu extraction function called');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      restaurantWebsite, 
      searchQuery, 
      allergies, 
      restrictions, 
      restaurantName, 
      deepScrape,
      querySpecific 
    } = await req.json();
    
    console.log('Processing deep menu extraction for:', restaurantName);
    console.log('Deep scrape enabled:', deepScrape);
    console.log('Query-specific extraction:', querySpecific);
    console.log('Search query:', searchQuery);

    let scrapedLines: string[] = [];
    let scraped = false;
    
    if (deepScrape) {
      scrapedLines = await deepScrapeWebsite(restaurantWebsite, searchQuery);
      scraped = scrapedLines.length > 0;
    }
    
    let prompt: string;
    
    if (scrapedLines.length > 0) {
      console.log('Using deep scraped content for analysis');
      prompt = buildDeepScrapingPrompt(
        restaurantWebsite, 
        searchQuery, 
        allergies || [], 
        restrictions || [], 
        scrapedLines,
        querySpecific || false
      );
    } else {
      console.log('Deep scraping failed, using enhanced fallback prompt');
      const itemCount = querySpecific && searchQuery ? '8-12' : '15-25';
      prompt = `You are a comprehensive menu analysis expert for ${restaurantName}.

Context:
- Restaurant: ${restaurantName}
- User query: ${searchQuery || 'general menu'}
- User allergies: ${allergies ? allergies.join(', ') : 'none'} - CRITICAL for safety
- User restrictions: ${restrictions ? restrictions.join(', ') : 'none'}

${querySpecific ? 
  `Generate ${itemCount} items that would match "${searchQuery}" at this restaurant type.` :
  `Generate a comprehensive menu with ${itemCount} items from all categories.`
}

Include detailed ingredient analysis and accurate allergen detection.

Output format (JSON only):
[
  {
    "dish": "Dish Name",
    "ingredients": ["ingredient1", "ingredient2"],
    "contains_restricted": ["restricted ingredient"],
    "price": "$X.XX (estimated)",
    "category": "category_name",
    "description": "detailed description"
  }
]`;
    }

    console.log('Calling OpenAI GPT-4o for deep menu analysis');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a deep menu extraction and food safety expert. Always respond with valid JSON only. Be extremely thorough in allergen detection and ingredient analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 5000 // Increased for deep analysis
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI deep analysis response received');

    let menuItems = [];
    try {
      const content = data.choices[0].message.content;
      console.log('GPT-4o deep analysis response content length:', content.length);
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        menuItems = JSON.parse(jsonMatch[0]);
        console.log('Parsed deep menu items:', menuItems.length);
      } else {
        console.log('No valid JSON found in response, returning empty array');
        menuItems = [];
      }
    } catch (parseError) {
      console.error('Error parsing deep menu items:', parseError);
      menuItems = [];
    }

    await storeDeepAnalysisResults(supabaseService, restaurantWebsite, restaurantName, menuItems, scraped, searchQuery);

    const categories = [...new Set(menuItems.map((item: any) => item.category).filter(Boolean))];

    return new Response(JSON.stringify({ 
      menuItems,
      status: 'success',
      scraped: scraped,
      totalItemsFound: menuItems.length,
      categoriesFound: categories,
      deepScrape: true,
      querySpecific: querySpecific || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in deep extract-menu-items function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      menuItems: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
