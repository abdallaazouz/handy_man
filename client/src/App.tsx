import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { AudioNotificationProvider } from "@/hooks/use-audio-notifications";
import { SystemSettingsProvider } from "@/hooks/use-system-settings";
import { useWebSocket } from "@/hooks/useWebSocket";
import MainLayout from "@/components/layout/main-layout";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Technicians from "@/pages/technicians";
import Settings from "@/pages/settings";
import Invoices from "@/pages/invoices";
import Reports from "@/pages/reports";
import LanguageSettings from "@/pages/language-settings";
import ActivityHistory from "@/pages/activity-history";
import BackupRestore from "@/pages/backup-restore";
import DatabaseManagement from "@/pages/database-management";
import BotSettings from "@/pages/bot-settings";
import Notifications from "@/pages/notifications";
import AdminProfile from "@/pages/admin-profile";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

function AuthenticatedApp() {
  // Initialize WebSocket connection for real-time notifications
  const { isConnected } = useWebSocket();

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/technicians" component={Technicians} />
        <Route path="/settings" component={BotSettings} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/reports" component={Reports} />
        <Route path="/translation" component={LanguageSettings} />
        <Route path="/history" component={ActivityHistory} />
        <Route path="/backup" component={BackupRestore} />
        <Route path="/database" component={DatabaseManagement} />
        <Route path="/database-management" component={DatabaseManagement} />
        <Route path="/bot-settings" component={BotSettings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/admin-profile" component={AdminProfile} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SystemSettingsProvider>
          <AudioNotificationProvider>
            <LanguageProvider>
              <Toaster />
              {isAuthenticated ? (
                <AuthenticatedApp />
              ) : (
                <Switch>
                  <Route path="/forgot-password" component={ForgotPassword} />
                  <Route path="/reset-password" component={ResetPassword} />
                  <Route>
                    <Login onLogin={() => setIsAuthenticated(true)} />
                  </Route>
                </Switch>
              )}
            </LanguageProvider>
          </AudioNotificationProvider>
        </SystemSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
