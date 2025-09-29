
import RestaurantCard from './RestaurantCard';
import { Restaurant } from '@/lib/types';

const FeaturedRestaurants = () => {
  const mockRestaurants = [
    {
      name: "Le Bernardin",
      image: "/placeholder.svg",
      rating: 4.8,
      location: "Midtown West",
      cuisine: "French Seafood",
      priceRange: "$$$$",
      availableTime: "7:30 PM"
    },
    {
      name: "Osteria Francescana",
      image: "/placeholder.svg",
      rating: 4.9,
      location: "Little Italy",
      cuisine: "Italian",
      priceRange: "$$$",
      availableTime: "8:00 PM"
    },
    {
      name: "Sukiyabashi Jiro",
      image: "/placeholder.svg",
      rating: 4.7,
      location: "East Village",
      cuisine: "Japanese Sushi",
      priceRange: "$$$$",
      availableTime: "6:30 PM"
    },
    {
      name: "The French Laundry",
      image: "/placeholder.svg",
      rating: 4.9,
      location: "Upper East Side",
      cuisine: "Contemporary American",
      priceRange: "$$$$",
      availableTime: "9:00 PM"
    },
    {
      name: "Noma",
      image: "/placeholder.svg",
      rating: 4.8,
      location: "SoHo",
      cuisine: "Nordic",
      priceRange: "$$$",
      availableTime: "7:00 PM"
    },
    {
      name: "Eleven Madison Park",
      image: "/placeholder.svg",
      rating: 4.6,
      location: "Flatiron",
      cuisine: "Contemporary",
      priceRange: "$$$$",
      availableTime: "8:30 PM"
    }
  ];

  // Transform mock data into Restaurant objects
  const restaurants: Restaurant[] = mockRestaurants.map((restaurant, index) => ({
    id: `featured-${index}`,
    name: restaurant.name,
    imageUrl: restaurant.image,
    cuisineType: restaurant.cuisine,
    rating: restaurant.rating,
    priceLevel: restaurant.priceRange as '$' | '$$' | '$$$' | '$$$$',
    address: restaurant.location,
    distance: "2.5 km",
    dietaryOptions: [],
    pros: [],
    cons: []
  }));

  return (
    <section className="py-16 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Featured Restaurants
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover exceptional dining experiences at these carefully curated restaurants, 
            each offering unique flavors and unforgettable moments.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedRestaurants;
