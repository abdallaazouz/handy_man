import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Database, CheckCircle, XCircle, RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/use-language";

interface DatabaseStatus {
  connected: boolean;
  hasPermissions: boolean;
  isReady: boolean;
}

interface InitializeResponse {
  success: boolean;
  status: DatabaseStatus;
  message: string;
}

export default function DatabaseManagement() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/database/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });



  const downloadBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/database/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate backup');
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
        title: t('common.success'),
        description: t('database.backup_success'),
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });



  const handleDownloadBackup = () => {
    downloadBackupMutation.mutate();
  };

  const getStatusBadge = (connected: boolean, hasPermissions: boolean, isReady: boolean) => {
    if (isReady) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
    } else if (connected && !hasPermissions) {
      return <Badge variant="secondary" className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />Limited Permissions</Badge>;
    } else if (connected) {
      return <Badge variant="secondary" className="bg-blue-500"><Database className="w-3 h-3 mr-1" />Connected</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('database.title')}</h1>
          <p className="text-muted-foreground">
            {t('database.subtitle')}
          </p>
        </div>
        <Button 
          onClick={() => refetchStatus()} 
          variant="outline" 
          size="sm"
          disabled={statusLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
          {t('common.loading')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t('database.status')}
            </CardTitle>
            <CardDescription>
              {t('database.status_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : status ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('database.general_status')}:</span>
                  {getStatusBadge((status as DatabaseStatus).connected, (status as DatabaseStatus).hasPermissions, (status as DatabaseStatus).isReady)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t('database.connection')}:</span>
                    <Badge variant={(status as DatabaseStatus).connected ? "default" : "destructive"}>
                      {(status as DatabaseStatus).connected ? t('database.connected') : t('database.disconnected')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>{t('database.write_permissions')}:</span>
                    <Badge variant={(status as DatabaseStatus).hasPermissions ? "default" : "secondary"}>
                      {(status as DatabaseStatus).hasPermissions ? t('database.available') : t('database.not_available')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>{t('database.ready_for_use')}:</span>
                    <Badge variant={(status as DatabaseStatus).isReady ? "default" : "secondary"}>
                      {(status as DatabaseStatus).isReady ? t('common.yes') : t('common.no')}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {t('database.failed_to_load')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('database.backup')}</CardTitle>
            <CardDescription>
              {t('database.backup_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Download a complete backup of your database including all tables and data.
              </p>
              
              {status && (status as any).isReady && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Database Ready
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        PostgreSQL connected with full permissions
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleDownloadBackup}
              disabled={downloadBackupMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {downloadBackupMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t('database.download_backup')}
                </>
              )}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('database.backup_description')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('database.connection_info')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">{t('database.connected')} Database:</p>
                <p className="text-muted-foreground">PostgreSQL on Supabase</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Database className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Active Tables:</p>
                <p className="text-muted-foreground">
                  users, system_settings, technicians, tasks, bot_settings, notifications, invoices
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Status:</p>
                <p className="text-muted-foreground">
                  All data is permanently stored with automatic backups
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}