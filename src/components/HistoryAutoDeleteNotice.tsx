import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Bookmark } from 'lucide-react';

export const HistoryAutoDeleteNotice = () => {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <span>
          History items are automatically deleted after 2 weeks to keep your data fresh. 
          Click the <Bookmark className="h-4 w-4 inline" /> icon to save important items permanently.
        </span>
      </AlertDescription>
    </Alert>
  );
};