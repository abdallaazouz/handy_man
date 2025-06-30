import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioService } from '@/lib/audio';

interface AudioNotificationContextType {
  isEnabled: boolean;
  enableAudio: () => Promise<void>;
  playNotification: (type: string) => Promise<void>;
  toggleAudio: () => void;
}

const AudioNotificationContext = createContext<AudioNotificationContextType | undefined>(undefined);

export function AudioNotificationProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Default to true (enabled) if no preference is saved
    const saved = localStorage.getItem('audioEnabled');
    return saved === null ? true : saved === 'true';
  });

  const enableAudio = async () => {
    try {
      await audioService.enableAudio();
      setIsEnabled(true);
      localStorage.setItem('audioEnabled', 'true');
    } catch (error) {
      console.warn('Failed to enable audio:', error);
      // Still set as enabled even if audio context fails
      setIsEnabled(true);
      localStorage.setItem('audioEnabled', 'true');
    }
  };

  const playNotification = async (type: string) => {
    // Always try to play notification, enable audio if needed
    if (!isEnabled) {
      await enableAudio();
    }
    await audioService.playNotification(type);
  };

  const toggleAudio = () => {
    // Always keep audio enabled - remove toggle functionality
    enableAudio();
  };

  // Auto-enable audio on mount
  useEffect(() => {
    enableAudio();
  }, []);

  return (
    <AudioNotificationContext.Provider value={{ isEnabled, enableAudio, playNotification, toggleAudio }}>
      {children}
    </AudioNotificationContext.Provider>
  );
}

export function useAudioNotifications() {
  const context = useContext(AudioNotificationContext);
  if (!context) {
    throw new Error('useAudioNotifications must be used within an AudioNotificationProvider');
  }
  return context;
}
