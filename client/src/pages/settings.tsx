import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function Settings() {
  const [, setLocation] = useLocation();

  // Redirect to bot-settings page to avoid confusion and conflicts
  useEffect(() => {
    setLocation('/bot-settings');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Bot Settings...</p>
      </div>
    </div>
  );
}