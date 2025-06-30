import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLanguage } from '@/hooks/use-language';
import { useAudioNotifications } from '@/hooks/use-audio-notifications';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TaskForm from '@/components/forms/task-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Send, Table2, Grid3X3, MoreVertical, MapPin, Zap, Droplets, Settings, Wrench, UserCheck, Calendar, Shield, Users, MessageSquare, User, Phone, Clock, Euro, Eye, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

export default function Tasks() {
  const { t, currentLanguage, isRTL } = useLanguage();
  const { toast } = useToast();
  const { playNotification } = useAudioNotifications();
  const { settings } = useSystemSettings();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [reassignTaskId, setReassignTaskId] = useState<number | null>(null);
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<number[]>([]);

  // Apply default view mode from system settings
  useEffect(() => {
    if (settings?.defaultView) {
      setViewMode(settings.defaultView);
    }
  }, [settings]);

  // Handler functions for new features
  const handleSendGeneralData = async (task: any) => {
    if (!task.technicianIds || task.technicianIds.length === 0) {
      const warningTitle = settings?.language === 'ar' 
        ? 'تحذير'
        : settings?.language === 'de'
        ? 'Warnung'
        : 'Warning';
        
      const warningDesc = settings?.language === 'ar' 
        ? 'لا يوجد فنيين مُكلفين بهذه المهمة'
        : settings?.language === 'de'
        ? 'Keine Techniker für diese Aufgabe zugewiesen'
        : 'No technicians assigned to this task';
        
      toast({
        title: warningTitle,
        description: warningDesc,
        variant: "destructive",
      });
      return;
    }

    try {
      // Send task to each assigned technician
      for (const technicianId of task.technicianIds) {
        await apiRequest('POST', '/api/telegram/send-task', {
          taskId: task.id,
          technicianId: technicianId
        });
      }
      
      const successTitle = settings?.language === 'ar' 
        ? 'نجح الإرسال'
        : settings?.language === 'de'
        ? 'Erfolgreich gesendet'
        : 'Successfully sent';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم إرسال بيانات المهمة عبر التليجرام بنجاح'
        : settings?.language === 'de'
        ? 'Aufgabendaten erfolgreich über Telegram gesendet'
        : 'Task data sent successfully via Telegram';
      
      toast({
        title: successTitle,
        description: successDesc,
      });
      playNotification('success');
    } catch (error) {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في إرسال البيانات عبر التليجرام'
        : settings?.language === 'de'
        ? 'Fehler beim Senden über Telegram'
        : 'Failed to send data via Telegram';
        
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive",
      });
    }
  };

  const handleSendClientData = async (task: any) => {
    if (!task.technicianIds || task.technicianIds.length === 0) {
      const warningTitle = settings?.language === 'ar' 
        ? 'تحذير'
        : settings?.language === 'de'
        ? 'Warnung'
        : 'Warning';
        
      const warningDesc = settings?.language === 'ar' 
        ? 'لا يوجد فنيين مُكلفين بهذه المهمة'
        : settings?.language === 'de'
        ? 'Keine Techniker für diese Aufgabe zugewiesen'
        : 'No technicians assigned to this task';
        
      toast({
        title: warningTitle,
        description: warningDesc,
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = settings?.language === 'ar' 
      ? 'سيتم إرسال بيانات العميل السرية للفنيين المُكلفين. هل أنت متأكد من المتابعة؟'
      : settings?.language === 'de'
      ? 'Vertrauliche Kundendaten werden an die zugewiesenen Techniker gesendet. Möchten Sie fortfahren?'
      : 'Confidential client data will be sent to assigned technicians. Do you want to continue?';
      
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    try {
      // Send client info to each assigned technician
      for (const technicianId of task.technicianIds) {
        await apiRequest('POST', '/api/telegram/send-client-info', {
          taskId: task.id,
          technicianId: technicianId
        });
      }
      
      const successTitle = settings?.language === 'ar' 
        ? 'تم الإرسال'
        : settings?.language === 'de'
        ? 'Erfolgreich gesendet'
        : 'Successfully sent';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم إرسال بيانات العميل السرية للفنيين المُكلفين'
        : settings?.language === 'de'
        ? 'Vertrauliche Kundendaten erfolgreich an zugewiesene Techniker gesendet'
        : 'Confidential client data sent successfully to assigned technicians';
      
      toast({
        title: successTitle,
        description: successDesc,
      });
      playNotification('success');
    } catch (error) {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في إرسال بيانات العميل عبر التليجرام'
        : settings?.language === 'de'
        ? 'Fehler beim Senden von Kundendaten über Telegram'
        : 'Failed to send client data via Telegram';
        
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive",
      });
    }
  };

  const handleReassignTask = async (taskId: number, newTechnicianIds: number[]) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { technicianIds: newTechnicianIds }
      });
      const successTitle = settings?.language === 'ar' 
        ? 'تم إعادة التكليف'
        : settings?.language === 'de'
        ? 'Neu zugewiesen'
        : 'Reassigned';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم إعادة تكليف المهمة بنجاح'
        : settings?.language === 'de'
        ? 'Aufgabe erfolgreich neu zugewiesen'
        : 'Task reassigned successfully';
        
      toast({
        title: successTitle, 
        description: successDesc,
      });
      setReassignTaskId(null);
      setSelectedTechnicianIds([]);
      playNotification('success');
    } catch (error) {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في إعادة تكليف المهمة'
        : settings?.language === 'de'
        ? 'Fehler beim Neu-Zuweisen der Aufgabe'
        : 'Failed to reassign task';
        
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmMessage = settings?.language === 'ar' 
      ? 'هل أنت متأكد من حذف هذه المهمة؟'
      : settings?.language === 'de'
      ? 'Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?'
      : 'Are you sure you want to delete this task?';
      
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh tasks data
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        
        const successTitle = settings?.language === 'ar' 
          ? 'تم الحذف'
          : settings?.language === 'de'
          ? 'Gelöscht'
          : 'Deleted';
          
        const successDesc = settings?.language === 'ar' 
          ? 'تم حذف المهمة بنجاح'
          : settings?.language === 'de'
          ? 'Aufgabe erfolgreich gelöscht'
          : 'Task deleted successfully';
        
        const successToast = toast({
          title: successTitle,
          description: successDesc,
        });
        
        setTimeout(() => {
          if (successToast && successToast.dismiss) {
            successToast.dismiss();
          }
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }
    } catch (error: any) {
      console.error('Delete task error:', error);
      
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ في الحذف'
        : settings?.language === 'de'
        ? 'Löschfehler'
        : 'Delete Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في حذف المهمة'
        : settings?.language === 'de'
        ? 'Aufgabe konnte nicht gelöscht werden'
        : 'Failed to delete task';
      
      const errorToast = toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive",
      });
      
      setTimeout(() => {
        if (errorToast && errorToast.dismiss) {
          errorToast.dismiss();
        }
      }, 5000);
    }
  };

  const openReassignDialog = (task: any) => {
    setReassignTaskId(task.id);
    setSelectedTechnicianIds(task.technicianIds || []);
  };

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsNewTaskOpen(false);
      
      const successTitle = settings?.language === 'ar' 
        ? 'نجح'
        : settings?.language === 'de'
        ? 'Erfolgreich'
        : 'Success';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم إنشاء المهمة بنجاح'
        : settings?.language === 'de'
        ? 'Aufgabe erfolgreich erstellt'
        : 'Task created successfully';
        
      toast({ title: successTitle, description: successDesc });
      playNotification('task_created');
    },
    onError: (error: any) => {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في إنشاء المهمة'
        : settings?.language === 'de'
        ? 'Fehler beim Erstellen der Aufgabe'
        : 'Failed to create task';
        
      toast({ 
        title: errorTitle, 
        description: error.message || errorDesc,
        variant: 'destructive' 
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setEditingTask(null);
      
      const successTitle = settings?.language === 'ar' 
        ? 'تم التحديث'
        : settings?.language === 'de'
        ? 'Aktualisiert'
        : 'Updated';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم تحديث المهمة بنجاح'
        : settings?.language === 'de'
        ? 'Aufgabe erfolgreich aktualisiert'
        : 'Task updated successfully';
        
      toast({ title: successTitle, description: successDesc });
    },
    onError: (error: any) => {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في تحديث المهمة'
        : settings?.language === 'de'
        ? 'Fehler beim Aktualisieren der Aufgabe'
        : 'Failed to update task';
        
      toast({ 
        title: errorTitle, 
        description: error.message || errorDesc,
        variant: 'destructive' 
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Success', description: 'Task deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete task',
        variant: 'destructive' 
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'status-pending',
      sent: 'status-sent',
      accepted: 'status-accepted',
      rejected: 'status-rejected',
      in_progress: 'status-in_progress',
      completed: 'status-completed',
      paid: 'status-paid',
    };
    return colors[status as keyof typeof colors] || 'status-pending';
  };

  const getTechnicianName = (technicianId: number) => {
    const technician = (technicians as any[]).find((t: any) => t.id === technicianId);
    return technician ? `${technician.firstName} ${technician.lastName}` : t('task.unassigned' as any);
  };

  const getTechniciansNames = (technicianIds: number[] | null) => {
    if (!technicianIds || technicianIds.length === 0) return t('task.unassigned');
    return technicianIds.map(id => {
      const technician = (technicians as any[]).find((t: any) => t.id === id);
      return technician ? `${technician.firstName} ${technician.lastName}` : t('common.unknown' as any);
    }).join(', ');
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors = {
      on_demand: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[paymentStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredTasks = (tasks as any[]).filter((task: any) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.tasks')}</h1>
          <p className="text-muted-foreground">Manage and track all tasks</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.new_task')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('task.create_new' as any)}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TaskForm
                onSubmit={(data) => createTaskMutation.mutate(data)}
                onCancel={() => setIsNewTaskOpen(false)}
                isLoading={createTaskMutation.isPending}
                technicians={technicians}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4 mr-2" />
                {t('view.table' as any)}
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {t('view.cards' as any)}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <div className="rounded-lg border border-border/50 overflow-x-auto bg-card/95">
              <Table className="min-w-[1000px] table-fixed">
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm w-[140px]">{currentLanguage === 'en' ? 'Task ID' : currentLanguage === 'de' ? 'Aufgaben-ID' : 'معرف المهمة'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm w-[180px]">{currentLanguage === 'en' ? 'Task Title' : currentLanguage === 'de' ? 'Task Title' : 'عنوان المهمة'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm w-[200px]">{currentLanguage === 'en' ? 'Client' : currentLanguage === 'de' ? 'Kunde' : 'العميل'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm w-[120px]">{currentLanguage === 'en' ? 'Technician' : currentLanguage === 'de' ? 'Technician' : 'الفني'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm text-center w-[90px]">{currentLanguage === 'en' ? 'Status' : currentLanguage === 'de' ? 'Status' : 'الحالة'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm text-center w-[90px]">{currentLanguage === 'en' ? 'Payment' : currentLanguage === 'de' ? 'Payment' : 'الدفع'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm text-center w-[100px]">{currentLanguage === 'en' ? 'Scheduled' : currentLanguage === 'de' ? 'Scheduled' : 'مجدول'}</TableHead>
                  <TableHead className="font-semibold text-foreground/90 bg-muted/40 py-3 px-3 text-sm text-center w-[140px]">{currentLanguage === 'en' ? 'Actions' : currentLanguage === 'de' ? 'Actions' : 'الإجراءات'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm">No tasks found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task: any, index: number) => (
                    <TableRow 
                      key={task.id} 
                      className={`
                        border-b border-border/30 hover:bg-muted/50 transition-colors duration-200
                        ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                      `}
                    >
                      <TableCell className="py-4 px-3">
                        <div className="font-mono text-xs text-primary bg-primary/10 rounded-md px-2 py-1 inline-block">
                          {task.taskId}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 max-w-[220px]">
                        <div className="font-medium text-foreground text-sm leading-tight" title={task.title}>
                          {task.title}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 max-w-[220px]">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-foreground truncate text-sm" title={task.clientName}>{task.clientName}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate text-sm" title={task.clientPhone}>{task.clientPhone}</span>
                          </div>
                          <div className="flex items-start text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm truncate" title={task.location}>{task.location}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 max-w-[150px]">
                        <div className="font-medium text-foreground truncate text-sm" title={getTechniciansNames(task.technicianIds)}>
                          {getTechniciansNames(task.technicianIds)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Badge
                          variant="secondary"
                          className={`
                            font-medium text-xs px-2 py-1 rounded-full border-2
                            ${task.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' : 
                              task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 
                              task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 
                              'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'}
                          `}
                        >
                          {task.status === 'pending' ? 'Pending' : 
                           task.status === 'in_progress' ? 'In Progress' : 
                           task.status === 'completed' ? 'Completed' : 
                           task.status === 'sent' ? 'Sent' :
                           task.status === 'accepted' ? 'Accepted' :
                           task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Badge
                          variant="secondary"
                          className={`
                            font-medium text-xs px-2 py-1 rounded-full border-2
                            ${(task.paymentStatus || 'on_demand') === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                              (task.paymentStatus || 'on_demand') === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                              'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'}
                          `}
                        >
                          {(task.paymentStatus || 'on_demand') === 'paid' ? 'Paid' : 
                           (task.paymentStatus || 'on_demand') === 'pending' ? 'Pending' : 
                           'On Demand'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-3 text-center">
                        <div className="text-xs space-y-1">
                          <p className="font-medium text-foreground">{format(new Date(task.scheduledDate), 'dd.MM.yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.scheduledTimeFrom} - {task.scheduledTimeTo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleSendGeneralData(task)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-lg h-9 w-9 p-0 shadow-md hover:shadow-lg transition-all duration-300"
                            title="Telegram senden"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendClientData(task)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-lg h-9 w-9 p-0 shadow-md hover:shadow-lg transition-all duration-300"
                            title="Kundendaten senden"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTask(task)}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-lg h-9 w-9 p-0 shadow-md hover:shadow-lg transition-all duration-300"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-lg h-9 w-9 p-0 shadow-md hover:shadow-lg transition-all duration-300"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          ) : (
            // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  {t('common.no_data')}
                </div>
              ) : (
                filteredTasks.map((task: any, index: number) => {
                  const gradients = [
                    'gradient-blue-purple',
                    'gradient-emerald-cyan', 
                    'gradient-rose-amber'
                  ];
                  const gradientClass = gradients[index % gradients.length];
                  
                  const getTaskIcon = (description: string) => {
                    const desc = description?.toLowerCase() || '';
                    if (desc.includes('electric') || desc.includes('electrical')) return 'electric';
                    if (desc.includes('plumb') || desc.includes('water')) return 'plumbing';
                    if (desc.includes('maintenance') || desc.includes('repair')) return 'maintenance';
                    return 'general';
                  };

                  const getTaskIconComponent = (type: string) => {
                    switch (type) {
                      case 'electric': return <Zap className="h-5 w-5 task-icon-electric" />;
                      case 'plumbing': return <Droplets className="h-5 w-5 task-icon-plumbing" />;
                      case 'maintenance': return <Settings className="h-5 w-5 task-icon-maintenance" />;
                      default: return <Wrench className="h-5 w-5 task-icon-general" />;
                    }
                  };

                  const taskType = getTaskIcon(task.description);

                  return (
                    <Card key={task.id} className={`hover:card-shadow-hover transition-all duration-300 card-shadow rounded-2xl overflow-hidden ${gradientClass} relative flex flex-col h-full min-h-[400px] max-h-[500px]`}>
                      {/* Task type icon in top right */}
                      <div className="absolute top-3 right-3 z-10">
                        {getTaskIconComponent(taskType)}
                      </div>
                      
                      <CardHeader className="pb-3 text-center relative pt-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                            <span className="font-mono font-semibold text-sm tracking-wide text-white/95 uppercase">
                              {task.taskId}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1.5">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-1 mb-3">
                          <h3 className="font-bold text-xl text-white leading-tight line-clamp-2">
                            {task.title}
                          </h3>
                          <div className="flex items-center justify-center space-x-1 text-white/75">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {task.clientName} • {task.location}
                            </span>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 py-3 space-y-4 text-white min-h-0 flex-1 flex flex-col">
                      <div className="text-center">
                        <p className="text-white/80 text-sm leading-relaxed font-light line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                      
                      {/* Merged Info Section */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex-shrink-0">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2 min-w-0">
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <UserCheck className="h-4 w-4 text-white/50 flex-shrink-0" />
                              <span className="text-white/60 font-medium uppercase tracking-wide text-xs">{t('task.assign_technician' as any)}</span>
                            </div>
                            <div className={`text-white/95 font-semibold text-sm ${isRTL ? 'text-right' : 'text-left'} break-words`}>
                              {getTechniciansNames(task.technicianIds)}
                            </div>
                          </div>
                          <div className="space-y-2 min-w-0">
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Calendar className="h-4 w-4 text-white/50 flex-shrink-0" />
                              <span className="text-white/60 font-medium uppercase tracking-wide text-xs">{t('task.scheduled_date' as any)}</span>
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <div className="text-white/95 font-semibold text-sm">{task.scheduledDate}</div>
                              <div className="text-white/70 text-xs">{task.scheduledTimeFrom} - {task.scheduledTimeTo}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Controls Row - Simplified */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="flex-1 min-w-0 bg-white/15 border-white/20 text-white hover:bg-white/20 rounded-lg h-8 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('status.pending' as any)}</SelectItem>
                            <SelectItem value="sent">{t('status.sent' as any)}</SelectItem>
                            <SelectItem value="accepted">{t('status.accepted' as any)}</SelectItem>
                            <SelectItem value="rejected">{t('status.rejected' as any)}</SelectItem>
                            <SelectItem value="in_progress">{t('status.in_progress' as any)}</SelectItem>
                            <SelectItem value="completed">{t('status.completed' as any)}</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          onClick={() => openReassignDialog(task)}
                          className="bg-white/15 border-white/20 text-white hover:bg-white/25 rounded-lg h-8 w-8 p-0"
                          variant="outline"
                          size="sm"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTask(task)}
                          className="bg-white/15 border-white/25 text-white hover:bg-white/25 font-medium rounded-lg w-8 h-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Action Buttons - Fixed Layout */}
                      <div className="grid grid-cols-2 gap-2 mt-auto flex-shrink-0">
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0 rounded-xl h-12 font-medium text-sm transition-all duration-200"
                          onClick={() => handleSendGeneralData(task)}
                        >
                          <div className={`flex items-center gap-1.5 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="text-base flex-shrink-0">🛈</div>
                            <div className={`${isRTL ? 'text-right' : 'text-left'} leading-tight min-w-0`}>
                              <div className="font-semibold text-xs truncate">{t('telegram.send_general' as any)}</div>
                              <div className="text-xs opacity-90 truncate">Task Info</div>
                            </div>
                          </div>
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg border-0 rounded-xl h-12 font-medium text-sm transition-all duration-200"
                          onClick={() => handleSendClientData(task)}
                        >
                          <div className={`flex items-center gap-1.5 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="text-base flex-shrink-0">🔒</div>
                            <div className={`${isRTL ? 'text-right' : 'text-left'} leading-tight min-w-0`}>
                              <div className="font-semibold text-xs truncate">{t('telegram.send_client' as any)}</div>
                              <div className="text-xs opacity-90 truncate">Confidential</div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                    </Card>
                  );
                })
              )}
                  </div>
                )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="py-4">
              <TaskForm
                initialData={editingTask}
                onSubmit={(data) => updateTaskMutation.mutate({ id: (editingTask as any).id, data })}
                onCancel={() => setEditingTask(null)}
                isLoading={updateTaskMutation.isPending}
                technicians={technicians}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reassign Technicians Dialog */}
      <Dialog open={!!reassignTaskId} onOpenChange={() => {setReassignTaskId(null); setSelectedTechnicianIds([]);}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Technicians</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {technicians.map((tech: any) => (
                <div key={tech.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`reassign-tech-${tech.id}`}
                    checked={selectedTechnicianIds.includes(tech.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTechnicianIds([...selectedTechnicianIds, tech.id]);
                      } else {
                        setSelectedTechnicianIds(selectedTechnicianIds.filter(id => id !== tech.id));
                      }
                    }}
                  />
                  <Label htmlFor={`reassign-tech-${tech.id}`} className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">{tech.firstName} {tech.lastName}</div>
                      <div className="text-xs text-muted-foreground">{tech.serviceProvided} - {tech.cityArea}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {setReassignTaskId(null); setSelectedTechnicianIds([]);}}
              >
                Cancel
              </Button>
              <Button
                onClick={() => reassignTaskId && handleReassignTask(reassignTaskId, selectedTechnicianIds)}
                disabled={selectedTechnicianIds.length === 0}
              >
                Assign ({selectedTechnicianIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
