import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import GuestHeader from '@/components/GuestHeader';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import SearchResultsPagination from '@/components/SearchResultsPagination';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import ComparisonBar from '@/components/ComparisonBar';
import { Restaurant, UserPreferences } from '@/lib/types';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';

const GuestSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, searchPreferences } = location.state || {};
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('distance-asc');
  const resultsPerPage = 12;

  useEffect(() => {
    if (!searchResults || !searchPreferences) {
      navigate('/app/guest');
    }
  }, [searchResults, searchPreferences, navigate]);

  if (!searchResults || !searchPreferences) {
    return null;
  }

  // Sort results
  const sortedResults = [...searchResults].sort((a: Restaurant, b: Restaurant) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'price-asc':
        const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
        const priceA = priceOrder[a.priceLevel || '$'] || 0;
        const priceB = priceOrder[b.priceLevel || '$'] || 0;
        return priceA - priceB;
      case 'distance-asc':
        const distA = parseFloat(a.distance?.replace(/[^\d.]/g, '') || '999');
        const distB = parseFloat(b.distance?.replace(/[^\d.]/g, '') || '999');
        return distA - distB;
      case 'menu-scraped':
        // Restaurants with scraped menus first
        if (a.menuScraped && !b.menuScraped) return -1;
        if (!a.menuScraped && b.menuScraped) return 1;
        return 0;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = sortedResults.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Search Results - DineFineAI</title>
        <meta name="description" content="Browse restaurants matching your preferences" />
      </Helmet>

      <GuestHeader />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {searchResults.length} Restaurants Found
            </h1>
            {searchPreferences.searchQuery && (
              <Badge variant="secondary" className="text-sm">
                Search: {searchPreferences.searchQuery}
              </Badge>
            )}
          </div>
          <SortDropdown currentSort={sortBy} onSortChange={setSortBy} />
        </div>

        <SearchResultsGrid 
          restaurants={currentResults}
          onRestaurantClick={(restaurant) => navigate(`/app/guest/restaurant/${restaurant.id}`)}
        />

        {totalPages > 1 && (
          <SearchResultsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <ComparisonBar />
    </div>
  );
};

export default GuestSearchResults;
