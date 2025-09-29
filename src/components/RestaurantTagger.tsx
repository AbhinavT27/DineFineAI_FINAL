import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Tag, Plus } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import { addTaggedRestaurant } from '@/services/taggedRestaurantsService';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGate from './FeatureGate';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
}

interface RestaurantTag {
  id: string;
  tag_id: string;
  user_tags: UserTag;
}

interface RestaurantTaggerProps {
  restaurant: Restaurant;
  onTagsChange?: () => void;
  onTagsUpdated?: () => void;
  className?: string;
  compact?: boolean;
  hasExistingTags?: boolean;
}

const RestaurantTagger: React.FC<RestaurantTaggerProps> = ({ 
  restaurant, 
  onTagsChange, 
  onTagsUpdated, 
  className,
  compact = false,
  hasExistingTags = false
}) => {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [restaurantTags, setRestaurantTags] = useState<RestaurantTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserTags();
      fetchRestaurantTags();
    }
  }, [user, restaurant.id]);

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
      toast.error('Failed to load tags');
    }
  };

  const fetchRestaurantTags = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tags')
        .select(`
          id,
          tag_id,
          user_tags (
            id,
            tag_name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;
      setRestaurantTags(data || []);
    } catch (error) {
      console.error('Error fetching restaurant tags:', error);
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsCreatingTag(true);
    try {
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user?.id,
          tag_name: newTagName.trim(),
          color: randomColor
        })
        .select()
        .single();

      if (error) throw error;

      await fetchUserTags();
      setNewTagName('');
      toast.success('Tag created successfully');
      
      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('tagCreated'));
      
      // Auto-apply the new tag to the restaurant
      if (data && user?.id) {
        await handleTagToggle(data.id, true);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleTagToggle = async (tagId: string, isChecked: boolean) => {
    setIsLoading(true);
    try {
      if (isChecked) {
        const { error } = await supabase
          .from('restaurant_tags')
          .insert({
            user_id: user?.id,
            restaurant_id: restaurant.id,
            tag_id: tagId
          });

        if (error) throw error;
        
        // Add to tagged restaurants table
        if (user?.id) {
          try {
            await addTaggedRestaurant(restaurant, user.id);
          } catch (taggedError) {
            console.error('Failed to add to tagged restaurants:', taggedError);
            // Don't show error to user as the main tagging still worked
          }
        }
        
        toast.success('Tag added to restaurant');
      } else {
        const { error } = await supabase
          .from('restaurant_tags')
          .delete()
          .eq('user_id', user?.id)
          .eq('restaurant_id', restaurant.id)
          .eq('tag_id', tagId);

        if (error) throw error;
        toast.success('Tag removed from restaurant');
      }

      await fetchRestaurantTags();
      onTagsChange?.();
      onTagsUpdated?.();
    } catch (error) {
      console.error('Error toggling tag:', error);
      toast.error('Failed to update tag');
    } finally {
      setIsLoading(false);
    }
  };

  const isTagSelected = (tagId: string) => {
    return restaurantTags.some(rt => rt.tag_id === tagId);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDialogOpen(true);
  };

  if (!user) {
    return null;
  }

  // Check if tagging feature is allowed - only show for premium users
  if (!limits.canCreateTags) {
    return null;
  }

  // For premium users, show the button even if no tags exist yet
  // This allows them to create their first tag

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`${className} bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors duration-200 px-3 py-2`}
          onClick={handleButtonClick}
        >
          <Tag className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            {compact ? (hasExistingTags ? "Tags" : "Tag") : "Tag Restaurant"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-lg">Tag "{restaurant.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create new tag section */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Create New Tag</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewTag()}
              />
              <Button
                size="sm"
                onClick={createNewTag}
                disabled={isCreatingTag || !newTagName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing tags */}
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {userTags.length > 0 ? (
              userTags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={tag.id}
                    checked={isTagSelected(tag.id)}
                    onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <label htmlFor={tag.id} className="cursor-pointer flex-1">
                    <Badge
                      variant="secondary"
                      className="text-sm px-3 py-1"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.tag_name}
                    </Badge>
                  </label>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No tags created yet.</p>
                <p className="text-xs">Create your first tag above to get started!</p>
              </div>
            )}
          </div>

          {restaurantTags.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Current Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {restaurantTags.map((rt) => (
                  <Badge
                    key={rt.id}
                    variant="secondary"
                    className="px-3 py-1"
                    style={{ 
                      backgroundColor: rt.user_tags.color + '20', 
                      color: rt.user_tags.color 
                    }}
                  >
                    {rt.user_tags.tag_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantTagger;
