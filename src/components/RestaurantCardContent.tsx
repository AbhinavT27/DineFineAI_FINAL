import { useState } from 'react';
import { Restaurant } from '@/lib/types';
import { MapPin } from 'lucide-react';
import StarRating from './StarRating';
import RestaurantSafetyIndicator from './RestaurantSafetyIndicator';
import AllergenAlert from './AllergenAlert';
import RestaurantCardTags from './RestaurantCardTags';
import ComparisonButton from './ComparisonButton';
import RestaurantTagger from './RestaurantTagger';
import ScrapeButton from './ScrapeButton';

interface RestaurantCardContentProps {
  restaurant: Restaurant;
  allergenScanResult: any;
  restaurantTags: any[];
  searchPreferences: any;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const RestaurantCardContent: React.FC<RestaurantCardContentProps> = ({
  restaurant,
  allergenScanResult,
  restaurantTags,
  searchPreferences,
  onRestaurantClick
}) => {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  return (
    <div className="p-4 space-y-3">
      {/* Restaurant name and rating */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold line-clamp-1 hover:text-foodRed transition-colors">
          {restaurant.name}
        </h3>
        <div className="flex items-center gap-2">
          <StarRating rating={restaurant.rating} size={14} />
          <span className="text-sm text-foodGray font-medium">{restaurant.rating}</span>
        </div>
      </div>

      {/* Cuisine type */}
      <p className="text-foodGray text-sm">{restaurant.cuisineType}</p>

      {/* Address and distance */}
      <div className="flex items-start gap-1 text-sm text-foodGray">
        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="line-clamp-1">{restaurant.address}</p>
          {restaurant.distance && restaurant.distance !== "Calculating..." && (
            <p className="font-medium text-foodRed">{restaurant.distance}</p>
          )}
        </div>
      </div>

      {/* Safety indicator */}
      <RestaurantSafetyIndicator allergenScanResult={allergenScanResult} />

      {/* Allergen alert - compact version for card */}
      {allergenScanResult && (allergenScanResult.allergenWarnings.length > 0 || allergenScanResult.dietaryWarnings.length > 0) && (
        <div className="pt-1">
          <AllergenAlert scanResult={allergenScanResult} className="text-xs p-2" />
        </div>
      )}

      {/* User tags display */}
      <RestaurantCardTags restaurantTags={restaurantTags} />

      {/* Bottom section with Scrape, Compare and Tag buttons */}
      <div className="pt-2 border-t border-muted space-y-2">
        <ScrapeButton 
          restaurant={restaurant}
          className="w-full"
        />
        <div className="flex items-center gap-2">
          <ComparisonButton 
            restaurant={restaurant}
            className="flex-1 h-8 text-xs bg-foodRed hover:bg-foodRed/90 text-white"
          />
          <RestaurantTagger 
            restaurant={restaurant}
            className="flex-1 h-8 text-xs bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm"
            compact={true}
            onTagsUpdated={() => window.location.reload()}
          />
        </div>
      </div>
      
    </div>
  );
};

export default RestaurantCardContent;