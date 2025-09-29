
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChefHat } from 'lucide-react';
import { MenuAnalysisResult, analyzeRestaurantMenu } from '@/services/menuAnalysisService';
import { useAuth } from '@/contexts/AuthContext';

interface MenuAnalysisProps {
  restaurantWebsite?: string;
  searchQuery: string;
  className?: string;
}

const MenuAnalysis: React.FC<MenuAnalysisProps> = ({ 
  restaurantWebsite, 
  searchQuery, 
  className 
}) => {
  const { userPreferences } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyzeMenu = async () => {
    if (!restaurantWebsite || !userPreferences) return;
    
    setIsLoading(true);
    try {
      const results = await analyzeRestaurantMenu(
        restaurantWebsite,
        searchQuery,
        userPreferences.allergies || [],
        userPreferences.dietary_preferences || []
      );
      setMenuItems(results);
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!restaurantWebsite) {
    return null;
  }

  return (
    <div className={className}>
      {!hasAnalyzed && !isLoading && (
        <button
          onClick={handleAnalyzeMenu}
          className="flex items-center gap-2 text-sm text-foodRed hover:text-foodRed/80 transition-colors"
        >
          <ChefHat size={16} />
          Analyze Menu
        </button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Analyzing menu...
        </div>
      )}

      {hasAnalyzed && menuItems.length > 0 && (
        <Card className="mt-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ChefHat size={16} />
              Menu Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {menuItems.slice(0, 3).map((item, index) => (
              <div key={index} className="border-b border-muted pb-3 last:border-b-0 last:pb-0">
                <h4 className="font-medium text-sm mb-2">{item.dish}</h4>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ingredient, idx) => {
                    const isRestricted = item.contains_restricted?.includes(ingredient);
                    return (
                      <Badge
                        key={idx}
                        variant={isRestricted ? "destructive" : "outline"}
                        className={`text-xs ${isRestricted ? 'bg-red-100 text-red-800 border-red-300' : ''}`}
                      >
                        {ingredient}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
            {menuItems.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{menuItems.length - 3} more items available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {hasAnalyzed && menuItems.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          No menu information available for this restaurant.
        </p>
      )}
    </div>
  );
};

export default MenuAnalysis;
