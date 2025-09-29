
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaceSummary } from '@/lib/types';
import { MessageSquare, Sparkles, User } from 'lucide-react';

interface PlaceSummaryCardProps {
  summary: PlaceSummary;
  isLoading?: boolean;
}

const PlaceSummaryCard: React.FC<PlaceSummaryCardProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Place Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles size={18} className="text-foodRed" />
            Restaurant Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-foodGray leading-relaxed">{summary.placeSummary}</p>
        </CardContent>
      </Card>

      {/* Review Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare size={18} className="text-foodRed" />
            Review Insights
            <Badge variant="outline" className="ml-auto">
              {summary.reviewCount} reviews analyzed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="prose prose-sm max-w-none">
            {summary.reviewSummary.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="text-foodGray leading-relaxed mb-3 last:mb-0">
                  {paragraph.trim()}
                </p>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Recommendation */}
      {summary.personalizedRecommendation && (
        <Card className="border-foodRed/20 bg-foodRed/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User size={18} className="text-foodRed" />
              Personalized for You
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-foodGray leading-relaxed font-medium">
              {summary.personalizedRecommendation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlaceSummaryCard;
