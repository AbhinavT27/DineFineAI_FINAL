import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UpgradeBlockProps {
  className?: string;
}

const UpgradeBlock: React.FC<UpgradeBlockProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpgradeClick = () => {
    if (user) {
      navigate('/current-plan');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-foodRed/5 to-primary/5 border-foodRed/20 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Blurred placeholder text */}
          <div className="space-y-2">
            <div className="filter blur-sm select-none">
              <div className="text-sm font-medium text-muted-foreground">
                AI-Powered Analysis & Customer Reviews
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Get detailed insights about menu items, dietary compatibility, and aggregated customer feedback to make informed dining decisions.
              </div>
            </div>
          </div>
          
          {/* Upgrade button */}
          <Button 
            onClick={handleUpgradeClick}
            className="w-full bg-foodRed hover:bg-foodRed/90 text-white"
            size="sm"
          >
            <Crown size={14} className="mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradeBlock;