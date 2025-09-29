
import { Restaurant } from '@/lib/types';

export interface AllergenScanResult {
  isSafe: boolean;
  allergenWarnings: string[];
  dietaryWarnings: string[];
  safeOptions: string[];
  riskLevel: 'safe' | 'caution' | 'danger';
  hasSafeMenuItems: boolean;
}

// Enhanced allergen keywords mapping with more comprehensive coverage
const allergenKeywords: Record<string, string[]> = {
  'Peanuts': ['peanut', 'peanuts', 'groundnut', 'arachis oil', 'peanut oil', 'peanut butter', 'ground nuts'],
  'Tree Nuts': ['almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'brazil nut', 'brazil nuts', 'macadamia', 'macadamias', 'pine nut', 'pine nuts', 'tree nuts', 'tree nut', 'nut oil'],
  'Milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'lactose', 'casein', 'whey', 'condensed milk', 'evaporated milk', 'buttermilk', 'sour cream'],
  'Eggs': ['egg', 'eggs', 'albumin', 'mayonnaise', 'mayo', 'meringue', 'egg white', 'egg yolk', 'whole egg'],
  'Fish': ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'anchovies', 'sardine', 'sardines', 'mackerel', 'halibut', 'sea bass', 'fish sauce'],
  'Shellfish': ['shrimp', 'shrimps', 'crab', 'lobster', 'oyster', 'oysters', 'mussel', 'mussels', 'clam', 'clams', 'scallop', 'scallops', 'shellfish', 'prawns', 'crayfish'],
  'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'gluten', 'semolina', 'bulgur', 'wheat flour', 'whole wheat', 'wheat starch', 'wheat protein'],
  'Soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame', 'lecithin', 'soy sauce', 'soy protein', 'soybean', 'soybeans', 'soy milk']
};

// Enhanced dietary restriction keywords
const dietaryKeywords: Record<string, string[]> = {
  'Vegetarian': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'gelatin', 'animal fat', 'lard', 'bacon', 'ham', 'sausage', 'turkey', 'duck'],
  'Vegan': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'dairy', 'milk', 'cheese', 'butter', 'egg', 'eggs', 'honey', 'gelatin', 'animal fat', 'lard', 'bacon', 'ham', 'sausage', 'turkey', 'duck', 'cream', 'yogurt'],
  'Gluten-Free': ['wheat', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'flour', 'beer', 'wheat flour', 'whole wheat', 'semolina', 'bulgur', 'malt', 'brewer\'s yeast'],
  'Halal': ['pork', 'ham', 'bacon', 'alcohol', 'wine', 'beer', 'lard', 'gelatin', 'pork fat'],
  'Kosher': ['pork', 'ham', 'bacon', 'shellfish', 'mixing dairy and meat', 'lard', 'pork fat'],
  'Dairy-Free': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'lactose', 'casein', 'whey', 'condensed milk', 'evaporated milk', 'buttermilk', 'sour cream'],
  'Nut-Free': ['peanut', 'peanuts', 'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'brazil nut', 'brazil nuts', 'macadamia', 'macadamias', 'pine nut', 'pine nuts', 'tree nuts', 'tree nut', 'nut oil']
};

// Function to normalize and clean text for better matching
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

// Function to check if a keyword matches in text with word boundaries
const hasKeywordMatch = (text: string, keyword: string): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  
  // Check for exact word matches
  const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
  return wordBoundaryRegex.test(normalizedText);
};

export const scanRestaurantForAllergens = (
  restaurant: Restaurant,
  userAllergies: string[],
  userDietaryRestrictions: string[]
): AllergenScanResult => {
  const allergenWarnings: string[] = [];
  const dietaryWarnings: string[] = [];
  const safeOptions: string[] = [];

  // IMPORTANT: Only scan if user actually has allergies or restrictions
  if (!userAllergies || userAllergies.length === 0) {
    userAllergies = [];
  }
  if (!userDietaryRestrictions || userDietaryRestrictions.length === 0) {
    userDietaryRestrictions = [];
  }

  // If user has no restrictions, mark as safe
  if (userAllergies.length === 0 && userDietaryRestrictions.length === 0) {
    return {
      isSafe: true,
      allergenWarnings: [],
      dietaryWarnings: [],
      safeOptions: ['No dietary restrictions specified'],
      riskLevel: 'safe',
      hasSafeMenuItems: true
    };
  }

  // Combine all text fields to scan
  const textToScan = [
    restaurant.cuisineType,
    ...(restaurant.allergyInfo || []),
    ...(restaurant.dietaryOptions || []),
    ...(restaurant.pros || []),
    ...(restaurant.cons || [])
  ].join(' ');

  // Check for allergen conflicts ONLY if user has specified allergies
  userAllergies.forEach(allergy => {
    const keywords = allergenKeywords[allergy] || [allergy.toLowerCase()];
    const foundKeywords = keywords.filter(keyword => 
      hasKeywordMatch(textToScan, keyword)
    );
    
    if (foundKeywords.length > 0) {
      allergenWarnings.push(`Contains ${allergy.toLowerCase()}: ${foundKeywords.join(', ')}`);
    }
  });

  // Check for dietary restriction conflicts ONLY if user has specified restrictions
  userDietaryRestrictions.forEach(restriction => {
    const keywords = dietaryKeywords[restriction] || [restriction.toLowerCase()];
    const foundKeywords = keywords.filter(keyword => 
      hasKeywordMatch(textToScan, keyword)
    );
    
    if (foundKeywords.length > 0) {
      dietaryWarnings.push(`May conflict with ${restriction}: ${foundKeywords.join(', ')}`);
    } else {
      // Check if restaurant explicitly supports this dietary option
      const explicitSupport = restaurant.dietaryOptions?.some(option => 
        hasKeywordMatch(option, restriction)
      );
      if (explicitSupport) {
        safeOptions.push(`Supports ${restriction}`);
      }
    }
  });

  // Determine risk level
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';
  if (allergenWarnings.length > 0) {
    riskLevel = 'danger';
  } else if (dietaryWarnings.length > 0) {
    riskLevel = 'caution';
  }

  const isSafe = allergenWarnings.length === 0 && dietaryWarnings.length === 0;
  
  // For now, assume there are safe menu items if no major allergen conflicts
  // This will be enhanced when we integrate with actual menu analysis
  const hasSafeMenuItems = allergenWarnings.length === 0;

  return {
    isSafe,
    allergenWarnings,
    dietaryWarnings,
    safeOptions,
    riskLevel,
    hasSafeMenuItems
  };
};

export const getPersonalizedSafetyMessage = (
  scanResult: AllergenScanResult,
  userAllergies: string[],
  userDietaryRestrictions: string[]
): string => {
  if (scanResult.isSafe && scanResult.safeOptions.length > 0) {
    return `✅ Safe for your dietary needs! ${scanResult.safeOptions.join(', ')}`;
  }
  
  if (scanResult.riskLevel === 'danger') {
    return `⚠️ ALLERGY WARNING: This restaurant may not be safe due to: ${scanResult.allergenWarnings.join(', ')}`;
  }
  
  if (scanResult.riskLevel === 'caution') {
    return `⚡ Dietary Notice: ${scanResult.dietaryWarnings.join(', ')}. Please verify with restaurant.`;
  }
  
  return `✅ No obvious conflicts found with your dietary preferences`;
};

// Function to check if restaurant has safe menu items based on menu analysis
export const checkMenuItemsSafety = (
  menuItems: any[],
  userAllergies: string[],
  userDietaryRestrictions: string[]
): { hasSafeItems: boolean; safeItemsCount: number; totalItems: number } => {
  if (!menuItems || menuItems.length === 0) {
    return { hasSafeItems: true, safeItemsCount: 0, totalItems: 0 }; // Unknown, so allow
  }

  // Only scan if user has actual restrictions
  if ((!userAllergies || userAllergies.length === 0) && 
      (!userDietaryRestrictions || userDietaryRestrictions.length === 0)) {
    return { hasSafeItems: true, safeItemsCount: menuItems.length, totalItems: menuItems.length };
  }

  let safeItemsCount = 0;
  const totalItems = menuItems.length;

  menuItems.forEach(item => {
    const hasAllergenConflict = userAllergies.some(allergy => {
      const keywords = allergenKeywords[allergy] || [allergy.toLowerCase()];
      return keywords.some(keyword => 
        item.ingredients?.some((ingredient: string) => 
          hasKeywordMatch(ingredient, keyword)
        ) ||
        item.contains_restricted?.some((restricted: string) => 
          hasKeywordMatch(restricted, keyword)
        )
      );
    });

    const hasDietaryConflict = userDietaryRestrictions.some(restriction => {
      const keywords = dietaryKeywords[restriction] || [restriction.toLowerCase()];
      return keywords.some(keyword => 
        item.ingredients?.some((ingredient: string) => 
          hasKeywordMatch(ingredient, keyword)
        ) ||
        item.contains_restricted?.some((restricted: string) => 
          hasKeywordMatch(restricted, keyword)
        )
      );
    });

    if (!hasAllergenConflict && !hasDietaryConflict) {
      safeItemsCount++;
    }
  });

  return {
    hasSafeItems: safeItemsCount > 0,
    safeItemsCount,
    totalItems
  };
};
