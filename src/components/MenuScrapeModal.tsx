import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Utensils, AlertTriangle, Loader2, Globe, Database } from 'lucide-react';
import { MenuItemData, scrapeRestaurantMenu } from '@/services/menuExtractionService';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { toast } from '@/hooks/use-toast';

interface MenuScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantWebsite?: string;
  restaurantName: string;
}

// Allergen keywords mapping
const allergenKeywords: Record<string, string[]> = {
  'Peanuts': ['peanut', 'peanuts', 'groundnut', 'arachis oil', 'peanut oil', 'peanut butter'],
  'Tree Nuts': ['almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'brazil nut', 'macadamia', 'pine nut'],
  'Milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey'],
  'Eggs': ['egg', 'eggs', 'albumin', 'mayonnaise', 'meringue'],
  'Fish': ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'fish sauce'],
  'Shellfish': ['shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'shellfish'],
  'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'gluten', 'semolina', 'bulgur'],
  'Soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame', 'lecithin', 'soy sauce'],
  'Vegetarian': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'ham', 'bacon', 'sausage', 'pepperoni', 'ground beef', 'ground pork', 'ground turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'seafood'],
  'Vegan': ['meat', 'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'ham', 'bacon', 'sausage', 'fish', 'seafood', 'dairy', 'milk', 'cheese', 'butter', 'egg', 'eggs', 'honey', 'gelatin'],
  'Gluten-Free': ['wheat', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'flour', 'beer', 'malt'],
  'Dairy-Free': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey']
};

const isIngredientRestricted = (
  ingredient: string,
  userAllergies: string[],
  userDietaryRestrictions: string[]
): boolean => {
  const normalizedIngredient = ingredient.toLowerCase();
  
  const allUserRestrictions = [
    ...(userAllergies || []),
    ...(userDietaryRestrictions || [])
  ];

  if (allUserRestrictions.length === 0) {
    return false;
  }
  
  return allUserRestrictions.some(restriction => {
    const keywords = allergenKeywords[restriction];
    if (!keywords) return false;
    
    return keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return wordBoundaryRegex.test(normalizedIngredient);
    });
  });
};

const MenuScrapeModal: React.FC<MenuScrapeModalProps> = ({
  isOpen,
  onClose,
  restaurantWebsite,
  restaurantName
}) => {
  const { userPreferences } = useAuth();
  const { incrementRestaurantScrape, canScrapeRestaurant, decrementRestaurantScrape } = useFeatureGates();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const userAllergies = userPreferences?.allergies || [];
  const userDietaryRestrictions = userPreferences?.dietary_preferences || [];
  const hasRestrictions = userAllergies.length > 0 || userDietaryRestrictions.length > 0;

  const handleScrapeMenu = async () => {
    if (!restaurantWebsite || loading) {
      return;
    }

    if (!canScrapeRestaurant()) {
      return;
    }

    setLoading(true);
    setHasAttempted(true);
    
    try {
      // Increment usage before scraping
      const canProceed = await incrementRestaurantScrape();
      if (!canProceed) {
        setLoading(false);
        return;
      }
      
      const result = await scrapeRestaurantMenu(restaurantWebsite);
      
      if (result.error) {
        console.error('Menu scraping failed:', result.error);
        // Decrement usage since scraping failed
        await decrementRestaurantScrape();
        toast({
          title: "Error",
          description: "Failed to scrape menu. Please try again.",
          variant: "destructive"
        });
      } else if (result.menuItems && Array.isArray(result.menuItems) && result.menuItems.length > 0) {
        setMenuItems(result.menuItems);
        toast({
          title: "Success",
          description: "Menu scraped successfully!"
        });
      } else {
        // Decrement usage since no menu items were found
        await decrementRestaurantScrape();
        toast({
          title: "No Menu Found",
          description: "No menu items could be extracted from this website."
        });
      }
      
    } catch (error) {
      console.error('Failed to scrape menu:', error);
      // Decrement usage since scraping failed with an exception
      await decrementRestaurantScrape();
      toast({
        title: "Error",
        description: "Failed to scrape menu. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMenuItems([]);
    setHasAttempted(false);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils size={20} />
            {restaurantName} - Menu Items
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Scraping menu items...
              </div>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              {hasAttempted ? (
                <p className="text-sm text-muted-foreground">
                  Menu analysis attempted - no items extracted
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to scrape the menu from this restaurant's website
                  </p>
                  <Button
                    onClick={handleScrapeMenu}
                    disabled={!canScrapeRestaurant()}
                    className="w-full max-w-xs"
                  >
                    <Utensils size={14} className="mr-2" />
                    {canScrapeRestaurant() ? 'Scrape Menu' : 'Daily Limit Reached'}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    <Globe size={10} className="mr-1" />
                    Live Scraped
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {menuItems.length} items found
                  </span>
                </div>
                
                {menuItems.map((item, index) => (
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
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.ingredients.map((ingredient, idx) => {
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

                      {hasRestrictions && item.ingredients.some(ingredient => 
                        isIngredientRestricted(ingredient, userAllergies, userDietaryRestrictions)
                      ) && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-800 font-medium">
                            ⚠️ Contains ingredients that conflict with your dietary preferences
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Please verify with restaurant before ordering
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuScrapeModal;