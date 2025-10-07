import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Search, Loader2, Mic, MicOff, MapPin, X, ChevronDown, RotateCcw, Globe } from 'lucide-react';
import { UserPreferences } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { geocodeLocation, reverseGeocode } from '@/services/geocodingService';
import DietaryAndAllergyEditor from './DietaryAndAllergyEditor';
import { getLocationSuggestions } from '@/services/locationAutocompleteService';
import { useTranslation } from 'react-i18next';
import { detectAndTranslateSearchQuery } from '@/services/languageDetectionService';

interface SearchFormProps {
  onSearch: (preferences: UserPreferences) => void;
  isLoading?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading = false }) => {
  const { user, userPreferences } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [priceRange, setPriceRange] = useState<'$' | '$$' | '$$$' | '$$$$' | ''>('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState([5]); // Default 5 miles
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  // Always default to current location on login - don't load cached location preferences
  useEffect(() => {
    // Deliberately empty - we always want to start with current location
    // This ensures users always get fresh, accurate location data on login
  }, []);

  // Get user's current location when useCurrentLocation is true and no coordinates cached
  useEffect(() => {
    if (useCurrentLocation && !coordinates) {
      getCurrentLocationWithFallback();
    }
  }, [useCurrentLocation]);

  const getCurrentLocationWithFallback = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      setUseCurrentLocation(false);
      return;
    }

    setIsGettingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setCoordinates(location);
      
      try {
        const address = await reverseGeocode(location.lat, location.lng);
        setCurrentLocationAddress(address);
      } catch (error) {
        console.error('Error getting address for current location:', error);
        setCurrentLocationAddress('');
      }
      
    } catch (error) {
      console.error("Error getting current location:", error);
      toast.error("Couldn't access your location. Please check your browser settings or enter your location manually.");
      setCoordinates(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLocationToggle = async (checked: boolean) => {
    setUseCurrentLocation(checked);
    
    if (checked) {
      setManualLocation('');
    } else {
      setCoordinates(null);
    }
  };

  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) return;

    try {
      const coords = await geocodeLocation(manualLocation);
      if (coords) {
        setCoordinates(coords);
        setShowLocationModal(false);
        toast.success(`Location set to ${manualLocation}`);
      } else {
        toast.error('Could not find coordinates for this location');
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      toast.error('Could not find coordinates for this location');
    }
  };

  // Location autocomplete functionality
  const handleLocationInputChange = async (value: string) => {
    setManualLocation(value);
    
    if (value.trim().length >= 2) {
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await getLocationSuggestions(value);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Error getting location suggestions:', error);
        setLocationSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setManualLocation(suggestion);
    setLocationSuggestions([]);
  };

  const handleReset = () => {
    setSearchQuery('');
    setCuisineType('');
    setPriceRange('');
    setSearchRadius([5]);
    setUseCurrentLocation(true);
    setManualLocation('');
    setCoordinates(null);
    setLocationSuggestions([]);
    
    // Get current location again when resetting to current location
    getCurrentLocationWithFallback();
    
    toast.success('Search form reset to defaults');
  };

  const saveSearchToHistory = async (preferences: UserPreferences) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_query: preferences.searchQuery || null,
          cuisine_type: preferences.cuisineType || null,
          price_range: preferences.priceRange || null,
          dietary_restrictions: preferences.dietaryRestrictions || null,
          allergies: preferences.allergies || null,
          location: preferences.location || null,
          coordinates: preferences.coordinates ? {
            lat: preferences.coordinates.lat,
            lng: preferences.coordinates.lng
          } : null
        });
    } catch (error) {
      console.error('Error saving search to history:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle multilingual search
    let finalSearchQuery = searchQuery;
    let extractedDietaryInfo = {};
    
    if (searchQuery.trim()) {
      setIsTranslating(true);
      try {
        const translationResult = await detectAndTranslateSearchQuery(searchQuery);
        console.log('Translation result in SearchForm:', translationResult);
        
        if (translationResult.detectedLanguage !== 'en') {
          finalSearchQuery = translationResult.translatedText;
          setDetectedLanguage(translationResult.detectedLanguage);
          toast.success(`${t('search.languageDetected')}: ${translationResult.detectedLanguage.toUpperCase()}`);
        }
        
        extractedDietaryInfo = translationResult.extractedDietaryInfo || {};
      } catch (error) {
        console.error('Error in translation:', error);
      }
      setIsTranslating(false);
    }
    
    // If using current location but no coordinates, try to get them first
    if (useCurrentLocation && !coordinates && !isGettingLocation) {
      toast.error("Please wait for location to be detected or enter your location manually.");
      getCurrentLocationWithFallback();
      return;
    }
    
    // If using manual location but no coordinates found, try to geocode
    if (!useCurrentLocation && manualLocation && !coordinates) {
      await handleManualLocationSubmit();
      return;
    }

    // Ensure we have coordinates for the search
    if (!coordinates) {
      toast.error('Location is required for restaurant search. Please enable location access or enter your location manually.');
      return;
    }
    
    const preferences: UserPreferences = {
      searchQuery: finalSearchQuery || undefined,
      cuisineType: (extractedDietaryInfo as any)?.cuisineType || cuisineType || undefined,
      priceRange: priceRange || undefined,
      dietaryRestrictions: [
        ...(userPreferences?.dietary_preferences || []),
        ...((extractedDietaryInfo as any)?.preferences || [])
      ],
      allergies: [
        ...(userPreferences?.allergies || []),
        ...((extractedDietaryInfo as any)?.allergies || [])
      ],
      useCurrentLocation,
      location: useCurrentLocation ? (currentLocationAddress || undefined) : manualLocation,
      coordinates: coordinates,
      searchRadius: searchRadius[0],
    };

    await saveSearchToHistory(preferences);
    onSearch(preferences);
  };

  // Voice typing functionality
  const startVoiceTyping = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        setIsProcessingVoice(true);
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });

            if (error) {
              console.error('Voice transcription error:', error);
              toast.error('Failed to transcribe voice input');
            } else if (data?.text) {
              setSearchQuery(data.text);
              toast.success('Voice input captured!');
              
              // Auto-trigger search after successful transcription
              setTimeout(() => {
                triggerSearchFromVoice(data.text);
              }, 500); // Small delay to allow UI to update
            }
            
            setIsProcessingVoice(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing voice:', error);
          toast.error('Error processing voice input');
          setIsProcessingVoice(false);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceTyping = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const triggerSearchFromVoice = async (searchText: string) => {
    if (!searchText.trim()) return;

    // Validate location requirements
    if (useCurrentLocation && !coordinates && !isGettingLocation) {
      toast.error("Please wait for location to be detected or enter your location manually.");
      getCurrentLocationWithFallback();
      return;
    }
    
    if (!useCurrentLocation && manualLocation && !coordinates) {
      await handleManualLocationSubmit();
      return;
    }

    if (!coordinates) {
      toast.error('Location is required for restaurant search. Please enable location access or enter your location manually.');
      return;
    }
    
    const preferences: UserPreferences = {
      searchQuery: searchText || undefined,
      cuisineType: cuisineType || undefined,
      priceRange: priceRange || undefined,
      dietaryRestrictions: userPreferences?.dietary_preferences || [],
      allergies: userPreferences?.allergies || [],
      useCurrentLocation,
      location: useCurrentLocation ? (currentLocationAddress || undefined) : manualLocation,
      coordinates: coordinates,
      searchRadius: searchRadius[0],
    };

    await saveSearchToHistory(preferences);
    onSearch(preferences);
  };

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      {/* Reset Button and Main Search Bar */}
      <div className="space-y-3">
        {/* Reset Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('search.reset')}
          </Button>
        </div>
        
        {/* Main Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.searchPlaceholder', { defaultValue: 'What are you craving today?' })}
              className="pl-10 pr-20 h-12 text-lg"
            />
            
            {/* Language indicator */}
            {detectedLanguage && (
              <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
            )}
            
            {/* Translation indicator */}
            {isTranslating && (
              <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            
            {/* Voice Recording Button */}
            <Button
              type="button"
              variant={isRecording ? "destructive" : "ghost"}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
              onClick={isRecording ? stopVoiceTyping : startVoiceTyping}
              disabled={isProcessingVoice}
            >
              {isProcessingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dietary & Allergies Filter */}
        <div>
          <DietaryAndAllergyEditor />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('search.location')}</span>
          
          {/* Location Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  {useCurrentLocation ? (
                    <>
                      <p className="font-medium text-sm text-gray-800">{t('search.currentLocation')}</p>
                      {currentLocationAddress && (
                        <p className="text-xs text-gray-600 truncate">({currentLocationAddress.split(',').slice(0, 2).join(',')})</p>
                      )}
                      {isGettingLocation && (
                        <p className="text-xs text-blue-600">{t('search.gettingLocation')}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm text-gray-800">{t('search.manualLocation')}</p>
                      {manualLocation ? (
                        <p className="text-xs text-gray-600 truncate">{manualLocation}</p>
                      ) : (
                        <p className="text-xs text-gray-500">{t('search.noLocationSet')}</p>
                      )}
                    </>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem 
                onClick={() => {
                  handleLocationToggle(true);
                }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                {t('search.currentLocation')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  handleLocationToggle(false);
                  setShowLocationModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {t('search.manualEntry')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Location dropdown/editor */}
          {showLocationModal && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t('search.locationSettings')}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLocationModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Manual Entry Mode - No Current Location Option */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Enter city or zip code</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    placeholder="Type to search for a city..."
                    className="w-full"
                  />
                  
                  {/* Location Suggestions */}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectLocationSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {isLoadingSuggestions && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  onClick={handleManualLocationSubmit}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={!manualLocation.trim()}
                >
                  Set Location
                </Button>
              </div>
              
              {currentLocationAddress && useCurrentLocation && (
                <div className="text-sm text-gray-600 border-t pt-3">
                  <p className="font-medium mb-1">Current Address:</p>
                  <p>{currentLocationAddress}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Radius Row */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">{t('search.searchRadius')}</Label>
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t('search.distance')}</span>
            <span className="text-sm font-medium text-gray-800">{searchRadius[0]} {t('search.miles')}</span>
          </div>
          <Slider
            value={searchRadius}
            onValueChange={setSearchRadius}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Optional Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cuisine Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">{t('search.cuisineType')}</Label>
          <Select value={cuisineType} onValueChange={(value) => setCuisineType(value === 'any' ? '' : value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('search.anyCuisine')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t('search.anyCuisine')}</SelectItem>
              <SelectItem value="american">American</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="mexican">Mexican</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="indian">Indian</SelectItem>
              <SelectItem value="thai">Thai</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="korean">Korean</SelectItem>
              <SelectItem value="vietnamese">Vietnamese</SelectItem>
              <SelectItem value="greek">Greek</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
              <SelectItem value="seafood">Seafood</SelectItem>
              <SelectItem value="steakhouse">Steakhouse</SelectItem>
              <SelectItem value="barbecue">Barbecue</SelectItem>
              <SelectItem value="pizza">Pizza</SelectItem>
              <SelectItem value="fast-food">Fast Food</SelectItem>
              <SelectItem value="cafe">Café</SelectItem>
              <SelectItem value="bakery">Bakery</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">{t('search.priceRange')}</Label>
          <Select value={priceRange || 'any'} onValueChange={(value: '$' | '$$' | '$$$' | '$$$$' | 'any') => setPriceRange(value === 'any' ? '' : value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('search.anyPrice')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t('search.anyPrice')}</SelectItem>
              <SelectItem value="$">$ - Budget friendly</SelectItem>
              <SelectItem value="$$">$$ - Moderate</SelectItem>
              <SelectItem value="$$$">$$$ - Expensive</SelectItem>
              <SelectItem value="$$$$">$$$$ - Very expensive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Find Restaurants Button */}
      <Button
        type="submit"
        disabled={isLoading || (useCurrentLocation && !coordinates) || (!useCurrentLocation && !manualLocation)}
        className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          t('search.findRestaurants')
        )}
      </Button>
    </form>
  );
};

export default SearchForm;