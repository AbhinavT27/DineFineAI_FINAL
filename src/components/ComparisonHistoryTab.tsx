import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ComparisonHistory, getComparisonHistory, deleteComparisonHistory } from '@/services/comparisonHistoryService';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import StarRating from '@/components/StarRating';
import { SaveHistoryButton } from '@/components/SaveHistoryButton';
import { HistoryAutoDeleteNotice } from '@/components/HistoryAutoDeleteNotice';

const ComparisonHistoryTab = () => {
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchComparisonHistory();
    }
  }, [user?.id]);

  const fetchComparisonHistory = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await getComparisonHistory(user.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load comparison history",
        variant: "destructive",
      });
    } else {
      setComparisonHistory(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (comparisonId: string) => {
    const { error } = await deleteComparisonHistory(comparisonId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete comparison",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Comparison deleted successfully",
      });
      setComparisonHistory(prev => prev.filter(c => c.id !== comparisonId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (comparisonHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Comparison History</h3>
          <p className="text-muted-foreground mb-4">
            You haven't compared any restaurants yet. Start comparing restaurants to see them here.
          </p>
          <Button asChild>
            <Link to="/">Find Restaurants</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <HistoryAutoDeleteNotice />
      {comparisonHistory.map((comparison) => (
        <Card key={comparison.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Restaurant Comparison ({comparison.comparison_data.length} restaurants)
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <SaveHistoryButton
                  historyId={comparison.id}
                  historyType="comparison"
                  isSaved={comparison.saved || false}
                  onSaveToggle={(saved) => {
                    setComparisonHistory(prev => 
                      prev.map(item => 
                        item.id === comparison.id ? { ...item, saved } : item
                      )
                    );
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comparison.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(comparison.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {comparison.comparison_data.map((restaurant, index) => (
                <div key={restaurant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{restaurant.name}</h4>
                        <div className="flex items-center gap-2">
                          <StarRating rating={restaurant.rating} size={14} />
                          <span className="text-sm text-muted-foreground">
                            {restaurant.rating} • {restaurant.cuisineType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">{restaurant.priceLevel}</Badge>
                    <span className="text-sm text-muted-foreground">{restaurant.distance}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Link 
                  to="/comparison"
                  state={{ 
                    comparisonRestaurants: comparison.comparison_data,
                    fromHistory: true 
                  }}
                >
                  View Comparison Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComparisonHistoryTab;