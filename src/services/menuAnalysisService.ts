
import { supabase } from '@/integrations/supabase/client';

export interface MenuAnalysisResult {
  dish: string;
  ingredients: string[];
  contains_restricted?: string[];
}

export const analyzeRestaurantMenu = async (
  restaurantWebsite: string,
  searchQuery: string,
  allergies: string[],
  dietaryRestrictions: string[]
): Promise<MenuAnalysisResult[]> => {
  try {
    console.log('Analyzing menu for:', restaurantWebsite);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to analyze menu');
    }

    const { data, error } = await supabase.functions.invoke('analyze-menu-items', {
      body: {
        restaurantWebsite,
        searchQuery,
        allergies,
        dietaryRestrictions
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Error analyzing menu:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in menu analysis:', error);
    return [];
  }
};
