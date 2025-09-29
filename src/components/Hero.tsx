
import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { reverseGeocode, geocodeLocation } from '@/services/geocodingService';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load cached preferences on mount
  useEffect(() => {
    try {
      // First try to load from search preferences (last used location)
      const searchPrefs = localStorage.getItem('searchPreferences');
      const heroPrefs = localStorage.getItem('heroSearchPreferences');
      
      let locationToSet = '';
      
      if (searchPrefs) {
        const preferences = JSON.parse(searchPrefs);
        // If there was a manual location from last search, use it
        if (preferences.location && !preferences.useCurrentLocation) {
          locationToSet = preferences.location;
          console.log('Loading location from search preferences:', preferences.location);
        }
      }
      
      // Then load hero-specific preferences if no location from search prefs
      if (heroPrefs) {
        const preferences = JSON.parse(heroPrefs);
        if (preferences.searchQuery) setSearchQuery(preferences.searchQuery);
        if (preferences.dateTime) setDateTime(preferences.dateTime);
        // Only set location from hero prefs if we didn't get one from search prefs
        if (!locationToSet && preferences.location) {
          locationToSet = preferences.location;
          console.log('Loading location from hero preferences:', preferences.location);
        }
      }
      
      if (locationToSet) {
        setLocation(locationToSet);
      }
    } catch (error) {
      console.error('Error loading cached hero preferences:', error);
    }
  }, []);

  // Cache preferences whenever they change
  useEffect(() => {
    const preferences = { searchQuery, location, dateTime };
    localStorage.setItem('heroSearchPreferences', JSON.stringify(preferences));
  }, [searchQuery, location, dateTime]);

  const resetPreferences = () => {
    setSearchQuery('');
    setLocation('');
    setDateTime('');
    localStorage.removeItem('heroSearchPreferences');
    localStorage.removeItem('searchPreferences');
    toast.success('Search preferences reset');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter what you're looking for");
      return;
    }

    let coordinates = null;
    let locationString = location.trim();
    
    // Check if we have cached location from previous searches
    if (!locationString) {
      try {
        const cachedPreferences = localStorage.getItem('searchPreferences');
        if (cachedPreferences) {
          const preferences = JSON.parse(cachedPreferences);
          if (preferences.manualLocation && !preferences.useCurrentLocation) {
            locationString = preferences.manualLocation;
            coordinates = preferences.coordinates;
          } else if (preferences.useCurrentLocation && preferences.coordinates) {
            coordinates = preferences.coordinates;
            // Get the address for display purposes
            locationString = await reverseGeocode(coordinates.lat, coordinates.lng);
          }
        }
      } catch (error) {
        console.error('Error loading cached location:', error);
      }
    }
    
    // Only if no cached location exists, try to get current location
    if (!locationString && !coordinates) {
      if (navigator.geolocation) {
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
          
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Get address from coordinates
          locationString = await reverseGeocode(coordinates.lat, coordinates.lng);
          console.log('Got current location for hero search:', coordinates, locationString);
        } catch (error) {
          console.error('Error getting current location in hero:', error);
          toast.error("Could not get your current location. Please enter your location manually.");
          return;
        }
      } else {
        toast.error("Please enter your location to search for restaurants.");
        return;
      }
    } else if (locationString && !coordinates) {
      // If we have a location string but no coordinates, geocode it
      console.log('Processing location:', locationString);
      coordinates = await geocodeLocation(locationString);
      if (coordinates) {
        console.log('Geocoded coordinates:', coordinates);
        // Convert coordinates back to full address
        const fullAddress = await reverseGeocode(coordinates.lat, coordinates.lng);
        locationString = fullAddress;
        console.log('Full address:', fullAddress);
      } else {
        toast.error(`Could not find location: ${locationString}. Please try a different location.`);
        return;
      }
    }

    // Navigate to search results with the query and location
    const searchPreferences = {
      searchQuery: searchQuery.trim(),
      useCurrentLocation: !location.trim(), // Use current location if no manual location was entered
      manualLocation: location.trim() || undefined, // Save the manual location if entered
      coordinates: coordinates,
      location: locationString || undefined,
      dietaryRestrictions: [],
      allergies: [],
    };

    console.log('Search preferences:', searchPreferences);

    navigate('/search-results', {
      state: {
        searchPreferences: searchPreferences
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: 'search' | 'location' | 'datetime') => {
    if (e.key === 'Enter') {
      if (field === 'search' || field === 'location') {
        handleSearch();
      }
    }
  };

  return (
    <section className="relative py-20 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
      <div className="container mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Discover Your Next
          <span className="text-orange-600 block">Fine Dining Experience</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Find and book the perfect table at the world's best restaurants. 
          From intimate bistros to Michelin-starred establishments.
        </p>
        
        <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto shadow-xl border border-border">
          {/* Reset button */}
          <div className="flex justify-end mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetPreferences}
              className="flex items-center gap-2 text-sm"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder={t('search.searchPlaceholder', { defaultValue: 'What are you craving today?' })} 
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'search')}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="City, State or Address (optional)" 
                className="pl-10 h-12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'location')}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Date & Time" 
                className="pl-10 h-12"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'datetime')}
              />
            </div>
            <Button 
              size="lg" 
              className="h-12 bg-orange-600 hover:bg-orange-700"
              onClick={handleSearch}
            >
              {t('search.findRestaurants')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
