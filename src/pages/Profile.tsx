import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, Settings, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountDetailsDialog } from '@/components/AccountDetailsDialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';

// Same dietary and allergy options from SearchForm component
const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free'];
const allergyOptions = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Wheat', 'Soy'];

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { changeLanguage, availableLanguages, currentLanguage } = useLanguage();
  const {
    user,
    userPreferences,
    refreshUserPreferences,
    isNewUser,
    setIsNewUser
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileFromUrl, setIsProfileFromUrl] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  // Form states
  const [username, setUsername] = useState(userPreferences?.username || '');
  const [distanceUnit, setDistanceUnit] = useState(userPreferences?.distance_unit || 'miles');
  const [language, setLanguage] = useState(userPreferences?.language || 'en');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(userPreferences?.dietary_preferences || []);
  const [allergies, setAllergies] = useState<string[]>(userPreferences?.allergies || []);
  const [newDietaryPreference, setNewDietaryPreference] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Update form when userPreferences changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newUserParam = params.get('newUser') === 'true';
    if (newUserParam) {
      setIsProfileFromUrl(true);
      setIsNewUser(true);
    }

    if (userPreferences) {
      setUsername(userPreferences.username || '');
      setDistanceUnit(userPreferences.distance_unit || 'miles');
      setLanguage(userPreferences.language || 'en');
      setDietaryPreferences(userPreferences.dietary_preferences || []);
      setAllergies(userPreferences.allergies || []);
    }
  }, [userPreferences, setIsNewUser]);

  // Handle dietary preference checkbox change
  const handleDietaryChange = (option: string) => {
    setDietaryPreferences(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  // Handle allergy checkbox change
  const handleAllergyChange = (option: string) => {
    setAllergies(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  // Add new dietary preference
  const addDietaryPreference = () => {
    if (!newDietaryPreference.trim()) return;

    if (dietaryPreferences.includes(newDietaryPreference.trim())) {
      toast.error(t('profile.dietaryExists', 'This dietary preference already exists'));
      return;
    }
    setDietaryPreferences([...dietaryPreferences, newDietaryPreference.trim()]);
    setNewDietaryPreference('');
  };

  // Remove dietary preference
  const removeDietaryPreference = (preference: string) => {
    setDietaryPreferences(dietaryPreferences.filter(item => item !== preference));
  };

  // Add new allergy
  const addAllergy = () => {
    if (!newAllergy.trim()) return;

    if (allergies.includes(newAllergy.trim())) {
      toast.error(t('profile.allergyExists', 'This allergy already exists'));
      return;
    }
    setAllergies([...allergies, newAllergy.trim()]);
    setNewAllergy('');
  };

  // Remove allergy
  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(item => item !== allergy));
  };

  // Navigate to home after skipping preferences
  const handleSkip = () => {
    setIsNewUser(false); // No longer a new user
    navigate('/home');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to update your profile');
      navigate('/auth');
      return;
    }
    setIsLoading(true);
    try {
      // Update language in i18n
      changeLanguage(language);
      
      const {
        error
      } = await supabase.from('profiles').update({
        username,
        distance_unit: distanceUnit,
        language,
        dietary_preferences: dietaryPreferences,
        allergies
      }).eq('id', user.id);
      if (error) throw error;

      await refreshUserPreferences();
      setIsNewUser(false); // No longer a new user after saving

      if (isProfileFromUrl) {
        navigate('/home', {
          replace: true
        });
        } else {
          toast.success(t('profile.updateSuccess', 'Profile updated successfully'));
          navigate('/home');
        }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || t('profile.updateError', 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="container max-w-4xl mx-auto px-4 py-8">
      {isNewUser && <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <p className="text-blue-700 font-medium">{t('welcome.newUser')}</p>
          <p className="text-blue-600">{t('welcome.newUserDesc')}</p>
        </div>}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('profile.title')}</CardTitle>
          <CardDescription>
            {t('profile.description')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('profile.accountInfo')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('common.username')}</Label>
                  <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('common.username')} required />
                </div>
                
                <div className="space-y-2">
                  <Label>{t('profile.accountDetails', 'Account Details')}</Label>
                  <Button type="button" variant="outline" onClick={() => setShowAccountDetails(true)} className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('profile.changePassword')}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.changePasswordDesc')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="distance-unit">{t('profile.distanceUnit')}</Label>
                  <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('profile.selectDistanceUnit', 'Select distance unit')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">{t('profile.miles')}</SelectItem>
                      <SelectItem value="km">{t('profile.kilometers')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t('common.language')}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('profile.selectLanguageDesc')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.nativeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('profile.theme', 'Theme')}</Label>
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">
                      {t('profile.themeDesc', 'Toggle between light and dark mode')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('profile.dietaryPreferences')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('profile.dietaryDesc')}
              </p>
              
              {/* Dietary checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dietaryOptions.map(option => <div key={option} className="flex items-center space-x-2">
                    <Checkbox id={`dietary-${option}`} checked={dietaryPreferences.includes(option)} onCheckedChange={() => handleDietaryChange(option)} />
                    <Label htmlFor={`dietary-${option}`} className="text-sm">{option}</Label>
                  </div>)}
              </div>
              
              {/* Custom dietary preferences that are already added */}
              <div className="flex flex-wrap gap-2">
                {dietaryPreferences.filter(pref => !dietaryOptions.includes(pref)).map(preference => <Badge key={preference} variant="secondary" className="py-1.5">
                      {preference}
                      <button type="button" onClick={() => removeDietaryPreference(preference)} className="ml-1 text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {preference}</span>
                      </button>
                    </Badge>)}
              </div>
              
              {/* Add custom dietary preference */}
              <div className="flex space-x-2">
                <Input value={newDietaryPreference} onChange={e => setNewDietaryPreference(e.target.value)} placeholder={t('profile.addCustomDietary')} className="flex-1" />
                <Button type="button" variant="outline" onClick={addDietaryPreference}>
                  <PlusCircle className="h-4 w-4 mr-1" /> {t('profile.add')}
                </Button>
              </div>
            </div>
            
            {/* Allergies */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('profile.allergies')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('profile.allergiesDesc')}
              </p>
              
              {/* Allergy checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allergyOptions.map(option => <div key={option} className="flex items-center space-x-2">
                    <Checkbox id={`allergy-${option}`} checked={allergies.includes(option)} onCheckedChange={() => handleAllergyChange(option)} />
                    <Label htmlFor={`allergy-${option}`} className="text-sm">{option}</Label>
                  </div>)}
              </div>
              
              {/* Custom allergies that are already added */}
              <div className="flex flex-wrap gap-2">
                {allergies.filter(allergy => !allergyOptions.includes(allergy)).map(allergy => <Badge key={allergy} variant="secondary" className="py-1.5">
                      {allergy}
                      <button type="button" onClick={() => removeAllergy(allergy)} className="ml-1 text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {allergy}</span>
                      </button>
                    </Badge>)}
              </div>
              
              {/* Add custom allergy */}
              <div className="flex space-x-2">
                <Input value={newAllergy} onChange={e => setNewAllergy(e.target.value)} placeholder={t('profile.addCustomAllergy')} className="flex-1" />
                <Button type="button" variant="outline" onClick={addAllergy}>
                  <PlusCircle className="h-4 w-4 mr-1" /> {t('profile.add')}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/home')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('profile.savingChanges') : t('profile.saveChanges')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AccountDetailsDialog open={showAccountDetails} onOpenChange={setShowAccountDetails} userEmail={user?.email || ''} />
    </div>;
};

export default Profile;
