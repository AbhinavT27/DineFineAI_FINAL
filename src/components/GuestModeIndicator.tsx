import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useGuestMode, GuestFeature } from '@/hooks/useGuestMode';

interface GuestModeIndicatorProps {
  feature: GuestFeature;
}

const GuestModeIndicator: React.FC<GuestModeIndicatorProps> = ({ feature }) => {
  const { getRemainingUses } = useGuestMode();
  const remaining = getRemainingUses(feature);

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {remaining} free uses left today
    </Badge>
  );
};

export default GuestModeIndicator;
