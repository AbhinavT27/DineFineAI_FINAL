import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestHeader from '@/components/GuestHeader';
import SearchForm from '@/components/SearchForm';
import ComparisonBar from '@/components/ComparisonBar';
import { UserPreferences } from '@/lib/types';
import { toast } from '@/components/ui/sonner';
import { searchRestaurants } from '@/services/restaurantApi';
import { Helmet } from 'react-helmet-async';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { Instagram, Youtube, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

const GuestApp = () => {
  const navigate = useNavigate();
  const { checkFeatureAccess, registerUsage, getRemainingTries } = useFreeTrial();
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  
  const handleSearch = async (searchPreferences: UserPreferences) => {
    // Check if guest can use search
    if (!checkFeatureAccess('search')) {
      return;
    }

    setIsLoading(true);
    
    console.log('Guest searching with preferences:', searchPreferences);
    
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
      
      // Register usage AFTER successful backend call
      registerUsage('search');
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} restaurants that match your preferences!`, {
          position: 'top-center',
        });
        
        // Navigate to guest search results page
        navigate('/app/guest/search-results', {
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

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>DineFineAI - Try For Free</title>
        <meta name="description" content="Try DineFineAI for free! Discover restaurants that match your dietary needs and preferences." />
      </Helmet>
      
      <GuestHeader />
      
      <main className="flex-grow">
        <div 
          className="bg-cover bg-center h-full flex items-center py-8 md:py-16"
          style={{ 
            backgroundImage: `url(${isDarkMode ? '/DineFineAI_bBlackground.png' : '/DineFineAI_wBackground.png'})`
          }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-foreground mb-8">
              <div className="flex justify-end mb-4">
                <ThemeToggle />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Try DineFineAI Free
              </h1>
              <p className="text-lg md:text-xl mb-2">
                Get 3 free uses of each feature
              </p>
              <p className="text-sm opacity-90">
                You have {getRemainingTries('search')} free searches left • Sign up for unlimited access
              </p>
            </div>

            <div className="max-w-3xl mx-auto bg-transparent backdrop-blur-sm rounded-2xl p-6 md:p-8">
              <SearchForm 
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>

      <ComparisonBar />
      
      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Left side - Logo and Copyright */}
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-bold">
                <span className="text-foodRed">DineFine</span>
                <span className="text-foodOrange">AI</span>
              </h3>
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

export default GuestApp;
