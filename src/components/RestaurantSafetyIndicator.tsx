import { AlertTriangle, Shield } from 'lucide-react';

interface RestaurantSafetyIndicatorProps {
  allergenScanResult: {
    riskLevel: string;
    allergenWarnings: any[];
    dietaryWarnings: any[];
    safeOptions: any[];
  } | null;
}

const RestaurantSafetyIndicator: React.FC<RestaurantSafetyIndicatorProps> = ({ allergenScanResult }) => {
  if (!allergenScanResult) return null;

  if (allergenScanResult.riskLevel === 'danger') {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle size={16} />
        <span className="text-sm font-medium">High Risk</span>
      </div>
    );
  }

  // Show "Check Menu" if there are ANY warnings (allergen or dietary)
  if (allergenScanResult.allergenWarnings.length > 0 || allergenScanResult.dietaryWarnings.length > 0) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertTriangle size={16} />
        <span className="text-sm font-medium">Check Menu</span>
      </div>
    );
  }

  if (allergenScanResult.safeOptions.length > 0 || allergenScanResult.riskLevel === 'safe') {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <Shield size={16} />
        <span className="text-sm font-medium">Safe Option</span>
      </div>
    );
  }

  return null;
};

export default RestaurantSafetyIndicator;