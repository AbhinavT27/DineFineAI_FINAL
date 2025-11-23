import GuestHeader from '@/components/GuestHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const GuestHistory = () => {
  return (
    <div className="min-h-screen">
      <GuestHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Guest History
            </CardTitle>
            <CardDescription>
              Your search history is not saved in guest mode. Sign up to save your searches and access them anytime!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-muted-foreground text-center">
                No history available for guest users
              </p>
              <Button asChild className="bg-foodRed hover:bg-foodRed/90">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GuestHistory;
