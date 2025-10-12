
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import ComparisonBar from '@/components/ComparisonBar';
import { DowngradeWarning } from '@/components/DowngradeWarning';
import { UserPreferences } from '@/lib/types';
import { toast } from '@/components/ui/sonner';
import { searchRestaurants } from '@/services/restaurantApi';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    useCurrentLocation: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async (searchPreferences: UserPreferences) => {
    setIsLoading(true);
    
    console.log('Searching with preferences:', searchPreferences);
    
    try {
      // Ensure we have location for the search
      if (!searchPreferences.location) {
        toast.error("Location is required for restaurant search. Please enable location access or enter your location manually.", {
          position: 'top-center',
        });
        return;
      }

      // Call our API service to get real restaurant data
      const results = await searchRestaurants(searchPreferences);
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} restaurants that match your preferences!`, {
          position: 'top-center',
        });
        
        // Navigate to search results page with the data
        navigate('/search-results', {
          state: {
            searchResults: results,
            searchPreferences: searchPreferences
          }
        });
      } else {
        toast.error("No restaurants found matching your criteria. Try adjusting your preferences.", {
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
      toast.error(error.message || "An error occurred while searching for restaurants.", {
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Welcome to DineFineAI - AI-Powered Restaurant Discovery</title>
        <meta name="description" content="Welcome to DineFineAI! Discover restaurants that match your dietary needs, preferences, and location using artificial intelligence. Never worry about finding the right place to eat again." />
        <meta name="keywords" content="restaurant discovery, AI dining, dietary preferences, restaurant search, dining experience" />
        <meta property="og:title" content="Welcome to DineFineAI - AI-Powered Restaurant Discovery" />
        <meta property="og:description" content="Discover restaurants that match your dietary needs, preferences, and location using artificial intelligence." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      
      <Header />
      
      {user && <DowngradeWarning />}
      
      <main className="flex-grow">
        <div 
          className="bg-cover bg-center h-full flex items-center py-16 md:py-24"
          style={{ 
            backgroundImage: 'url(/updated_home.png)'
          }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-black mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t('home.title')}</h1>
              <p className="text-lg md:text-xl mb-8">
                {t('home.subtitle')}
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Comparison Bar */}
      <ComparisonBar />
    </div>
  );
};

export default Index;
