import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Heart, Clock, Crown } from 'lucide-react';
import Logo from './Logo';
import AppFeedback from './AppFeedback';
import GuestUsageCircles from './GuestUsageCircles';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from './ThemeProvider';

const GuestHeader = () => {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider defaultTheme="light">
      <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 py-2 sm:py-0 sm:h-16">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center">
              <Link to="/app/guest" className="flex items-center">
                <Logo linkTo={false} />
              </Link>
              <div className="ml-3 text-xl font-bold text-muted-foreground">
                Guest
              </div>
            </div>

            {/* Mobile/Tablet: User dropdown */}
            {!isMobile && (
              <nav className="flex lg:hidden items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/app/guest/locked/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/app/guest/locked/saved" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        Saved List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/app/guest/history" className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/app/guest/locked/plan" className="flex items-center">
                        <Crown className="mr-2 h-4 w-4" />
                        Current Plan
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            )}
          </div>

          {/* Desktop: Full navigation with usage indicators */}
          <div className="hidden lg:flex items-center space-x-4">
            <GuestUsageCircles />
            <AppFeedback />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/app/guest/locked/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/guest/locked/saved" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    Saved List
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/guest/history" className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/guest/locked/plan" className="flex items-center">
                    <Crown className="mr-2 h-4 w-4" />
                    Current Plan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild className="bg-foodRed hover:bg-foodRed/90">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
    </ThemeProvider>
  );
};

export default GuestHeader;
