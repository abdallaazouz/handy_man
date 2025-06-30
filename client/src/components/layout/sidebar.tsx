import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ClipboardList,
  Users,
  FileText,
  BarChart3,
  Settings,
  Languages,
  History,
  Download,
  Database,
  Menu,
  Zap,
  Bot,
  Bell
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'nav.dashboard', href: '/', icon: Home },
  { name: 'nav.tasks', href: '/tasks', icon: ClipboardList },
  { name: 'nav.technicians', href: '/technicians', icon: Users },
  { name: 'nav.invoices', href: '/invoices', icon: FileText },
  { name: 'nav.notifications', href: '/notifications', icon: Bell },
  { name: 'nav.reports', href: '/reports', icon: BarChart3 },
  { name: 'nav.bot_settings', href: '/bot-settings', icon: Bot },
];

const secondaryNavigation = [
  { name: 'nav.translation', href: '/translation', icon: Languages },
  { name: 'nav.history', href: '/history', icon: History },
  { name: 'nav.backup', href: '/backup', icon: Download },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useLanguage();

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

  const getIconBackground = (itemName: string) => {
    switch (itemName) {
      case 'nav.dashboard':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800';
      case 'nav.tasks':
        return 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200 dark:border-orange-800';
      case 'nav.technicians':
        return 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800';
      case 'nav.invoices':
        return 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800';
      case 'nav.notifications':
        return 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800';
      case 'nav.reports':
        return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800';
      case 'nav.bot_settings':
        return 'bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800';
      case 'nav.translation':
        return 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800';
      case 'nav.history':
        return 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800';
      case 'nav.backup':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 border border-gray-200 dark:border-gray-800';
    }
  };

  const getIconColor = (itemName: string) => {
    switch (itemName) {
      case 'nav.dashboard':
        return 'text-blue-600 dark:text-blue-400';
      case 'nav.tasks':
        return 'text-orange-600 dark:text-orange-400';
      case 'nav.technicians':
        return 'text-purple-600 dark:text-purple-400';
      case 'nav.invoices':
        return 'text-blue-600 dark:text-blue-400';
      case 'nav.notifications':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'nav.reports':
        return 'text-green-600 dark:text-green-400';
      case 'nav.bot_settings':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'nav.translation':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'nav.history':
        return 'text-teal-600 dark:text-teal-400';
      case 'nav.backup':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      {!isCollapsed && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
          <div className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 lg:hidden flex flex-col">
            {/* Mobile Header */}
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-sidebar-foreground">{t('app.name')}</h2>
                  <p className="text-xs text-sidebar-foreground/60">{t('app.version')}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-0.5">
                {navigation.map((item, index) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.href}>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-between relative h-12 pr-2",
                            isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                            !isActive && "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                          onClick={onToggle}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              isActive ? "bg-white/20" : getIconBackground(item.name)
                            )}>
                              <Icon className={cn(
                                "h-4 w-4",
                                isActive ? "text-white" : getIconColor(item.name)
                              )} />
                            </div>
                            <span className="truncate">{t(item.name as any)}</span>
                          </div>
                          {item.badge && (
                            <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-bold rounded-full px-3 py-1.5 min-w-[36px] h-7 flex items-center justify-center shadow-lg border-2 border-white/30 flex-shrink-0 ml-3 transition-all duration-300 hover:scale-105">
                              {item.badge}
                            </span>
                          )}
                        </Button>
                      </Link>
                      {index < navigation.length - 1 && (
                        <div className="my-0.5 px-3">
                          <div className="h-px bg-white/20 w-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Separator */}
                <div className="pt-1 mt-1">
                  <div className="mb-1 px-3">
                    <div className="h-px bg-white/30 w-full"></div>
                  </div>
                  
                  <div className="space-y-0.5">
                    {secondaryNavigation.map((item, index) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <div key={item.href}>
                          <Link href={item.href}>
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start",
                                isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                                !isActive && "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                              )}
                              onClick={onToggle}
                            >
                              <div className={cn(
                                "w-8 h-8 mr-3 rounded-lg flex items-center justify-center",
                                isActive ? "bg-white/20" : getIconBackground(item.name)
                              )}>
                                <Icon className={cn(
                                  "h-4 w-4",
                                  isActive ? "text-white" : getIconColor(item.name)
                                )} />
                              </div>
                              <span>{t(item.name as any)}</span>
                            </Button>
                          </Link>
                          {index < secondaryNavigation.length - 1 && (
                            <div className="flex items-center my-1 px-2">
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"></div>
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mx-2 opacity-50 shadow-sm shadow-green-400/40"></div>
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </nav>
            </ScrollArea>
          </div>
        </>
      )}
      
      {/* Desktop sidebar */}
      <div className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 fixed left-0 top-0 z-30",
        "hidden lg:flex lg:flex-col", // Hidden on mobile, visible on desktop
        isCollapsed ? "lg:w-16" : "lg:w-72"
      )}>
        {/* Header */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">{t('app.name')}</h2>
                <p className="text-xs text-sidebar-foreground/60">{t('app.version')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-0.5">
            {navigation.map((item, index) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full relative transition-all duration-300",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg",
                        !isActive && "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md",
        isCollapsed ? "h-12 justify-center px-2" : "h-14 justify-start px-4"
                      )}
                    >
                      {isCollapsed ? (
                        // Collapsed view
                        <div className="flex items-center justify-center w-full relative">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                            isActive ? "bg-white/20 shadow-md" : getIconBackground(item.name)
                          )}>
                            <Icon className={cn(
                              "h-4 w-4 transition-all duration-300",
                              isActive ? "text-white" : getIconColor(item.name)
                            )} />
                          </div>

                        </div>
                      ) : (
                        // Expanded view
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0",
                              isActive ? "bg-white/20 shadow-md" : getIconBackground(item.name)
                            )}>
                              <Icon className={cn(
                                "h-5 w-5 transition-all duration-300",
                                isActive ? "text-white" : getIconColor(item.name)
                              )} />
                            </div>
                            <span className={cn(
                              "font-bold text-sm truncate transition-all duration-300",
                              isActive ? "text-white" : "text-sidebar-foreground"
                            )}>
                              {t(item.name as any)}
                            </span>
                          </div>
                          {item.badge && (
                            <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-bold rounded-full px-3 py-1.5 min-w-[36px] h-7 flex items-center justify-center shadow-lg border-2 border-white/30 flex-shrink-0 ml-3 transition-all duration-300 hover:scale-105">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Button>
                  </Link>
                  {index < navigation.length - 1 && (
                    <div className={cn(
                      "my-0.5",
                      isCollapsed ? "px-1" : "px-3"
                    )}>
                      <div className="h-px bg-white/20 w-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Separator */}
            <div className="pt-1 mt-1">
              <div className={cn(
                "mb-1",
                isCollapsed ? "px-1" : "px-3"
              )}>
                <div className="h-px bg-white/30 w-full"></div>
              </div>
              
              <div className="space-y-0.5">
                {secondaryNavigation.map((item, index) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.href}>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                            !isActive && "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                            isCollapsed && "px-2"
                          )}
                        >
                          <div className={cn(
                            "rounded-lg flex items-center justify-center",
                            isCollapsed ? "w-8 h-8" : "w-8 h-8 mr-3",
                            isActive ? "bg-white/20" : getIconBackground(item.name)
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isActive ? "text-white" : getIconColor(item.name)
                            )} />
                          </div>
                          {!isCollapsed && <span className="font-bold text-sm">{t(item.name as any)}</span>}
                        </Button>
                      </Link>
                      {index < secondaryNavigation.length - 1 && (
                        <div className={cn(
                          "my-0.5",
                          isCollapsed ? "px-1" : "px-3"
                        )}>
                          <div className="h-px bg-white/20 w-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>
        </ScrollArea>
      </div>
    </>
  );
}
