
import { Restaurant } from '@/lib/types';
import { SortOption } from '@/components/SortDropdown';

export const sortRestaurants = (restaurants: Restaurant[], sortOption: SortOption): Restaurant[] => {
  const sortedRestaurants = [...restaurants];

  switch (sortOption) {
    case 'name-asc':
      return sortedRestaurants.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'price-asc':
      return sortedRestaurants.sort((a, b) => {
        const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
        return (priceOrder[a.priceLevel] || 0) - (priceOrder[b.priceLevel] || 0);
      });
    
    case 'distance-asc':
      return sortedRestaurants.sort((a, b) => {
        // Extract numeric value from distance string (e.g., "2.4 km away" -> 2.4)
        const getDistanceValue = (distance: string): number => {
          const match = distance.match(/^([\d.]+)/);
          return match ? parseFloat(match[1]) : Infinity;
        };
        
        const aDistance = getDistanceValue(a.distance || '');
        const bDistance = getDistanceValue(b.distance || '');
        return aDistance - bDistance;
      });
    
    case 'menu-scraped':
      return sortedRestaurants.sort((a, b) => {
        // Use the hasMenuExtraction boolean to determine if restaurant has extracted menu data
        const aHasMenu = a.hasMenuExtraction || false;
        const bHasMenu = b.hasMenuExtraction || false;
        
        // Restaurants with extracted menus come first
        if (aHasMenu && !bHasMenu) return -1;
        if (!aHasMenu && bHasMenu) return 1;
        return 0;
      });
    
    default:
      return sortedRestaurants;
  }
};
