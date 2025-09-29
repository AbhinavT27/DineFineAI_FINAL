
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import RestaurantTagFilter from '@/components/RestaurantTagFilter';
import ComparisonBar from '@/components/ComparisonBar';
import SearchResultsHeader from '@/components/SearchResultsHeader';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import SearchResultsPagination from '@/components/SearchResultsPagination';
import EmptySearchState from '@/components/EmptySearchState';
import { useSearchResults } from '@/hooks/useSearchResults';
import { DowngradeWarning } from '@/components/DowngradeWarning';
import { Restaurant } from '@/lib/types';
import { addToHistory } from '@/services/historyService';

const SearchResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
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
  } = useSearchResults();

  const handleRestaurantClick = async (restaurant: Restaurant) => {
    console.log('Restaurant clicked from search results:', restaurant.name, 'ID:', restaurant.id);
    
    if (user?.id) {
      try {
        console.log('Adding restaurant to history:', {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          userId: user.id,
          actionType: 'viewed'
        });
        
        const result = await addToHistory(restaurant, 'viewed', user.id);
        if (result.error) {
          console.error('Failed to add restaurant to history:', result.error);
        } else {
          console.log('Successfully added restaurant to history');
        }
      } catch (historyError) {
        console.error('Failed to add restaurant to history:', historyError);
      }
    } else {
      console.log('User not logged in, skipping history tracking');
    }

    navigate(`/restaurant/${restaurant.id}`, {
      state: {
        searchResults: searchResults,
        searchPreferences: searchPreferences
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {user && <DowngradeWarning />}
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {searchResults.length > 0 && (
            <RestaurantTagFilter 
              onTagsChange={handleTagsChange}
              selectedTagIds={selectedTagIds}
            />
          )}

          <SearchResultsHeader
            resultsCount={searchResults.length}
            filteredCount={filteredResults.length}
            searchPreferences={searchPreferences}
            onNewSearch={handleNewSearch}
            onSortChange={handleSortChange}
            currentSort={currentSort}
          />
          
          {searchResults.length > 0 ? (
            filteredResults.length > 0 ? (
              <>
                <SearchResultsGrid
                  restaurants={currentRestaurants}
                  onRestaurantClick={handleRestaurantClick}
                />

                <SearchResultsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptySearchState
                type="no-filters-match"
                onAction={clearFilters}
              />
            )
          ) : (
            <EmptySearchState
              type="no-results"
              onAction={handleNewSearch}
            />
          )}
        </div>
      </main>
      
      {searchResults.length > 0 && <ComparisonBar />}
    </div>
  );
};

export default SearchResults;
