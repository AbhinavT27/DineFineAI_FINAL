import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface LockedPageStateProps {
  title: string;
  message: string;
}

const LockedPageState: React.FC<LockedPageStateProps> = ({ title, message }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start gap-3 mb-4">
        <Clock className="h-8 w-8 text-foreground mt-1" />
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </div>
      <p className="text-muted-foreground mb-8 text-base">{message}</p>
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground mb-6 text-center">
          This feature requires an account
        </p>
        <Button asChild className="bg-foodRed hover:bg-foodRed/90">
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    </div>
  );
};

export default LockedPageState;
