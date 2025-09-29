
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  className
}) => {
  const fullStars = Math.floor(rating);
  const fractionalPart = rating % 1;
  const emptyStars = maxRating - Math.ceil(rating);

  return (
    <div className={cn("flex items-center", className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={`star-full-${index}`}
          size={size}
          className="text-foodYellow fill-foodYellow"
        />
      ))}

      {/* Fractional star */}
      {fractionalPart > 0 && (
        <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
          <Star
            size={size}
            className="text-foodYellow absolute top-0 left-0"
          />
          <div 
            className="absolute top-0 left-0 overflow-hidden" 
            style={{ 
              width: `${fractionalPart * size}px`, 
              height: `${size}px` 
            }}
          >
            <Star
              size={size}
              className="text-foodYellow fill-foodYellow"
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <Star
          key={`star-empty-${index}`}
          size={size}
          className="text-foodYellow"
        />
      ))}
    </div>
  );
};

export default StarRating;
