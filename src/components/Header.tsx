
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Heart, Clock, Crown } from 'lucide-react';
import Logo from './Logo';
import AppFeedback from './AppFeedback';
import PlanIndicator from './PlanIndicator';
import HeaderUsageIndicator from './HeaderUsageIndicator';
import DailySearchIndicator from './DailySearchIndicator';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 py-2 sm:py-0 sm:h-16">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center">
              <Link to="/home" className="flex items-center">
                <Logo />
              </Link>
              {user && <PlanIndicator />}
            </div>

            {/* Mobile: Show menu on the right */}
            <nav className="flex sm:hidden items-center space-x-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {t('navigation.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/saved-list" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        {t('navigation.savedList')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/history" className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {t('navigation.history')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/current-plan" className="flex items-center">
                        <Crown className="mr-2 h-4 w-4" />
                        {t('navigation.currentPlan')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" size="sm" className="bg-foodRed hover:bg-foodRed/90">
                  <Link to="/auth">{t('navigation.signIn')}</Link>
                </Button>
              )}
            </nav>
          </div>

          {user && (
            <div className="flex items-center justify-center gap-2 sm:gap-6 w-full sm:w-auto sm:flex-1">
              <DailySearchIndicator />
              <HeaderUsageIndicator />
              <div className="sm:hidden">
                <AppFeedback />
              </div>
            </div>
          )}
          
          {/* Desktop: Show menu on the right */}
          <nav className="hidden sm:flex items-center space-x-4">
            <AppFeedback />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {t('navigation.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved-list" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      {t('navigation.savedList')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {t('navigation.history')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/current-plan" className="flex items-center">
                      <Crown className="mr-2 h-4 w-4" />
                      {t('navigation.currentPlan')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="bg-foodRed hover:bg-foodRed/90">
                <Link to="/auth">{t('navigation.signIn')}</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
