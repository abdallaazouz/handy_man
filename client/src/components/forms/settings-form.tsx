import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Eye, EyeOff, Bot, Map, Key } from 'lucide-react';
import { useState } from 'react';

const settingsSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  googleMapsApiKey: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialData?: any;
  onSubmit: (data: SettingsFormData) => void;
  isLoading?: boolean;
}

export default function SettingsForm({ initialData, onSubmit, isLoading }: SettingsFormProps) {
  const { t } = useLanguage();
  const [showBotToken, setShowBotToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      botToken: initialData?.botToken || '',
      googleMapsApiKey: initialData?.googleMapsApiKey || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = (data: SettingsFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Bot Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Bot Token</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showBotToken ? 'text' : 'password'}
                        placeholder="1234567890:ABCDefGhIjKlMnOpQrStUvWxYz"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowBotToken(!showBotToken)}
                      >
                        {showBotToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Get your bot token from @BotFather on Telegram
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Bot Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable the Telegram bot
                    </FormDescription>
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
          </CardContent>
        </Card>

        {/* Google Maps Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-5 w-5" />
              <span>Google Maps Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="googleMapsApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="AIzaSyBNLrJhOMz6idD0Zjg-SuuTiQO1D4FG..."
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Optional: Enable location features and map integration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Bot Token Setup:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Message @BotFather on Telegram</li>
                  <li>Create a new bot with /newbot command</li>
                  <li>Copy the provided token and paste it above</li>
                  <li>Set bot privacy to disabled with /setprivacy</li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Google Maps API Setup:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Console</li>
                  <li>Enable Maps JavaScript API</li>
                  <li>Create an API key with proper restrictions</li>
                  <li>Add your domain to the restrictions</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-4 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
