import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Utensils, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItemData } from '@/services/menuExtractionService';

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

const ScrapeMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userPreferences } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);

  const restaurantName = searchParams.get('restaurant') || 'Restaurant';
  const menuData = searchParams.get('menuData');

  // Get user restrictions
  const userAllergies = userPreferences?.allergies || [];
  const userDietaryRestrictions = userPreferences?.dietary_preferences || [];
  const hasRestrictions = userAllergies.length > 0 || userDietaryRestrictions.length > 0;

  useEffect(() => {
    if (menuData) {
      try {
        const parsedMenuData = JSON.parse(decodeURIComponent(menuData));
        setMenuItems(parsedMenuData);
      } catch (error) {
        console.error('Failed to parse menu data:', error);
        navigate('/search-results');
      }
    } else {
      navigate('/search-results');
    }
  }, [menuData, navigate]);

  const handleBackToResults = () => {
    navigate('/search-results');
  };

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToResults}
              className="mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Search Results
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils size={20} />
                {restaurantName} - Menu Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No menu items found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToResults}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Search Results
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground">
            {restaurantName} - Menu Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Scraped menu items with ingredient analysis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils size={20} />
              Menu Items & Ingredients
              <Badge variant="outline" className="ml-auto">
                {menuItems.length} items analyzed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh]">
              <div className="space-y-6 pr-4">
                {menuItems.map((item, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{item.dish}</h3>
                      {item.price && (
                        <span className="text-lg font-medium text-primary">{item.price}</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ingredients:</p>
                      <div className="flex flex-wrap gap-2">
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
                              className={`text-sm px-3 py-1 ${
                                isRestricted ? 'bg-destructive/10 text-destructive border-destructive/20' : ''
                              }`}
                            >
                              {isRestricted && <AlertTriangle size={12} className="mr-1" />}
                              {ingredient}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {hasRestrictions && item.ingredients.some(ingredient => 
                      isIngredientRestricted(ingredient, userAllergies, userDietaryRestrictions)
                    ) && (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Contains ingredients that conflict with your dietary preferences
                        </p>
                        <p className="text-xs text-destructive/80 mt-1">
                          Please verify with restaurant before ordering
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 pt-4 border-t space-y-2">
              <p className="text-sm text-green-600 text-center">
                🌐 Live data scraped from restaurant website
              </p>
              
              {hasRestrictions && (
                <p className="text-sm text-orange-600 text-center">
                  🔍 Personalized allergen detection active for your dietary preferences
                </p>
              )}
              
              {!hasRestrictions && (
                <p className="text-sm text-muted-foreground text-center">
                  💡 Set dietary preferences in your profile for personalized allergen warnings
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScrapeMenu;