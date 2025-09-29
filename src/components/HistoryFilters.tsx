
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X, Tag, DollarSign, ShieldAlert, Utensils } from 'lucide-react';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
}

interface HistoryFiltersProps {
  onFiltersChange: (filters: {
    searchQuery: string;
    selectedTags: string[];
    priceFilters: string[];
    dietaryFilters: string[];
    allergyFilters: string[];
  }) => void;
  onTagsRefresh?: () => void;
}

const PRICE_OPTIONS = ['$', '$$', '$$$', '$$$$'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher'];
const ALLERGY_OPTIONS = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Eggs', 'Fish', 'Sesame'];

const HistoryFilters: React.FC<HistoryFiltersProps> = ({ onFiltersChange, onTagsRefresh }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceFilters, setPriceFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [allergyFilters, setAllergyFilters] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserTags();
    }
  }, [user]);

  // Listen for custom tag creation events
  useEffect(() => {
    const handleTagCreated = () => {
      fetchUserTags();
    };

    window.addEventListener('tagCreated', handleTagCreated);
    return () => {
      window.removeEventListener('tagCreated', handleTagCreated);
    };
  }, []);

  useEffect(() => {
    if (onTagsRefresh) {
      fetchUserTags();
    }
  }, [onTagsRefresh]);

  useEffect(() => {
    onFiltersChange({
      searchQuery,
      selectedTags,
      priceFilters,
      dietaryFilters,
      allergyFilters
    });
  }, [searchQuery, selectedTags, priceFilters, dietaryFilters, allergyFilters, onFiltersChange]);

  const fetchUserTags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('tag_name');

      if (error) throw error;
      setUserTags(data || []);
    } catch (error) {
      console.error('Error fetching user tags:', error);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handlePriceToggle = (price: string) => {
    setPriceFilters(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

  const handleDietaryToggle = (dietary: string) => {
    setDietaryFilters(prev => 
      prev.includes(dietary) 
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
  };

  const handleAllergyToggle = (allergy: string) => {
    setAllergyFilters(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setPriceFilters([]);
    setDietaryFilters([]);
    setAllergyFilters([]);
  };

  const hasActiveFilters = selectedTags.length > 0 || priceFilters.length > 0 || 
                          dietaryFilters.length > 0 || allergyFilters.length > 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Tags Filter */}
          {userTags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium">Filter by Tags</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {userTags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag.id}
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <label 
                          htmlFor={tag.id} 
                          className="text-sm cursor-pointer flex items-center gap-1"
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.tag_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Price Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Price
                {priceFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {priceFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-3">
                <h4 className="font-medium">Filter by Price</h4>
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_OPTIONS.map((price) => (
                    <div key={price} className="flex items-center space-x-2">
                      <Checkbox
                        id={price}
                        checked={priceFilters.includes(price)}
                        onCheckedChange={() => handlePriceToggle(price)}
                      />
                      <label htmlFor={price} className="text-sm cursor-pointer">
                        {price}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Dietary Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Utensils className="h-4 w-4" />
                Dietary
                {dietaryFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {dietaryFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-medium">Filter by Dietary Preferences</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DIETARY_OPTIONS.map((dietary) => (
                    <div key={dietary} className="flex items-center space-x-2">
                      <Checkbox
                        id={dietary}
                        checked={dietaryFilters.includes(dietary)}
                        onCheckedChange={() => handleDietaryToggle(dietary)}
                      />
                      <label htmlFor={dietary} className="text-sm cursor-pointer">
                        {dietary}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Allergy Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                Allergies
                {allergyFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {allergyFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-medium">Filter by Allergies</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGY_OPTIONS.map((allergy) => (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Checkbox
                        id={allergy}
                        checked={allergyFilters.includes(allergy)}
                        onCheckedChange={() => handleAllergyToggle(allergy)}
                      />
                      <label htmlFor={allergy} className="text-sm cursor-pointer">
                        {allergy}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagId) => {
              const tag = userTags.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="secondary" className="gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.tag_name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTagToggle(tagId)} 
                  />
                </Badge>
              ) : null;
            })}
            {priceFilters.map((price) => (
              <Badge key={price} variant="secondary" className="gap-1">
                {price}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handlePriceToggle(price)} 
                />
              </Badge>
            ))}
            {dietaryFilters.map((dietary) => (
              <Badge key={dietary} variant="secondary" className="gap-1">
                {dietary}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleDietaryToggle(dietary)} 
                />
              </Badge>
            ))}
            {allergyFilters.map((allergy) => (
              <Badge key={allergy} variant="secondary" className="gap-1">
                {allergy}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleAllergyToggle(allergy)} 
                />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryFilters;
