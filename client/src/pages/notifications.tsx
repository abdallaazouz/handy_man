import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, EyeOff, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { format } from "date-fns";
import { ar, de, enUS } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Notification {
  id: number;
  type: string;
  message: string;
  metadata?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch('/api/notifications/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      setSelectedNotifications([]);
      toast({
        title: "Success",
        description: "Selected notifications deleted successfully",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'de': return de;
      default: return enUS;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task_rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'task_completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'invoice_created':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getNotificationTypeText = (type: string) => {
    const types: Record<string, string> = {
      'task_assigned': 'Task Assigned',
      'task_accepted': 'Task Accepted',
      'task_rejected': 'Task Rejected',
      'task_completed': 'Task Completed',
      'invoice_created': 'Invoice Created',
    };
    return types[type] || type;
  };

  const handleSelectNotification = (id: number) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n: Notification) => n.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notifications and activity history
          </p>
        </div>
        <div className="flex gap-2">
          {selectedNotifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedNotifications.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedNotifications.length} notification(s)? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => bulkDeleteMutation.mutate(selectedNotifications)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
            onChange={handleSelectAll}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">
            Select All ({notifications.length} notifications)
          </span>
        </label>
        {selectedNotifications.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedNotifications.length} selected
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                You're all caught up! No new notifications to display.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification: Notification) => (
            <Card 
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
              } ${
                selectedNotifications.includes(notification.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getNotificationTypeColor(notification.type)}>
                        {getNotificationTypeText(notification.type)}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {notification.metadata && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          Additional Details
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(JSON.parse(notification.metadata), null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), 'PPpp', { 
                        locale: getDateLocale() 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this notification? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}