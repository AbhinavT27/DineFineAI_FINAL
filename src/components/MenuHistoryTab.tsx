import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type MenuHistory = Database['public']['Tables']['ai_generated_menus']['Row'];

const MenuHistoryTab = () => {
  const [menuHistory, setMenuHistory] = useState<MenuHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuHistory();
  }, []);

  const fetchMenuHistory = async () => {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data, error } = await supabase
        .from('ai_generated_menus')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuHistory((data || []) as MenuHistory[]);
    } catch (error) {
      console.error('Error fetching menu history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (menuHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Menu History</h3>
        <p className="text-muted-foreground mb-4">
          You haven't scraped any restaurant menus in the last day.
        </p>
        <Link to="/search-results">
          <Button>Find Restaurants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          History items are automatically deleted after 1 day to keep your data fresh.
        </AlertDescription>
      </Alert>

      {menuHistory.map((menu) => (
        <Card key={menu.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {menu.restaurant_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{menu.location}</p>
            <p className="text-xs text-muted-foreground">
              Scraped {new Date(menu.created_at).toLocaleDateString()} at{' '}
              {new Date(menu.created_at).toLocaleTimeString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {Array.isArray(menu.menu_items) ? menu.menu_items.length : 0} menu items found
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {Array.isArray(menu.menu_items) && menu.menu_items.slice(0, 10).map((item: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary/20 pl-3 py-1">
                    <p className="font-medium text-sm">{item.menu_item || item.name}</p>
                    {item.ingredients && (
                      <p className="text-xs text-muted-foreground">
                        {Array.isArray(item.ingredients) 
                          ? item.ingredients.join(', ') 
                          : item.ingredients}
                      </p>
                    )}
                    {item.calories && (
                      <p className="text-xs text-muted-foreground">
                        Calories: {item.calories}
                      </p>
                    )}
                  </div>
                ))}
                {Array.isArray(menu.menu_items) && menu.menu_items.length > 10 && (
                  <p className="text-xs text-muted-foreground italic">
                    + {menu.menu_items.length - 10} more items
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MenuHistoryTab;
