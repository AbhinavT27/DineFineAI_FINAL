
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTaggedRestaurants, removeTaggedRestaurant, TaggedRestaurant } from '@/services/taggedRestaurantsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Tag, Trash2, MapPin } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { toast } from '@/components/ui/sonner';
import { getRestaurantTags } from '@/utils/restaurantTagUtils';
import RestaurantTagFilter from '@/components/RestaurantTagFilter';
import { filterRestaurantsByTags } from '@/utils/restaurantTagUtils';
import ComparisonButton from '@/components/ComparisonButton';
import RestaurantTagger from '@/components/RestaurantTagger';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGate from '@/components/FeatureGate';

const TaggedRestaurantsTab = () => {
  const { user } = useAuth();
  const { subscription_tier } = useSubscription();
  const [taggedRestaurants, setTaggedRestaurants] = useState<TaggedRestaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<TaggedRestaurant[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [restaurantTagsMap, setRestaurantTagsMap] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaggedRestaurants = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      const data = await getTaggedRestaurants(user.id);
      setTaggedRestaurants(data);
      
      // Fetch tags for each restaurant
      const tagsMap: {[key: string]: any[]} = {};
      for (const restaurant of data) {
        const tags = await getRestaurantTags(restaurant.restaurant_id, user.id);
        tagsMap[restaurant.restaurant_id] = tags;
      }
      setRestaurantTagsMap(tagsMap);
      
      setLoading(false);
    };

    fetchTaggedRestaurants();
  }, [user?.id]);

  useEffect(() => {
    applyTagFilters();
  }, [taggedRestaurants, selectedTagIds]);

  const applyTagFilters = async () => {
    if (!user?.id) return;
    
    try {
      const restaurants = taggedRestaurants.map(tr => tr.restaurant_data);
      const filtered = await filterRestaurantsByTags(restaurants, selectedTagIds, user.id);
      const filteredTaggedRestaurants = taggedRestaurants.filter(tr => 
        filtered.some(r => r.id === tr.restaurant_id)
      );
      setFilteredRestaurants(filteredTaggedRestaurants);
    } catch (error) {
      console.error('Error applying tag filters:', error);
      setFilteredRestaurants(taggedRestaurants);
    }
  };

  const handleRemoveTaggedRestaurant = async (restaurantId: string) => {
    if (!user?.id) return;
    
    try {
      await removeTaggedRestaurant(restaurantId, user.id);
      setTaggedRestaurants(prev => prev.filter(tr => tr.restaurant_id !== restaurantId));
      toast.success('Restaurant removed from tagged list');
    } catch (error) {
      console.error('Error removing tagged restaurant:', error);
      toast.error('Failed to remove restaurant');
    }
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  const displayRestaurants = selectedTagIds.length > 0 ? filteredRestaurants : taggedRestaurants;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foodRed"></div>
      </div>
    );
  }

  // Show upgrade message if not on premium plan
  if (subscription_tier !== 'premium') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center max-w-md bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Upgrade to Premium to unlock this feature</h3>
          <div className="flex gap-2 justify-center">
            <Button 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-6 py-2 rounded-lg"
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade to Premium
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => window.location.href = '/pricing'}
            >
              View plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="tagging" requiredPlan="premium">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tagged Restaurants</h3>
          <span className="text-sm text-gray-600">
            {displayRestaurants.length} restaurant{displayRestaurants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tag Filter Component */}
        <RestaurantTagFilter 
          onTagsChange={handleTagsChange}
          selectedTagIds={selectedTagIds}
        />

        {displayRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayRestaurants.map((taggedRestaurant) => {
              const restaurantTags = restaurantTagsMap[taggedRestaurant.restaurant_id] || [];
              
              return (
                <Card key={taggedRestaurant.id} className="restaurant-card h-full overflow-hidden border border-border hover:border-foodRed/30 transition-all duration-200">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={taggedRestaurant.restaurant_data.imageUrl}
                      alt={taggedRestaurant.restaurant_data.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Tag badges in top left */}
                    <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[200px]">
                      {restaurantTags.slice(0, 3).map((tagData) => (
                        <Badge 
                          key={tagData.id} 
                          className="text-xs px-2 py-1" 
                          style={{ 
                            backgroundColor: tagData.user_tags?.color || '#3B82F6',
                            color: 'white'
                          }}
                        >
                          {tagData.user_tags?.tag_name}
                        </Badge>
                      ))}
                      {restaurantTags.length > 3 && (
                        <Badge className="text-xs px-2 py-1 bg-gray-500 text-white">
                          +{restaurantTags.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Price level in top right */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
                        {taggedRestaurant.restaurant_data.priceLevel}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Restaurant name and rating */}
                    <div className="space-y-1">
                      <Link 
                        to={`/restaurant/${taggedRestaurant.restaurant_data.id}`}
                        state={{ fromHistory: true }}
                        className="text-lg font-bold line-clamp-1 hover:text-foodRed transition-colors"
                      >
                        {taggedRestaurant.restaurant_data.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <StarRating rating={taggedRestaurant.restaurant_data.rating} size={14} />
                        <span className="text-sm text-foodGray font-medium">
                          {taggedRestaurant.restaurant_data.rating}
                        </span>
                      </div>
                    </div>

                    {/* Cuisine type */}
                    <p className="text-foodGray text-sm">{taggedRestaurant.restaurant_data.cuisineType}</p>

                    {/* Address and distance */}
                    <div className="flex items-start gap-1 text-sm text-foodGray">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="line-clamp-1">{taggedRestaurant.restaurant_data.address}</p>
                        {taggedRestaurant.restaurant_data.distance && taggedRestaurant.restaurant_data.distance !== "Calculating..." && (
                          <p className="font-medium text-foodRed">{taggedRestaurant.restaurant_data.distance}</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom section with buttons */}
                    <div className="pt-2 border-t border-muted flex items-center justify-between">
                      <ComparisonButton 
                        restaurant={taggedRestaurant.restaurant_data}
                        className="bg-foodRed hover:bg-foodRed/90 text-white"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTaggedRestaurant(taggedRestaurant.restaurant_id)}
                          className="h-8 px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <RestaurantTagger 
                          restaurant={taggedRestaurant.restaurant_data}
                          onTagsUpdated={() => {
                            // Refresh tagged restaurants and tags map
                            getTaggedRestaurants(user?.id || '').then(data => {
                              setTaggedRestaurants(data);
                              // Update tags map
                              const tagsMap: {[key: string]: any[]} = {};
                              data.forEach(async (restaurant) => {
                                const tags = await getRestaurantTags(restaurant.restaurant_id, user?.id || '');
                                tagsMap[restaurant.restaurant_id] = tags;
                              });
                              setRestaurantTagsMap(tagsMap);
                            });
                          }}
                          className="h-8 px-3 text-xs"
                          compact={true}
                          hasExistingTags={restaurantTags.length > 0}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center max-w-md">
              <Tag size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {selectedTagIds.length > 0 
                  ? 'No tagged restaurants match your filters'
                  : 'No tagged restaurants yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedTagIds.length > 0
                  ? 'Try adjusting your tag filters to see more restaurants.'
                  : 'Tag restaurants to organize them and find them easily later!'
                }
              </p>
              <Button asChild variant="default" className="bg-foodRed hover:bg-foodRed/90">
                <Link to="/home">Browse Restaurants</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default TaggedRestaurantsTab;
