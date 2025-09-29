
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  formatted_address: string;
  address_components: AddressComponent[];
}

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    console.log('Reverse geocoding coordinates:', { lat, lng });
    
    // Use Google Geocoding API for more detailed address information
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Google Geocoding API request failed');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the most detailed address (usually the first result)
      const result: GeocodeResult = data.results[0];
      console.log('Google Geocoding result:', result.formatted_address);
      return result.formatted_address;
    } else {
      throw new Error('No results from Google Geocoding API');
    }
  } catch (error) {
    console.error('Google Geocoding failed, falling back to OpenStreetMap:', error);
    
    // Fallback to OpenStreetMap for basic address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch address from OpenStreetMap");
      }
      
      const data = await response.json();
      return data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (fallbackError) {
      console.error("OpenStreetMap geocoding also failed:", fallbackError);
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
};

export const geocodeLocation = async (locationInput: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    console.log('Geocoding location:', locationInput);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data.length === 0) {
      return null;
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
