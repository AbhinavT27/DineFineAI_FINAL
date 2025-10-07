import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: 'comparison' | 'reviews' | 'aiAnalysis' | 'tagging';
  requiredPlan?: 'pro' | 'premium';
  className?: string;
  showUpgradeButton?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  feature,
  requiredPlan = 'pro',
  className,
  showUpgradeButton = true
}) => {
  const { subscription_tier, limits, createCheckout } = useSubscription();
  const navigate = useNavigate();

  const isFeatureAllowed = () => {
    switch (feature) {
      case 'comparison':
        return limits.comparisonTool;
      case 'reviews':
        return true; // Reviews are available on all plans
      case 'aiAnalysis':
        return limits.aiAnalysis;
      case 'tagging':
        return limits.canCreateTags;
      default:
        return false;
    }
  };

  const getFeatureName = () => {
    switch (feature) {
      case 'comparison':
        return 'Restaurant Comparison';
      case 'reviews':
        return 'Customer Reviews';
      case 'aiAnalysis':
        return 'AI-Powered Analysis';
      case 'tagging':
        return 'Smart Tagging System';
      default:
        return 'Premium Feature';
    }
  };

  const getUpgradeMessage = () => {
    if (requiredPlan === 'premium') {
      return 'Upgrade to Premium to unlock this feature';
    }
    return 'Upgrade to Pro to unlock this feature';
  };

  if (isFeatureAllowed()) {
    return <>{children}</>;
  }

  // For AI analysis, show blurred content instead of overlay
  if (feature === 'aiAnalysis') {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-2 z-10 flex items-center justify-center">
          <Card className="shadow-lg max-w-full w-fit">
            <CardContent className="p-3">
              <div className="flex flex-col items-center gap-2 text-center max-w-xs">
                <Crown className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-xs mb-1">{getFeatureName()}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getUpgradeMessage()}
                  </p>
                </div>
                {showUpgradeButton && (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <Button
                      onClick={() => subscription_tier ? navigate('/current-plan') : createCheckout(requiredPlan)}
                      size="sm"
                      className="text-xs h-7 px-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      <Lock className="mr-1 h-3 w-3" />
                      Upgrade to Premium
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => subscription_tier ? navigate('/current-plan') : navigate('/pricing')}
                      className="text-xs h-6 px-2 w-full"
                    >
                      View plans
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/90 dark:bg-black/90 rounded-lg flex items-center justify-center p-1">
        <Card className="w-full max-w-xs mx-auto shadow-lg">
          <CardContent className="p-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <div>
                {requiredPlan === 'premium' ? (
                  <Crown className="h-4 w-4 text-orange-500 mx-auto" />
                ) : (
                  <Star className="h-4 w-4 text-blue-500 mx-auto" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-xs mb-1 line-clamp-1">{getFeatureName()}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {getUpgradeMessage()}
                </p>
              </div>
              
              {showUpgradeButton && (
                <div className="flex flex-col items-center gap-1 w-full">
                  <Button
                    onClick={() => subscription_tier ? navigate('/current-plan') : createCheckout(requiredPlan)}
                    size="sm"
                    className={`text-xs h-6 px-2 w-full ${
                      requiredPlan === 'premium'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    <Lock className="mr-1 h-3 w-3" />
                    Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
                  </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => subscription_tier ? navigate('/current-plan') : navigate('/pricing')}
                      className="text-xs h-5 px-1 w-full"
                  >
                    View plans
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="blur-sm opacity-20 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default FeatureGate;