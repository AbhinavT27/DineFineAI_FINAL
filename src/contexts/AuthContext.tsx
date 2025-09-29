
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useNavigate, useLocation } from 'react-router-dom';

type UserPreferences = {
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  username: string;
  phone_number: string | null;
  location: string | null;
  usecurrentlocation: boolean | null;
  distance_unit: string | null;
  language: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userPreferences: UserPreferences | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserPreferences: () => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: (isNew: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Function to fetch user preferences
  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, dietary_preferences, allergies, phone_number, location, usecurrentlocation, distance_unit, language')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences({
          username: data.username,
          dietary_preferences: data.dietary_preferences,
          allergies: data.allergies,
          phone_number: data.phone_number,
          location: data.location,
          usecurrentlocation: data.usecurrentlocation,
          distance_unit: data.distance_unit,
          language: data.language
        });
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
    }
  };

  // Function to refresh user preferences
  const refreshUserPreferences = async () => {
    if (!user?.id) return;
    await fetchUserPreferences(user.id);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is new (signed up) from OAuth or regular signup
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user was created recently (within last minute) to detect new users
          const userCreated = new Date(session.user.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - userCreated.getTime();
          const isRecentlyCreated = timeDiff < 60000; // 1 minute
          
          if (isRecentlyCreated) {
            setIsNewUser(true);
          }
          
          // Use setTimeout to prevent potential deadlocks
          setTimeout(() => {
            fetchUserPreferences(session.user.id);
          }, 0);
          
          // Handle redirects after authentication
          setTimeout(() => {
            if (isRecentlyCreated) {
              navigate('/profile?newUser=true');
              setIsNewUser(false);
            } else if (location.pathname === '/auth') {
              navigate('/home');
            }
          }, 100);
        } else {
          setUserPreferences(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Use setTimeout to prevent potential deadlocks
        setTimeout(() => {
          fetchUserPreferences(session.user.id);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clean up auth state from storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for a clean state
      window.location.href = '/welcome';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userPreferences, 
      isLoading, 
      signOut,
      refreshUserPreferences,
      isNewUser,
      setIsNewUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
