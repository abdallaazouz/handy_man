import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

export default function RecentTasks() {
  const { t } = useLanguage();
  
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
      sent: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      accepted: 'bg-green-500/20 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/20',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: '⏳',
      sent: '📤',
      accepted: '✅',
      rejected: '❌',
      in_progress: '🔄',
      completed: '✅',
    };
    return icons[status as keyof typeof icons] || '📋';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recent_tasks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTasks = tasks.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.recent_tasks')}</CardTitle>
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              {t('common.view_all')}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('common.no_data')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{getStatusIcon(task.status)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Client: {task.clientName} - {task.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.taskNumber} - {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(task.status)} border`}
                  >
                    {t(`status.${task.status}` as any)}
                  </Badge>
                  {task.technicianId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Technician ID: {task.technicianId}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
