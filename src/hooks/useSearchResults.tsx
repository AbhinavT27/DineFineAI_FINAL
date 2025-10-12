
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPreferences, Restaurant } from '@/lib/types';
import { SortOption } from '@/components/SortDropdown';
import { filterRestaurantsByTags } from '@/utils/restaurantTagUtils';
import { sortRestaurantsByPricePreference } from '@/services/helpers/restaurantFilters';
import { sortRestaurants } from '@/utils/restaurantSortUtils';

const RESTAURANTS_PER_PAGE = 9;

export const useSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [searchPreferences, setSearchPreferences] = useState<UserPreferences>({
    searchQuery: '',
    cuisineType: '',
    priceRange: '',
    dietaryRestrictions: [],
    allergies: [],
    useCurrentLocation: false,
    location: '',
    partySize: undefined
  });
  const [filteredResults, setFilteredResults] = useState<Restaurant[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState<SortOption | undefined>();

  // Initialize search results from location state or localStorage
  useEffect(() => {
    const locationResults = location.state?.searchResults || [];
    const locationPreferences = location.state?.searchPreferences || {
      searchQuery: '',
      cuisineType: '',
      priceRange: '',
      dietaryRestrictions: [],
      allergies: [],
      useCurrentLocation: false,
      location: '',
      partySize: undefined
    };
    
    if (locationResults.length > 0) {
      console.log('Processing new search results from navigation');
      setSearchResults(locationResults);
      setSearchPreferences(locationPreferences);
      
      localStorage.setItem('searchResults', JSON.stringify(locationResults));
      localStorage.setItem('searchPreferences', JSON.stringify(locationPreferences));
    } else {
      const savedResults = localStorage.getItem('searchResults');
      const savedPreferences = localStorage.getItem('searchPreferences');
      
      if (savedResults && savedPreferences) {
        try {
          console.log('Restoring search results from localStorage');
          setSearchResults(JSON.parse(savedResults));
          setSearchPreferences(JSON.parse(savedPreferences));
        } catch (error) {
          console.error('Error parsing saved search data:', error);
          setSearchResults([]);
          setSearchPreferences({
            searchQuery: '',
            cuisineType: '',
            priceRange: '',
            dietaryRestrictions: [],
            allergies: [],
            useCurrentLocation: false,
            location: '',
            partySize: undefined
          });
        }
      }
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    const applyFilters = async () => {
      let results = [...searchResults];
      
      if (searchPreferences.priceRange) {
        results = sortRestaurantsByPricePreference(results, searchPreferences.priceRange);
      }
      
      if (selectedTagIds.length > 0 && user?.id) {
        results = await filterRestaurantsByTags(results, selectedTagIds, user.id);
      }
      
      if (currentSort) {
        results = sortRestaurants(results, currentSort);
      }
      
      setFilteredResults(results);
      setCurrentPage(1);
    };

    applyFilters();
  }, [searchResults, selectedTagIds, searchPreferences.priceRange, currentSort]);

  const handleNewSearch = () => {
    localStorage.removeItem('searchResults');
    localStorage.removeItem('searchPreferences');
    navigate('/home');
  };

  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSort(sortOption);
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / RESTAURANTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESTAURANTS_PER_PAGE;
  const endIndex = startIndex + RESTAURANTS_PER_PAGE;
  const currentRestaurants = filteredResults.slice(startIndex, endIndex);

  return {
    searchResults,
    searchPreferences,
    filteredResults,
    selectedTagIds,
    currentPage,
    currentSort,
    totalPages,
    currentRestaurants,
    handleNewSearch,
    handleSortChange,
    handleTagsChange,
    handlePageChange,
    clearFilters
  };
};

