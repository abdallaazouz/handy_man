import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface SystemSettings {
  language: string;
  rtlEnabled: boolean;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  defaultView: 'table' | 'cards';
  isLocked: boolean;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response: any = await apiRequest('GET', '/api/system-settings');
      setSettings(response);
    } catch (error) {
      console.log('Failed to load system settings, using defaults');
      setSettings({
        language: 'en',
        rtlEnabled: false,
        dateFormat: 'dd/mm/yyyy',
        timeFormat: '24h',
        currency: 'EUR',
        defaultView: 'table',
        isLocked: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const response: any = await apiRequest('POST', '/api/system-settings', updatedSettings);
      setSettings(response);
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SystemSettingsContext.Provider 
      value={{ 
        settings, 
        isLoading, 
        updateSettings, 
        refreshSettings 
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}