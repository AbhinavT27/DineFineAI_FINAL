
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Restaurant as RestaurantType } from '@/lib/types';
import RestaurantDetails from '@/components/RestaurantDetails';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getRestaurantDetails } from '@/services/restaurantApi';
import { addToHistory } from '@/services/historyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const Restaurant = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldStartScraping, setShouldStartScraping] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<any[] | null>(null);

  useEffect(() => {
    // Check if we have a generated menu passed from ScrapeButton
    if (location.state?.generatedMenu) {
      console.log('Received generated menu:', location.state.generatedMenu);
      setGeneratedMenu(location.state.generatedMenu);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        console.log('Fetching restaurant details for ID:', id);
        const restaurantData = await getRestaurantDetails(id);
        
        if (restaurantData) {
          console.log('Restaurant data fetched:', restaurantData.name);
          setRestaurant(restaurantData);
          
          // Check if we came from a scrape button click
          if (location.state?.shouldScrape) {
            setShouldStartScraping(true);
          }
          
          // Add to history when restaurant is viewed - but only if user is logged in
          if (user?.id) {
            console.log('Adding restaurant to history for user:', user.id);
            try {
              await addToHistory(restaurantData, 'viewed', user.id);
              console.log('Successfully added to history');
            } catch (historyError) {
              console.error('Failed to add to history:', historyError);
              // Don't show error to user, just log it
            }
          } else {
            console.log('User not logged in, skipping history tracking');
          }
        } else {
          console.error("Restaurant not found");
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id, user?.id]);

  const handleBackClick = () => {
    // Check if we came from history page
    if (location.state?.fromHistory) {
      navigate('/history');
      return;
    }
    
    // Check if we have search results to pass back
    const searchResults = location.state?.searchResults;
    const searchPreferences = location.state?.searchPreferences;
    
    if (searchResults && searchResults.length > 0) {
      // Navigate back to search results with the original search data
      navigate('/search-results', {
        state: {
          searchResults: searchResults,
          searchPreferences: searchPreferences
        }
      });
    } else {
      // Use browser back navigation as fallback
      navigate(-1);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={handleBackClick}>
          <ArrowLeft size={18} className="mr-2" />
          Back to Results
        </Button>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foodRed"></div>
          </div>
        ) : restaurant ? (
          <RestaurantDetails 
            restaurant={restaurant} 
            shouldStartScraping={shouldStartScraping}
            initialMenuItems={generatedMenu || []}
          />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Restaurant not found</h3>
              <p className="text-foodGray">The restaurant you're looking for doesn't exist or has been removed.</p>
              <Button variant="default" className="mt-4 bg-foodRed hover:bg-foodRed/90" onClick={() => navigate('/home')}>
                Go Back Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Restaurant;
