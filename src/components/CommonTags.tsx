import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Sparkles } from 'lucide-react';

interface CommonTag {
  name: string;
  color: string;
  description: string;
}

interface CommonTagsProps {
  existingTags: string[];
  onTagCreated?: () => void;
}

const COMMON_TAGS: CommonTag[] = [
  { name: "Date Night", color: "#EC4899", description: "Perfect for romantic evenings" },
  { name: "Family Friendly", color: "#10B981", description: "Great for families with kids" },
  { name: "Quick Lunch", color: "#F59E0B", description: "Fast service for lunch breaks" },
  { name: "Fine Dining", color: "#8B5CF6", description: "Upscale dining experience" },
  { name: "Casual Dining", color: "#3B82F6", description: "Relaxed atmosphere" },
  { name: "Budget Friendly", color: "#22C55E", description: "Great value for money" },
  { name: "Late Night", color: "#6366F1", description: "Open late hours" },
  { name: "Takeout", color: "#F97316", description: "Perfect for ordering to-go" },
  { name: "Group Dining", color: "#14B8A6", description: "Good for large parties" },
  { name: "Business Meeting", color: "#64748B", description: "Professional atmosphere" }
];

const CommonTags: React.FC<CommonTagsProps> = ({ existingTags, onTagCreated }) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const createCommonTag = async (commonTag: CommonTag) => {
    if (!user) return;

    setIsCreating(commonTag.name);
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user.id,
          tag_name: commonTag.name,
          color: commonTag.color
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a tag with this name');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`"${commonTag.name}" tag created successfully!`);
      onTagCreated?.();
    } catch (error) {
      console.error('Error creating common tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setIsCreating(null);
    }
  };

  const availableTags = COMMON_TAGS.filter(tag => 
    !existingTags.includes(tag.name.toLowerCase())
  );

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Quick Start Tags
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get started quickly with these common restaurant tags
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableTags.map((tag) => (
            <div key={tag.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="px-3 py-1"
                  style={{ 
                    backgroundColor: tag.color + '20', 
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                >
                  {tag.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {tag.description}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createCommonTag(tag)}
                disabled={isCreating === tag.name}
                className="ml-2"
              >
                {isCreating === tag.name ? 'Adding...' : 'Add'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommonTags;