
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemData {
  dish: string;
  ingredients: string[];
  contains_restricted: string[];
  price?: string;
  category?: string;
  description?: string;
}

export interface MenuExtractionResponse {
  menuItems: MenuItemData[];
  status: string;
  scraped?: boolean;
  totalItemsFound?: number;
  categoriesFound?: string[];
}

const isMenuItemDataArray = (data: any): data is MenuItemData[] => {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.dish === 'string' &&
    Array.isArray(item.ingredients)
  );
};

export const scrapeRestaurantMenu = async (url: string): Promise<any> => {
  try {
    console.log('Scraping restaurant menu for URL:', url);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('User not authenticated for menu scraping');
      return { error: 'Authentication required' };
    }

    const response = await fetch("https://tijsqfupxdyowiticatq.supabase.co/functions/v1/fetch-menu", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();
    console.log('Menu scraping result:', result);
    
    return result;
  } catch (error) {
    console.error('Error scraping restaurant menu:', error);
    return { error: 'Failed to scrape menu' };
  }
};

export const extractMenuItems = async (
  restaurantWebsite: string,
  searchQuery: string,
  allergies: string[],
  restrictions: string[],
  restaurantName: string
): Promise<MenuItemData[] | MenuExtractionResponse> => {
  try {
    console.log('Extracting menu items for:', restaurantName);
    console.log('Website URL:', restaurantWebsite);
    console.log('Search query:', searchQuery);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('User not authenticated for menu extraction');
      return [];
    }

    // Check if we already have cached analysis data
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('menu_analysis')
      .select('*')
      .eq('restaurant_website', restaurantWebsite)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing analysis:', fetchError);
    }

    // Create a cache key that includes the search query for query-specific caching
    const cacheKey = `${restaurantWebsite}:${searchQuery}`;
    
    // Check if cached data is recent (less than 7 days old) and comprehensive
    let shouldRescrape = true;
    if (existingAnalysis && existingAnalysis.menu_items) {
      const analysisAge = new Date().getTime() - new Date(existingAnalysis.updated_at).getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      const cachedMenuItems = existingAnalysis.menu_items as unknown;
      
      // Use cache if less than 7 days old and has good data
      if (isMenuItemDataArray(cachedMenuItems) && analysisAge < sevenDaysInMs && cachedMenuItems.length >= 3) {
        console.log('Found recent menu analysis, checking if query-specific re-scrape needed');
        
        // If search query is different or more specific, trigger re-scrape for better results
        if (searchQuery && searchQuery.trim() && searchQuery.length > 3) {
          console.log('Specific search query detected, performing targeted deep scrape');
          shouldRescrape = true;
        } else {
          // Use cached data for general queries
          let filteredItems = cachedMenuItems;
          
          if (searchQuery && searchQuery.trim()) {
            const lowerSearchQuery = searchQuery.toLowerCase();
            filteredItems = cachedMenuItems.filter(item =>
              item.dish.toLowerCase().includes(lowerSearchQuery) ||
              item.ingredients.some(ingredient => 
                ingredient.toLowerCase().includes(lowerSearchQuery)
              ) ||
              (item.category && item.category.toLowerCase().includes(lowerSearchQuery))
            );
            
            console.log(`Filtered ${filteredItems.length} items from ${cachedMenuItems.length} cached items`);
          }
          
          return {
            menuItems: filteredItems,
            status: 'success',
            scraped: false,
            totalItemsFound: cachedMenuItems.length,
            categoriesFound: [...new Set(cachedMenuItems.map(item => item.category).filter(Boolean))]
          };
        }
      }
    }

    console.log('Performing deep menu extraction with query-specific targeting');

    const allRestrictions = [...(allergies || []), ...(restrictions || [])];

    const { data, error } = await supabase.functions.invoke('extract-menu-items', {
      body: {
        restaurantWebsite,
        searchQuery: searchQuery || '',
        allergies: allergies || [],
        restrictions: allRestrictions,
        restaurantName,
        comprehensiveScrape: true,
        deepScrape: true, // Enable deep scraping mode
        querySpecific: searchQuery && searchQuery.trim().length > 0 // Flag for query-specific extraction
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Menu extraction error:', error);
      return [];
    }

    console.log('Deep menu extraction result:', data);
    
    if (data && typeof data === 'object' && data.menuItems) {
      let filteredItems = data.menuItems;
      
      // Apply search query filtering if specified
      if (searchQuery && searchQuery.trim() && Array.isArray(data.menuItems)) {
        const lowerSearchQuery = searchQuery.toLowerCase();
        filteredItems = data.menuItems.filter(item =>
          item.dish && (
            item.dish.toLowerCase().includes(lowerSearchQuery) ||
            (item.ingredients && item.ingredients.some(ingredient => 
              ingredient.toLowerCase().includes(lowerSearchQuery)
            )) ||
            (item.category && item.category.toLowerCase().includes(lowerSearchQuery)) ||
            (item.description && item.description.toLowerCase().includes(lowerSearchQuery))
          )
        );
        
        console.log(`Deep scrape: Filtered ${filteredItems.length} items from ${data.menuItems.length} extracted items`);
      }
      
      return {
        ...data,
        menuItems: filteredItems
      } as MenuExtractionResponse;
    }
    
    return data?.menuItems || [];
  } catch (error) {
    console.error('Error in menu extraction service:', error);
    return [];
  }
};
