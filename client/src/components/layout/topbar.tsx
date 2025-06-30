import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAudioNotifications } from '@/hooks/use-audio-notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  Globe,
  ChevronDown,
  Menu,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Settings
} from 'lucide-react';

interface TopbarProps {
  onSidebarToggle: () => void;
  isCollapsed: boolean;
}

export default function Topbar({ onSidebarToggle, isCollapsed }: TopbarProps) {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { isEnabled: audioEnabled, toggleAudio } = useAudioNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch admin profile to show display name
  const { data: profile } = useQuery({
    queryKey: ['/api/admin/profile'],
    queryFn: async () => {
      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': 'Bearer auth_token_123'
        }
      });
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  const notificationArray = Array.isArray(notifications) ? notifications : [];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.reload();
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border-b border-border/60 z-40 w-full">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="hidden lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center space-x-2 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Audio Toggle - Always Enabled */}
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950"
            title="Audio notifications enabled"
          >
            <Volume2 className="h-5 w-5" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="space-x-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {currentLanguage.toUpperCase()}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className="flex items-center space-x-2"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => setLocation('/notifications')}
            title={t('nav.notifications')}
          >
            <Bell className="h-5 w-5" />
            {notificationArray.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs notification-dot"
              >
                {notificationArray.length}
              </Badge>
            )}
          </Button>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{profile?.displayName || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground">{t('user.role')}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="gradient-bg text-white">
                    {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'AU'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation('/admin-profile')}>
                <User className="h-4 w-4 mr-2" />
                {t('profile.title')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('user.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
