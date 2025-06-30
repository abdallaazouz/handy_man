import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioNotifications } from '@/hooks/use-audio-notifications';

interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  soundType?: string;
}

export function showToastNotification({ 
  message, 
  type = 'info', 
  duration = 5000,
  soundType = 'general'
}: ToastNotificationProps) {
  const { toast } = useToast();
  const { playNotification } = useAudioNotifications();

  useEffect(() => {
    toast({
      title: getToastTitle(type),
      description: message,
      duration,
      variant: type === 'error' ? 'destructive' : 'default',
    });

    // Play notification sound
    playNotification(soundType);
  }, [message, type, duration, soundType, toast, playNotification]);

  return null;
}

function getToastTitle(type: string) {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };
  return titles[type as keyof typeof titles] || 'Notification';
}

// Helper function to show toast notifications
export function showNotification(
  message: string,
  type: ToastNotificationProps['type'] = 'info',
  soundType: string = 'general'
) {
  const event = new CustomEvent('showToast', {
    detail: { message, type, soundType }
  });
  window.dispatchEvent(event);
}
