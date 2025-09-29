
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { AllergenScanResult } from '@/services/allergenScanner';

interface AllergenAlertProps {
  scanResult: AllergenScanResult;
  className?: string;
}

const AllergenAlert: React.FC<AllergenAlertProps> = ({ scanResult, className }) => {
  if (scanResult.isSafe && scanResult.safeOptions.length === 0) {
    return null; // Don't show anything if no issues and no explicit safe options
  }

  const getAlertVariant = () => {
    switch (scanResult.riskLevel) {
      case 'danger':
        return 'destructive';
      case 'caution':
        return 'default';
      case 'safe':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (scanResult.riskLevel) {
      case 'danger':
        return <AlertTriangle className="h-4 w-4" />;
      case 'caution':
        return <Info className="h-4 w-4" />;
      case 'safe':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getBorderColor = () => {
    switch (scanResult.riskLevel) {
      case 'danger':
        return 'border-red-500';
      case 'caution':
        return 'border-yellow-500';
      case 'safe':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Alert variant={getAlertVariant()} className={`${getBorderColor()} ${className}`}>
      {getIcon()}
      <AlertDescription>
        <div className="space-y-2">
          {scanResult.allergenWarnings.length > 0 && (
            <div>
              <p className="font-medium text-red-600 mb-1">⚠️ Allergy Warnings:</p>
              <div className="flex flex-wrap gap-1">
                {scanResult.allergenWarnings.map((warning, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {warning}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {scanResult.dietaryWarnings.length > 0 && (
            <div>
              <p className="font-medium text-yellow-600 mb-1">⚡ Dietary Notices:</p>
              <div className="flex flex-wrap gap-1">
                {scanResult.dietaryWarnings.map((warning, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {warning}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {scanResult.safeOptions.length > 0 && (
            <div>
              <p className="font-medium text-green-600 mb-1">✅ Safe Options:</p>
              <div className="flex flex-wrap gap-1">
                {scanResult.safeOptions.map((option, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-700">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {scanResult.riskLevel !== 'safe' && (
            <p className="text-xs text-muted-foreground mt-2">
              Always verify with the restaurant about ingredients and preparation methods.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AllergenAlert;
