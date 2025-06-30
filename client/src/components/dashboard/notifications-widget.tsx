import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, UserPlus, AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsWidget() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [previousCount, setPreviousCount] = useState<number | null>(null);
  
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 2000,
  });

  const getNotificationIcon = (type: string) => {
    const icons = {
      task_created: Clock,
      task_accepted: CheckCircle,
      task_rejected: AlertTriangle,
      task_completed: CheckCircle,
      technician_added: UserPlus,
      invoice_created: CheckCircle,
    };
    return icons[type as keyof typeof icons] || Clock;
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      task_created: 'text-blue-500',
      task_accepted: 'text-emerald-500',
      task_rejected: 'text-red-500',
      task_completed: 'text-emerald-500',
      technician_added: 'text-blue-500',
      invoice_created: 'text-amber-500',
    };
    return colors[type as keyof typeof colors] || 'text-blue-500';
  };

  const getBorderColor = (type: string) => {
    const colors = {
      task_created: 'border-l-blue-500',
      task_accepted: 'border-l-emerald-500',
      task_rejected: 'border-l-red-500',
      task_completed: 'border-l-emerald-500',
      technician_added: 'border-l-blue-500',
      invoice_created: 'border-l-amber-500',
    };
    return colors[type as keyof typeof colors] || 'border-l-blue-500';
  };

  // Enhanced audio notification
  const playNotificationSound = () => {
    const soundEnabled = localStorage.getItem('sound-enabled');
    if (soundEnabled === null || JSON.parse(soundEnabled)) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a more pleasant notification sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.frequency.value = 800;
        oscillator2.frequency.value = 1000;
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.15);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator2.stop(audioContext.currentTime + 0.3);
        
        console.log('🔊 Enhanced notification sound played');
      } catch (e) {
        console.log('❌ Audio failed, using fallback beep');
      }
    }
  };

  // Show enhanced browser notification
  const showBrowserNotification = (title: string, message: string) => {
    const notificationsEnabled = localStorage.getItem('notifications-enabled');
    if (notificationsEnabled === null || JSON.parse(notificationsEnabled)) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'technician-manager',
          requireInteraction: true // Keep notification until user interacts
        });
        
        setTimeout(() => notification.close(), 8000); // 8 seconds
        console.log('📢 Enhanced browser notification shown:', title);
      } else if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // Real-time notification detection
  useEffect(() => {
    if (unreadNotifications && previousCount !== null && unreadNotifications.length > previousCount) {
      const newNotifications = unreadNotifications.slice(0, unreadNotifications.length - previousCount);
      newNotifications.forEach((notification: any) => {
        console.log('🆕 New notification detected:', notification);
        
        // Immediate sound and visual feedback
        setTimeout(() => {
          playNotificationSound();
          showBrowserNotification(
            t('notifications.new_notification') || 'New Notification',
            notification.message
          );
          
          // Also show toast
          toast({
            title: t('notifications.new_notification') || 'New Notification',
            description: notification.message,
            duration: 5000,
          });
        }, 100); // Small delay to ensure proper timing
      });
    }
    setPreviousCount(unreadNotifications?.length || 0);
  }, [unreadNotifications, previousCount, t, toast]);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.notifications')}</CardTitle>
      </CardHeader>
      <CardContent>
        {recentNotifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No new notifications</p>
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {recentNotifications.map((notification: any) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 bg-muted/30 rounded-lg border-l-4 ${getBorderColor(notification.type)}`}
                  >
                    <Icon className={`h-4 w-4 mt-1 ${getNotificationColor(notification.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
