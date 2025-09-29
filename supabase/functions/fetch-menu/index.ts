import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MenuItemData {
  dish: string;
  ingredients: string[];
  contains_restricted: string[];
  price?: string;
  category?: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Scraping menu from URL:', url);

    // Use Zyte API for web scraping
    const zyte_api_key = Deno.env.get('ZYTE_API_KEY');
    
    if (!zyte_api_key) {
      console.error('ZYTE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Web scraping service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Zyte API request
    const zyte_response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(zyte_api_key + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        extract: {
          product: {
            name: true,
            price: true,
            description: true,
            mainImage: true
          },
          article: {
            headline: true,
            text: true
          }
        },
        extractOptions: {
          product: {
            extract_from: 'menu'
          }
        }
      })
    });

    if (!zyte_response.ok) {
      console.error('Zyte API error:', zyte_response.status, zyte_response.statusText);
      
      // Fallback to simple HTML parsing
      const html_response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!html_response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch website content' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const html = await html_response.text();
      const menuItems = parseMenuFromHtml(html);
      
      return new Response(
        JSON.stringify({
          menuItems,
          status: 'success',
          scraped: true,
          source: 'html_fallback'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const zyte_data = await zyte_response.json();
    console.log('Zyte API response:', JSON.stringify(zyte_data, null, 2));

    // Parse Zyte response into menu items
    const menuItems: MenuItemData[] = [];
    
    if (zyte_data.product && Array.isArray(zyte_data.product)) {
      zyte_data.product.forEach((item: any) => {
        if (item.name) {
          const menuItem: MenuItemData = {
            dish: item.name,
            price: item.price || 'N/A',
            description: item.description || '',
            ingredients: extractIngredients(item.description || ''),
            contains_restricted: []
          };
          menuItems.push(menuItem);
        }
      });
    }

    // If no products found, try parsing from article text
    if (menuItems.length === 0 && zyte_data.article) {
      const text = zyte_data.article.text || '';
      const parsedItems = parseMenuFromText(text);
      menuItems.push(...parsedItems);
    }

    console.log(`Extracted ${menuItems.length} menu items`);

    return new Response(
      JSON.stringify({
        menuItems,
        status: 'success',
        scraped: true,
        totalItemsFound: menuItems.length,
        source: 'zyte_api'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-menu function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function parseMenuFromHtml(html: string): MenuItemData[] {
  const menuItems: MenuItemData[] = [];
  
  // Simple regex patterns to extract menu items from HTML
  const patterns = [
    // Pattern for items with prices like "Pizza Margherita - $12.99"
    /([A-Z][^$-]*?)\s*[-–—]\s*\$?([0-9]+\.?[0-9]*)/gi,
    // Pattern for items in list format
    /<(?:li|div|p)[^>]*>([^<$]*(?:pizza|burger|sandwich|salad|pasta|chicken|beef|fish)[^<$]*?)(?:\s*\$([0-9]+\.?[0-9]*))?<\/(?:li|div|p)>/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const dish = match[1].trim().replace(/[^\w\s'-]/g, '');
      const price = match[2] ? `$${match[2]}` : 'N/A';
      
      if (dish.length > 3 && dish.length < 100) {
        menuItems.push({
          dish,
          price,
          ingredients: extractIngredients(dish),
          contains_restricted: []
        });
      }
    }
  });

  return menuItems.slice(0, 20); // Limit to 20 items
}

function parseMenuFromText(text: string): MenuItemData[] {
  const menuItems: MenuItemData[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for lines that might be menu items
    if (line.length > 10 && line.length < 200) {
      const priceMatch = line.match(/\$([0-9]+\.?[0-9]*)/);
      const price = priceMatch ? priceMatch[0] : 'N/A';
      
      // Remove price from dish name
      const dish = line.replace(/\$[0-9]+\.?[0-9]*/, '').trim();
      
      if (dish.length > 3) {
        menuItems.push({
          dish,
          price,
          ingredients: extractIngredients(dish),
          contains_restricted: []
        });
      }
    }
  }
  
  return menuItems.slice(0, 20); // Limit to 20 items
}

function extractIngredients(text: string): string[] {
  const commonIngredients = [
    'cheese', 'tomato', 'lettuce', 'onion', 'garlic', 'basil', 'oregano',
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon', 'tuna',
    'pasta', 'rice', 'bread', 'flour', 'egg', 'eggs', 'milk', 'cream',
    'mushrooms', 'peppers', 'spinach', 'arugula', 'cucumber', 'avocado',
    'olive oil', 'butter', 'parmesan', 'mozzarella', 'cheddar',
    'bacon', 'ham', 'sausage', 'pepperoni', 'salami'
  ];
  
  const ingredients: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const ingredient of commonIngredients) {
    if (lowerText.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }
  
  // If no specific ingredients found, try to extract from common patterns
  if (ingredients.length === 0) {
    const words = text.toLowerCase().split(/[\s,]+/);
    for (const word of words) {
      if (word.length > 3 && word.match(/^[a-z]+$/)) {
        ingredients.push(word);
      }
    }
  }
  
  return ingredients.slice(0, 10); // Limit to 10 ingredients
}