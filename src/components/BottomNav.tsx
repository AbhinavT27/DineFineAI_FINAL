import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Home, Heart, Clock, Crown, User, LogOut } from 'lucide-react';

const BottomNav = () => {
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!isMobile) return null;

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/saved-list', icon: Heart, label: 'Saved List' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/current-plan', icon: Crown, label: 'Current Plan' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
