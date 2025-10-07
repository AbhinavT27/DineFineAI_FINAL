import { Helmet } from 'react-helmet-async';
import { Construction, Calendar } from 'lucide-react';
import { maintenanceConfig } from '@/config/maintenance';

export default function UnderConstruction() {
  return (
    <>
      <Helmet>
        <title>DineFineAI - Under Construction</title>
        <meta name="description" content="DineFineAI is currently under construction. We're working hard to bring you an amazing experience." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-8">
            <img 
              src="/DineFineAI_logo_transparent.png" 
              alt="DineFineAI Logo" 
              className="h-20 w-auto"
            />
          </div>

          {/* Construction Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-card border-2 border-primary/20 rounded-full p-8">
                <Construction className="h-24 w-24 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Under Construction
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              We're working diligently to bring you an enhanced DineFineAI experience. 
              Our team is making important improvements to serve you better.
            </p>
          </div>

          {/* Check Back Date */}
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Please check back on</span>
              <span className="font-semibold text-foreground">
                {maintenanceConfig.checkBackDate}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Thank you for your patience and understanding.
            </p>
            <p className="text-sm text-muted-foreground">
              For urgent inquiries, please contact us at{' '}
              <a 
                href="mailto:help.dinefineai@gmail.com" 
                className="text-primary hover:underline"
              >
                help.dinefineai@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
