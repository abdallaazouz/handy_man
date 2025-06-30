import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Languages, 
  Globe, 
  Type, 
  Settings,
  ArrowRight,
  Check,
  RotateCcw,
  Save
} from 'lucide-react';

export default function LanguageSettings() {
  const { currentLanguage, setLanguage, t, isRTL } = useLanguage();
  const { settings, updateSettings, isLoading: systemLoading } = useSystemSettings();
  const { toast } = useToast();
  const [rtlEnabled, setRtlEnabled] = useState(isRTL);
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [currency, setCurrency] = useState('EUR');
  const [defaultView, setDefaultView] = useState<'table' | 'cards'>('table');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);

  // Default settings for reset functionality
  const defaultSettings = {
    language: 'en' as const,
    rtl: false,
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    defaultView: 'table' as const
  };

  // Load settings when system settings are available
  useEffect(() => {
    if (settings) {
      setDateFormat(settings.dateFormat || 'dd/mm/yyyy');
      setTimeFormat(settings.timeFormat || '24h');
      setCurrency(settings.currency || 'EUR');
      setRtlEnabled(settings.rtlEnabled || false);
      setDefaultView((settings.defaultView as 'table' | 'cards') || 'table');
    }
  }, [settings]);

  const handleSaveRequest = () => {
    const newSettings = {
      language: currentLanguage,
      rtlEnabled,
      dateFormat,
      timeFormat,
      currency,
      defaultView: defaultView as 'table' | 'cards',
      isLocked: false
    };
    
    setPendingChanges(newSettings);
    setShowConfirmDialog(true);
  };

  const confirmSaveSettings = async () => {
    if (!pendingChanges) return;
    
    try {
      setIsSaving(true);
      await updateSettings(pendingChanges);
      
      toast({
        title: "Settings Saved",
        description: "Language and system settings have been updated successfully.",
      });
      
      setShowConfirmDialog(false);
      setPendingChanges(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setLanguage(defaultSettings.language as any);
      setRtlEnabled(defaultSettings.rtl);
      setDateFormat(defaultSettings.dateFormat);
      setTimeFormat(defaultSettings.timeFormat);
      setCurrency(defaultSettings.currency);
      setDefaultView(defaultSettings.defaultView);
      
      // Also update system settings
      await updateSettings({
        language: defaultSettings.language,
        rtlEnabled: defaultSettings.rtl,
        dateFormat: defaultSettings.dateFormat,
        timeFormat: defaultSettings.timeFormat,
        currency: defaultSettings.currency,
        defaultView: defaultSettings.defaultView,
        isLocked: false
      });
      
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values and applied to the system.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  ];

  const dateFormats = [
    { value: 'dd/mm/yyyy', example: '18/06/2025' },
    { value: 'mm/dd/yyyy', example: '06/18/2025' },
    { value: 'yyyy-mm-dd', example: '2025-06-18' },
  ];

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Language Settings</h1>
        <p className="text-muted-foreground">Configure language and regional preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Languages className="h-5 w-5" />
              <span>Interface Language</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={currentLanguage} 
              onValueChange={(value) => setLanguage(value as any)}
            >
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center space-x-3">
                  <RadioGroupItem value={lang.code} id={lang.code} />
                  <Label htmlFor={lang.code} className="flex items-center space-x-3 cursor-pointer flex-1">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-medium">{lang.name}</p>
                      <p className="text-sm text-muted-foreground">{lang.native}</p>
                    </div>
                    {currentLanguage === lang.code && (
                      <Badge variant="default" className="ml-auto">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rtl-mode">Right-to-Left (RTL) Layout</Label>
                <p className="text-sm text-muted-foreground">Enable for Arabic and Hebrew languages</p>
              </div>
              <Switch
                id="rtl-mode"
                checked={rtlEnabled}
                onCheckedChange={setRtlEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Regional Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Format */}
            <div>
              <Label className="text-base font-medium">Date Format</Label>
              <RadioGroup value={dateFormat} onValueChange={setDateFormat} className="mt-2">
                {dateFormats.map((format) => (
                  <div key={format.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={format.value} id={format.value} />
                    <Label htmlFor={format.value} className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <span>{format.value}</span>
                        <span className="text-muted-foreground">{format.example}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Time Format */}
            <div>
              <Label className="text-base font-medium">Time Format</Label>
              <RadioGroup value={timeFormat} onValueChange={setTimeFormat} className="mt-2">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="24h" id="24h" />
                  <Label htmlFor="24h" className="cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <span>24-hour</span>
                      <span className="text-muted-foreground">14:30</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="12h" id="12h" />
                  <Label htmlFor="12h" className="cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <span>12-hour</span>
                      <span className="text-muted-foreground">2:30 PM</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Currency */}
            <div>
              <Label className="text-base font-medium">Currency</Label>
              <RadioGroup value={currency} onValueChange={setCurrency} className="mt-2">
                {currencies.map((curr) => (
                  <div key={curr.code} className="flex items-center space-x-3">
                    <RadioGroupItem value={curr.code} id={curr.code} />
                    <Label htmlFor={curr.code} className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <span>{curr.name}</span>
                        <span className="text-muted-foreground">{curr.symbol} {curr.code}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Default View */}
            <div>
              <Label className="text-base font-medium">Default View Mode</Label>
              <RadioGroup 
                value={defaultView} 
                onValueChange={(value: string) => setDefaultView(value as 'table' | 'cards')} 
                className="mt-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="table" id="table" />
                  <Label htmlFor="table" className="cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <span>Table View</span>
                      <span className="text-muted-foreground">Detailed data in rows</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cards" id="cards" />
                  <Label htmlFor="cards" className="cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <span>Card View</span>
                      <span className="text-muted-foreground">Visual card layout</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-medium">Sample Text in Current Language:</p>
            <p className="text-lg">{t('dashboard.title')}</p>
            <p>{t('dashboard.subtitle')}</p>
            
            <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
              <span>Date: {dateFormats.find(f => f.value === dateFormat)?.example}</span>
              <span>Time: {timeFormat === '24h' ? '14:30' : '2:30 PM'}</span>
              <span>Currency: {currencies.find(c => c.code === currency)?.symbol}1,234.56</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={resetToDefaults}
          disabled={systemLoading || isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
        <Button 
          onClick={handleSaveRequest}
          disabled={isSaving || systemLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Settings Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to apply system-wide changes that will affect:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Interface language</li>
                <li>Date and time formats</li>
                <li>Default view preferences</li>
                <li>Regional settings</li>
              </ul>
              These changes will be applied immediately across the entire system. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? 'Applying Changes...' : 'Confirm & Apply'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}