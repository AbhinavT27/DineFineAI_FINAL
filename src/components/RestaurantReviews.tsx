
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGate from './FeatureGate';

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

interface RestaurantReviewsProps {
  reviews: Review[];
  pros: string[];
  cons: string[];
}

const RestaurantReviews: React.FC<RestaurantReviewsProps> = ({ reviews, pros, cons }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { limits, subscription_tier } = useSubscription();
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;
  
  return (
    <div className="space-y-6">
      {/* Recent Reviews - Available on all plans */}
      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedReviews.map((review, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.author_name}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {review.relative_time_description}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{review.text}</p>
                </div>
              ))}
              
              {hasMoreReviews && (
                <div className="flex justify-center pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-sm"
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp size={16} className="mr-1" />
                        Show Less Reviews
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="mr-1" />
                        Show All {reviews.length} Reviews
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RestaurantReviews;
