
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
}

interface RestaurantTagFilterProps {
  onTagsChange: (tagIds: string[]) => void;
  selectedTagIds: string[];
}

const RestaurantTagFilter: React.FC<RestaurantTagFilterProps> = ({ onTagsChange, selectedTagIds }) => {
  const { user } = useAuth();
  const [userTags, setUserTags] = useState<UserTag[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserTags();
    }
  }, [user]);

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
    const newSelectedTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagsChange(newSelectedTags);
  };

  const clearAllFilters = () => {
    onTagsChange([]);
  };

  const selectedTags = userTags.filter(tag => selectedTagIds.includes(tag.id));

  if (userTags.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter by Tags
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.tag_name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:opacity-70" 
                    onClick={() => handleTagToggle(tag.id)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {userTags.map((tag) => (
            <Button
              key={tag.id}
              variant="outline"
              size="sm"
              onClick={() => handleTagToggle(tag.id)}
              className={`justify-start ${
                selectedTagIds.includes(tag.id) 
                  ? 'border-red-500 border-2' 
                  : ''
              }`}
            >
              <Badge
                variant="secondary"
                className="mr-2 text-xs"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.tag_name}
              </Badge>
            </Button>
          ))}
          {selectedTagIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantTagFilter;
