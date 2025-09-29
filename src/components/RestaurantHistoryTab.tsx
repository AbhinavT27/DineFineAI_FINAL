import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory, clearHistory, HistoryEntry } from '@/services/historyService';
import HistoryFilters from '@/components/HistoryFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock, Eye, GitCompare, Trash2 } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { toast } from '@/components/ui/sonner';
import { getRestaurantTags } from '@/utils/restaurantTagUtils';
import { SaveHistoryButton } from '@/components/SaveHistoryButton';
import { HistoryAutoDeleteNotice } from '@/components/HistoryAutoDeleteNotice';

const RestaurantHistoryTab = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'all' | 'viewed' | 'compared'>('all');
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedTags: [] as string[],
    priceFilters: [] as string[],
    dietaryFilters: [] as string[],
    allergyFilters: [] as string[]
  });
  const [tagsRefreshTrigger, setTagsRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      const historyData = await getHistory(user.id);
      setHistory(historyData);
      setLoading(false);
    };

    fetchHistory();
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [history, groupBy, filters]);

  const applyFilters = async () => {
    let filtered = history.filter(entry => {
      if (groupBy !== 'all' && entry.action_type !== groupBy) {
        return false;
      }
      return true;
    });

    // Apply search filter
    if (filters.searchQuery) {
      filtered = filtered.filter(entry =>
        entry.restaurant_data.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        entry.restaurant_data.cuisineType.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        entry.restaurant_data.address.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    if (filters.priceFilters.length > 0) {
      filtered = filtered.filter(entry =>
        filters.priceFilters.includes(entry.restaurant_data.priceLevel)
      );
    }

    // Apply dietary filter
    if (filters.dietaryFilters.length > 0) {
      filtered = filtered.filter(entry =>
        entry.restaurant_data.dietaryOptions?.some(option =>
          filters.dietaryFilters.includes(option)
        )
      );
    }

    // Apply tag filter - check if restaurant has ALL selected tags
    if (filters.selectedTags.length > 0 && user?.id) {
      const tagFilteredRestaurants = await Promise.all(
        filtered.map(async (entry) => {
          try {
            const restaurantTags = await getRestaurantTags(entry.restaurant_data.id, user.id);
            const restaurantTagIds = restaurantTags.map(tag => tag.tag_id);
            
            // Check if restaurant has ALL selected tags
            const hasAllTags = filters.selectedTags.every(tagId => 
              restaurantTagIds.includes(tagId)
            );
            
            return hasAllTags ? entry : null;
          } catch (error) {
            console.error('Error checking restaurant tags:', error);
            return null;
          }
        })
      );
      
      filtered = tagFilteredRestaurants.filter(entry => entry !== null) as HistoryEntry[];
    }

    // Apply allergy filter (checking against dietary options as a fallback)
    if (filters.allergyFilters.length > 0) {
      filtered = filtered.filter(entry => {
        // Check if restaurant has dietary options that avoid the selected allergies
        // For example, if "Gluten" is selected as an allergy, show restaurants with "Gluten-Free" option
        const allergyFriendlyOptions = filters.allergyFilters.map(allergy => {
          switch (allergy) {
            case 'Gluten': return 'Gluten-Free';
            case 'Dairy': return 'Dairy-Free';
            case 'Nuts': return 'Nut-Free';
            default: return `${allergy}-Free`;
          }
        });
        
        return entry.restaurant_data.dietaryOptions?.some(option =>
          allergyFriendlyOptions.includes(option)
        ) || false;
      });
    }

    setFilteredHistory(filtered);
  };

  const handleClearHistory = async () => {
    if (!user?.id) return;
    
    await clearHistory(user.id);
    setHistory([]);
    toast.success('Restaurant history cleared successfully');
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleTagsRefresh = () => {
    setTagsRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'viewed':
        return <Eye size={16} className="text-blue-500" />;
      case 'compared':
        return <GitCompare size={16} className="text-green-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'compared':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionText = (actionType: string) => {
    switch (actionType) {
      case 'viewed':
        return 'Visited';
      case 'compared':
        return 'Compared';
      default:
        return actionType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foodRed"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HistoryAutoDeleteNotice />
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Restaurant History</h3>
        {history.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700"
            size="sm"
          >
            <Trash2 size={16} className="mr-2" />
            Clear History
          </Button>
        )}
      </div>

      {/* Search and Filter Component */}
      <HistoryFilters 
        onFiltersChange={handleFiltersChange} 
        onTagsRefresh={tagsRefreshTrigger > 0 ? handleTagsRefresh : undefined}
      />

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={groupBy === 'all' ? 'default' : 'outline'}
          onClick={() => setGroupBy('all')}
          className={groupBy === 'all' ? 'bg-foodRed hover:bg-foodRed/90' : ''}
          size="sm"
        >
          All ({history.length})
        </Button>
        <Button
          variant={groupBy === 'viewed' ? 'default' : 'outline'}
          onClick={() => setGroupBy('viewed')}
          className={groupBy === 'viewed' ? 'bg-foodRed hover:bg-foodRed/90' : ''}
          size="sm"
        >
          Visited ({history.filter(h => h.action_type === 'viewed').length})
        </Button>
        <Button
          variant={groupBy === 'compared' ? 'default' : 'outline'}
          onClick={() => setGroupBy('compared')}
          className={groupBy === 'compared' ? 'bg-foodRed hover:bg-foodRed/90' : ''}
          size="sm"
        >
          Compared ({history.filter(h => h.action_type === 'compared').length})
        </Button>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                    <img
                      src={entry.restaurant_data.imageUrl}
                      alt={entry.restaurant_data.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-grow">
                        <Link 
                          to={`/restaurant/${entry.restaurant_data.id}`}
                          state={{ fromHistory: true }}
                          className="text-lg font-semibold hover:text-foodRed transition-colors line-clamp-1"
                        >
                          {entry.restaurant_data.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <StarRating rating={entry.restaurant_data.rating} size={14} />
                            <span className="text-sm text-gray-600">
                              {entry.restaurant_data.rating}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {entry.restaurant_data.priceLevel}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {entry.restaurant_data.cuisineType}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <SaveHistoryButton
                          historyId={entry.id}
                          historyType="restaurant"
                          isSaved={entry.saved || false}
                          onSaveToggle={(saved) => {
                            setHistory(prev => 
                              prev.map(item => 
                                item.id === entry.id ? { ...item, saved } : item
                              )
                            );
                          }}
                        />
                        <Badge className={`${getActionColor(entry.action_type)} border`}>
                          <div className="flex items-center gap-1">
                            {getActionIcon(entry.action_type)}
                            {getActionText(entry.action_type)}
                          </div>
                        </Badge>
                        <span className="text-xs text-gray-500 text-right">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="truncate">{entry.restaurant_data.address}</span>
                      {entry.restaurant_data.distance && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap">{entry.restaurant_data.distance}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center max-w-md">
            <Clock size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filters.searchQuery || filters.selectedTags.length > 0 || filters.priceFilters.length > 0 || filters.dietaryFilters.length > 0 || filters.allergyFilters.length > 0
                ? 'No restaurants match your filters'
                : groupBy === 'all' ? 'No restaurant history yet' : `No ${groupBy} restaurants yet`
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {filters.searchQuery || filters.selectedTags.length > 0 || filters.priceFilters.length > 0 || filters.dietaryFilters.length > 0 || filters.allergyFilters.length > 0
                ? 'Try adjusting your search or filter criteria.'
                : groupBy === 'all' 
                  ? 'Start exploring restaurants to build your history!'
                  : `You haven't ${groupBy} any restaurants yet.`
              }
            </p>
            <Button asChild variant="default" className="bg-foodRed hover:bg-foodRed/90">
              <Link to="/home">Browse Restaurants</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantHistoryTab;
