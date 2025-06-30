import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff,
  Key,
  Shield,
  MessageSquare,
  Users,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

const botSettingsSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  googleMapsApiKey: z.string().optional(),
  enableNotifications: z.boolean().default(true),
  isEnabled: z.boolean().default(false),
});

type BotSettingsForm = z.infer<typeof botSettingsSchema>;

export default function BotSettings() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBotToken, setShowBotToken] = useState(false);
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  const form = useForm<BotSettingsForm>({
    resolver: zodResolver(botSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      botToken: '',
      googleMapsApiKey: '',
      enableNotifications: true,
      isEnabled: false,
    },
  });

  // Fetch current bot settings
  const { data: botSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/bot-settings'],
    enabled: true,
  });

  // Fetch bot status
  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/telegram/status'],
    refetchInterval: 10000, // Check status every 10 seconds
  });

  // Update bot settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: BotSettingsForm) =>
      apiRequest('PUT', '/api/bot-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
      toast({
        title: t('settings_saved'),
        description: t('bot_settings.saved'),
      });
      // Play success sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBzuLrOcA');
        audio.volume = 0.1;
        audio.play().catch(() => {});
      } catch (e) {}
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('bot_settings.save_error'),
        variant: "destructive",
      });
      // Play error sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRvQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdADAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4');
        audio.volume = 0.15;
        audio.play().catch(() => {});
      } catch (e) {}
    },
  });

  // Load settings from server when available
  useEffect(() => {
    if (botSettings && Object.keys(botSettings).length > 0) {
      const settings = {
        botToken: (botSettings as any).botToken || '',
        googleMapsApiKey: (botSettings as any).googleMapsApiKey || '',
        enableNotifications: true,
        isEnabled: (botSettings as any).isEnabled ?? false,
      };
      
      // Only update if form is not dirty (user hasn't started typing)
      if (!form.formState.isDirty) {
        form.reset(settings);
        console.log('Loaded settings from server:', settings);
      }
    }
  }, [botSettings]);

  // Load settings from localStorage on component mount if no server data
  useEffect(() => {
    if (!botSettings && !settingsLoading) {
      const savedSettings = localStorage.getItem('botSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          form.reset(parsed);
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }
    }
  }, [botSettings, settingsLoading, form]);

  const onSubmit = async (data: BotSettingsForm) => {
    console.log('Submitting bot settings:', data);
    
    // Ensure notifications are always enabled
    data.enableNotifications = true;
    
    // Keep the exact values from the form - don't clear anything
    const finalData = {
      botToken: data.botToken?.trim() || '',
      googleMapsApiKey: data.googleMapsApiKey?.trim() || '',
      enableNotifications: true,
      isEnabled: data.isEnabled
    };
    
    console.log('Final data being sent:', finalData);
    updateSettingsMutation.mutate(finalData);
  };

  const maskToken = (token: string) => {
    if (!token || token.length < 10) return token;
    return `${token.slice(0, 10)}${'*'.repeat(token.length - 20)}${token.slice(-10)}`;
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('bot_settings.title')}</h1>
            <p className="text-muted-foreground">{t('bot_settings.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Status Alert for Bot Connection Issues */}
      {(botStatus as any)?.connected && !(botSettings as any)?.isEnabled && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                {t('bot_settings.connection_warning_title')}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t('bot_settings.connection_warning_message')}
              </p>
            </div>
          </div>
        </div>
      )}

      {!(botStatus as any)?.connected && (botSettings as any)?.isEnabled && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-800 dark:text-red-200">
                {t('bot_settings.disconnection_error_title')}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t('bot_settings.disconnection_error_message')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot Status Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('bot_settings.status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {(botStatus as any)?.connected ? (
                    <>
                      <div className="relative">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
                        {t('bot_settings.connected')}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        {t('bot_settings.disconnected')}
                      </Badge>
                    </>
                  )}
                </div>
                
                {/* Enhanced Status Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-3 space-y-2 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Status Details:
                    </span>
                    <Badge variant="outline" className="bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs px-2 py-0.5">
                      {(botStatus as any)?.status || 'Unknown'}
                    </Badge>
                  </div>
                  
                  {(botStatus as any)?.connected && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Bot Username:
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border text-blue-600 dark:text-blue-400">
                          @{(botStatus as any)?.username || 'Loading...'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Last Check:
                    </span>
                    <span className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Quick Stats */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('bot_settings.bot_status')}</span>
                <Badge variant={
                  (botStatus as any)?.connected && (botSettings as any)?.isEnabled ? "default" : "secondary"
                } className={
                  (botStatus as any)?.connected && (botSettings as any)?.isEnabled 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }>
                  {(botStatus as any)?.connected && (botSettings as any)?.isEnabled 
                    ? t('common.enabled') 
                    : t('common.disabled')
                  }
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('bot_settings.notifications_status')}</span>
                <Badge variant={(botSettings as any)?.enableNotifications ? "default" : "secondary"}>
                  {(botSettings as any)?.enableNotifications ? t('common.enabled') : t('common.disabled')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Google Maps API</span>
                <Badge variant={(botSettings as any)?.googleMapsApiKey ? "default" : "secondary"}>
                  {(botSettings as any)?.googleMapsApiKey ? t('common.enabled') : t('common.disabled')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Configuration Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
              {t('bot_settings.configuration')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Bot Token Field */}
                <FormField
                  control={form.control}
                  name="botToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                          <Key className="w-3 h-3 text-white" />
                        </div>
                        {t('bot_settings.bot_token')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showBotToken ? "text" : "password"}
                            placeholder={t('bot_settings.bot_token_placeholder')}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="font-mono pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2"
                            onClick={() => setShowBotToken(!showBotToken)}
                          >
                            {showBotToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {t('bot_settings.bot_token_help')}
                      </p>
                    </FormItem>
                  )}
                />

                {/* Google Maps API Key */}
                <FormField
                  control={form.control}
                  name="googleMapsApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        {t('bot_settings.google_maps')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showGoogleMapsKey ? "text" : "password"}
                            placeholder={t('bot_settings.google_maps_placeholder')}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2"
                            onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                          >
                            {showGoogleMapsKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {t('bot_settings.google_maps_help')}
                      </p>
                    </FormItem>
                  )}
                />

                {/* Bot Enable/Disable Toggle */}
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                          {t('bot_settings.enable_bot')}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {t('bot_settings.enable_bot_description')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Enable Notifications */}
                <FormField
                  control={form.control}
                  name="enableNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
                          </div>
                          {t('bot_settings.enable_notifications')}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {t('bot_settings.enable_notifications_description')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('common.saving')}
                    </>
                  ) : (
                    t('bot_settings.save')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            {t('bot_settings.how_to_use')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('bot_settings.for_technicians')}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</span>
                  {t('bot_settings.step_1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</span>
                  {t('bot_settings.step_2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</span>
                  {t('bot_settings.step_3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">4</span>
                  {t('bot_settings.step_4')}
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('bot_settings.for_admins')}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</span>
                  {t('bot_settings.admin_step_1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</span>
                  {t('bot_settings.admin_step_2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</span>
                  {t('bot_settings.admin_step_3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">4</span>
                  {t('bot_settings.admin_step_4')}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}