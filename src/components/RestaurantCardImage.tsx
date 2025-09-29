import { Restaurant } from '@/lib/types';
import SaveButton from './SaveButton';

interface RestaurantCardImageProps {
  restaurant: Restaurant;
}

const RestaurantCardImage: React.FC<RestaurantCardImageProps> = ({ restaurant }) => {
  return (
    <div className="relative h-48 overflow-hidden">
      <img 
        src={restaurant.imageUrl} 
        alt={restaurant.name} 
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
      
      {/* Top overlay buttons */}
      <div className="absolute top-2 left-2 z-10">
        <SaveButton 
          restaurant={restaurant} 
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full p-2"
        />
      </div>
      
      {restaurant.priceLevel && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
            {restaurant.priceLevel}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantCardImage;