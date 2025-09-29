
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface RestaurantPhotoGalleryProps {
  photos: string[];
  restaurantName: string;
}

const RestaurantPhotoGallery: React.FC<RestaurantPhotoGalleryProps> = ({ photos, restaurantName }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4">
      {/* Main large photo */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-xl">
        <img 
          src={photos[selectedPhotoIndex]} 
          alt={`${restaurantName} - Photo ${selectedPhotoIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {photos.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight size={16} />
            </Button>
          </>
        )}
      </div>

      {/* Photo thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhotoIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                selectedPhotoIndex === index 
                  ? 'border-foodRed' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img 
                src={photo} 
                alt={`${restaurantName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo count indicator */}
      {photos.length > 1 && (
        <div className="text-center text-sm text-gray-500">
          {selectedPhotoIndex + 1} of {photos.length} photos
        </div>
      )}
    </div>
  );
};

export default RestaurantPhotoGallery;
