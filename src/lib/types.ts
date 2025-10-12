export interface UserPreferences {
  searchQuery?: string;
  cuisineType?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$' | '';
  dietaryRestrictions: string[];
  allergies: string[];
  useCurrentLocation: boolean;
  location?: string; // City name or address
  partySize?: number;
  isGroupDining?: boolean;
  groupSize?: number;
  searchRadius?: number; // Add search radius in miles
}

export interface PlaceSummary {
  placeSummary: string;
  reviewSummary: string;
  personalizedRecommendation?: string;
  reviewCount: number;
}

export interface Restaurant {
  id: string;
  name: string;
  imageUrl: string;
  cuisineType: string;
  rating: number;
  priceLevel?: '$' | '$$' | '$$$' | '$$$$';
  address: string;
  distance: string;
  dietaryOptions: string[];
  pros: string[];
  cons: string[];
  // Adding missing properties
  phone?: string;
  website?: string;
  hours?: string[];
  allergyInfo?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  groupDiningAvailable?: boolean;
  // Google Places API properties
  place_id?: string;
  photo_reference?: string;
  photos?: string[]; // Changed to string array for actual photo URLs
  types?: string[];
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
    periods?: any[];
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    relative_time_description: string;
  }>;
  menuScraped?: boolean;
  hasMenuExtraction?: boolean;
}
