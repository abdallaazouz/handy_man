import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { queryClient } from "@/lib/queryClient";
import { User, Mail, Phone, Lock, Upload, MessageCircle, Settings, Shield, Image } from "lucide-react";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  phoneLoginEnabled: z.boolean().default(false),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AdminProfile() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      phoneLoginEnabled: false,
    },
  });

  // Use React Query to fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['/api/admin/profile'],
    queryFn: async () => {
      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': 'Bearer auth_token_123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Profile loaded:', data);
      return data;
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Initialize form when profile data loads
  useEffect(() => {
    if (profile) {
      const formData = {
        username: profile.username || "",
        displayName: profile.displayName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        phoneLoginEnabled: Boolean(profile.phoneLoginEnabled),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
      
      form.reset(formData);
    }
  }, [profile, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Client-side validation
      if (!data.username || data.username.length < 3) {
        toast({
          title: "Validation Error",
          description: "Username must be at least 3 characters long.",
          variant: "destructive",
        });
        return;
      }

      if (!data.email || !data.email.includes('@')) {
        toast({
          title: "Validation Error", 
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "New passwords do not match.",
          variant: "destructive",
        });
        return;
      }

      if (data.newPassword && data.newPassword.length < 6) {
        toast({
          title: "Validation Error",
          description: "New password must be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }

      console.log('Updating profile with data:', data);

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });

      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));

      if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response as JSON');
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Profile updated successfully:', result);
      
      // Update form with new data if profile was returned
      if (result.profile) {
        form.reset({
          username: result.profile.username,
          displayName: result.profile.displayName,
          email: result.profile.email,
          phone: result.profile.phone,
          phoneLoginEnabled: result.profile.phoneLoginEnabled,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
      
      // Clear password fields after successful update
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
      form.setValue('confirmPassword', '');
      
      toast({
        title: "Profile Updated",
        description: result.message || "Your profile has been successfully updated and saved.",
      });
      
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      let errorMessage = "Failed to update profile. Please check your information and try again.";
      
      // Handle different error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message.includes('JSON')) {
        errorMessage = "Server communication error. Please try again.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Unable to connect to server. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              {t('profile.title')}
            </CardTitle>
            <CardDescription>
              Update your admin account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Logo Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={logoPreview || "/placeholder-avatar.png"} alt="Profile" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">{t('profile.logo')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('profile.uploadNewLogo')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    {t('profile.username')}
                  </Label>
                  <Input
                    id="username"
                    {...form.register('username')}
                    placeholder="Enter username"
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                  )}
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('profile.display_name')}</Label>
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    placeholder="Enter display name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-red-500">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                      <Mail className="w-3 h-3 text-white" />
                    </div>
                    {t('profile.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="Enter email address"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register('phone')}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Phone Login Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('profile.phone_login')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow login using phone number
                  </p>
                </div>
                <Switch {...form.register('phoneLoginEnabled')} />
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('profile.passwordSection')}</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...form.register('currentPassword')}
                      placeholder={t('profile.currentPassword')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...form.register('newPassword')}
                      placeholder={t('profile.newPassword')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...form.register('confirmPassword')}
                      placeholder={t('profile.confirmPassword')}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const email = form.getValues('email');
                      const response = await fetch('/api/admin/reset-password', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({ email })
                      });

                      if (response.ok) {
                        const result = await response.json();
                        toast({
                          title: "Password Reset",
                          description: result.message || "Password reset instructions sent to your email.",
                        });
                        
                        // Show development token in console
                        if (result.devToken) {
                          console.log('Development reset token:', result.devToken);
                        }
                      } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Reset failed');
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to send password reset. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Reset Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Technical Support Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t('profile.support')}
            </CardTitle>
            <CardDescription>
              Get help from our technical support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">{t('profile.contact_support')}</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our support team via Telegram for immediate assistance
                </p>
              </div>
              <Button asChild variant="outline">
                <a 
                  href="https://t.me/AAPRO2025" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Telegram
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}