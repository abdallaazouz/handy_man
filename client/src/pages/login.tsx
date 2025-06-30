import { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      
      toast({
        title: 'Success',
        description: 'Successfully logged in',
      });
      
      onLogin();
    } catch (error) {
      toast({
        title: 'Error',
        description: t('login.error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      toast({
        title: 'Success',
        description: t('login.reset_email_sent'),
      });
      
      setShowForgotPassword(false);
      setEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: t('login.reset_email_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
          <p className="text-muted-foreground">{t('app.name')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <Mail className="h-3 w-3 text-white" />
                </div>
                {t('login.username')}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={t('login.username')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
                {t('login.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('login.password')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('login.submit')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowForgotPassword(true)}
            >
              {t('login.forgot_password')}
            </Button>
          </div>

          {showForgotPassword && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/20">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                      <Mail className="h-3 w-3 text-white" />
                    </div>
                    {t('login.email_recovery')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.email_placeholder')}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('login.send_reset')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
