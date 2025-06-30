import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Loader2 } from 'lucide-react';
import type { BotSettings } from '@shared/schema';

interface GoogleMapsPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number; mapUrl: string }) => void;
  defaultLocation?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsPicker({ onLocationSelect, defaultLocation, className }: GoogleMapsPickerProps) {
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchValue, setSearchValue] = useState(defaultLocation || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Get Google Maps API key from bot settings
  const { data: settings } = useQuery<BotSettings>({
    queryKey: ['/api/bot-settings'],
  });

  const googleMapsApiKey = (settings as any)?.googleMapsApiKey || '';

  // Load Google Maps script
  useEffect(() => {
    if (!googleMapsApiKey || window.google) {
      if (window.google) {
        initializeMap();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      setIsMapLoaded(true);
      initializeMap();
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [googleMapsApiKey]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Default to Berlin, Germany
    const defaultCenter = { lat: 52.5200, lng: 13.4050 };
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const markerInstance = new window.google.maps.Marker({
      position: defaultCenter,
      map: mapInstance,
      draggable: true,
      title: 'اختر الموقع'
    });

    // Handle marker drag
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      
      // Reverse geocoding to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
          setSearchValue(address);
          onLocationSelect({ address, lat, lng, mapUrl });
        }
      });
    });

    // Handle map click
    mapInstance.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      markerInstance.setPosition({ lat, lng });
      
      // Reverse geocoding to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
          setSearchValue(address);
          onLocationSelect({ address, lat, lng, mapUrl });
        }
      });
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    // Initialize autocomplete
    const searchInput = document.getElementById('location-search') as HTMLInputElement;
    if (searchInput) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInput, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'de' }, // Restrict to Germany
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name;
          const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}`;

          mapInstance.setCenter({ lat, lng });
          markerInstance.setPosition({ lat, lng });
          setSearchValue(address);
          onLocationSelect({ address, lat, lng, mapUrl });
        }
      });

      autocompleteRef.current = autocomplete;
    }
  };

  const handleSearch = async () => {
    if (!map || !searchValue.trim()) return;

    setIsLoading(true);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchValue }, (results: any[], status: string) => {
      setIsLoading(false);
      
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = results[0].formatted_address;
        const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}`;

        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
        onLocationSelect({ address, lat, lng, mapUrl });
      }
    });
  };

  if (!googleMapsApiKey) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">خدمة الخرائط غير متاحة</h3>
          <p className="text-sm text-muted-foreground mb-4">
            يتطلب تفعيل Google Maps API Key في صفحة الإعدادات
          </p>
          <Button variant="outline" size="sm">
            إضافة API Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          اختيار الموقع من الخريطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            id="location-search"
            placeholder="ابحث عن عنوان أو منطقة..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg border border-border bg-muted"
          />
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <ul className="space-y-1">
            <li>• انقر على الخريطة لتحديد الموقع</li>
            <li>• اسحب العلامة لتغيير الموقع</li>
            <li>• استخدم البحث للعثور على عنوان محدد</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}