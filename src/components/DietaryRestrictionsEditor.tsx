
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

const COMMON_DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan', 
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Halal',
  'Kosher',
  'Low-Sodium'
];

const DietaryRestrictionsEditor = () => {
  const { user, userPreferences, refreshUserPreferences } = useAuth();
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userPreferences?.dietary_preferences) {
      setSelectedRestrictions(userPreferences.dietary_preferences);
    }
  }, [userPreferences]);

  const handleRestrictionToggle = (restriction: string) => {
    setSelectedRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleAddCustomRestriction = () => {
    if (customRestriction.trim() && !selectedRestrictions.includes(customRestriction.trim())) {
      setSelectedRestrictions(prev => [...prev, customRestriction.trim()]);
      setCustomRestriction('');
    }
  };

  const handleRemoveRestriction = (restriction: string) => {
    setSelectedRestrictions(prev => prev.filter(r => r !== restriction));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dietary_preferences: selectedRestrictions })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserPreferences();
      toast.success('Dietary preferences updated successfully!');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error updating dietary preferences:', error);
      toast.error('Failed to update dietary preferences');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dietary Preferences</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-foodRed hover:text-foodRed/80"
          >
            <Plus size={16} className="mr-1" />
            Edit
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRestrictions.length > 0 ? (
            selectedRestrictions.map((restriction) => (
              <Badge key={restriction} variant="secondary" className="bg-green-100 text-green-800">
                {restriction}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500">No dietary preferences set</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Edit Dietary Preferences</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {COMMON_DIETARY_RESTRICTIONS.map((restriction) => (
            <Badge
              key={restriction}
              variant={selectedRestrictions.includes(restriction) ? "default" : "outline"}
              className={`cursor-pointer hover:opacity-80 ${
                selectedRestrictions.includes(restriction) 
                  ? 'bg-foodRed text-white' 
                  : 'hover:border-foodRed'
              }`}
              onClick={() => handleRestrictionToggle(restriction)}
            >
              {restriction}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add custom dietary preference..."
            value={customRestriction}
            onChange={(e) => setCustomRestriction(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomRestriction()}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustomRestriction}
            disabled={!customRestriction.trim()}
          >
            Add
          </Button>
        </div>

        {selectedRestrictions.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Selected preferences:</span>
            <div className="flex flex-wrap gap-2">
              {selectedRestrictions.map((restriction) => (
                <Badge
                  key={restriction}
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {restriction}
                  <X
                    size={14}
                    className="ml-1 cursor-pointer hover:text-red-600"
                    onClick={() => handleRemoveRestriction(restriction)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-foodRed hover:bg-foodRed/90"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRestrictions(userPreferences?.dietary_preferences || []);
              setIsExpanded(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DietaryRestrictionsEditor;
