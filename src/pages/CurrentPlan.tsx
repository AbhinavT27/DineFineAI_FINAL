import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const CurrentPlan = () => {
  const { user } = useAuth();
  const { subscription_tier, createCheckout, openCustomerPortal } = useSubscription();

  useEffect(() => {
    document.title = 'Current Plan - DineFineAI';
  }, []);

  const freeFeatures = [
    "Basic restaurant search",
    "Location-based results", 
    "Dietary filters",
    "Basic allergen alerts",
    "Scrape up to 5 restaurants/day",
    "5 saved restaurants total"
  ];

  const freeNotIncluded = [
    "Restaurant comparison tool",
    "Customer reviews",
    "AI-powered pros & cons",
    "Smart tagging system",
    "Unlimited scraping"
  ];

  const proFeatures = [
    "Everything in Free Plan",
    "Scrape up to 15 restaurants/day",
    "20 saved restaurants total",
    "2-restaurant comparison tool",
    "Customer reviews"
  ];

  const proNotIncluded = [
    "Unlimited restaurant scrapes",
    "Unlimited saved restaurants",
    "3-restaurant comparison tool",
    "AI-powered pros & cons review",
    "Smart tagging system"
  ];

  const premiumFeatures = [
    "Everything in Pro Plan",
    "Unlimited restaurant scrapes",
    "Unlimited saved restaurants",
    "3-restaurant comparison tool",
    "AI-powered pros & cons review",
    "Smart tagging system"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />

      {/* Current Plan Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-foodRed mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Your Current Plan
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your subscription and explore available features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className={`border-2 ${subscription_tier === 'free' ? 'border-foodRed bg-foodRed/5' : 'border-border'}`}>
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-2">
                  <h3 className="text-2xl font-bold">Free</h3>
                  {subscription_tier === 'free' && (
                    <Badge className="ml-3 bg-foodRed text-white">
                      Your Plan
                    </Badge>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">forever</span>
                </div>
                <p className="text-muted-foreground">Perfect for casual diners</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                    WHAT'S INCLUDED
                  </h4>
                  <ul className="space-y-3">
                    {freeFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                    NOT INCLUDED
                  </h4>
                  <ul className="space-y-3">
                    {freeNotIncluded.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <X className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {subscription_tier === 'free' ? (
                  <div className="text-center py-4">
                    <span className="text-muted-foreground font-medium">Current Plan</span>
                  </div>
                 ) : (
                   <Button 
                     className="w-full bg-foodRed hover:bg-foodRed/90"
                     onClick={() => openCustomerPortal()}
                   >
                     Manage Subscription
                   </Button>
                 )}
               </CardContent>
             </Card>

             {/* Pro Plan */}
              <Card className={`border-2 ${subscription_tier === 'pro' ? 'border-foodRed bg-foodRed/5' : 'border-border'} relative`}>
                {subscription_tier !== 'pro' && (
                 <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foodRed text-white">
                   Most Popular
                 </Badge>
               )}
               <CardHeader className="text-center pb-8">
                 <div className="flex items-center justify-center mb-2">
                   <h3 className="text-2xl font-bold">Pro</h3>
                    {subscription_tier === 'pro' && (
                      <Badge className="ml-3 bg-foodRed text-white">
                        Your Plan
                      </Badge>
                    )}
                 </div>
                 <div className="mb-4">
                   <span className="text-4xl font-bold">$5</span>
                   <span className="text-muted-foreground ml-2">per month</span>
                 </div>
                 <p className="text-muted-foreground">For regular restaurant explorers</p>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div>
                   <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                     WHAT'S INCLUDED
                   </h4>
                   <ul className="space-y-3">
                     {proFeatures.map((feature, index) => (
                       <li key={index} className="flex items-center">
                         <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                         <span className="text-sm">{feature}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div>
                   <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                     NOT INCLUDED
                   </h4>
                   <ul className="space-y-3">
                     {proNotIncluded.map((feature, index) => (
                       <li key={index} className="flex items-center">
                         <X className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                         <span className="text-sm text-muted-foreground">{feature}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                  {subscription_tier === 'pro' ? (
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => openCustomerPortal()}
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-foodRed hover:bg-foodRed/90"
                      onClick={() => createCheckout('pro')}
                    >
                      Upgrade to Pro
                    </Button>
                  )}
               </CardContent>
             </Card>

             {/* Premium Plan */}
             <Card className={`border-2 ${subscription_tier === 'premium' ? 'border-orange-500 bg-orange-500/5' : 'border-orange-500'} relative`}>
               <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 premium-gradient text-white">
                 Premium
               </Badge>
               <CardHeader className="text-center pb-8">
                 <div className="flex items-center justify-center mb-2">
                   <h3 className="text-2xl font-bold">Premium</h3>
                    {subscription_tier === 'premium' && (
                      <Badge className="ml-3 premium-gradient text-white">
                        Your Plan
                      </Badge>
                    )}
                 </div>
                 <div className="mb-4">
                   <span className="text-4xl font-bold">$10</span>
                   <span className="text-muted-foreground ml-2">per month</span>
                 </div>
                 <p className="text-muted-foreground">For food enthusiasts who want it all</p>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div>
                   <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                     WHAT'S INCLUDED
                   </h4>
                   <ul className="space-y-3">
                     {premiumFeatures.map((feature, index) => (
                       <li key={index} className="flex items-center">
                         <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                         <span className="text-sm">{feature}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                  {subscription_tier === 'premium' ? (
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => openCustomerPortal()}
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full premium-gradient hover:opacity-90"
                      onClick={() => createCheckout('premium')}
                    >
                      Upgrade to Premium
                    </Button>
                  )}
               </CardContent>
             </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CurrentPlan;
