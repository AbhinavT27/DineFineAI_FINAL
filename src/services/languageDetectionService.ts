import { supabase } from '@/integrations/supabase/client';

export interface LanguageDetectionResult {
  originalText: string;
  detectedLanguage: string;
  translatedText: string;
  confidence: 'high' | 'medium' | 'low';
  extractedDietaryInfo: {
    preferences?: string[];
    allergies?: string[];
    cuisineType?: string;
    foodItems?: string[];
  };
  searchIntent: string;
}

export const detectAndTranslateSearchQuery = async (userInput: string): Promise<LanguageDetectionResult> => {
  try {
    console.log('Detecting language and translating:', userInput);
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in to use language detection');
    }

    // Call the language detection edge function
    const { data, error } = await supabase.functions.invoke('detect-and-translate', {
      body: { userInput },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Language detection error:', error);
      // Return fallback result if detection fails
      return {
        originalText: userInput,
        detectedLanguage: 'en',
        translatedText: userInput,
        confidence: 'low',
        extractedDietaryInfo: {},
        searchIntent: userInput
      };
    }

    console.log('Language detection result:', data);
    return data;
  } catch (error) {
    console.error('Error in language detection service:', error);
    // Return fallback result if service fails
    return {
      originalText: userInput,
      detectedLanguage: 'en',
      translatedText: userInput,
      confidence: 'low',
      extractedDietaryInfo: {},
      searchIntent: userInput
    };
  }
};