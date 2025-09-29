import { supabase } from '@/integrations/supabase/client';

export const getLocationSuggestions = async (userInput: string): Promise<string[]> => {
  try {
    if (!userInput || userInput.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase.functions.invoke('autocomplete-locations', {
      body: { userInput: userInput.trim() }
    });

    if (error) {
      console.error('Error getting location suggestions:', error);
      return [];
    }

    return data?.suggestions || [];
  } catch (error) {
    console.error('Error calling location autocomplete service:', error);
    return [];
  }
};