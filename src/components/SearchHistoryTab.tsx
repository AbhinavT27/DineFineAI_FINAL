
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSearchHistory, clearSearchHistory, SearchHistoryEntry } from '@/services/searchHistoryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Search, Trash2, Clock, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { SaveHistoryButton } from '@/components/SaveHistoryButton';
import { HistoryAutoDeleteNotice } from '@/components/HistoryAutoDeleteNotice';

const SearchHistoryTab = () => {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchHistory = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      const historyData = await getSearchHistory(user.id);
      setSearchHistory(historyData);
      setLoading(false);
    };

    fetchSearchHistory();
  }, [user?.id]);

  const handleClearHistory = async () => {
    if (!user?.id) return;
    
    await clearSearchHistory(user.id);
    setSearchHistory([]);
    toast.success('Search history cleared successfully');
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
        <h3 className="text-lg font-semibold">Search History</h3>
        {searchHistory.length > 0 && (
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

      {searchHistory.length > 0 ? (
        <div className="space-y-4">
          {searchHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-grow">
                    {entry.search_query && (
                      <div className="flex items-center gap-2 mb-2">
                        <Search size={16} className="text-gray-500" />
                        <span className="font-medium">{entry.search_query}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {entry.cuisine_type && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.cuisine_type}
                        </Badge>
                      )}
                      {entry.price_range && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.price_range}
                        </Badge>
                      )}
                      {entry.dietary_restrictions?.map((restriction) => (
                        <Badge key={restriction} variant="outline" className="text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>

                    {entry.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{entry.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <SaveHistoryButton
                      historyId={entry.id}
                      historyType="search"
                      isSaved={entry.saved || false}
                      onSaveToggle={(saved) => {
                        setSearchHistory(prev => 
                          prev.map(item => 
                            item.id === entry.id ? { ...item, saved } : item
                          )
                        );
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link 
                      to="/home" 
                      state={{ 
                        searchQuery: entry.search_query,
                        cuisineType: entry.cuisine_type,
                        priceRange: entry.price_range,
                        dietaryRestrictions: entry.dietary_restrictions,
                        location: entry.location,
                        coordinates: entry.coordinates
                      }}
                    >
                      Search Again
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center max-w-md">
            <Search size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No search history yet</h3>
            <p className="text-gray-600 mb-6">
              Start searching for restaurants to build your search history!
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

export default SearchHistoryTab;
