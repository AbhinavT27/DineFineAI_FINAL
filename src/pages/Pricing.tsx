import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
const Pricing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const {
    user
  } = useAuth();
  const {
    subscription_tier,
    createCheckout,
    openCustomerPortal,
    checkSubscription
  } = useSubscription();
  useEffect(() => {
    document.title = 'Pricing - DineFineAI';

    // Handle Stripe success/cancel redirects
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      // Payment successful, refresh subscription status
      setTimeout(() => {
        checkSubscription().then(() => {
          toast.success('Welcome to your new plan! Your subscription is now active. 🎉');
          // Clean up URL params
          setSearchParams(new URLSearchParams());
        });
      }, 2000); // Give Stripe time to process
    } else if (canceled === 'true') {
      toast.error('Payment was canceled. You can try again anytime.');
      // Clean up URL params
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams, checkSubscription]);
  const freeFeatures = [
    t('pricing.features.basicSearch'),
    t('pricing.features.locationResults'),
    t('pricing.features.dietaryFilters'),
    t('pricing.features.basicAllergenAlerts'),
    t('pricing.features.customerReviews'),
    t('pricing.features.scrape5'),
    t('pricing.features.saved5')
  ];
  
  const freeNotIncluded = [
    t('pricing.features.comparisonTool'),
    t('pricing.features.smartTagging'),
    t('pricing.features.aiProsAndCons'),
    t('pricing.features.unlimitedScraping')
  ];
  
  const proFeatures = [
    t('pricing.features.everythingFree'),
    t('pricing.features.scrape15'),
    t('pricing.features.saved20'),
    t('pricing.features.comparison2')
  ];
  
  const proNotIncluded = [
    t('pricing.features.unlimitedScrapes'),
    t('pricing.features.unlimitedSaved'),
    t('pricing.features.comparison3'),
    t('pricing.features.aiReview'),
    t('pricing.features.smartTagging')
  ];
  
  const premiumFeatures = [
    t('pricing.features.everythingPro'),
    t('pricing.features.unlimitedScrapes'),
    t('pricing.features.unlimitedSaved'),
    t('pricing.features.comparison3'),
    t('pricing.features.aiReview'),
    t('pricing.features.smartTagging')
  ];
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild className="bg-foodRed hover:bg-foodRed/90">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {t('pricing.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-border flex flex-col">
              <CardHeader className="text-center pb-8">
                <h3 className="text-2xl font-bold mb-2">{t('pricing.free')}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">{t('pricing.forever')}</span>
                </div>
                <p className="text-muted-foreground">{t('pricing.casualDiners')}</p>
              </CardHeader>
              <CardContent className="space-y-6 flex-grow flex flex-col">
                <div className="flex-grow space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                      {t('pricing.whatsIncluded')}
                    </h4>
                    <ul className="space-y-3">
                      {freeFeatures.map((feature, index) => <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                      {t('pricing.notIncluded')}
                    </h4>
                    <ul className="space-y-3">
                      {freeNotIncluded.map((feature, index) => <li key={index} className="flex items-center">
                          <X className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {user ? subscription_tier === 'free' ? <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button> : <Button variant="outline" className="w-full" onClick={() => openCustomerPortal()}>
                        Manage Subscription
                      </Button> : <Button asChild className="w-full" variant="outline">
                      <Link to="/auth">Get Started</Link>
                    </Button>}
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-foodRed relative flex flex-col">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foodRed text-white">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground ml-2">per month</span>
                </div>
                <p className="text-muted-foreground">For regular restaurant explorers</p>
              </CardHeader>
              <CardContent className="space-y-6 flex-grow flex flex-col">
                <div className="flex-grow space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                      WHAT'S INCLUDED
                    </h4>
                    <ul className="space-y-3">
                      {proFeatures.map((feature, index) => <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                      NOT INCLUDED
                    </h4>
                    <ul className="space-y-3">
                      {proNotIncluded.map((feature, index) => <li key={index} className="flex items-center">
                          <X className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {user ? subscription_tier === 'pro' ? <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button> : <Button className="w-full bg-foodRed hover:bg-foodRed/90" onClick={() => createCheckout('pro')}>
                        {subscription_tier !== 'free' ? 'Change to Pro' : 'Start Pro Trial'}
                      </Button> : <Button asChild className="w-full bg-foodRed hover:bg-foodRed/90">
                      <Link to="/auth">Start Pro Trial</Link>
                    </Button>}
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-orange-500 relative flex flex-col">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 premium-gradient text-white">
                Premium
              </Badge>
              <CardHeader className="text-center pb-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground ml-2">per month</span>
                </div>
                <p className="text-muted-foreground">For food enthusiasts who want it all</p>
              </CardHeader>
              <CardContent className="space-y-6 flex-grow flex flex-col">
                <div className="flex-grow space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground uppercase text-sm tracking-wider">
                      WHAT'S INCLUDED
                    </h4>
                    <ul className="space-y-3">
                      {premiumFeatures.map((feature, index) => <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {user ? subscription_tier === 'premium' ? <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button> : <Button className="w-full premium-gradient hover:opacity-90" onClick={() => createCheckout('premium')}>
                        {subscription_tier !== 'free' ? 'Change to Premium' : 'Start Premium Trial'}
                      </Button> : <Button asChild className="w-full premium-gradient hover:opacity-90">
                      <Link to="/auth">Start Premium Trial</Link>
                    </Button>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>;
};
export default Pricing;
