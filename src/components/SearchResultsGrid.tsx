
import { Restaurant } from '@/lib/types';
import RestaurantCard from '@/components/RestaurantCard';
import { useRestaurantExtraction } from '@/hooks/useRestaurantExtraction';

interface SearchResultsGridProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
}

const RestaurantCardWrapper = ({ restaurant, onRestaurantClick }: { restaurant: Restaurant; onRestaurantClick: (restaurant: Restaurant) => void }) => {
  const { hasMenuExtraction } = useRestaurantExtraction(restaurant.id);
  
  const restaurantWithExtraction = {
    ...restaurant,
    hasMenuExtraction
  };

  return (
    <RestaurantCard 
      restaurant={restaurantWithExtraction} 
      onRestaurantClick={onRestaurantClick}
    />
  );
};

const SearchResultsGrid = ({ restaurants, onRestaurantClick }: SearchResultsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {restaurants.map(restaurant => (
        <RestaurantCardWrapper 
          key={restaurant.id} 
          restaurant={restaurant} 
          onRestaurantClick={onRestaurantClick}
        />
      ))}
    </div>
  );
};

export default SearchResultsGrid;
