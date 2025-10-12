import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Search, Loader2, MapPin, RotateCcw, Globe } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { geocodeLocation, reverseGeocode } from '@/services/geocodingService';
import { addSearchToHistory } from '@/services/searchHistoryService';
import { UserPreferences } from '@/lib/types';
import { detectAndTranslateSearchQuery } from '@/services/languageDetectionService';
import { useTranslation } from 'react-i18next';

interface QuickSearchBarProps {
  onSearch: (query: string, searchPreferences?: UserPreferences) => void;
  placeholder?: string;
  isLoading?: boolean;
  currentSearchPreferences?: UserPreferences;
}

const QuickSearchBar: React.FC<QuickSearchBarProps> = ({ 
  onSearch, 
  placeholder = "What are you craving today?",
  isLoading = false,
  currentSearchPreferences
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  // Initialize location state from current search preferences
  useEffect(() => {
    if (currentSearchPreferences) {
      if (currentSearchPreferences.useCurrentLocation) {
        setUseCurrentLocation(true);
        setCurrentLocationAddress(currentSearchPreferences.location || '');
      } else {
        setUseCurrentLocation(false);
        setManualLocation(currentSearchPreferences.location || '');
      }
    }
  }, [currentSearchPreferences]);

  const getCurrentLocationWithFallback = async () => {
    if (!useCurrentLocation) return;
    
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        setIsGettingLocation(false);
        toast.error('Location request timed out. Please try manual location.');
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          
          try {
            const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            // Use the city name from reverse geocoding
            if (address && !address.includes('Location:') && !address.match(/\d+\.\d+,\s*-?\d+\.\d+/)) {
              setCurrentLocationAddress(address);
              console.log('Current location obtained:', address);
            } else {
              setCurrentLocationAddress('Current Location');
              console.log('Using generic location label');
            }
          } catch (error) {
            console.error('Error getting address from coordinates:', error);
            setCurrentLocationAddress('Current Location');
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Geolocation error:', error);
          setIsGettingLocation(false);
          
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location access denied. Please enable location permissions or use manual location.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error('Location information unavailable. Please try manual location.');
          } else {
            toast.error('Location request timed out. Please try manual location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error('Geolocation is not supported. Please use manual location.');
    }
  };

  // Manual location is now just used directly as a city name
  // No geocoding needed - we pass the city name directly to the API

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Handle multilingual search
    let finalSearchQuery = searchQuery.trim();
    let extractedDietaryInfo = {};
    
    setIsTranslating(true);
    try {
      const translationResult = await detectAndTranslateSearchQuery(searchQuery);
      console.log('Translation result in QuickSearchBar:', translationResult);
      
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

    // Validate location
    const locationToUse = useCurrentLocation ? currentLocationAddress : manualLocation.trim();
    if (!locationToUse) {
      toast.error('Please provide a location');
      return;
    }

    // Create search preferences with location and extracted dietary info
    const searchPreferences: UserPreferences = {
      searchQuery: finalSearchQuery,
      useCurrentLocation,
      location: locationToUse,
      cuisineType: (extractedDietaryInfo as any)?.cuisineType || '',
      priceRange: '',
      dietaryRestrictions: (extractedDietaryInfo as any)?.preferences || [],
      allergies: (extractedDietaryInfo as any)?.allergies || [],
      partySize: undefined
    };

    // Save to search history if user is logged in
    if (user?.id) {
      try {
        await addSearchToHistory(searchPreferences, user.id);
      } catch (error) {
        console.error('Error saving search to history:', error);
      }
    }

    onSearch(finalSearchQuery, searchPreferences);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started - speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
      toast.info('Processing your voice...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }

        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          throw error;
        }

        if (data?.text) {
          setSearchQuery(data.text);
          toast.success('Voice transcribed successfully!');
          
          // Auto-trigger search after successful transcription
          setTimeout(() => {
            triggerSearch(data.text);
          }, 500); // Small delay to allow UI to update
        } else {
          throw new Error('No text was transcribed from the audio');
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice recording');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const triggerSearch = (searchText: string) => {
    if (!searchText.trim()) return;

    // Create search preferences with location
    const locationToUse = useCurrentLocation ? currentLocationAddress : manualLocation.trim();
    const searchPreferences: UserPreferences = {
      searchQuery: searchText.trim(),
      useCurrentLocation,
      location: locationToUse,
      cuisineType: '',
      priceRange: '',
      dietaryRestrictions: [],
      allergies: [],
      partySize: undefined
    };

    // Save to search history if user is logged in
    if (user?.id) {
      addSearchToHistory(searchPreferences, user.id).catch(error => {
        console.error('Error saving search to history:', error);
      });
    }

    onSearch(searchText.trim(), searchPreferences);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={t('search.searchPlaceholder', { defaultValue: placeholder || 'What are you craving today?' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-16"
            disabled={isLoading || isProcessingVoice}
          />
          
          {/* Language/Translation indicators */}
          {(isTranslating || detectedLanguage) && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Globe className="w-4 h-4 text-blue-500" />
              )}
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleRecording}
            disabled={isLoading || isProcessingVoice}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10"
          >
              {isProcessingVoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
          </Button>
        </div>

        {/* Location Section */}
        <div className="relative min-w-[200px]">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useCurrentLocation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setUseCurrentLocation(true);
                setManualLocation('');
                getCurrentLocationWithFallback();
              }}
              disabled={isLoading || isGettingLocation}
              className="flex items-center gap-1 whitespace-nowrap"
            >
              {isGettingLocation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              Current
            </Button>
            
            <Button
              type="button"
              variant={!useCurrentLocation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setUseCurrentLocation(false);
                setCurrentLocationAddress('');
              }}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              Manual
            </Button>
          </div>

          {useCurrentLocation && currentLocationAddress && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-sm p-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin size={12} />
                <span className="truncate">{currentLocationAddress}</span>
              </div>
            </div>
          )}

          {!useCurrentLocation && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <Input
                  type="text"
                  placeholder="Enter city or address..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="pl-8 text-xs"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button 
          type="submit" 
          disabled={!searchQuery.trim() || isLoading || isProcessingVoice || (!useCurrentLocation && !manualLocation.trim())}
          className="px-6 bg-foodRed hover:bg-foodRed/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {t('search.findRestaurants')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default QuickSearchBar;