import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Trash2,
  XCircle
} from 'lucide-react';

interface DatabaseStatus {
  connected: boolean;
  hasPermissions: boolean;
  isReady: boolean;
}

interface BackupRecord {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  description: string;
}

export default function BackupRestore() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Real backup data from localStorage (in production, this would come from API)
  const getBackupHistory = (): BackupRecord[] => {
    const stored = localStorage.getItem('backup_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(getBackupHistory());

  const { data: systemStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: dbStatus, isLoading: dbStatusLoading, refetch: refetchDbStatus } = useQuery({
    queryKey: ['/api/database/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const downloadDbBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/database/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate database backup');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: t('backup.db_success_title') || 'Database Backup Success',
        description: t('backup.db_success_message') || 'Database backup downloaded successfully',
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createBackupMutation = useMutation({
    mutationFn: async (backupName: string) => {
      setIsBackingUp(true);
      setBackupProgress(0);
      
      // Simulate progress while making real API call
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      try {
        const response = await fetch('/api/backup/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: backupName,
            description: 'Manual backup created by user'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        clearInterval(progressInterval);
        setBackupProgress(100);
        
        // If backup includes data, trigger download
        if (result.data) {
          const blob = new Blob([result.data], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${result.backup.name}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        setIsBackingUp(false);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setIsBackingUp(false);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Add to backup history
      const newBackup: BackupRecord = {
        id: data.backup.id,
        name: data.backup.name,
        createdAt: data.backup.createdAt,
        size: data.backup.size,
        type: data.backup.type,
        status: 'completed',
        description: 'Manual backup created by user'
      };
      
      const updatedHistory = [newBackup, ...backupHistory].slice(0, 10); // Keep last 10
      setBackupHistory(updatedHistory);
      localStorage.setItem('backup_history', JSON.stringify(updatedHistory));
      
      toast({ 
        title: t('backup.success_title') || 'Success', 
        description: t('backup.success_message') || 'Backup created and downloaded successfully' 
      });
      setIsBackupDialogOpen(false);
      setBackupProgress(0);
    },
    onError: (error: any) => {
      setIsBackingUp(false);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create backup',
        variant: 'destructive' 
      });
    },
  });

  const handleCreateBackup = () => {
    const backupName = `Manual_Backup_${new Date().toISOString().split('T')[0]}`;
    createBackupMutation.mutate(backupName);
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const filename = `System_Backup_${new Date().toISOString().split('T')[0]}`;
      const response = await fetch(`/api/backup/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ 
        title: t('backup.download_success') || 'Download Started', 
        description: t('backup.download_description') || 'Backup file downloaded successfully' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to download backup',
        variant: 'destructive' 
      });
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    // Create file input for backup file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);
        
        const response = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ backupData })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        toast({ 
          title: t('backup.restore_success') || 'Restore Complete', 
          description: `Restored ${result.restored.tasks} tasks, ${result.restored.technicians} technicians, ${result.restored.invoices} invoices`
        });
        
        // Refresh the page to load restored data
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Failed to restore backup. Please check the file format.',
          variant: 'destructive' 
        });
      }
    };
    input.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-200';
      case 'failed':
        return 'bg-red-500/20 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getDbStatusBadge = (connected: boolean, hasPermissions: boolean, isReady: boolean) => {
    if (isReady) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t('backup.db_ready') || 'Ready'}</Badge>;
    } else if (connected && !hasPermissions) {
      return <Badge variant="secondary" className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" />{t('backup.db_limited') || 'Limited Permissions'}</Badge>;
    } else if (connected) {
      return <Badge variant="secondary" className="bg-blue-500"><Database className="w-3 h-3 mr-1" />{t('backup.db_connected') || 'Connected'}</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('backup.db_disconnected') || 'Disconnected'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <Download className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('backup.title') || 'Backup & Restore'}</h1>
            <p className="text-muted-foreground">{t('backup.subtitle') || 'Manage system backups and database recovery'}</p>
          </div>
        </div>
        <Button 
          onClick={() => refetchDbStatus()} 
          variant="outline" 
          size="sm"
          className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
          disabled={dbStatusLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${dbStatusLoading ? 'animate-spin' : ''} text-blue-600 dark:text-blue-400`} />
          {t('backup.refresh') || 'Refresh'}
        </Button>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t('backup.db_status') || 'Database Status'}
          </CardTitle>
          <CardDescription>
            {t('backup.db_status_desc') || 'Current database connection and permissions status'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dbStatusLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('backup.loading') || 'Loading...'}
            </div>
          ) : dbStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('backup.general_status') || 'General Status'}:</span>
                {getDbStatusBadge((dbStatus as DatabaseStatus).connected, (dbStatus as DatabaseStatus).hasPermissions, (dbStatus as DatabaseStatus).isReady)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{t('backup.connection') || 'Connection'}:</span>
                  <Badge variant={(dbStatus as DatabaseStatus).connected ? "default" : "destructive"}>
                    {(dbStatus as DatabaseStatus).connected ? t('backup.connected') || 'Connected' : t('backup.disconnected') || 'Disconnected'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>{t('backup.permissions') || 'Write Permissions'}:</span>
                  <Badge variant={(dbStatus as DatabaseStatus).hasPermissions ? "default" : "secondary"}>
                    {(dbStatus as DatabaseStatus).hasPermissions ? t('backup.available') || 'Available' : t('backup.not_available') || 'Not Available'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>{t('backup.ready_for_use') || 'Ready for Use'}:</span>
                  <Badge variant={(dbStatus as DatabaseStatus).isReady ? "default" : "secondary"}>
                    {(dbStatus as DatabaseStatus).isReady ? t('backup.yes') || 'Yes' : t('backup.no') || 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              {t('backup.failed_to_load') || 'Failed to load database status'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(systemStats as any)?.totalTechnicians || 0}</p>
                <p className="text-sm text-muted-foreground">Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(systemStats as any)?.activeTasks || 0}</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <HardDrive className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backupHistory.length}</p>
                <p className="text-sm text-muted-foreground">Available Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Daily</p>
                <p className="text-sm text-muted-foreground">Backup Schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span>{t('backup.create_backup') || 'Create Backup'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('backup.create_backup_desc') || 'Create a manual backup of all system data including tasks, technicians, and settings.'}
            </p>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {t('backup.security_warning') || 'Backups include all sensitive data. Store securely and follow data protection guidelines.'}
              </AlertDescription>
            </Alert>

            <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  {t('backup.create_manual_backup') || 'Create Manual Backup'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('backup.create_system_backup') || 'Create System Backup'}</DialogTitle>
                  <DialogDescription>
                    {t('backup.create_system_backup_desc') || 'This will create a complete backup of all system data.'}
                  </DialogDescription>
                </DialogHeader>
                
                {isBackingUp ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('backup.creating_backup') || 'Creating backup'}... {backupProgress}%
                      </p>
                      <Progress value={backupProgress} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{t('backup.backup_will_include') || 'Backup will include'}:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• {t('backup.technician_records') || 'All technician records'}</li>
                        <li>• {t('backup.task_history') || 'Task history and data'}</li>
                        <li>• {t('backup.invoice_records') || 'Invoice records'}</li>
                        <li>• {t('backup.bot_settings') || 'Bot settings and configuration'}</li>
                        <li>• {t('backup.system_notifications') || 'System notifications'}</li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending}>
                        {createBackupMutation.isPending ? t('backup.creating') || 'Creating...' : t('backup.create_backup') || 'Create Backup'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsBackupDialogOpen(false)}
                      >
                        {t('backup.cancel') || 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span>{t('backup.restore_from_backup') || 'Restore from Backup'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('backup.restore_desc') || 'Restore system data from a previous backup. This will replace current data.'}
            </p>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('backup.restore_warning') || 'Warning: Restoring will overwrite all current data. Create a backup first.'}
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              onClick={() => handleRestoreBackup('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('backup.upload_backup_file') || 'Upload Backup File'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span>{t('backup.database_backup') || 'Database Backup'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('backup.database_backup_desc') || 'Download a complete SQL backup of your database including all tables and data.'}
            </p>
            
            {dbStatus && (dbStatus as any).isReady && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {t('backup.database_ready') || 'Database Ready'}
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      {t('backup.postgresql_connected') || 'PostgreSQL connected with full permissions'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => downloadDbBackupMutation.mutate()}
              disabled={downloadDbBackupMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {downloadDbBackupMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('backup.loading') || 'Loading...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t('backup.download_db_backup') || 'Download Database Backup'}
                </>
              )}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('backup.db_backup_info') || 'This will download a complete SQL backup of all database tables and data.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>{t('backup.backup_history') || 'Backup History'}</span>
            </div>
            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30">
              <RefreshCw className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              {t('backup.refresh') || 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('backup.backup_name') || 'Backup Name'}</TableHead>
                  <TableHead>{t('backup.type') || 'Type'}</TableHead>
                  <TableHead>{t('backup.created') || 'Created'}</TableHead>
                  <TableHead>{t('backup.size') || 'Size'}</TableHead>
                  <TableHead>{t('backup.status') || 'Status'}</TableHead>
                  <TableHead>{t('backup.actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t('backup.no_backups') || 'No backups available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-sm text-muted-foreground">{backup.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={backup.type === 'automatic' ? 'default' : 'secondary'}>
                          {backup.type === 'automatic' ? t('backup.auto') || 'Auto' : t('backup.manual') || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {new Date(backup.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{backup.size}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(backup.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(backup.status)}
                            <span className="capitalize">{backup.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
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
        </CardContent>
      </Card>
    </div>
  );
}