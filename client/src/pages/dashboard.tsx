import { useLanguage } from '@/hooks/use-language';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentTasks from '@/components/dashboard/recent-tasks';
import BotStatus from '@/components/dashboard/bot-status';
import QuickActions from '@/components/dashboard/quick-actions';
import NotificationsWidget from '@/components/dashboard/notifications-widget';
import MapsIntegration from '@/components/dashboard/maps-integration';

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentTasks />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <BotStatus />
          <QuickActions />
          <NotificationsWidget />
        </div>
      </div>

      {/* Maps Integration */}
      <MapsIntegration />
    </div>
  );
}
