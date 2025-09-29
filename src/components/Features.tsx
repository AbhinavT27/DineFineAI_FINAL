
import { Clock, Shield, Award, HeartHandshake } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: "Instant Reservations",
      description: "Book your table in seconds with real-time availability and instant confirmation."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your reservations are protected with our secure booking system and reliable service."
    },
    {
      icon: Award,
      title: "Curated Selection",
      description: "Only the finest restaurants make it to our platform, ensuring exceptional dining experiences."
    },
    {
      icon: HeartHandshake,
      title: "Concierge Service",
      description: "Need special arrangements? Our concierge team is here to make your evening perfect."
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Choose DineFine?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're more than just a reservation platform. We're your gateway to extraordinary culinary adventures.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <feature.icon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
