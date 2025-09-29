
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import { UserPreferences } from '@/lib/types';

interface SearchResultsHeaderProps {
  resultsCount: number;
  filteredCount: number;
  searchPreferences: UserPreferences;
  onNewSearch: () => void;
  onSortChange: (sortOption: SortOption) => void;
  currentSort?: SortOption;
}

const SearchResultsHeader = ({
  resultsCount,
  filteredCount,
  searchPreferences,
  onNewSearch,
  onSortChange,
  currentSort
}: SearchResultsHeaderProps) => {
  const getSearchQueryDisplay = () => {
    const parts = [];
    if (searchPreferences.searchQuery) {
      parts.push(`"${searchPreferences.searchQuery}"`);
    }
    if (searchPreferences.cuisineType) {
      parts.push(searchPreferences.cuisineType);
    }
    if (searchPreferences.priceRange) {
      parts.push(searchPreferences.priceRange);
    }
    if (searchPreferences.dietaryRestrictions && searchPreferences.dietaryRestrictions.length > 0) {
      parts.push(...searchPreferences.dietaryRestrictions);
    }
    if (searchPreferences.partySize) {
      parts.push(`Party of ${searchPreferences.partySize}`);
    }
    // Remove location from display - user doesn't want to see address in search results
    return parts.length > 0 ? parts.join(' • ') : 'General search';
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div className="mb-2 md:mb-0">
        <h2 className="text-2xl font-bold">
          {resultsCount > 0 
            ? `Found ${filteredCount} restaurants` 
            : "Search Results"}
        </h2>
        {resultsCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-foodGray">Search:</span>
            <Badge variant="outline" className="text-sm">
              {getSearchQueryDisplay()}
            </Badge>
            {searchPreferences.priceRange && (
              <Badge variant="secondary" className="text-sm">
                {searchPreferences.priceRange} restaurants shown first
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 self-start">
        {resultsCount > 0 && (
          <SortDropdown 
            onSortChange={onSortChange}
            currentSort={currentSort}
          />
        )}
        <Button 
          variant="outline" 
          onClick={onNewSearch}
        >
          New Search
        </Button>
      </div>
    </div>
  );
};

export default SearchResultsHeader;
