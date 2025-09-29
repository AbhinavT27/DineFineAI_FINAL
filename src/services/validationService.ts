
import { supabase } from '@/integrations/supabase/client';

export interface SearchValidationResult {
  isValid: boolean;
  originalInput: string;
  validatedInput?: string;
}

export interface LocationValidationResult {
  isCorrect: boolean;
  originalInput: string;
  suggestion?: string;
  correctedLocation?: string;
  isInvalid?: boolean;
}

export const validateSearchInput = async (userInput: string): Promise<SearchValidationResult> => {
  try {
    console.log('Validating search input:', userInput);
    
    // Much more comprehensive local check for food-related terms - be very permissive
    const foodKeywords = [
      // Basic food terms
      'restaurant', 'food', 'eat', 'dining', 'cuisine', 'meal', 'lunch', 'dinner', 'breakfast', 'brunch',
      
      // Cuisine types
      'italian', 'chinese', 'japanese', 'mexican', 'indian', 'thai', 'french', 'american', 'korean',
      'vietnamese', 'greek', 'mediterranean', 'lebanese', 'ethiopian', 'moroccan', 'spanish', 'german',
      
      // Specific foods
      'pizza', 'burger', 'sushi', 'pasta', 'noodle', 'steak', 'seafood', 'vegetarian', 'vegan',
      'chicken', 'beef', 'pork', 'fish', 'rice', 'bread', 'sandwich', 'salad', 'soup', 'wings',
      'tacos', 'burritos', 'quesadilla', 'enchilada', 'nachos', 'fries', 'chips', 'hot dog',
      
      // Restaurant types
      'cafe', 'bistro', 'grill', 'bar', 'pub', 'diner', 'buffet', 'takeout', 'delivery', 'fast food',
      'bakery', 'pizzeria', 'steakhouse', 'seafood', 'sushi bar', 'food truck', 'gastropub',
      
      // Descriptive terms
      'hungry', 'craving', 'taste', 'flavor', 'spicy', 'sweet', 'savory', 'delicious', 'fresh',
      'organic', 'local', 'authentic', 'traditional', 'gourmet', 'casual', 'fine dining',
      
      // Beverages and desserts
      'ice cream', 'gelato', 'frozen yogurt', 'coffee', 'tea', 'smoothie', 'juice', 'cocktail',
      'beer', 'wine', 'dessert', 'cake', 'pie', 'cookie', 'donut', 'pastry', 'bakery',
      
      // Cooking methods
      'fried', 'grilled', 'roasted', 'steamed', 'baked', 'boiled', 'sauteed', 'barbecue', 'bbq',
      
      // Dietary preferences
      'halal', 'kosher', 'gluten free', 'gluten-free', 'dairy free', 'nut free', 'keto', 'paleo',
      
      // Common food combinations/phrases
      'near me', 'open now', 'cheap eats', 'best', 'good', 'recommendations', 'reviews',
      
      // Single letter searches or very short terms (likely food-related)
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'
    ];
    
    const lowerInput = userInput.toLowerCase().trim();
    
    // If input is very short (3 characters or less), assume it's food-related
    if (lowerInput.length <= 3) {
      console.log('Input is very short, assuming food-related and allowing');
      return { 
        isValid: true, 
        originalInput: userInput, 
        validatedInput: userInput 
      };
    }
    
    // Check if any food keyword is contained in the input
    const isObviouslyFoodRelated = foodKeywords.some(keyword => 
      lowerInput.includes(keyword.toLowerCase())
    );
    
    // If it's obviously food-related, skip the API call and return as valid
    if (isObviouslyFoodRelated) {
      console.log('Input contains food-related keywords, skipping API validation');
      return { 
        isValid: true, 
        originalInput: userInput, 
        validatedInput: userInput 
      };
    }
    
    // Only call the API for truly ambiguous cases, and even then be permissive
    console.log('Input is ambiguous, calling validation API but being permissive');
    const { data, error } = await supabase.functions.invoke('validate-search-input', {
      body: { userInput: userInput.trim() }
    });

    if (error) {
      console.error('Search validation error:', error);
      // Be very permissive if validation fails - assume it's valid
      return { isValid: true, originalInput: userInput, validatedInput: userInput };
    }

    console.log('Search validation result:', data);
    
    // Even if API says invalid, be more permissive for short queries
    if (!data.isValid && userInput.length <= 10) {
      console.log('API said invalid but query is short, allowing anyway');
      return { isValid: true, originalInput: userInput, validatedInput: userInput };
    }
    
    return data;
  } catch (error) {
    console.error('Error in search validation service:', error);
    // Be very permissive if validation fails - assume it's valid
    return { isValid: true, originalInput: userInput, validatedInput: userInput };
  }
};

export const validateLocationInput = async (userLocation: string): Promise<LocationValidationResult> => {
  try {
    console.log('Validating location input:', userLocation);
    
    const { data, error } = await supabase.functions.invoke('validate-location-input', {
      body: { userLocation: userLocation.trim() }
    });

    if (error) {
      console.error('Location validation error:', error);
      // Return as correct if validation fails (graceful fallback)
      return { isCorrect: true, originalInput: userLocation };
    }

    console.log('Location validation result:', data);
    return data;
  } catch (error) {
    console.error('Error in location validation service:', error);
    // Return as correct if validation fails (graceful fallback)
    return { isCorrect: true, originalInput: userLocation };
  }
};
