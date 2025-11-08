
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
import { Instagram, Youtube, Mail } from 'lucide-react';

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
      
      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Left side - Logo and Copyright */}
            <div className="flex flex-col gap-2">
              <h3 className="text-primary text-2xl font-bold">DineFineAI</h3>
              <p className="text-muted-foreground text-sm">
                © 2025 DineFineAI. All rights reserved.
              </p>
            </div>
            
            {/* Right side - Social Media and Email */}
            <div className="flex flex-col items-end gap-3">
              {/* Social Media Links in a row */}
              <div className="flex items-center gap-6">
                <a 
                  href="https://www.instagram.com/dinefineai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span>DineFineAI</span>
                </a>
                <a 
                  href="https://www.tiktok.com/@dinefineai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span>DineFineAI</span>
                </a>
                <a 
                  href="https://www.youtube.com/@dinefineai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                  <span>DineFineAI</span>
                </a>
              </div>
              
              {/* Email underneath social media */}
              <a 
                href="mailto:help.dinefineai@gmail.com"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>help.dinefineai@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
