import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Shield, Star, Zap, Users } from 'lucide-react';
import Logo from '@/components/Logo';
import { Helmet } from 'react-helmet-async';

const Welcome = () => {
  const features = [
    {
      icon: Search,
      title: "Smart Restaurant Search",
      description: "Find restaurants that match your dietary restrictions and preferences with AI-powered search."
    },
    {
      icon: MapPin,
      title: "Location-Based Results",
      description: "Discover nearby restaurants or search in any location you're planning to visit."
    },
    {
      icon: Shield,
      title: "Allergen Safety",
      description: "Get alerts about potential allergens in menu items to keep you safe while dining."
    },
    {
      icon: Star,
      title: "Personalized Recommendations",
      description: "Receive restaurant suggestions tailored to your taste preferences and dietary needs."
    },
    {
      icon: Zap,
      title: "Real-Time Data",
      description: "Access up-to-date restaurant information, hours, and availability."
    },
    {
      icon: Users,
      title: "Compare Options",
      description: "Side-by-side restaurant comparisons to help you make the best dining choice."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Helmet>
        <title>Welcome to DineFineAI - AI-Powered Restaurant Discovery</title>
        <meta name="description" content="Welcome to DineFineAI! Discover restaurants that match your dietary needs, preferences, and location using artificial intelligence. Never worry about finding the right place to eat again." />
        <meta name="keywords" content="restaurant discovery, AI dining, dietary preferences, restaurant search, dining experience" />
        <meta property="og:title" content="Welcome to DineFineAI - AI-Powered Restaurant Discovery" />
        <meta property="og:description" content="Discover restaurants that match your dietary needs, preferences, and location using artificial intelligence." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/welcome`} />
      </Helmet>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Logo linkTo={false} />
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link to="/pricing">Pricing</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Logo Section */}
            <div className="flex justify-center">
              <img 
                src="/DineFineAI_logo_transparent.png" 
                alt="DineFineAI Logo" 
                className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] object-contain"
              />
            </div>
            
            {/* Text Content Section */}
            <div className="text-center md:text-left">
              <Badge variant="secondary" className="mb-4">
                AI-Powered Restaurant Discovery
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foodRed to-foodOrange bg-clip-text text-transparent">
                Find Your Perfect
                <br />
                Dining Experience
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                DineFineAI uses artificial intelligence to help you discover restaurants that match your dietary needs, 
                preferences, and location. Never worry about finding the right place to eat again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg" className="bg-foodRed hover:bg-foodRed/90">
                  <Link to="/auth">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose DineFineAI?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes restaurant discovery effortless and personalized
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-foodRed/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-foodRed" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-foodRed to-foodOrange rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Dining Experience?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who have discovered their perfect restaurants with DineFineAI
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <Logo linkTo={false} className="mb-4" />
          <p className="text-sm text-muted-foreground">© 2025 DineFineAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;