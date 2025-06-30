import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Users, FileText, Euro } from 'lucide-react';

export default function StatsCards() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: t('stats.active_tasks'),
      value: stats?.activeTasks || 0,
      subtitle: "+2 from yesterday",
      icon: ClipboardList,
      gradient: "from-emerald-500 to-emerald-600",
      iconBg: "bg-white/20",
    },
    {
      title: t('stats.technicians'),
      value: stats?.totalTechnicians || 0,
      subtitle: `${stats?.activeTechnicians || 0} available now`,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-white/20",
    },
    {
      title: t('stats.pending_invoices'),
      value: stats?.pendingInvoices || 0,
      subtitle: "€2,850 total",
      icon: FileText,
      gradient: "from-amber-500 to-amber-600",
      iconBg: "bg-white/20",
    },
    {
      title: t('stats.monthly_revenue'),
      value: `€${stats?.monthlyRevenue?.toLocaleString() || '0'}`,
      subtitle: "+15% from last month",
      icon: Euro,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-white/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`bg-gradient-to-r ${card.gradient} text-white border-0`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-white/70 text-xs mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.iconBg} rounded-lg p-3`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
