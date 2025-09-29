
import { Link, useLocation } from 'react-router-dom';
import { Restaurant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import RestaurantTagger from './RestaurantTagger';
import RestaurantCardImage from './RestaurantCardImage';
import RestaurantCardContent from './RestaurantCardContent';
import { useAuth } from '@/contexts/AuthContext';
import { scanRestaurantForAllergens } from '@/services/allergenScanner';
import { useState, useEffect } from 'react';
import { getRestaurantTags } from '@/utils/restaurantTagUtils';
import { useRestaurantExtraction } from '@/hooks/useRestaurantExtraction';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onRestaurantClick }) => {
  const location = useLocation();
  const { userPreferences, user } = useAuth();
  const [restaurantTags, setRestaurantTags] = useState<any[]>([]);
  const [refreshTags, setRefreshTags] = useState(0);
  const { hasMenuExtraction } = useRestaurantExtraction(restaurant.id);
  
  // Get current search results from location state to pass them along
  const searchResults = location.state?.searchResults || [];
  const searchPreferences = location.state?.searchPreferences || {};

  // Fetch restaurant tags
  useEffect(() => {
    const fetchTags = async () => {
      if (user?.id) {
        const tags = await getRestaurantTags(restaurant.id, user.id);
        setRestaurantTags(tags);
      }
    };
    fetchTags();
  }, [restaurant.id, user?.id, refreshTags]);

  const handleTagsUpdated = () => {
    setRefreshTags(prev => prev + 1);
  };

  // Perform allergen scan if user has preferences
  const allergenScanResult = userPreferences ? scanRestaurantForAllergens(
    restaurant,
    userPreferences.allergies || [],
    userPreferences.dietary_preferences || []
  ) : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button or interactive element
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  return (
    <Card className="restaurant-card h-full overflow-hidden border border-border hover:border-foodRed/30 transition-all duration-200 cursor-pointer relative">
      <Link 
        to={`/restaurant/${restaurant.id}`} 
        state={{ 
          searchResults: searchResults, 
          searchPreferences: searchPreferences 
        }}
        className="block"
        onClick={handleCardClick}
      >
        <RestaurantCardImage restaurant={restaurant} />
        <CardContent>
          <RestaurantCardContent
            restaurant={restaurant}
            allergenScanResult={allergenScanResult}
            restaurantTags={restaurantTags}
            searchPreferences={searchPreferences}
            onRestaurantClick={onRestaurantClick}
          />
        </CardContent>
      </Link>
    </Card>
  );
};

export default RestaurantCard;
