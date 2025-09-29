import React, { useEffect } from 'react';
import { useComparison } from '@/contexts/ComparisonContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Phone, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from '@/components/StarRating';
import { useSubscription } from '@/hooks/useSubscription';

const Comparison = () => {
  const { comparisonRestaurants, clearComparison, saveCurrentComparison, setComparisonFromHistory } = useComparison();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription_tier } = useSubscription();

  // Get current search results from location state to pass them along
  const searchResults = location.state?.searchResults || [];
  const searchPreferences = location.state?.searchPreferences || {};
  const fromHistory = location.state?.fromHistory || false;
  const historyComparisonRestaurants = location.state?.comparisonRestaurants || [];

  // Load comparison from history if coming from history page
  useEffect(() => {
    if (fromHistory && historyComparisonRestaurants.length > 0) {
      setComparisonFromHistory(historyComparisonRestaurants);
    }
  }, [fromHistory, historyComparisonRestaurants, setComparisonFromHistory]);

  // Save comparison when restaurants are being compared (but not from history)
  useEffect(() => {
    if (!fromHistory && comparisonRestaurants.length > 1) {
      saveCurrentComparison();
    }
  }, [comparisonRestaurants, fromHistory, saveCurrentComparison]);

  const handleBackClick = () => {
    // Go back to search results page with proper state, or history if from history
    if (fromHistory) {
      navigate('/history');
    } else if (searchResults.length > 0) {
      navigate('/search-results', {
        state: {
          searchResults: searchResults,
          searchPreferences: searchPreferences
        }
      });
    } else {
      // Fallback to search results page without state
      navigate('/search-results');
    }
  };

  const comparisonCriteria = [
    { key: 'rating', label: 'Rating', icon: Star },
    { key: 'priceLevel', label: 'Price', icon: null },
    { key: 'cuisineType', label: 'Cuisine', icon: null },
    { key: 'distance', label: 'Distance', icon: MapPin },
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'website', label: 'Website', icon: Globe },
  ];

  const renderCellValue = (restaurant: any, criteriaKey: string) => {
    const value = restaurant[criteriaKey];
    
    if (criteriaKey === 'rating') {
      return (
        <div className="flex items-center gap-2">
          <StarRating rating={restaurant.rating} size={14} />
          <span>{restaurant.rating}</span>
        </div>
      );
    }
    
    if (criteriaKey === 'website' && value) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foodRed hover:underline"
        >
          Visit Website
        </a>
      );
    }
    
    if (criteriaKey === 'coordinates' && value && typeof value === 'object') {
      return `${value.lat}, ${value.lng}`;
    }
    
    if (Array.isArray(value)) {
      return value.join(', ') || 'N/A';
    }
    
    return value || 'N/A';
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft size={18} className="mr-2" />
            {fromHistory ? 'Back to History' : 'Back to Search'}
          </Button>
          
          {!fromHistory && (
            <Button variant="outline" onClick={clearComparison}>
              Clear Comparison
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Restaurant Comparison</h1>

        {comparisonRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">No Restaurants to Compare</h1>
            <p className="text-muted-foreground mb-6">
              Add restaurants to comparison from the search results to see them here.
            </p>
            <Button asChild variant="default" className="bg-foodRed hover:bg-foodRed/90">
              <Link to="/">Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Restaurant Images */}
            <div className={`grid grid-cols-${comparisonRestaurants.length} gap-6 mb-8`}>
              {comparisonRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded text-sm font-medium">
                      {restaurant.priceLevel}
                    </div>
                  </div>
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                    <div className="flex justify-center">
                      <StarRating rating={restaurant.rating} size={16} />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Criteria</th>
                        {comparisonRestaurants.map((restaurant) => (
                          <th key={restaurant.id} className="text-left py-3 px-4 font-semibold">
                            {restaurant.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonCriteria.map((criteria) => (
                        <tr key={criteria.key} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium flex items-center gap-2">
                            {criteria.icon && <criteria.icon size={16} className="text-foodRed" />}
                            {criteria.label}
                          </td>
                          {comparisonRestaurants.map((restaurant) => (
                            <td key={restaurant.id} className="py-3 px-4">
                              {renderCellValue(restaurant, criteria.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      
                      {/* Dietary Options */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">Dietary Options</td>
                        {comparisonRestaurants.map((restaurant) => (
                          <td key={restaurant.id} className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {restaurant.dietaryOptions.length > 0 ? (
                                restaurant.dietaryOptions.map((option, index) => (
                                  <span
                                    key={index}
                                    className="text-xs px-2 py-1 bg-muted rounded-full"
                                  >
                                    {option}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground">None listed</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Pros - Premium Only */}
                      {subscription_tier === 'premium' && (
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">Pros</td>
                          {comparisonRestaurants.map((restaurant) => (
                            <td key={restaurant.id} className="py-3 px-4">
                              <ul className="list-disc list-inside text-sm">
                                {restaurant.pros.length > 0 ? (
                                  restaurant.pros.map((pro, index) => (
                                    <li key={index} className="text-green-600">{pro}</li>
                                  ))
                                ) : (
                                  <li className="text-muted-foreground">No pros listed</li>
                                )}
                              </ul>
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Cons - Premium Only */}
                      {subscription_tier === 'premium' && (
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">Cons</td>
                          {comparisonRestaurants.map((restaurant) => (
                            <td key={restaurant.id} className="py-3 px-4">
                              <ul className="list-disc list-inside text-sm">
                                {restaurant.cons.length > 0 ? (
                                  restaurant.cons.map((con, index) => (
                                    <li key={index} className="text-red-500">{con}</li>
                                  ))
                                ) : (
                                  <li className="text-muted-foreground">No cons listed</li>
                                )}
                              </ul>
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Reviews */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">Reviews</td>
                        {comparisonRestaurants.map((restaurant) => (
                          <td key={restaurant.id} className="py-3 px-4">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {restaurant.reviews && restaurant.reviews.length > 0 ? (
                                restaurant.reviews.slice(0, 3).map((review, index) => (
                                  <div key={index} className="text-sm border-l-2 border-muted pl-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <StarRating rating={review.rating} size={12} />
                                      <span className="text-xs text-muted-foreground">{review.author_name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{review.text}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground text-sm">No reviews available</div>
                              )}
                              {restaurant.reviews && restaurant.reviews.length > 3 && (
                                <div className="text-xs text-primary">+{restaurant.reviews.length - 3} more reviews</div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              {comparisonRestaurants.map((restaurant) => (
                <Button key={restaurant.id} asChild variant="outline">
                  <Link 
                    to={`/restaurant/${restaurant.id}`}
                    state={{ 
                      fromComparison: true,
                      searchResults: searchResults,
                      searchPreferences: searchPreferences
                    }}
                  >
                    View {restaurant.name}
                  </Link>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Comparison;
