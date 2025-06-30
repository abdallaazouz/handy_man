import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '@/lib/translations';
import { useSystemSettings } from '@/hooks/use-system-settings';

type Language = 'en' | 'de' | 'ar';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const { settings, updateSettings } = useSystemSettings();

  // Load language from system settings when available
  useEffect(() => {
    if (settings?.language) {
      const systemLang = settings.language as Language;
      setCurrentLanguage(systemLang);
      localStorage.setItem('language', systemLang);
    } else {
      // Fallback to localStorage if system settings not loaded yet
      const saved = localStorage.getItem('language') as Language;
      if (saved && ['en', 'de', 'ar'].includes(saved)) {
        setCurrentLanguage(saved);
      }
    }
  }, [settings?.language]);

  const setLanguage = async (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update document direction for RTL languages
    const isRTL = lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Update system settings to persist language choice
    if (updateSettings) {
      try {
        await updateSettings({ language: lang });
      } catch (error) {
        console.error('Failed to update system language:', error);
      }
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[currentLanguage] || translations.en;
    const translation = (langTranslations as any)[key] || (translations.en as any)[key] || key;
    return translation;
  };

  const isRTL = currentLanguage === 'ar';

  useEffect(() => {
    // Set initial direction
    const isRTL = currentLanguage === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
