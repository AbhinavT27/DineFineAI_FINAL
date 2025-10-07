
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Utensils, AlertTriangle, Loader2, Globe, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuItemData, MenuExtractionResponse, extractMenuItems, scrapeRestaurantMenu } from '@/services/menuExtractionService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { toast } from 'sonner';

interface MenuItemsDisplayProps {
  restaurantWebsite?: string;
  restaurantName: string;
  searchQuery?: string;
  className?: string;
  showFullDetails?: boolean;
  onScrapeClick?: () => void;
  showScrapeButton?: boolean;
  initiallyHidden?: boolean;
}

// Updated allergen keywords - only include what's actually restricted for each category
const allergenKeywords: Record<string, string[]> = {
  'Peanuts': ['peanut', 'peanuts', 'groundnut', 'arachis oil', 'peanut oil', 'peanut butter'],
  'Tree Nuts': ['almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'brazil nut', 'macadamia', 'pine nut'],
  'Milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey'],
  'Eggs': ['egg', 'eggs', 'albumin', 'mayonnaise', 'meringue'],
  'Fish': ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'fish sauce'],
  'Shellfish': ['shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'shellfish'],
  'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'gluten', 'semolina', 'bulgur'],
  'Soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame', 'lecithin', 'soy sauce'],
  // Dietary restrictions - ONLY include actual animal products for vegetarian
  'Vegetarian': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'ham', 'bacon', 'sausage', 'pepperoni', 'ground beef', 'ground pork', 'ground turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'seafood'],
  // Vegan includes all animal products including dairy and eggs
  'Vegan': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'ham', 'bacon', 'sausage', 'fish', 'seafood', 'dairy', 'milk', 'cheese', 'butter', 'egg', 'eggs', 'honey', 'gelatin'],
  'Gluten-Free': ['wheat', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'flour', 'beer', 'malt'],
  'Dairy-Free': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey']
};

// Type guard to check if data is MenuItemData array
const isMenuItemDataArray = (data: any): data is MenuItemData[] => {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.dish === 'string' &&
    Array.isArray(item.ingredients)
  );
};

// FIXED: Only check against user's actual restrictions - no cross-contamination logic
const isIngredientRestricted = (
  ingredient: string,
  userAllergies: string[],
  userDietaryRestrictions: string[]
): boolean => {
  const normalizedIngredient = ingredient.toLowerCase();
  
  // Combine user's actual restrictions
  const allUserRestrictions = [
    ...(userAllergies || []),
    ...(userDietaryRestrictions || [])
  ];

  // If user has no restrictions, nothing is restricted
  if (allUserRestrictions.length === 0) {
    return false;
  }
  
  // CRITICAL FIX: Only check each ingredient against the user's specific restrictions
  return allUserRestrictions.some(restriction => {
    const keywords = allergenKeywords[restriction];
    if (!keywords) return false;
    
    return keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      // Use exact word boundary matching to avoid false positives
      const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return wordBoundaryRegex.test(normalizedIngredient);
    });
  });
};

const MenuItemsDisplay: React.FC<MenuItemsDisplayProps> = ({
  restaurantWebsite,
  restaurantName,
  searchQuery = '',
  className = '',
  showFullDetails = false,
  onScrapeClick,
  showScrapeButton = false,
  initiallyHidden = false
}) => {
  const navigate = useNavigate();
  const { userPreferences } = useAuth();
  const { incrementRestaurantScrape, canScrapeRestaurant, decrementRestaurantScrape } = useFeatureGates();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAttemptedExtraction, setHasAttemptedExtraction] = useState(false);
  const [dataSource, setDataSource] = useState<'scraped' | 'knowledge' | 'cached' | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showMenu, setShowMenu] = useState(!initiallyHidden);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get user restrictions - ensure they're arrays even if undefined
  const userAllergies = userPreferences?.allergies || [];
  const userDietaryRestrictions = userPreferences?.dietary_preferences || [];

  // Check if user has any dietary restrictions or allergies
  const hasRestrictions = userAllergies.length > 0 || userDietaryRestrictions.length > 0;

  // Load cached menu data only when showing full details (restaurant page) and menu is shown
  useEffect(() => {
    const loadCachedMenuData = async () => {
      if (!restaurantWebsite || !userPreferences || !showFullDetails || !showMenu) {
        return;
      }

      try {
        // Only check if we have cached analysis for this restaurant
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from('menu_analysis')
          .select('*')
          .eq('restaurant_website', restaurantWebsite)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching existing analysis:', fetchError);
          return;
        }

        // If we have analysis, use it regardless of age
        if (existingAnalysis && existingAnalysis.menu_items) {
          console.log('Loading cached menu analysis for:', restaurantWebsite);
          // Type check the cached data before using it
          if (isMenuItemDataArray(existingAnalysis.menu_items)) {
            setMenuItems(existingAnalysis.menu_items);
            setDataSource(existingAnalysis.scraped ? 'scraped' : 'cached');
            setHasAttemptedExtraction(true);
          }
        }
        
      } catch (error) {
        console.error('Failed to load cached menu data:', error);
      }
    };

    loadCachedMenuData();
  }, [restaurantWebsite, userPreferences, showFullDetails, showMenu]);

  // Direct menu scraping function for card view (redirects to scrape menu page)
  const handleCardMenuScraping = async () => {
    if (!restaurantWebsite || loading) {
      return;
    }

    // Check if user can scrape (respects daily limits)
    if (!canScrapeRestaurant()) {
      return; // incrementRestaurantScrape will show the appropriate toast
    }

    setLoading(true);
    setHasAttemptedExtraction(true);
    
    try {
      console.log('Scraping menu for card view:', restaurantWebsite);
      
      // Increment usage before scraping
      const canProceed = await incrementRestaurantScrape();
      if (!canProceed) {
        setLoading(false);
        return;
      }
      
      const result = await scrapeRestaurantMenu(restaurantWebsite);
      
      if (result.error) {
        console.error('Menu scraping failed:', result.error);
        // Refund the scrape on error since user didn't get menu
        await decrementRestaurantScrape();
        toast.error('Failed to scrape menu. Please try again.');
      } else if (result.menuItems && Array.isArray(result.menuItems) && result.menuItems.length > 0) {
        // Redirect to scrape menu page with the menu data
        const menuDataParam = encodeURIComponent(JSON.stringify(result.menuItems));
        navigate(`/scrape-menu?restaurant=${encodeURIComponent(restaurantName)}&menuData=${menuDataParam}`);
      } else {
        // No menu items extracted - refund the scrape since user didn't get menu
        await decrementRestaurantScrape();
        toast.error('No menu items could be extracted from this website.');
      }
      
    } catch (error) {
      console.error('Failed to scrape menu:', error);
      // Refund the scrape on error since user didn't get menu
      await decrementRestaurantScrape();
      toast.error('Failed to scrape menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Direct menu scraping function for full details page
  const handleMenuScraping = async () => {
    if (!restaurantWebsite || loading) {
      return;
    }

    // Show menu section when scraping starts
    setShowMenu(true);

    // Check if user can scrape (respects daily limits)
    if (!canScrapeRestaurant()) {
      return; // incrementRestaurantScrape will show the appropriate toast
    }

    setLoading(true);
    setHasAttemptedExtraction(true);
    
    try {
      console.log('Scraping menu directly for:', restaurantWebsite);
      
      // If we're in card view (search results page), use card scraping instead
      if (!showFullDetails && showScrapeButton) {
        return handleCardMenuScraping();
      }
      
      // Increment usage before scraping
      const canProceed = await incrementRestaurantScrape();
      if (!canProceed) {
        setLoading(false);
        return;
      }
      
      const result = await scrapeRestaurantMenu(restaurantWebsite);
      
      if (result.error) {
        console.error('Menu scraping failed:', result.error);
        // Refund the scrape on error since user didn't get menu
        await decrementRestaurantScrape();
        toast.error('Failed to scrape menu. Please try again.');
      } else if (result.menuItems && Array.isArray(result.menuItems) && result.menuItems.length > 0) {
        setMenuItems(result.menuItems);
        setDataSource('scraped');
        toast.success('Menu scraped successfully!');
      } else {
        // No menu items extracted - refund the scrape since user didn't get menu
        await decrementRestaurantScrape();
        toast.error('No menu items could be extracted from this website.');
      }
      
    } catch (error) {
      console.error('Failed to scrape menu:', error);
      // Refund the scrape on error since user didn't get menu
      await decrementRestaurantScrape();
      toast.error('Failed to scrape menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Manual extraction function
  const handleManualExtraction = async () => {
    if (!restaurantWebsite || !userPreferences || loading) {
      return;
    }

    // Show menu section when extraction starts
    setShowMenu(true);

    // Check if user can scrape (respects daily limits)
    if (!canScrapeRestaurant()) {
      return; // incrementRestaurantScrape will show the appropriate toast
    }

    setLoading(true);
    setHasAttemptedExtraction(true);
    
    try {
      console.log('Performing manual menu analysis for:', restaurantWebsite);
      
      // Increment usage before extraction
      const canProceed = await incrementRestaurantScrape();
      if (!canProceed) {
        setLoading(false);
        return;
      }
      
      const response = await extractMenuItems(
        restaurantWebsite,
        searchQuery,
        userAllergies,
        userDietaryRestrictions,
        restaurantName
      );
      
      // Check if the response includes source information and has valid menu items
      if (Array.isArray(response) && response.length > 0) {
        setMenuItems(response);
        setDataSource('knowledge');
        toast.success('Menu analysis completed!');
      } else if (response && typeof response === 'object' && 'menuItems' in response) {
        const extractionResponse = response as MenuExtractionResponse;
        if (extractionResponse.menuItems && extractionResponse.menuItems.length > 0) {
          setMenuItems(extractionResponse.menuItems);
          setDataSource(extractionResponse.scraped ? 'scraped' : 'knowledge');
          toast.success('Menu analysis completed!');
        } else {
          // No menu items extracted - refund the scrape since user didn't get menu
          await decrementRestaurantScrape();
          toast.error('No menu items could be analyzed from this restaurant.');
        }
      } else {
        // No valid response - refund the scrape since user didn't get menu
        await decrementRestaurantScrape();
        toast.error('No menu items could be analyzed from this restaurant.');
      }
      
      // Only navigate if we're in card view (search results page)
      if (!showFullDetails && onScrapeClick) {
        onScrapeClick();
      }
      
    } catch (error) {
      console.error('Failed to extract menu items:', error);
      // Refund the scrape on error since user didn't get menu
      await decrementRestaurantScrape();
      toast.error('Failed to analyze menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // No auto-scraping - only manual scraping via button click

  if (!restaurantWebsite) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils size={16} />
            Menu Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Website not available for menu analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!showMenu) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils size={16} />
            Menu Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleMenuScraping}
            size="sm"
            variant="default"
            className="w-full"
            disabled={!canScrapeRestaurant()}
          >
            <Utensils size={14} className="mr-2" />
            {canScrapeRestaurant() ? 'Scrape Menu' : 'Daily Limit Reached'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils size={16} />
            Analyzing Menu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            {dataSource === 'cached' ? 'Loading cached analysis...' : 'Extracting menu items and analyzing allergens...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (menuItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils size={16} />
            Menu Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAttemptedExtraction ? (
            <p className="text-sm text-muted-foreground">
              Menu analysis attempted - no items extracted
            </p>
          ) : (
            <>
              {showFullDetails ? (
                <Button
                  onClick={handleMenuScraping}
                  size="sm"
                  variant="default"
                  className="w-full"
                  disabled={!canScrapeRestaurant()}
                >
                  <Utensils size={14} className="mr-2" />
                  {canScrapeRestaurant() ? 'Scrape Menu' : 'Daily Limit Reached'}
                </Button>
              ) : showScrapeButton ? (
                <Button
                  onClick={handleCardMenuScraping}
                  size="sm"
                  variant="default"
                  className="w-full"
                  disabled={!canScrapeRestaurant()}
                >
                  <Utensils size={14} className="mr-2" />
                  {canScrapeRestaurant() ? 'Scrape Menu' : 'Daily Limit Reached'}
                </Button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const displayedItems = showFullDetails || showAllItems ? menuItems : menuItems.slice(0, 3);
  const hasMoreItems = !showFullDetails && menuItems.length > 3;

  // For card view with expanded menu (3x height of menu information box)
  const cardHeight = isExpanded && !showFullDetails ? "h-96" : "h-auto";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Utensils size={16} />
          Menu Items & Ingredients
          {dataSource && (
            <div className="ml-auto flex items-center gap-1">
              {dataSource === 'scraped' ? (
                <Badge variant="outline" className="text-xs">
                  <Globe size={10} className="mr-1" />
                  Live
                </Badge>
              ) : dataSource === 'cached' ? (
                <Badge variant="secondary" className="text-xs">
                  <Database size={10} className="mr-1" />
                  Cached
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Database size={10} className="mr-1" />
                  Sample
                </Badge>
              )}
              {!showFullDetails && isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <ChevronUp size={12} />
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className={!showFullDetails && isExpanded ? cardHeight : showAllItems ? "h-80" : "h-auto"}>
          <div className="space-y-4 pr-4">
            {displayedItems.map((item, index) => {
              // Check if this item has any restricted ingredients
              const hasRestrictedIngredients = hasRestrictions && item.ingredients.some(ingredient => 
                isIngredientRestricted(ingredient, userAllergies, userDietaryRestrictions)
              );
              
              return (
                <div 
                  key={index} 
                  className={`border-l-2 pl-3 space-y-2 rounded-lg p-3 ${
                    hasRestrictedIngredients 
                      ? 'border-red-500 bg-red-50/50' 
                      : 'border-muted'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{item.dish}</h4>
                    {item.price && (
                      <span className="text-sm text-muted-foreground">{item.price}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.ingredients.map((ingredient, idx) => {
                        // FIXED: Only flag if user has that specific restriction - no false positives
                        const isRestricted = hasRestrictions && isIngredientRestricted(
                          ingredient,
                          userAllergies,
                          userDietaryRestrictions
                        );
                        
                        return (
                          <Badge 
                            key={idx} 
                            variant={isRestricted ? "destructive" : "secondary"}
                            className={`text-xs px-2 py-0.5 ${
                              isRestricted ? 'bg-red-100 text-red-800 border-red-200' : ''
                            }`}
                          >
                            {isRestricted && <AlertTriangle size={10} className="mr-1" />}
                            {ingredient}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Show restriction warnings only if there are actual matches */}
                  {hasRestrictedIngredients && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-800 font-medium">
                        ⚠️ Contains ingredients that conflict with your dietary preferences
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Please verify with restaurant before ordering
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {hasMoreItems && (
          <div className="flex justify-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllItems(!showAllItems)}
              className="text-xs"
            >
              {showAllItems ? (
                <>
                  <ChevronUp size={14} className="mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1" />
                  +{menuItems.length - 3} more items analyzed
                </>
              )}
            </Button>
          </div>
        )}
        
        {dataSource === 'scraped' && (
          <p className="text-xs text-green-700 text-center pt-1">
            🌐 Live data from restaurant website
          </p>
        )}
        
        {dataSource === 'cached' && (
          <p className="text-xs text-blue-700 text-center pt-1">
            💾 Using cached analysis (updated within 7 days)
          </p>
        )}
        
        {hasRestrictions && (
          <p className="text-xs text-orange-700 text-center pt-1">
            🔍 Personalized allergen detection active for your dietary preferences
          </p>
        )}
        
        {!hasRestrictions && (
          <p className="text-xs text-gray-600 text-center pt-1">
            💡 Set dietary preferences in your profile for personalized allergen warnings
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuItemsDisplay;
