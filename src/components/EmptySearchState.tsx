
import { Button } from '@/components/ui/button';

interface EmptySearchStateProps {
  type: 'no-results' | 'no-filters-match';
  onAction: () => void;
}

const EmptySearchState = ({ type, onAction }: EmptySearchStateProps) => {
  if (type === 'no-filters-match') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold mb-2">No restaurants match your filters</h3>
          <p className="text-foodGray mb-6">
            Try adjusting your tag filters to see more results.
          </p>
          <Button 
            variant="default" 
            className="bg-foodRed hover:bg-foodRed/90"
            onClick={onAction}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold mb-2">No search results available</h3>
        <p className="text-foodGray mb-6">
          It looks like you haven't performed a search yet. Start a new search to find restaurants that match your preferences.
        </p>
        <Button 
          variant="default" 
          className="bg-foodRed hover:bg-foodRed/90"
          onClick={onAction}
        >
          Start a New Search
        </Button>
      </div>
    </div>
  );
};

export default EmptySearchState;
