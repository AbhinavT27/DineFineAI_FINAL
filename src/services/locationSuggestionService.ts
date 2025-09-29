
import { supabase } from '@/integrations/supabase/client';

export interface LocationSuggestion {
  originalText: string;
  suggestedLocation: string;
  confidence: 'high' | 'medium' | 'low';
  explanation?: string;
}

export const getLocationSuggestion = async (userInput: string): Promise<LocationSuggestion | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-location', {
      body: { userInput: userInput.trim() }
    });

    if (error) {
      console.error('Error getting location suggestion:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error calling location suggestion service:', error);
    return null;
  }
};
