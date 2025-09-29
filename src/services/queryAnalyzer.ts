
import { supabase } from '@/integrations/supabase/client';
import { detectAndTranslateSearchQuery } from './languageDetectionService';

export interface QueryAnalysisResult {
  isRestaurantRelated: boolean;
  intent: 'search_restaurants' | 'find_cuisine' | 'dietary_request' | 'location_based' | 'general_food' | 'specific_item' | 'not_food_related';
  extractedPreferences: {
    cuisineType?: string;
    dietaryRestrictions?: string[];
    allergies?: string[];
    priceRange?: '$' | '$$' | '$$$' | '$$$$';
    location?: string;
    searchQuery?: string;
    specificFoodItem?: string;
    establishmentType?: string;
  };
  confidence: number;
  suggestedSearch?: string;
  displayCategory?: string;
  googlePlacesType?: string;
}

export const analyzeSearchQuery = async (query: string): Promise<QueryAnalysisResult> => {
  console.log('Analyzing search query with enhanced logic:', query);
  
  try {
    // First, detect language and translate if needed
    const translationResult = await detectAndTranslateSearchQuery(query);
    console.log('Translation result:', translationResult);
    
    // Use the translated text for analysis if different language was detected
    const queryToAnalyze = translationResult.detectedLanguage !== 'en' ? 
      translationResult.translatedText : query;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in to analyze search queries');
    }

    const { data, error } = await supabase.functions.invoke('analyze-search-query', {
      body: { query: queryToAnalyze },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Error calling query analysis function:', error);
      return enhancedFallbackAnalysis(query, translationResult);
    }

    console.log('OpenAI query analysis result:', data);
    return enhanceAnalysisResult(data, query, translationResult);
  } catch (error) {
    console.error('Error in query analysis:', error);
    return enhancedFallbackAnalysis(query);
  }
};

interface FoodCategoryConfig {
  type: string;
  category: string;
  cuisine?: string;
  item?: string;
}

const enhancedFallbackAnalysis = (query: string, translationResult?: any): QueryAnalysisResult => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Enhanced food keyword matching with consistent structure
  const foodCategories: Record<string, FoodCategoryConfig> = {
    // Ice cream variations
    'ice cream': { type: 'store', category: 'Ice Cream Shops', item: 'ice cream' },
    'icecream': { type: 'store', category: 'Ice Cream Shops', item: 'ice cream' },
    'gelato': { type: 'store', category: 'Ice Cream Shops', item: 'gelato' },
    'frozen yogurt': { type: 'store', category: 'Frozen Yogurt Shops', item: 'frozen yogurt' },
    
    // Coffee variations
    'coffee': { type: 'cafe', category: 'Coffee Shops', item: 'coffee' },
    'cafe': { type: 'cafe', category: 'Coffee Shops', item: 'coffee' },
    'starbucks': { type: 'cafe', category: 'Coffee Shops', item: 'coffee' },
    
    // Specific foods that should find restaurants
    'pizza': { type: 'restaurant', category: 'Pizza Places', cuisine: 'Italian', item: 'pizza' },
    'taco': { type: 'restaurant', category: 'Taco Places', cuisine: 'Mexican', item: 'tacos' },
    'tacos': { type: 'restaurant', category: 'Taco Places', cuisine: 'Mexican', item: 'tacos' },
    'burger': { type: 'restaurant', category: 'Burger Places', item: 'burgers' },
    'burgers': { type: 'restaurant', category: 'Burger Places', item: 'burgers' },
    'sushi': { type: 'restaurant', category: 'Sushi Restaurants', cuisine: 'Japanese', item: 'sushi' },
    'sandwich': { type: 'restaurant', category: 'Sandwich Shops', item: 'sandwiches' },
    'sandwiches': { type: 'restaurant', category: 'Sandwich Shops', item: 'sandwiches' },
    'donuts': { type: 'bakery', category: 'Donut Shops', item: 'donuts' },
    'donut': { type: 'bakery', category: 'Donut Shops', item: 'donuts' },
    'doughnuts': { type: 'bakery', category: 'Donut Shops', item: 'donuts' },
    'doughnut': { type: 'bakery', category: 'Donut Shops', item: 'donuts' },
    'burrito': { type: 'restaurant', category: 'Mexican Restaurants', cuisine: 'Mexican', item: 'burritos' },
    'burritos': { type: 'restaurant', category: 'Mexican Restaurants', cuisine: 'Mexican', item: 'burritos' },
    'pasta': { type: 'restaurant', category: 'Italian Restaurants', cuisine: 'Italian', item: 'pasta' },
    'ramen': { type: 'restaurant', category: 'Ramen Shops', cuisine: 'Japanese', item: 'ramen' },
    'pho': { type: 'restaurant', category: 'Vietnamese Restaurants', cuisine: 'Vietnamese', item: 'pho' },
    'curry': { type: 'restaurant', category: 'Indian Restaurants', cuisine: 'Indian', item: 'curry' },
    'wings': { type: 'restaurant', category: 'Wings Places', item: 'wings' },
    'chicken wings': { type: 'restaurant', category: 'Wings Places', item: 'wings' },
    'bbq': { type: 'restaurant', category: 'BBQ Restaurants', item: 'barbecue' },
    'barbecue': { type: 'restaurant', category: 'BBQ Restaurants', item: 'barbecue' },
    'steak': { type: 'restaurant', category: 'Steakhouses', item: 'steak' },
    'seafood': { type: 'restaurant', category: 'Seafood Restaurants', item: 'seafood' },
    'salad': { type: 'restaurant', category: 'Salad Places', item: 'salads' },
    'salads': { type: 'restaurant', category: 'Salad Places', item: 'salads' },
    'smoothie': { type: 'store', category: 'Smoothie Bars', item: 'smoothies' },
    'smoothies': { type: 'store', category: 'Smoothie Bars', item: 'smoothies' },
    'juice': { type: 'store', category: 'Juice Bars', item: 'juice' },
    'breakfast': { type: 'restaurant', category: 'Breakfast Places', item: 'breakfast' },
    'brunch': { type: 'restaurant', category: 'Brunch Places', item: 'brunch' },
    'pancakes': { type: 'restaurant', category: 'Breakfast Places', item: 'pancakes' },
    'waffles': { type: 'restaurant', category: 'Breakfast Places', item: 'waffles' },
    'fried chicken': { type: 'restaurant', category: 'Fried Chicken Places', item: 'fried chicken' },
    'hot dog': { type: 'restaurant', category: 'Hot Dog Stands', item: 'hot dogs' },
    'hot dogs': { type: 'restaurant', category: 'Hot Dog Stands', item: 'hot dogs' },
    'bagel': { type: 'bakery', category: 'Bagel Shops', item: 'bagels' },
    'bagels': { type: 'bakery', category: 'Bagel Shops', item: 'bagels' },
    'croissant': { type: 'bakery', category: 'Bakeries', cuisine: 'French', item: 'croissants' },
    'pastry': { type: 'bakery', category: 'Bakeries', item: 'pastries' },
    'pastries': { type: 'bakery', category: 'Bakeries', item: 'pastries' },
    
    // Cuisines
    'italian': { type: 'restaurant', category: 'Italian Restaurants', cuisine: 'Italian' },
    'chinese': { type: 'restaurant', category: 'Chinese Restaurants', cuisine: 'Chinese' },
    'mexican': { type: 'restaurant', category: 'Mexican Restaurants', cuisine: 'Mexican' },
    'indian': { type: 'restaurant', category: 'Indian Restaurants', cuisine: 'Indian' },
    'japanese': { type: 'restaurant', category: 'Japanese Restaurants', cuisine: 'Japanese' },
    'thai': { type: 'restaurant', category: 'Thai Restaurants', cuisine: 'Thai' },
    'american': { type: 'restaurant', category: 'American Restaurants', cuisine: 'American' },
    'mediterranean': { type: 'restaurant', category: 'Mediterranean Restaurants', cuisine: 'Mediterranean' },
    'french': { type: 'restaurant', category: 'French Restaurants', cuisine: 'French' },
    'korean': { type: 'restaurant', category: 'Korean Restaurants', cuisine: 'Korean' },
    'vietnamese': { type: 'restaurant', category: 'Vietnamese Restaurants', cuisine: 'Vietnamese' },
    'greek': { type: 'restaurant', category: 'Greek Restaurants', cuisine: 'Greek' },
    'middle eastern': { type: 'restaurant', category: 'Middle Eastern Restaurants', cuisine: 'Middle Eastern' },
    'ethiopian': { type: 'restaurant', category: 'Ethiopian Restaurants', cuisine: 'Ethiopian' },
    'lebanese': { type: 'restaurant', category: 'Lebanese Restaurants', cuisine: 'Lebanese' },
    
    // Establishment types
    'bakery': { type: 'bakery', category: 'Bakeries', item: 'baked goods' },
    'bakeries': { type: 'bakery', category: 'Bakeries', item: 'baked goods' },
    'bar': { type: 'bar', category: 'Bars & Pubs' },
    'bars': { type: 'bar', category: 'Bars & Pubs' },
    'pub': { type: 'bar', category: 'Bars & Pubs' },
    'pubs': { type: 'bar', category: 'Bars & Pubs' },
    'buffet': { type: 'restaurant', category: 'Buffet Restaurants' },
    'diner': { type: 'restaurant', category: 'Diners' },
    'bistro': { type: 'restaurant', category: 'Bistros' },
    'grill': { type: 'restaurant', category: 'Grills' }
  };

  // Check for exact matches and partial matches
  for (const [keyword, config] of Object.entries(foodCategories)) {
    if (lowerQuery === keyword || lowerQuery.includes(keyword)) {
      const extractedPreferences: any = {
        searchQuery: lowerQuery
      };
      
      if (config.cuisine) extractedPreferences.cuisineType = config.cuisine;
      if (config.item) extractedPreferences.specificFoodItem = config.item;
      
      return {
        isRestaurantRelated: true,
        intent: config.cuisine ? 'find_cuisine' : 'specific_item',
        extractedPreferences,
        confidence: 0.9,
        suggestedSearch: keyword,
        displayCategory: config.category,
        googlePlacesType: config.type
      };
    }
  }

  // Generic food keywords - be more inclusive
  const genericFoodKeywords = [
    'restaurant', 'restaurants', 'food', 'eat', 'eating', 'dining', 'cuisine', 'meal', 'meals',
    'lunch', 'dinner', 'breakfast', 'hungry', 'craving', 'crave', 'taste', 'tasty', 'delicious',
    'spicy', 'sweet', 'savory', 'fresh', '5pm', '6pm', '7pm', '8pm', 'tonight', 'today',
    'takeout', 'delivery', 'dine in', 'order', 'menu', 'dish', 'plate', 'serve', 'serving'
  ];

  const isRestaurantRelated = genericFoodKeywords.some(keyword => lowerQuery.includes(keyword));
  
  if (!isRestaurantRelated) {
    return {
      isRestaurantRelated: false,
      intent: 'not_food_related',
      extractedPreferences: {},
      confidence: 0.8,
      displayCategory: 'Not Food Related'
    };
  }

  return {
    isRestaurantRelated: true,
    intent: 'search_restaurants',
    extractedPreferences: { searchQuery: lowerQuery },
    confidence: 0.6,
    suggestedSearch: lowerQuery,
    displayCategory: 'Restaurants',
    googlePlacesType: 'restaurant'
  };
};

const enhanceAnalysisResult = (data: any, originalQuery: string, translationResult?: any): QueryAnalysisResult => {
  // Use the OpenAI analysis but ensure we have proper fallback values
  const baseResult = {
    isRestaurantRelated: data.isRestaurantRelated ?? true,
    intent: data.intent ?? 'search_restaurants',
    extractedPreferences: data.extractedPreferences ?? { searchQuery: originalQuery },
    confidence: data.confidence ?? 0.7,
    suggestedSearch: data.suggestedSearch ?? originalQuery,
    displayCategory: data.displayCategory ?? 'Restaurants',
    googlePlacesType: data.googlePlacesType ?? 'restaurant'
  };

  // Enhance with translation data if available
  if (translationResult && translationResult.extractedDietaryInfo) {
    const dietaryInfo = translationResult.extractedDietaryInfo;
    if (dietaryInfo.preferences) {
      baseResult.extractedPreferences.dietaryRestrictions = dietaryInfo.preferences;
    }
    if (dietaryInfo.allergies) {
      baseResult.extractedPreferences.allergies = dietaryInfo.allergies;
    }
    if (dietaryInfo.cuisineType) {
      baseResult.extractedPreferences.cuisineType = dietaryInfo.cuisineType;
    }
    if (dietaryInfo.foodItems && dietaryInfo.foodItems.length > 0) {
      baseResult.extractedPreferences.specificFoodItem = dietaryInfo.foodItems[0];
    }
  }

  return baseResult;
};
