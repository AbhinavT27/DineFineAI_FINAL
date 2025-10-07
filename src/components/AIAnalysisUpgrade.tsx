import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { analyzeReviewsWithAI } from '@/services/reviewAnalysisService';

interface AIAnalysisUpgradeProps {
  className?: string;
  restaurantName?: string;
  reviews?: any[];
  pros?: string[];
  cons?: string[];
}

const AIAnalysisUpgrade: React.FC<AIAnalysisUpgradeProps> = ({ 
  className, 
  restaurantName, 
  reviews = [], 
  pros = [], 
  cons = [] 
}) => {
  const navigate = useNavigate();
  const { createCheckout, limits } = useSubscription();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState({ pros, cons });

  // Check if user has access to AI analysis
  const hasAccess = limits.aiAnalysis;

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (hasAccess && restaurantName && reviews.length > 0 && pros.length === 0 && cons.length === 0) {
        setIsAnalyzing(true);
        try {
          const result = await analyzeReviewsWithAI(reviews, restaurantName);
          setAnalysisData({
            pros: result.whatPeopleLove,
            cons: result.areasForImprovement
          });
        } catch (error) {
          console.error('Failed to analyze reviews:', error);
        } finally {
          setIsAnalyzing(false);
        }
      } else if (pros.length > 0 || cons.length > 0) {
        setAnalysisData({ pros, cons });
      }
    };

    fetchAnalysis();
  }, [hasAccess, restaurantName, reviews, pros, cons]);

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

  // If user has premium access, show the actual analysis
  if (hasAccess) {
    if (isAnalyzing) {
      return (
        <Card className={className}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">AI-Powered Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing reviews...</span>
          </CardContent>
        </Card>
      );
    }

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
              <div className="space-y-2">
                {analysisData.pros.length > 0 ? (
                  analysisData.pros.map((pro, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm">{pro}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews available for analysis</p>
                )}
              </div>
            </div>
            
            {/* Cons Column */}
            <div>
              <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Cons
              </h4>
              <div className="space-y-2">
                {analysisData.cons.length > 0 ? (
                  analysisData.cons.map((con, index) => (
                    <div key={index} className="flex items-start">
                      <X className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm">{con}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews available for analysis</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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