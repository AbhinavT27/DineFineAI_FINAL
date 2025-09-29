
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
  'Nut-Free'
];

const ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Wheat',
  'Soy'
];

const DietaryAndAllergyEditor = () => {
  const { user, userPreferences, refreshUserPreferences } = useAuth();
  const [selectedDietaryPreferences, setSelectedDietaryPreferences] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customDietaryPreference, setCustomDietaryPreference] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userPreferences?.dietary_preferences) {
      setSelectedDietaryPreferences(userPreferences.dietary_preferences);
    }
    if (userPreferences?.allergies) {
      setSelectedAllergies(userPreferences.allergies);
    }
  }, [userPreferences]);

  const handleDietaryPreferenceToggle = (preference: string) => {
    setSelectedDietaryPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleAllergyToggle = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleAddCustomDietaryPreference = () => {
    if (customDietaryPreference.trim() && !selectedDietaryPreferences.includes(customDietaryPreference.trim())) {
      setSelectedDietaryPreferences(prev => [...prev, customDietaryPreference.trim()]);
      setCustomDietaryPreference('');
    }
  };

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleRemoveDietaryPreference = (preference: string) => {
    setSelectedDietaryPreferences(prev => prev.filter(p => p !== preference));
  };

  const handleRemoveAllergy = (allergy: string) => {
    setSelectedAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          dietary_preferences: selectedDietaryPreferences,
          allergies: selectedAllergies
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserPreferences();
      toast.success('Dietary preferences and allergies updated successfully!');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error updating dietary preferences and allergies:', error);
      toast.error('Failed to update dietary preferences and allergies');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Dietary Preferences and Allergies</span>
        
        {/* Clickable Box Container */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
        >
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {selectedDietaryPreferences.length > 0 || selectedAllergies.length > 0 ? (
                <>
                  {selectedDietaryPreferences.map((preference) => (
                    <Badge key={preference} variant="secondary" className="bg-green-100 text-green-800">
                      {preference}
                    </Badge>
                  ))}
                  {selectedAllergies.map((allergy) => (
                    <Badge key={allergy} variant="secondary" className="bg-red-100 text-red-800">
                      {allergy}
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-sm text-gray-500">No dietary preferences or allergies set</span>
              )}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Edit Dietary Preferences and Allergies</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <X size={16} />
        </Button>
      </div>

      {/* Dietary Preferences Section */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Dietary Preferences</h4>
        <p className="text-sm text-gray-600">Select your dietary preferences to help us find the best restaurants for you</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DIETARY_PREFERENCES.map((preference) => (
            <div key={preference} className="flex items-center space-x-2">
              <Checkbox
                id={`dietary-${preference}`}
                checked={selectedDietaryPreferences.includes(preference)}
                onCheckedChange={() => handleDietaryPreferenceToggle(preference)}
              />
              <Label htmlFor={`dietary-${preference}`} className="text-sm cursor-pointer">
                {preference}
              </Label>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a custom dietary preference"
            value={customDietaryPreference}
            onChange={(e) => setCustomDietaryPreference(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomDietaryPreference()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomDietaryPreference}
            disabled={!customDietaryPreference.trim()}
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>

        {selectedDietaryPreferences.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedDietaryPreferences.map((preference) => (
              <Badge
                key={preference}
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {preference}
                <X
                  size={14}
                  className="ml-1 cursor-pointer hover:text-red-600"
                  onClick={() => handleRemoveDietaryPreference(preference)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Allergies Section */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Allergies</h4>
        <p className="text-sm text-gray-600">Select any food allergies to help us find safe restaurants for you</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALLERGIES.map((allergy) => (
            <div key={allergy} className="flex items-center space-x-2">
              <Checkbox
                id={`allergy-${allergy}`}
                checked={selectedAllergies.includes(allergy)}
                onCheckedChange={() => handleAllergyToggle(allergy)}
              />
              <Label htmlFor={`allergy-${allergy}`} className="text-sm cursor-pointer">
                {allergy}
              </Label>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a custom allergy"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAllergy()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomAllergy}
            disabled={!customAllergy.trim()}
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>

        {selectedAllergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedAllergies.map((allergy) => (
              <Badge
                key={allergy}
                variant="secondary"
                className="bg-red-100 text-red-800"
              >
                {allergy}
                <X
                  size={14}
                  className="ml-1 cursor-pointer hover:text-red-600"
                  onClick={() => handleRemoveAllergy(allergy)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="bg-foodRed hover:bg-foodRed/90"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDietaryPreferences(userPreferences?.dietary_preferences || []);
            setSelectedAllergies(userPreferences?.allergies || []);
            setIsExpanded(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default DietaryAndAllergyEditor;
