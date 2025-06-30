import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit } from 'lucide-react';

export default function MapsIntegration() {
  const { t } = useLanguage();
  
  const { data: settings } = useQuery({
    queryKey: ['/api/bot-settings'],
  });

  const hasApiKey = settings?.googleMapsApiKey;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.map_integration')}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${hasApiKey ? 'bg-emerald-500 animate-pulse-soft' : 'bg-red-500'}`} />
            <Badge variant={hasApiKey ? "default" : "destructive"}>
              {hasApiKey ? 'API Connected' : 'API Missing'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">API Key Status</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="password"
                  value={hasApiKey ? '•••••••••••••••key123' : ''}
                  placeholder="Enter Google Maps API Key"
                  className="flex-1"
                  readOnly
                />
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Map Features</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="realtime" defaultChecked />
                  <Label htmlFor="realtime" className="text-sm">Real-time tracking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="routes" defaultChecked />
                  <Label htmlFor="routes" className="text-sm">Route optimization</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="traffic" />
                  <Label htmlFor="traffic" className="text-sm">Traffic information</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Google Maps Integration</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasApiKey ? 'Map ready to display' : 'Configure API key to enable maps'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
