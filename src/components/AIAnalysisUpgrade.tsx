import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';

interface AIAnalysisUpgradeProps {
  className?: string;
}

const AIAnalysisUpgrade: React.FC<AIAnalysisUpgradeProps> = ({ className }) => {
  const navigate = useNavigate();
  const { createCheckout } = useSubscription();
  const { user } = useAuth();

  const handleUpgradeClick = () => {
    if (user) {
      navigate('/current-plan');
    } else {
      navigate('/pricing');
    }
  };

  const handleViewPlansClick = () => {
    if (user) {
      navigate('/current-plan');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">AI-Powered Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros Column */}
          <div>
            <h4 className="font-semibold text-green-600 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Pros
            </h4>
            <div className="space-y-2 filter blur-sm select-none">
              <div className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Fresh ingredients and quality sourcing</span>
              </div>
              <div className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Attentive and knowledgeable service</span>
              </div>
              <div className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Popular dining destination</span>
              </div>
              <div className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Consistent food quality</span>
              </div>
            </div>
          </div>
          
          {/* Cons Column */}
          <div>
            <h4 className="font-semibold text-red-600 mb-3 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Cons
            </h4>
            <div className="space-y-2 filter blur-sm select-none">
              <div className="flex items-start">
                <X className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">May experience wait times during peak hours</span>
              </div>
              <div className="flex items-start">
                <X className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Limited information available for detailed analysis</span>
              </div>
              <div className="flex items-start">
                <X className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Pricing may vary by location</span>
              </div>
              <div className="flex items-start">
                <X className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">Potential for crowding during busy periods</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upgrade Message */}
        <div className="pt-4 border-t">
          <p className="text-muted-foreground text-sm mb-4">
            Upgrade to Premium to unlock this feature
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium"
            >
              Upgrade to Premium
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewPlansClick}
              className="text-muted-foreground border-muted hover:bg-muted/50"
            >
              View plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisUpgrade;