import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Clock, Utensils, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { scanRestaurantForAllergens } from '@/services/allergenScanner';
import { addToHistory } from '@/services/historyService';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { toast } from '@/hooks/use-toast';
import SaveButton from './SaveButton';
import StarRating from './StarRating';
import AllergenAlert from './AllergenAlert';
import RestaurantPhotoGallery from './RestaurantPhotoGallery';
import RestaurantReviews from './RestaurantReviews';
import MenuItemsDisplay from './MenuItemsDisplay';
import AIAnalysisUpgrade from './AIAnalysisUpgrade';

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  shouldStartScraping?: boolean;
  initialMenuItems?: any[];
}

const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({ restaurant, shouldStartScraping = false, initialMenuItems = [] }) => {
  const { userPreferences, user } = useAuth();
  const { incrementRestaurantScrape, canScrapeRestaurant, decrementRestaurantScrape } = useFeatureGates();
  const [menuItems, setMenuItems] = useState<any[]>(initialMenuItems);
  const [isScrapingMenu, setIsScrapingMenu] = useState(false);
  const [hasAttemptedScrape, setHasAttemptedScrape] = useState(initialMenuItems.length > 0);

  const handleScrapeMenu = async () => {
    if (isScrapingMenu) {
      return;
    }

    if (!canScrapeRestaurant()) {
      toast({
        title: "Generation limit reached",
        description: "You've reached your daily limit. Upgrade to get more generations!",
        variant: "destructive"
      });
      return;
    }

    setIsScrapingMenu(true);
    setHasAttemptedScrape(true);
    
    try {
      // Increment usage before generating
      const canProceed = await incrementRestaurantScrape();
      if (!canProceed) {
        setIsScrapingMenu(false);
        return;
      }
      
      // Extract location from restaurant data
      const location = restaurant.address || 'Unknown location';
      
      console.log('Generating AI menu for:', restaurant.name, 'in', location);
      
      const { data, error } = await supabase.functions.invoke('generate-ai-menu', {
        body: {
          restaurantName: restaurant.name,
          location: location
        }
      });

      if (error) {
        console.error('Menu generation failed:', error);
        await decrementRestaurantScrape();
        toast({
          title: "Error",
          description: "Failed to generate menu. Please try again.",
          variant: "destructive"
        });
        setMenuItems([]);
      } else if (data?.menuItems && Array.isArray(data.menuItems) && data.menuItems.length > 0) {
        // Transform AI menu items to match expected format
        const transformedItems = data.menuItems.map((item: any) => ({
          dish: item.menu_item,
          ingredients: item.ingredients ? item.ingredients.split(', ') : [],
          price: item.price || 'N/A',
          calories: item.calories || '',
          contains_restricted: []
        }));
        
        setMenuItems(transformedItems);
        toast({
          title: "Success",
          description: `Menu generated successfully! Found ${data.menuItems.length} items.`
        });
      } else {
        setMenuItems([]);
        await decrementRestaurantScrape();
        toast({
          title: "No Menu Generated",
          description: "Could not generate menu items for this restaurant."
        });
      }
      
    } catch (error) {
      console.error('Failed to generate menu:', error);
      setMenuItems([]);
      await decrementRestaurantScrape();
      toast({
        title: "Error",
        description: "Failed to generate menu. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScrapingMenu(false);
    }
  };

  // Track restaurant view when component mounts
  useEffect(() => {
    const trackRestaurantView = async () => {
      if (user?.id && restaurant) {
        try {
          console.log('Tracking restaurant view:', {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            userId: user.id
          });
          
          await addToHistory(restaurant, 'viewed', user.id);
          console.log('Successfully tracked restaurant view');
        } catch (error) {
          console.error('Failed to track restaurant view:', error);
          // Don't show error to user, just log it
        }
      }
    };

    trackRestaurantView();
  }, [restaurant, user?.id]);

  // Handle automatic menu generation when coming from scrape button
  useEffect(() => {
    if (shouldStartScraping) {
      handleScrapeMenu();
    }
  }, [shouldStartScraping]);

  // Perform allergen scan if user has preferences
  const allergenScanResult = userPreferences ? scanRestaurantForAllergens(
    restaurant,
    userPreferences.allergies || [],
    userPreferences.dietary_preferences || []
  ) : null;

  // Prepare photos array - include main image and additional photos
  const allPhotos = [restaurant.imageUrl];
  if (restaurant.photos && restaurant.photos.length > 0) {
    allPhotos.push(...restaurant.photos.slice(0, 9)); // Limit to 10 total photos
  }

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <div className="relative">
        <RestaurantPhotoGallery 
          photos={allPhotos}
          restaurantName={restaurant.name}
        />
        <SaveButton 
          restaurant={restaurant}
          className="absolute top-4 right-4 rounded-full bg-white border shadow-sm hover:bg-gray-50"
        />
      </div>

      {/* Allergen Alert */}
      {allergenScanResult && (
        <AllergenAlert scanResult={allergenScanResult} />
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
            <span className="text-lg font-medium text-foodGray">{restaurant.priceLevel}</span>
          </div>
          <div className="flex items-center mt-1">
            <StarRating rating={restaurant.rating} size={18} />
          </div>
          <p className="text-foodGray mt-1">{restaurant.cuisineType}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Information</h3>
            
            <div className="flex items-start space-x-3">
              <MapPin className="text-foodRed w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-foodGray">{restaurant.address}</p>
              </div>
            </div>
            
            {restaurant.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-foodGray">{restaurant.phone}</p>
                </div>
              </div>
            )}
            
            {restaurant.website && (
              <div className="flex items-start space-x-3">
                <Globe className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Website</p>
                  <a 
                    href={restaurant.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foodRed hover:underline"
                  >
                    {restaurant.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            )}
            
            {restaurant.hours && restaurant.hours.length > 0 && (
              <div className="flex items-start space-x-3">
                <Clock className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Hours</p>
                  <ul className="text-foodGray">
                    {restaurant.hours.map((hour, idx) => (
                      <li key={idx}>{hour}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Menu Information */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Menu Information</h3>
              {menuItems.length > 0 && !isScrapingMenu && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeMenu}
                  disabled={!canScrapeRestaurant()}
                >
                  <RefreshCw size={14} className="mr-2" />
                  Regenerate Menu
                </Button>
              )}
            </div>
            
            {isScrapingMenu ? (
              <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Generating menu items...
                  </div>
              </div>
            ) : menuItems.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-3 pr-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Utensils size={10} className="mr-1" />
                      AI Generated
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {menuItems.length} items found
                    </span>
                  </div>
                  
                  {menuItems.map((item, index) => {
                    const userAllergies = userPreferences?.allergies || [];
                    const userDietaryRestrictions = userPreferences?.dietary_preferences || [];
                    const hasRestrictions = userAllergies.length > 0 || userDietaryRestrictions.length > 0;
                    
                    return (
                      <Card key={index} className="border-l-2 border-muted">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm">{item.dish}</CardTitle>
                            {item.price && (
                              <span className="text-sm text-muted-foreground">{item.price}</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {item.ingredients && item.ingredients.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Ingredients:</p>
                              <div className="flex flex-wrap gap-1">
                                {item.ingredients.map((ingredient: string, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : hasAttemptedScrape ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No menu items could be generated for this restaurant.
                </p>
                <Button
                  onClick={handleScrapeMenu}
                  disabled={!canScrapeRestaurant()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  className="w-full bg-foodRed hover:bg-foodRed/90 text-white"
                  onClick={handleScrapeMenu}
                  disabled={!canScrapeRestaurant()}
                >
                  Generate Menu
                </Button>
                {!canScrapeRestaurant() && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Daily generation limit reached. Upgrade for more generations!
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis and Reviews Section */}
      <div className="space-y-4">
        {/* AI-Powered Analysis */}
        <AIAnalysisUpgrade 
          restaurantName={restaurant.name}
          reviews={restaurant.reviews || []}
          pros={restaurant.pros || []}
          cons={restaurant.cons || []}
        />

        {/* Customer Reviews - Available for all users */}
        <RestaurantReviews 
          reviews={restaurant.reviews || []}
          pros={restaurant.pros || []}
          cons={restaurant.cons || []}
        />

        {/* AI-Generated Menu Below Reviews */}
        {menuItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">AI-Generated Menu</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeMenu}
                  disabled={!canScrapeRestaurant()}
                >
                  <RefreshCw size={14} className="mr-2" />
                  Regenerate Menu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menuItems.map((item, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{item.dish || item.menu_item}</h4>
                      {item.ingredients && (
                        <p className="text-sm text-gray-600 mb-2">
                          {Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        {item.price && (
                          <span className="font-semibold text-green-600">{item.price}</span>
                        )}
                        {item.calories && (
                          <span className="text-gray-500">{item.calories} cal</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetails;