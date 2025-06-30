import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio notification failed:', error);
    }
  };

  const connect = () => {
    try {
      const sseUrl = '/api/notifications/stream';
      eventSourceRef.current = new EventSource(sseUrl);
      
      eventSourceRef.current.onopen = () => {
        console.log('Connected to notification stream');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            const notification = message.data;
            
            // Play notification sound
            playNotificationSound();
            
            // Show toast notification
            toast({
              title: "New Notification",
              description: notification.message,
              duration: 5000,
            });
            
            // Trigger browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification('Task Management System', {
                body: notification.message,
                icon: '/favicon.ico',
                tag: `notification-${notification.id}`
              });
            }
          }
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('SSE connection failed:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  };

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect
  };
}