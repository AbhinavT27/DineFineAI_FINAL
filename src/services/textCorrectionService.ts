
import { supabase } from '@/integrations/supabase/client';

export const correctSearchText = async (userInput: string): Promise<{ originalText: string; correctedText: string }> => {
  try {
    console.log('Correcting user input:', userInput);
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in to use text correction');
    }

    // Call the text correction edge function
    const { data, error } = await supabase.functions.invoke('correct-search-text', {
      body: { userInput },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Text correction error:', error);
      // Return original text if correction fails
      return { originalText: userInput, correctedText: userInput };
    }

    console.log('Text correction result:', data);
    return data;
  } catch (error) {
    console.error('Error in text correction service:', error);
    // Return original text if correction fails
    return { originalText: userInput, correctedText: userInput };
  }
};
