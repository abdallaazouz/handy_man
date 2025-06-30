import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

interface BotSettings {
  botToken?: string;
  isEnabled?: boolean;
}

interface DashboardStats {
  activeTechnicians?: number;
}

export default function BotStatus() {
  const { t } = useLanguage();
  
  const { data: settings } = useQuery<BotSettings>({
    queryKey: ['/api/bot-settings'],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const isOnline = settings?.botToken && settings?.isEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.bot_status')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse-soft' : 'bg-red-500'}`} />
            <span className="text-sm">Connection Status</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">API Requests</span>
          <span className="text-sm font-medium">127/1000</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Users</span>
          <span className="text-sm font-medium">{stats?.activeTechnicians || 0}</span>
        </div>
        
        <div className="pt-2">
          <Link href="/settings">
            <Button className="w-full">
              {t('dashboard.manage_bot')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
