import React, { createContext, useContext, useEffect } from 'react';
import i18n from '@/i18n';
import { useAuth } from './AuthContext';

type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: Array<{ code: string; name: string; nativeName: string }>;
};

const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { userPreferences } = useAuth();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);

  // Set language from user preferences when available
  useEffect(() => {
    if (userPreferences?.language && userPreferences.language !== i18n.language) {
      i18n.changeLanguage(userPreferences.language);
    }
  }, [userPreferences?.language]);

  // Keep state in sync with i18n changes
  useEffect(() => {
    const handler = (lng: string) => setCurrentLanguage(lng);
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <LanguageContext.Provider 
      value={{
        currentLanguage,
        changeLanguage,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};