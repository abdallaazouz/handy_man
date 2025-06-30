import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Plus, UserPlus, FileText, BarChart3 } from 'lucide-react';

export default function QuickActions() {
  const { t } = useLanguage();

  const actions = [
    {
      name: t('actions.new_task'),
      href: '/tasks?new=true',
      icon: Plus,
      color: 'emerald',
    },
    {
      name: t('actions.add_technician'),
      href: '/technicians?new=true',
      icon: UserPlus,
      color: 'blue',
    },
    {
      name: t('actions.create_invoice'),
      href: '/invoices?new=true',
      icon: FileText,
      color: 'amber',
    },
    {
      name: t('actions.view_reports'),
      href: '/reports',
      icon: BarChart3,
      color: 'purple',
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400 hover:text-emerald-300',
      blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400 hover:text-blue-300',
      amber: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400 hover:text-amber-300',
      purple: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-400 hover:text-purple-300',
    };
    return classes[color as keyof typeof classes] || classes.blue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.quick_actions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className={`flex flex-col items-center p-4 h-auto ${getColorClasses(action.color)} border group transition-all`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-xs text-center leading-tight">
                    {action.name}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
