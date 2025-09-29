
// Helper function to extract cuisine type from Google Places types
export const extractCuisineType = (types: string[]): string | null => {
  if (!types || types.length === 0) return null;

  const cuisineMap: { [key: string]: string } = {
    'italian_restaurant': 'Italian',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'indian_restaurant': 'Indian',
    'thai_restaurant': 'Thai',
    'french_restaurant': 'French',
    'american_restaurant': 'American',
    'mediterranean_restaurant': 'Mediterranean',
    'pizza': 'Italian',
    'sushi': 'Japanese',
    'barbecue': 'American'
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  return null;
};

// Helper function to extract dietary options from types - much more strict
export const extractDietaryOptions = (types: string[], name: string = '', cuisineType: string = ''): string[] => {
  const options: string[] = [];
  
  // Check types for specific dietary options from Google Places API
  if (types) {
    if (types.includes('vegan_restaurant')) {
      options.push('Vegan');
    }
    if (types.includes('vegetarian_restaurant')) {
      options.push('Vegetarian');
    }
  }
  
  // Only check name for very specific and clear dietary indicators
  const searchText = `${name}`.toLowerCase();
  
  // Only add if the restaurant name explicitly contains these terms
  if (searchText.includes('vegan kitchen') || searchText.includes('vegan cafe') || searchText.includes('100% vegan')) {
    if (!options.includes('Vegan')) options.push('Vegan');
  }
  
  if (searchText.includes('vegetarian restaurant') || searchText.includes('veggie') || searchText.includes('pure vegetarian')) {
    if (!options.includes('Vegetarian')) options.push('Vegetarian');
  }
  
  if (searchText.includes('halal kitchen') || searchText.includes('halal restaurant')) {
    options.push('Halal');
  }
  
  if (searchText.includes('kosher kitchen') || searchText.includes('kosher restaurant')) {
    options.push('Kosher');
  }
  
  if (searchText.includes('gluten free kitchen') || searchText.includes('gluten-free restaurant')) {
    options.push('Gluten-Free');
  }
  
  return options;
};
