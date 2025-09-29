import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Bookmark, Loader2, Trash2, Tag } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import RestaurantCard from '@/components/RestaurantCard';
import RestaurantTagger from '@/components/RestaurantTagger';
import ComparisonButton from '@/components/ComparisonButton';
import ComparisonBar from '@/components/ComparisonBar';
import Header from '@/components/Header';
import TagManager from '@/components/TagManager';
import RestaurantTagFilter from '@/components/RestaurantTagFilter';
import TaggedRestaurantsTab from '@/components/TaggedRestaurantsTab';
import { filterRestaurantsByTags } from '@/utils/restaurantTagUtils';
import FeatureGate from '@/components/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';

const SavedList = () => {
  const { user } = useAuth();
  const { subscription_tier } = useSubscription();
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [cachedSavedRestaurants, setCachedSavedRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (user && !hasInitiallyLoaded) {
      fetchSavedRestaurants();
    } else if (user && hasInitiallyLoaded && cachedSavedRestaurants.length > 0) {
      // Use cached data if available
      setSavedRestaurants(cachedSavedRestaurants);
      setIsLoading(false);
    }
  }, [user, hasInitiallyLoaded]);

  useEffect(() => {
    applyTagFilters();
  }, [savedRestaurants, selectedTagIds]);

  const fetchSavedRestaurants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Extract restaurant data from the restaurant_data column with proper type conversion
      const restaurants = data?.map(item => item.restaurant_data as unknown as Restaurant) || [];
      
      // Refetch fresh images for all restaurants
      const restaurantsWithFreshImages = await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const freshImageUrl = await refetchRestaurantImage(restaurant.id);
            return {
              ...restaurant,
              imageUrl: freshImageUrl || restaurant.imageUrl || '/placeholder.svg'
            };
          } catch (error) {
            console.error(`Failed to refetch image for ${restaurant.name}:`, error);
            return {
              ...restaurant,
              imageUrl: '/placeholder.svg'
            };
          }
        })
      );

      setSavedRestaurants(restaurantsWithFreshImages);
      setCachedSavedRestaurants(restaurantsWithFreshImages);
      setHasInitiallyLoaded(true);
    } catch (error: any) {
      console.error('Error fetching saved restaurants:', error);
      toast.error('Failed to load saved restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTagFilters = async () => {
    if (!user?.id) return;
    
    try {
      const filtered = await filterRestaurantsByTags(savedRestaurants, selectedTagIds, user.id);
      setFilteredRestaurants(filtered);
    } catch (error) {
      console.error('Error applying tag filters:', error);
      setFilteredRestaurants(savedRestaurants);
    }
  };

  const refetchRestaurantImage = async (placeId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-places-details', {
        body: { place_id: placeId }
      });

      if (error) throw error;

      return data?.imageUrl || data?.photos?.[0] || null;
    } catch (error) {
      console.error('Error refetching restaurant image:', error);
      return null;
    }
  };

  const removeFromSavedList = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('saved_restaurants')
        .delete()
        .eq('user_id', user?.id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      const updatedRestaurants = savedRestaurants.filter(r => r.id !== restaurantId);
      setSavedRestaurants(updatedRestaurants);
      setCachedSavedRestaurants(updatedRestaurants);
      toast.success('Restaurant removed from saved list');
    } catch (error: any) {
      console.error('Error removing restaurant:', error);
      toast.error('Failed to remove restaurant');
    }
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  const displayRestaurants = selectedTagIds.length > 0 ? filteredRestaurants : savedRestaurants;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Tag Management Section - Premium Only */}
            {subscription_tier === 'premium' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Tag className="h-6 w-6 text-foodRed" />
                    Tag Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TagManager />
                    <RestaurantTagFilter 
                      onTagsChange={handleTagsChange} 
                      selectedTagIds={selectedTagIds}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Saved Restaurants Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bookmark className="h-6 w-6 text-foodRed" />
                  My Saved Restaurants
                  {selectedTagIds.length > 0 && (
                    <span className="text-sm font-normal text-gray-600">
                      ({displayRestaurants.length} filtered)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-foodRed" />
                  </div>
                ) : displayRestaurants.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      {selectedTagIds.length > 0 
                        ? 'No saved restaurants match the selected tags.'
                        : 'You haven\'t saved any restaurants yet.'
                      }
                    </p>
                    {selectedTagIds.length === 0 && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.href = '/home'}
                      >
                        Explore Restaurants
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayRestaurants.map((restaurant) => (
                      <SavedRestaurantCard 
                        key={restaurant.id} 
                        restaurant={restaurant}
                        onRemove={() => removeFromSavedList(restaurant.id)}
                        onTagsUpdated={fetchSavedRestaurants}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tagged Restaurants Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Tag className="h-6 w-6 text-purple-600" />
                  Tagged Restaurants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaggedRestaurantsTab />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Comparison Bar */}
      <ComparisonBar />
    </div>
  );
};

// Create a specialized component for saved restaurant cards
const SavedRestaurantCard: React.FC<{
  restaurant: Restaurant;
  onRemove: () => void;
  onTagsUpdated?: () => void;
}> = ({ restaurant, onRemove, onTagsUpdated }) => {
  return (
    <div className="relative">
      {/* Use the same styling as RestaurantCard from search results */}
      <Card className="restaurant-card h-full overflow-hidden border border-border hover:border-foodRed/30 transition-all duration-200">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Price level in top right */}
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
              {restaurant.priceLevel}
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Restaurant name and rating */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold line-clamp-1 hover:text-foodRed transition-colors">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(restaurant.rating)
                        ? 'text-yellow-400 fill-current'
                        : i < restaurant.rating
                        ? 'text-yellow-400 fill-current opacity-50'
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-foodGray font-medium">{restaurant.rating}</span>
            </div>
          </div>

          {/* Cuisine type */}
          <p className="text-foodGray text-sm">{restaurant.cuisineType}</p>

          {/* Address and distance */}
          <div className="flex items-start gap-1 text-sm text-foodGray">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="line-clamp-1">{restaurant.address}</p>
              {restaurant.distance && restaurant.distance !== "Calculating..." && (
                <p className="font-medium text-foodRed">{restaurant.distance}</p>
              )}
            </div>
          </div>

          {/* Bottom section with buttons */}
          <div className="pt-2 border-t border-muted flex items-center justify-between">
            <ComparisonButton 
              restaurant={restaurant}
              className="bg-foodRed hover:bg-foodRed/90 text-white"
            />
            
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemove}
                className="h-8 px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <RestaurantTagger 
                restaurant={restaurant}
                onTagsUpdated={onTagsUpdated}
                className="h-8 px-3 text-xs"
                compact={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedList;
