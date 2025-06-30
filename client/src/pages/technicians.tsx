import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAudioNotifications } from '@/hooks/use-audio-notifications';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TechnicianForm from '@/components/forms/technician-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Phone, AtSign, MessageCircle, FileText, BarChart3, Grid, List, MoreVertical, MapPin } from 'lucide-react';

export default function Technicians() {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { playNotification } = useAudioNotifications();
  const { settings } = useSystemSettings();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isNewTechnicianOpen, setIsNewTechnicianOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);

  // Apply default view mode from system settings
  useEffect(() => {
    if (settings?.defaultView) {
      setViewMode(settings.defaultView);
    }
  }, [settings]);

  const { data: technicians = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });

  const createTechnicianMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/technicians', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsNewTechnicianOpen(false);
      toast({ title: 'Success', description: 'Technician added successfully' });
      playNotification('general');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add technician',
        variant: 'destructive' 
      });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/technicians/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      setEditingTechnician(null);
      toast({ title: 'Success', description: 'Technician updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update technician',
        variant: 'destructive' 
      });
    },
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/technicians/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ 
        title: t('common.success'), 
        description: t('technicians.deleted_successfully') 
      });
      playNotification('success');
    },
    onError: (error: any) => {
      console.error('Delete technician error:', error);
      
      // Refresh the technician list to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      
      const errorMessage = error.message === 'Technician not found' 
        ? t('technicians.not_found_error')
        : t('technicians.delete_failed');
      
      toast({ 
        title: t('common.error'), 
        description: errorMessage,
        variant: 'destructive' 
      });
      playNotification('error');
    },
  });

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const filteredTechnicians = (technicians as any[]).filter((tech: any) =>
    tech.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.telegramId.includes(searchTerm)
  );

  const toggleTechnicianStatus = (technicianId: number, currentStatus: boolean) => {
    updateTechnicianMutation.mutate({ 
      id: technicianId, 
      data: { isActive: !currentStatus } 
    });
  };

  const handleSendMessage = (telegramId: string, firstName: string) => {
    // Open Telegram Web with pre-filled message
    const telegramUrl = `https://t.me/${telegramId.replace('@', '')}`;
    window.open(telegramUrl, '_blank');
    const title = settings?.language === 'ar' 
      ? 'تم فتح التليجرام'
      : settings?.language === 'de'
      ? 'Telegram geöffnet'
      : 'Telegram Opened';
      
    const description = settings?.language === 'ar' 
      ? `فتح محادثة مع ${firstName}`
      : settings?.language === 'de'
      ? `Chat mit ${firstName} öffnen`
      : `Opening chat with ${firstName}`;
      
    toast({
      title,
      description,
    });
  };

  const handleViewInvoices = (technicianId: number) => {
    // Navigate to invoices page with technician filter
    window.location.href = `/invoices?technician=${technicianId}`;
  };

  const handleViewReports = (technicianId: number) => {
    // Navigate to reports page with technician filter
    window.location.href = `/reports?technician=${technicianId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.technicians')}</h1>
          <p className="text-muted-foreground">Manage your team of technicians</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <List className="h-4 w-4 mr-1" />
              {t('common.table_view')}
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="px-3"
            >
              <Grid className="h-4 w-4 mr-1" />
              {t('common.card_view')}
            </Button>
          </div>
        </div>
          
        <Dialog open={isNewTechnicianOpen} onOpenChange={setIsNewTechnicianOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.add_technician')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TechnicianForm
                onSubmit={(data) => createTechnicianMutation.mutate(data)}
                onCancel={() => setIsNewTechnicianOpen(false)}
                isLoading={createTechnicianMutation.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(technicians as any[]).filter((t: any) => t.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(technicians as any[]).filter((t: any) => !t.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plus className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{technicians.length}</p>
                <p className="text-sm text-muted-foreground">Total Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search technicians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            // Table View
            <div className="rounded-lg border border-border/50 bg-card">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                <TableHeader className="bg-muted/20">
                <TableRow className="border-b border-border/20 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm min-w-[200px]">{currentLanguage === 'en' ? 'Technician' : currentLanguage === 'de' ? 'Techniker' : 'الفني'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm min-w-[150px]">{currentLanguage === 'en' ? 'Contact' : currentLanguage === 'de' ? 'Kontakt' : 'التواصل'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[120px]">{currentLanguage === 'en' ? 'Service' : currentLanguage === 'de' ? 'Service' : 'الخدمة'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[120px]">{currentLanguage === 'en' ? 'Coverage Area' : currentLanguage === 'de' ? 'Abdeckungsbereich' : 'منطقة التغطية'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[150px]">{currentLanguage === 'en' ? 'Telegram' : currentLanguage === 'de' ? 'Telegram' : 'تيليجرام'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[100px]">{currentLanguage === 'en' ? 'Status' : currentLanguage === 'de' ? 'Status' : 'الحالة'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[100px]">{currentLanguage === 'en' ? 'Joined' : currentLanguage === 'de' ? 'Beigetreten' : 'انضم'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[200px]">{currentLanguage === 'en' ? 'Actions' : currentLanguage === 'de' ? 'Aktionen' : 'الإجراءات'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechnicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm">No technicians found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTechnicians.map((technician: any, index: number) => (
                    <TableRow 
                      key={technician.id}
                      className={`
                        border-b border-border/30 hover:bg-muted/50 transition-colors duration-200
                        ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                      `}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(technician.firstName, technician.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                              {technician.firstName} {technician.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              ID: {technician.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {technician.phoneNumber ? (
                          <div className="flex items-center space-x-1 max-w-[150px]">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{technician.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Kein Telefon</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {technician.serviceProvided ? (
                          <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                            {technician.serviceProvided}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nicht angegeben</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {technician.cityArea ? (
                          <div className="flex items-center space-x-1 max-w-[120px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{technician.cityArea}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nicht angegeben</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {technician.telegramId}
                            </span>
                          </div>
                          {technician.username && (
                            <div className="flex items-center space-x-1">
                              <AtSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {technician.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={technician.isActive ? "default" : "secondary"}
                          className={technician.isActive ? "bg-emerald-500" : ""}
                        >
                          {technician.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(technician.joinedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleSendMessage(technician.telegramId, technician.firstName)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-lg h-9 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                            title="Send Telegram Message"
                          >
                            <div className="bg-white/20 rounded-full p-1">
                              <MessageCircle className="h-3 w-3" />
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleViewInvoices(technician.id)}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 rounded-lg h-9 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                            title="View Technician Invoices"
                          >
                            <div className="bg-white/20 rounded-full p-1">
                              <FileText className="h-3 w-3" />
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => toggleTechnicianStatus(technician.id, technician.isActive)}
                            className={`border-0 rounded-lg h-9 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 ${
                              technician.isActive 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            }`}
                            title={technician.isActive ? "Deactivate Technician" : "Activate Technician"}
                          >
                            <div className="bg-white/20 rounded-full p-1">
                              {technician.isActive ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setEditingTechnician(technician)}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-lg h-9 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                            title="Edit Technician"
                          >
                            <div className="bg-white/20 rounded-full p-1">
                              <Edit className="h-3 w-3" />
                            </div>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm"
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg h-9 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                                title="Delete Technician"
                              >
                                <div className="bg-white/20 rounded-full p-1">
                                  <Trash2 className="h-3 w-3" />
                                </div>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('technician.delete_confirm_title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('technician.delete_confirm_message').replace('{name}', `${technician.firstName} ${technician.lastName || ''}`)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTechnicianMutation.mutate(technician.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deleteTechnicianMutation.isPending}
                                >
                                  {deleteTechnicianMutation.isPending ? t('common.loading') : t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
              </div>
            </div>
          ) : (
            // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTechnicians.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  {t('common.no_data')}
                </div>
              ) : (
                filteredTechnicians.map((technician: any, index: number) => {
                  const gradients = [
                    'gradient-blue-purple',
                    'gradient-emerald-cyan', 
                    'gradient-rose-amber'
                  ];
                  const gradientClass = gradients[index % gradients.length];
                  
                  return (
                    <Card key={technician.id} className={`hover:card-shadow-hover transition-all duration-500 card-shadow border-0 rounded-3xl overflow-hidden ${gradientClass} relative`}>
                    {/* Status Header Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-2 ${technician.isActive ? 'status-active' : 'status-inactive'}`}></div>
                    
                    <CardHeader className="pt-8 pb-6 text-center relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="glass-effect rounded-2xl px-4 py-2">
                          <span className="font-bold text-sm tracking-wider text-white uppercase">
                            ID-{String(technician.id).padStart(3, '0')}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${technician.isActive ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                          {technician.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/20 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleSendMessage(technician.telegramId, technician.firstName)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {t('technician.message')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewInvoices(technician.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              {t('technician.invoices')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewReports(technician.id)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              {t('technician.reports')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingTechnician(technician)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-4 mb-6">
                        <h3 className="font-bold text-3xl text-white leading-tight tracking-tight">
                          {technician.firstName} {technician.lastName}
                        </h3>
                        <div className="flex items-center justify-center space-x-2 text-white/70">
                          <span className="text-sm font-medium">
                            @{technician.telegramId}
                          </span>
                        </div>
                        {technician.phoneNumber && (
                          <div className="flex items-center justify-center space-x-2 text-white/70">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">
                              {technician.phoneNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="glass-effect rounded-2xl p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center space-y-2">
                            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                              Service
                            </p>
                            <p className="text-sm font-medium text-white">
                              {technician.serviceProvided || 'Not specified'}
                            </p>
                          </div>

                          <div className="text-center space-y-2">
                            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                              Coverage Area
                            </p>
                            <div className="flex items-center justify-center space-x-1">
                              <MapPin className="h-4 w-4 text-white/60" />
                              <p className="text-sm font-medium text-white">
                                {technician.cityArea || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center pt-4 border-t border-white/10">
                          <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                            Member Since
                          </p>
                          <p className="text-sm font-medium text-white">
                            {new Date(technician.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-3 pt-6">
                        <Button
                          size="lg"
                          onClick={() => handleSendMessage(technician.telegramId, technician.firstName)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl h-16 w-16 p-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          title="Send Telegram Message"
                        >
                          <div className="bg-white/20 rounded-full p-2">
                            <MessageCircle className="h-6 w-6" />
                          </div>
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => setEditingTechnician(technician)}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl h-16 w-16 p-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          title="Edit Technician"
                        >
                          <div className="bg-white/20 rounded-full p-2">
                            <Edit className="h-6 w-6" />
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Technician Dialog */}
      <Dialog open={!!editingTechnician} onOpenChange={() => setEditingTechnician(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
          </DialogHeader>
          {editingTechnician && (
            <div className="py-4">
              <TechnicianForm
                initialData={editingTechnician}
                onSubmit={(data) => updateTechnicianMutation.mutate({ 
                  id: (editingTechnician as any).id, 
                  data 
                })}
                onCancel={() => setEditingTechnician(null)}
                isLoading={updateTechnicianMutation.isPending}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
