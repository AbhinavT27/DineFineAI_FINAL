import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestHeader from '@/components/GuestHeader';
import { useComparison } from '@/contexts/ComparisonContext';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import { MapPin, DollarSign, Phone, Globe } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

const GuestComparison = () => {
  const navigate = useNavigate();
  const { comparisonRestaurants, clearComparison } = useComparison();
  const { checkFeatureAccess, registerUsage, getRemainingTries } = useFreeTrial();

  useEffect(() => {
    // Navigate away if no restaurants to compare
    if (comparisonRestaurants.length === 0) {
      navigate('/app/guest');
      return;
    }

    // Check if guest can use comparison feature
    if (!checkFeatureAccess('compare')) {
      navigate('/app/guest');
      return;
    }

    // Register usage when comparison is viewed
    registerUsage('compare');
  }, [checkFeatureAccess, registerUsage, comparisonRestaurants.length, navigate]);

  if (comparisonRestaurants.length === 0) {
    return null;
  }

  const handleClearComparison = () => {
    clearComparison();
    navigate('/app/guest');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Compare Restaurants - DineFineAI Guest</title>
        <meta name="description" content="Compare restaurants side by side to find your perfect dining choice" />
      </Helmet>

      <GuestHeader />

      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          You have {getRemainingTries('compare')} free comparison uses left
        </p>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Restaurant Comparison</h1>
          <Button variant="outline" onClick={handleClearComparison}>
            Clear Comparison
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              {restaurant.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <StarRating rating={restaurant.rating} />
                  <span className="text-sm text-muted-foreground">
                    ({restaurant.rating?.toFixed(1) || 'N/A'})
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant.cuisineType && (
                  <div>
                    <Badge variant="secondary">{restaurant.cuisineType}</Badge>
                  </div>
                )}

                {restaurant.priceLevel && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.priceLevel}</span>
                  </div>
                )}

                {restaurant.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{restaurant.address}</span>
                  </div>
                )}

                {restaurant.distance && (
                  <div className="text-sm text-muted-foreground">
                    Distance: {restaurant.distance}
                  </div>
                )}

                {restaurant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-primary hover:underline"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {restaurant.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {restaurant.pros && restaurant.pros.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2">Pros:</h4>
                    <ul className="text-sm space-y-1">
                      {restaurant.pros.map((pro, index) => (
                        <li key={index} className="text-muted-foreground">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {restaurant.cons && restaurant.cons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Cons:</h4>
                    <ul className="text-sm space-y-1">
                      {restaurant.cons.map((con, index) => (
                        <li key={index} className="text-muted-foreground">• {con}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/app/guest/restaurant/${restaurant.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GuestComparison;
