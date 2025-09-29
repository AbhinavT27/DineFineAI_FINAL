import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveHistoryButtonProps {
  historyId: string;
  historyType: 'restaurant' | 'search' | 'comparison';
  isSaved?: boolean;
  onSaveToggle: (saved: boolean) => void;
  className?: string;
}

export const SaveHistoryButton: React.FC<SaveHistoryButtonProps> = ({ 
  historyId, 
  historyType, 
  isSaved = false,
  onSaveToggle,
  className = '' 
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getTableName = (): 'user_restaurant_history' | 'search_history' | 'comparison_history' => {
    switch (historyType) {
      case 'restaurant':
        return 'user_restaurant_history';
      case 'search':
        return 'search_history';
      case 'comparison':
        return 'comparison_history';
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('Please log in to save history items');
      return;
    }

    setIsLoading(true);
    try {
      const tableName = getTableName();
      const { error } = await supabase
        .from(tableName)
        .update({ saved: !isSaved })
        .eq('id', historyId)
        .eq('user_id', user.id);

      if (error) throw error;

      onSaveToggle(!isSaved);
      toast.success(
        !isSaved 
          ? 'History item saved permanently!' 
          : 'History item will auto-delete after 2 weeks'
      );
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast.error('Failed to update save status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`${className} ${isSaved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
      title={isSaved ? 'Remove permanent save' : 'Save permanently (prevents auto-deletion)'}
    >
      {isSaved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
};