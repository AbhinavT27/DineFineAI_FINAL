import { supabase } from '@/integrations/supabase/client';

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    console.log('Reverse geocoding coordinates:', { lat, lng });
    
    // Use secure edge function for geocoding
    const { data, error } = await supabase.functions.invoke('secure-geocoding', {
      body: { lat, lng }
    });

    if (error) {
      console.error('Secure geocoding edge function error:', error);
      throw new Error('Geocoding service unavailable');
    }

    if (data?.success && data.address) {
      console.log('Extracted location:', data.address);
      return data.address;
    } else {
      throw new Error('No address returned from geocoding service');
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Return a generic location label as fallback
    return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const geocodeLocation = async (locationInput: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    console.log('Geocoding location:', locationInput);
    
    // Use secure edge function for geocoding
    const { data, error } = await supabase.functions.invoke('secure-geocoding', {
      body: { location: locationInput }
    });

    if (error) {
      console.error('Secure geocoding edge function error:', error);
      return null;
    }

    console.log('Geocoding response:', data);
    
    if (data?.success && data.coordinates) {
      return {
        lat: data.coordinates.lat,
        lng: data.coordinates.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
