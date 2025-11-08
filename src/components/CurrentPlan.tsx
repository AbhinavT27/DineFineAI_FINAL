import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { useAuth } from '@/contexts/AuthContext';

const CurrentPlan = () => {
  const { user } = useAuth();
  const { subscription_tier, createCheckout, openCustomerPortal } = useSubscription();
  const { getUsageStats } = useFeatureGates();
  const usageStats = getUsageStats();
  
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for casual diners",
      features: [
        "Basic restaurant search",
        "Location-based results",
        "Dietary filters",
        "Basic allergen alerts",
        "Scrape up to 10 restaurants/day",
        "5 saved restaurants total"
      ],
      popular: false,
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      isCurrentPlan: subscription_tier === "free",
      icon: <Star className="w-5 h-5 text-gray-500" />
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "per month",
      description: "For regular restaurant explorers",
      features: [
        "Everything in Free Plan",
        "Scrape up to 50 restaurants/day",
        "20 saved restaurants total",
        "2-restaurant comparison tool",
        "Customer reviews"
      ],
      popular: true,
      buttonText: subscription_tier === "pro" ? "Current Plan" : "Upgrade to Pro",
      buttonVariant: subscription_tier === "pro" ? "outline" as const : "default" as const,
      isCurrentPlan: subscription_tier === "pro",
      icon: <Zap className="w-5 h-5 text-foodRed" />
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "per month",
      description: "For food enthusiasts who want it all",
      features: [
        "Everything in Pro Plan",
        "Unlimited restaurant scrapes",
        "Unlimited saved restaurants", 
        "3-restaurant comparison tool",
        "AI-powered pros & cons review",
        "Smart tagging system"
      ],
      popular: false,
      buttonText: subscription_tier === "premium" ? "Current Plan" : "Upgrade to Premium",
      buttonVariant: subscription_tier === "premium" ? "outline" as const : "default" as const,
      isCurrentPlan: subscription_tier === "premium",
      icon: <Crown className="w-5 h-5 text-orange-500" />
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-foodRed" />
        Current Plan
      </h3>
      
      <div className="space-y-4">
        {plans.map((plan, index) => (
          <Card key={index} className={`relative ${plan.isCurrentPlan ? 'border-foodRed ring-2 ring-foodRed/20' : 'border-gray-200 opacity-60'}`}>
            {plan.isCurrentPlan && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-foodRed text-white text-xs">Active</Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                </div>
                {plan.popular && !plan.isCurrentPlan && (
                  <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {plan.features.slice(0, 3).map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
                
                {/* Show usage stats for current plan */}
                {plan.isCurrentPlan && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {usageStats.dailyScrapesLimit !== -1 && (
                        <div className="flex justify-between">
                          <span>Scrapes today:</span>
                          <span className="font-medium">{usageStats.dailyScrapesUsed}/{usageStats.dailyScrapesLimit}</span>
                        </div>
                      )}
                      {usageStats.savedRestaurantsLimit !== -1 && (
                        <div className="flex justify-between">
                          <span>Saved restaurants:</span>
                          <span className="font-medium">{usageStats.savedRestaurantsUsed}/{usageStats.savedRestaurantsLimit}</span>
                        </div>
                      )}
                      {usageStats.dailyScrapesLimit === -1 && usageStats.savedRestaurantsLimit === -1 && (
                        <div className="text-green-600 font-medium">✨ Unlimited Access</div>
                      )}
                    </div>
                  </div>
                )}
                
                {plan.features.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{plan.features.length - 3} more features
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                {user ? (
                  plan.isCurrentPlan ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full cursor-default"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : plan.name === 'Free' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openCustomerPortal()}
                    >
                      Manage
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${plan.name === 'Pro' ? 'bg-foodRed hover:bg-foodRed/90' : plan.name === 'Premium' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                      variant={plan.buttonVariant}
                      size="sm"
                      onClick={() => createCheckout(plan.name === 'Pro' ? 'pro' : 'premium')}
                    >
                      {plan.buttonText}
                    </Button>
                  )
                ) : (
                  <Button 
                    asChild 
                    className={`w-full ${plan.name === 'Pro' ? 'bg-foodRed hover:bg-foodRed/90' : plan.name === 'Premium' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    variant={plan.buttonVariant}
                    size="sm"
                  >
                    <Link to="/pricing">{plan.buttonText}</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/pricing" className="text-foodRed hover:text-foodRed/80">
            View All Plans →
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CurrentPlan;