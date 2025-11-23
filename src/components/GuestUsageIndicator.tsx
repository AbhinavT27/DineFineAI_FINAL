import { useGuestMode } from '@/hooks/useGuestMode';
import { Card } from '@/components/ui/card';
import { Clock, Search, Scan, Sparkles, GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const GuestUsageIndicator = () => {
  const { getRemainingUses } = useGuestMode();
  
  const features = [
    { name: 'Searches', icon: Search, feature: 'search' as const, remaining: getRemainingUses('search') },
    { name: 'Menu Scrapes', icon: Scan, feature: 'scrape' as const, remaining: getRemainingUses('scrape') },
    { name: 'AI Analysis', icon: Sparkles, feature: 'ai_analysis' as const, remaining: getRemainingUses('ai_analysis') },
    { name: 'Comparisons', icon: GitCompare, feature: 'comparison' as const, remaining: getRemainingUses('comparison') },
  ];

  return (
    <Card className="bg-gradient-to-r from-background to-muted/50 border-border p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-foodRed" />
          <h3 className="font-semibold text-foreground">Free Daily Uses</h3>
        </div>
        
        <div className="flex items-center gap-6 flex-wrap">
          {features.map(({ name, icon: Icon, remaining }) => (
            <div key={name} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{name}:</span>
              <span className={`font-bold ${remaining > 0 ? 'text-foodRed' : 'text-muted-foreground'}`}>
                {remaining}/3
              </span>
            </div>
          ))}
        </div>

        <Button asChild size="sm" className="bg-foodRed hover:bg-foodRed/90">
          <Link to="/auth">Sign Up for Unlimited</Link>
        </Button>
      </div>
    </Card>
  );
};

export default GuestUsageIndicator;
