import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAudioNotifications } from '@/hooks/use-audio-notifications';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Eye, Send, Euro, FileText, CheckCircle, Clock, Grid, List, MoreVertical, Trash2, Download } from 'lucide-react';
import { ExportUtils } from '@/lib/export-utils';

export default function Invoices() {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { playNotification } = useAudioNotifications();
  const { settings } = useSystemSettings();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  // Handler for invoice status changes
  const handleInvoiceStatusChange = async (invoiceId: number, newStatus: string) => {
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        data: { status: newStatus }
      });
      const successTitle = settings?.language === 'ar' 
        ? 'تم التحديث'
        : settings?.language === 'de'
        ? 'Aktualisiert'
        : 'Updated';
        
      const successDesc = settings?.language === 'ar' 
        ? 'تم تحديث حالة الفاتورة بنجاح'
        : settings?.language === 'de'
        ? 'Rechnungsstatus erfolgreich aktualisiert'
        : 'Invoice status updated successfully';
        
      toast({
        title: successTitle,
        description: successDesc,
      });
      playNotification('success');
    } catch (error) {
      const errorTitle = settings?.language === 'ar' 
        ? 'خطأ'
        : settings?.language === 'de'
        ? 'Fehler'
        : 'Error';
        
      const errorDesc = settings?.language === 'ar' 
        ? 'فشل في تحديث حالة الفاتورة'
        : settings?.language === 'de'
        ? 'Fehler beim Aktualisieren des Rechnungsstatus'
        : 'Failed to update invoice status';
        
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive",
      });
    }
  };

  // Handler for PDF download
  const handleDownloadPDF = (invoice: any) => {
    try {
      const technicianData = technicians.find((tech: any) => 
        tech.id.toString() === invoice.technicianId
      );
      
      const technicianName = technicianData ? `${technicianData.firstName} ${technicianData.lastName || ''}`.trim() : 'Unbekannt';
      
      console.log('Creating PDF for invoice:', invoice.invoiceNumber);
      
      // Create jsPDF instance
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RECHNUNG', 20, 30);
      
      // Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 50;
      doc.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, 20, yPos);
      yPos += 10;
      doc.text(`Betrag: €${parseFloat(invoice.amount || 0).toFixed(2)}`, 20, yPos);
      yPos += 10;
      doc.text(`Techniker: ${technicianName}`, 20, yPos);
      yPos += 10;
      doc.text(`Kunde: ${invoice.clientName || 'Unknown Client'}`, 20, yPos);
      yPos += 10;
      
      const statusText = invoice.status === 'paid' ? 'Bezahlt' : 
                        invoice.status === 'sent' ? 'Gesendet' : 
                        invoice.status === 'pending' ? 'Ausstehend' : 'Nicht gesendet';
      doc.text(`Status: ${statusText}`, 20, yPos);
      yPos += 10;
      
      const createDate = new Date(invoice.createdAt).toLocaleDateString('de-DE');
      doc.text(`Rechnungsdatum: ${createDate}`, 20, yPos);
      yPos += 10;
      
      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate).toLocaleDateString('de-DE');
        doc.text(`Fälligkeitsdatum: ${dueDate}`, 20, yPos);
        yPos += 10;
      }
      
      // Payment method
      const paymentMethod = invoice.paymentMethod && Array.isArray(invoice.paymentMethod) && invoice.paymentMethod.length > 0 ? 
        invoice.paymentMethod.map((method: string) => {
          if (method === 'cash') return 'Bar';
          if (method === 'visa') return 'Visa';
          if (method === 'bank_transfer') return 'Banküberweisung';
          if (method === 'phone_wallet') return 'Handy-Wallet';
          return method;
        }).join(', ') : 'Bar';
      doc.text(`Zahlungsmethode: ${paymentMethod}`, 20, yPos);
      
      // Footer
      doc.setFontSize(8);
      doc.text('Erstellt mit Technician Task Manager', 20, 280);
      
      // Download PDF
      const fileName = `Rechnung_${invoice.invoiceNumber}.pdf`;
      console.log('Saving PDF as:', fileName);
      doc.save(fileName);
      
      toast({
        title: "PDF erfolgreich erstellt",
        description: `Rechnung ${invoice.invoiceNumber} wurde als PDF heruntergeladen`,
      });
      
    } catch (error: any) {
      console.error('PDF error:', error);
      
      // Text file fallback
      try {
        const technicianData = technicians.find((tech: any) => 
          tech.id.toString() === invoice.technicianId
        );
        const technicianName = technicianData ? `${technicianData.firstName} ${technicianData.lastName || ''}`.trim() : 'Unbekannt';
        
        const textContent = `RECHNUNG

Rechnungsnummer: ${invoice.invoiceNumber}
Betrag: €${parseFloat(invoice.amount || 0).toFixed(2)}
Techniker: ${technicianName}
Kunde: ${invoice.clientName || 'Unknown Client'}
Status: ${invoice.status === 'paid' ? 'Bezahlt' : 
          invoice.status === 'sent' ? 'Gesendet' : 
          invoice.status === 'pending' ? 'Ausstehend' : 'Nicht gesendet'}
Rechnungsdatum: ${new Date(invoice.createdAt).toLocaleDateString('de-DE')}
${invoice.dueDate ? `Fälligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}` : ''}
Zahlungsmethode: ${invoice.paymentMethod && Array.isArray(invoice.paymentMethod) && invoice.paymentMethod.length > 0 ? 
  invoice.paymentMethod.map((method: string) => {
    if (method === 'cash') return 'Bar';
    if (method === 'visa') return 'Visa';
    if (method === 'bank_transfer') return 'Banküberweisung';
    if (method === 'phone_wallet') return 'Handy-Wallet';
    return method;
  }).join(', ') : 'Bar'}

Erstellt mit Technician Task Manager`;
        
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rechnung_${invoice.invoiceNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Rechnung als Text heruntergeladen",
          description: `Rechnung ${invoice.invoiceNumber}.txt wurde heruntergeladen`,
        });
      } catch (fallbackError) {
        const errorToast = toast({
          title: "Download-Fehler",
          description: "Rechnung konnte nicht erstellt werden",
          variant: "destructive",
        });
        
        // Auto dismiss after 4 seconds
        setTimeout(() => {
          if (errorToast && errorToast.dismiss) {
            errorToast.dismiss();
          }
        }, 4000);
      }
    }
  };

  // Handler for sending invoice to technician via Telegram
  const handleSendToTechnician = async (invoice: any) => {
    try {
      const technicianData = technicians.find((tech: any) => 
        tech.id.toString() === invoice.technicianId
      );
      
      if (!technicianData || !technicianData.telegramId) {
        const errorToast = toast({
          title: "Fehler",
          description: "Techniker nicht gefunden oder nicht mit Telegram verbunden",
          variant: "destructive",
        });
        
        // Auto dismiss after 4 seconds
        setTimeout(() => {
          if (errorToast && errorToast.dismiss) {
            errorToast.dismiss();
          }
        }, 4000);
        return;
      }

      const technicianName = `${technicianData.firstName} ${technicianData.lastName || ''}`.trim();
      
      console.log('Sending invoice to technician:', technicianName, 'Telegram ID:', technicianData.telegramId);
      
      // Create PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RECHNUNG', 20, 30);
      
      // Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 50;
      doc.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, 20, yPos);
      yPos += 10;
      doc.text(`Betrag: €${parseFloat(invoice.amount || 0).toFixed(2)}`, 20, yPos);
      yPos += 10;
      doc.text(`Techniker: ${technicianName}`, 20, yPos);
      yPos += 10;
      doc.text(`Kunde: ${invoice.clientName || 'Unknown Client'}`, 20, yPos);
      yPos += 10;
      
      const statusText = invoice.status === 'paid' ? 'Bezahlt' : 
                        invoice.status === 'sent' ? 'Gesendet' : 
                        invoice.status === 'pending' ? 'Ausstehend' : 'Nicht gesendet';
      doc.text(`Status: ${statusText}`, 20, yPos);
      yPos += 10;
      
      const createDate = new Date(invoice.createdAt).toLocaleDateString('de-DE');
      doc.text(`Rechnungsdatum: ${createDate}`, 20, yPos);
      yPos += 10;
      
      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate).toLocaleDateString('de-DE');
        doc.text(`Fälligkeitsdatum: ${dueDate}`, 20, yPos);
        yPos += 10;
      }
      
      // Payment method
      const paymentMethod = invoice.paymentMethod && Array.isArray(invoice.paymentMethod) && invoice.paymentMethod.length > 0 ? 
        invoice.paymentMethod.map((method: string) => {
          if (method === 'cash') return 'Bar';
          if (method === 'visa') return 'Visa';
          if (method === 'bank_transfer') return 'Banküberweisung';
          if (method === 'phone_wallet') return 'Handy-Wallet';
          return method;
        }).join(', ') : 'Bar';
      doc.text(`Zahlungsmethode: ${paymentMethod}`, 20, yPos);
      
      // Footer
      doc.setFontSize(8);
      doc.text('Erstellt mit Technician Task Manager', 20, 280);
      
      // Convert PDF to blob
      const pdfBlob = doc.output('blob');
      
      // Create FormData to send PDF
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `Rechnung_${invoice.invoiceNumber}.pdf`);
      formData.append('technicianId', technicianData.telegramId);
      formData.append('invoiceNumber', invoice.invoiceNumber);
      formData.append('message', `Rechnung ${invoice.invoiceNumber} für ${invoice.clientName || 'Unknown Client'}`);
      
      // Send to backend
      const response = await fetch('/api/telegram/send-invoice-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const successTitle = settings?.language === 'ar' 
          ? 'تم إرسال الفاتورة'
          : settings?.language === 'de'
          ? 'Rechnung gesendet'
          : 'Invoice Sent';
          
        const successDesc = settings?.language === 'ar' 
          ? `تم إرسال الفاتورة ${invoice.invoiceNumber} بنجاح إلى ${technicianName}`
          : settings?.language === 'de'
          ? `Rechnung ${invoice.invoiceNumber} wurde erfolgreich an ${technicianName} gesendet`
          : `Invoice ${invoice.invoiceNumber} sent successfully to ${technicianName}`;
        
        const toastId = toast({
          title: successTitle,
          description: successDesc,
        });
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
          if (toastId && toastId.dismiss) {
            toastId.dismiss();
          }
        }, 3000);
      } else {
        // Show user-friendly error message
        const errorMsg = result.message || 'Failed to send invoice';
        
        let userFriendlyError;
        if (errorMsg.includes('not connected') || errorMsg.includes('not configured')) {
          userFriendlyError = settings?.language === 'ar' 
            ? 'البوت غير متصل. يرجى التحقق من إعدادات البوت.'
            : settings?.language === 'de'
            ? 'Bot ist nicht verbunden. Bitte prüfen Sie die Bot-Einstellungen.'
            : 'Bot is not connected. Please check bot settings.';
        } else {
          userFriendlyError = settings?.language === 'ar' 
            ? 'خطأ في إرسال الفاتورة'
            : settings?.language === 'de'
            ? 'Fehler beim Senden der Rechnung'
            : 'Error sending invoice';
        }
        
        throw new Error(userFriendlyError);
      }
      
    } catch (error: any) {
      console.error('Error sending invoice to technician:', error);
      const errorToast = toast({
        title: "Sendefehler",
        description: error.message || "Rechnung konnte nicht gesendet werden",
        variant: "destructive",
      });
      
      // Auto dismiss error after 5 seconds
      setTimeout(() => {
        if (errorToast && errorToast.dismiss) {
          errorToast.dismiss();
        }
      }, 5000);
    }
  };



  // Handler for payment method changes
  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    const currentMethods = newInvoiceData.paymentMethod;
    if (checked) {
      setNewInvoiceData({
        ...newInvoiceData,
        paymentMethod: [...currentMethods, method]
      });
    } else {
      setNewInvoiceData({
        ...newInvoiceData,
        paymentMethod: currentMethods.filter(m => m !== method)
      });
    }
  };

  // Filter invoices based on unpaid status
  const toggleUnpaidFilter = () => {
    setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid');
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `INV-${year}${month}${day}-${time}`;
  };

  const [newInvoiceData, setNewInvoiceData] = useState({
    invoiceNumber: generateInvoiceNumber(),
    taskId: '',
    technicianId: '',
    amount: '',
    taskDate: '',
    paymentDate: '',
    dueDate: '',
    paymentMethod: [] as string[],
  });

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['/api/technicians'],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsNewInvoiceOpen(false);
      setNewInvoiceData({ 
        invoiceNumber: generateInvoiceNumber(),
        taskId: '', 
        technicianId: '', 
        amount: '', 
        taskDate: '', 
        paymentDate: '', 
        dueDate: '',
        paymentMethod: []
      });
      toast({ title: t('common.success'), description: t('invoice.created_successfully') });
      playNotification('general');
    },
    onError: (error: any) => {
      toast({ 
        title: t('common.error'), 
        description: error.message || t('invoice.create_failed'),
        variant: 'destructive' 
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: t('common.success'), description: t('invoice.updated_successfully') });
    },
    onError: (error: any) => {
      toast({ 
        title: t('common.error'), 
        description: error.message || t('invoice.update_failed'),
        variant: 'destructive' 
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'نجح', description: 'تم حذف الفاتورة بنجاح' });
      playNotification('general');
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ', 
        description: error.message || 'فشل في حذف الفاتورة',
        variant: 'destructive' 
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'status-pending',
      sent: 'status-sent',
      paid: 'status-paid',
    };
    return colors[status as keyof typeof colors] || 'status-pending';
  };

  const getTaskInfo = (taskId: string) => {
    const task = (tasks as any[]).find((t: any) => t.taskId === taskId);
    return task ? `${task.taskNumber} - ${task.title}` : 'Unknown Task';
  };

  const getTechnicianName = (technicianId: string) => {
    const technician = (technicians as any[]).find((t: any) => t.id.toString() === technicianId);
    return technician ? `${technician.firstName} ${technician.lastName}` : 'Unknown';
  };

  const filteredInvoices = (invoices as any[]).filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTaskInfo(invoice.taskId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTechnicianName(invoice.technicianId).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'unpaid') return matchesSearch && ['pending', 'not_sent'].includes(invoice.status);
    return matchesSearch && invoice.status === statusFilter;
  });

  const handleCreateInvoice = () => {
    if (!newInvoiceData.taskId || !newInvoiceData.technicianId || !newInvoiceData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Get client name from selected task
    const selectedTask = (tasks as any[]).find(task => task.taskId === newInvoiceData.taskId);
    const clientName = selectedTask ? selectedTask.clientName : 'Unknown Client';

    createInvoiceMutation.mutate({
      invoiceNumber: newInvoiceData.invoiceNumber,
      taskId: newInvoiceData.taskId,
      technicianId: newInvoiceData.technicianId,
      amount: parseFloat(newInvoiceData.amount),
      status: 'pending',
      issueDate: newInvoiceData.taskDate || new Date().toISOString().split('T')[0],
      dueDate: newInvoiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidDate: newInvoiceData.paymentDate || undefined,
      clientName: clientName,
    });
  };

  const handleStatusChange = (invoiceId: number, newStatus: string) => {
    updateInvoiceMutation.mutate({ id: invoiceId, data: { status: newStatus } });
  };

  const completedTasks = (tasks as any[]).filter((task: any) => task.status === 'completed');
  const totalRevenue = (invoices as any[])
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.amount), 0);

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
          <h1 className="text-3xl font-bold">{t('nav.invoices')}</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={statusFilter === 'unpaid' ? 'default' : 'outline'}
            onClick={toggleUnpaidFilter}
            className={statusFilter === 'unpaid' ? '' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'}
          >
            <Clock className="h-4 w-4 mr-2" />
            {statusFilter === 'unpaid' ? 'Show All' : 'Unpaid Only'}
          </Button>
          
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
          
        <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.create_invoice')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Invoice Number (Auto-generated) */}
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={newInvoiceData.invoiceNumber}
                  readOnly
                  className="bg-muted"
                  placeholder="Auto-generated"
                />
              </div>

              {/* Task and Technician Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task">Task *</Label>
                  <Select 
                    value={newInvoiceData.taskId} 
                    onValueChange={(value) => setNewInvoiceData({...newInvoiceData, taskId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a completed task" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedTasks.map((task: any) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.taskNumber} - {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="technician">Technician *</Label>
                  <Select 
                    value={newInvoiceData.technicianId} 
                    onValueChange={(value) => setNewInvoiceData({...newInvoiceData, technicianId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {(technicians as any[]).map((tech: any) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.firstName} {tech.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">Amount (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newInvoiceData.amount}
                  onChange={(e) => setNewInvoiceData({...newInvoiceData, amount: e.target.value})}
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-base font-medium">{t('invoice.payment_method')}</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { key: 'cash', label: t('payment_method.cash') },
                    { key: 'visa', label: t('payment_method.visa') },
                    { key: 'bank_transfer', label: t('payment_method.bank_transfer') },
                    { key: 'phone_wallet', label: t('payment_method.phone_wallet') }
                  ].map((method) => (
                    <div key={method.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${method.key}`}
                        checked={newInvoiceData.paymentMethod.includes(method.key)}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodChange(method.key, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`payment-${method.key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskDate">Task Date</Label>
                  <Input
                    id="taskDate"
                    type="date"
                    value={newInvoiceData.taskDate}
                    onChange={(e) => setNewInvoiceData({...newInvoiceData, taskDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({...newInvoiceData, dueDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newInvoiceData.paymentDate}
                  onChange={(e) => setNewInvoiceData({...newInvoiceData, paymentDate: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button 
                  onClick={handleCreateInvoice}
                  disabled={createInvoiceMutation.isPending}
                  className="flex-1 order-2 sm:order-1"
                >
                  {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="flex-1 order-1 sm:order-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(invoices as any[]).filter((i: any) => i.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(invoices as any[]).filter((i: any) => i.status === 'paid').length}
                </p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
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
                placeholder="Search invoices..."
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
                <Table className="min-w-[1000px]">
                <TableHeader className="bg-muted/20">
                <TableRow className="border-b border-border/20 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm min-w-[150px]">{currentLanguage === 'en' ? 'Invoice Number' : currentLanguage === 'de' ? 'Rechnungsnummer' : 'رقم الفاتورة'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm min-w-[150px]">{currentLanguage === 'en' ? 'Technician' : currentLanguage === 'de' ? 'Techniker' : 'الفني'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[100px]">{currentLanguage === 'en' ? 'Amount' : currentLanguage === 'de' ? 'Betrag' : 'المبلغ'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[120px]">{currentLanguage === 'en' ? 'Payment Method' : currentLanguage === 'de' ? 'Zahlungsmethode' : 'طريقة الدفع'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[100px]">{currentLanguage === 'en' ? 'Status' : currentLanguage === 'de' ? 'Status' : 'الحالة'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[100px]">{currentLanguage === 'en' ? 'Date' : currentLanguage === 'de' ? 'Datum' : 'التاريخ'}</TableHead>
                  <TableHead className="font-bold text-foreground bg-muted/30 py-4 px-6 text-sm text-center min-w-[180px]">{currentLanguage === 'en' ? 'Actions' : currentLanguage === 'de' ? 'Aktionen' : 'الإجراءات'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm">No invoices found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice: any, index: number) => (
                    <TableRow 
                      key={invoice.id}
                      className={`
                        border-b border-border/30 hover:bg-muted/50 transition-colors duration-200
                        ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                      `}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="font-bold text-primary">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {invoice.id}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <div className="text-sm max-w-[150px]">
                          <div className="font-medium text-foreground truncate">
                            {getTechnicianName(invoice.technicianId)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                          €{parseFloat(invoice.amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <div className="text-sm max-w-[120px] mx-auto">
                          <div className="font-medium text-foreground truncate">
                            {Array.isArray(invoice.paymentMethod) 
                              ? invoice.paymentMethod.join(', ') 
                              : invoice.paymentMethod || 'Nicht angegeben'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Badge
                          variant="secondary"
                          className={`
                            font-medium text-xs px-3 py-1 rounded-full border-2
                            ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                              invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 
                              invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                              'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'}
                          `}
                        >
                          {invoice.status === 'paid' ? 'Bezahlt' : 
                           invoice.status === 'sent' ? 'Gesendet' : 
                           invoice.status === 'pending' ? 'Ausstehend' : 
                           'Nicht gesendet'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <div className="text-sm font-medium text-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setViewingInvoice(invoice)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownloadPDF(invoice)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20"
                            title="PDF herunterladen"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSendToTechnician(invoice)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20"
                            title="An Techniker senden"
                          >
                            <Send className="h-4 w-4" />
                          </Button>

                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleInvoiceStatusChange(invoice.id, 'sent')}
                              className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20"
                              title="Mark as Sent"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleInvoiceStatusChange(invoice.id, 'paid')}
                              className="h-8 w-8 p-0 rounded-full hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingInvoice(invoice)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/20"
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
                                deleteInvoiceMutation.mutate(invoice.id);
                              }
                            }}
                            className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              {filteredInvoices.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  {t('common.no_data')}
                </div>
              ) : (
                filteredInvoices.map((invoice: any, index: number) => {
                  const gradients = [
                    'gradient-blue-purple',
                    'gradient-emerald-cyan', 
                    'gradient-rose-amber'
                  ];
                  const gradientClass = gradients[index % gradients.length];
                  
                  return (
                    <Card key={invoice.id} className={`hover:card-shadow-hover transition-all duration-500 card-shadow border-0 rounded-3xl overflow-hidden ${gradientClass} relative`}>
                    <CardHeader className="pb-6 text-center relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <span className="font-mono font-medium text-xs tracking-wider text-white/90 uppercase">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/20 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-3 mb-4">
                        <h3 className="font-bold text-2xl text-white leading-tight">
                          €{parseFloat(invoice.amount).toFixed(2)}
                        </h3>
                        <div className="flex items-center justify-center space-x-2 text-white/80">
                          <span className="text-sm">
                            {getTaskInfo(invoice.taskId)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-white px-6 pb-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                        <div className="text-center space-y-3">
                          <div className="space-y-1">
                            <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                              Technician
                            </p>
                            <p className="text-sm font-medium text-white">
                              {getTechnicianName(invoice.technicianId)}
                            </p>
                          </div>
                          
                          <div className="space-y-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
                              <p className="text-sm text-white font-bold uppercase tracking-wider bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
                                {t('invoice.payment_method')}
                              </p>
                              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {Array.isArray(invoice.paymentMethod) ? 
                                invoice.paymentMethod.map((method: string, idx: number) => {
                                  const methodStyles = {
                                    cash: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-300/50',
                                    visa: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300/50',
                                    bank_transfer: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-300/50',
                                    phone_wallet: 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-300/50'
                                  };
                                  const methodIcons = {
                                    cash: '💵',
                                    visa: '💳',
                                    bank_transfer: '🏦',
                                    phone_wallet: '📱'
                                  };
                                  return (
                                    <Badge 
                                      key={idx} 
                                      className={`text-xs font-bold px-4 py-2 rounded-full transform hover:scale-105 transition-all duration-300 animate-in slide-in-from-bottom-2 ${methodStyles[method as keyof typeof methodStyles] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'}`}
                                    >
                                      <span className="mr-1">{methodIcons[method as keyof typeof methodIcons] || '💰'}</span>
                                      {method === 'cash' ? t('payment_method.cash') :
                                       method === 'visa' ? t('payment_method.visa') :
                                       method === 'bank_transfer' ? t('payment_method.bank_transfer') :
                                       method === 'phone_wallet' ? t('payment_method.phone_wallet') :
                                       method}
                                    </Badge>
                                  );
                                }) : 
                                <Badge className="text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-full shadow-lg">
                                  <span className="mr-1">❓</span>
                                  {typeof invoice.paymentMethod === 'string' ? invoice.paymentMethod : 'N/A'}
                                </Badge>
                              }
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                              Due Date
                            </p>
                            <p className="text-sm text-white">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center pt-3 border-t border-white/20 space-y-2">
                          <p className="text-xs text-white/70 uppercase tracking-wider font-medium">
                            Payment Status
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`text-xs font-bold px-4 py-2 rounded-full shadow-lg cursor-pointer transition-all duration-200 ${
                                invoice.status === 'paid' ? 'bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-300' : 
                                invoice.status === 'sent' ? 'bg-blue-500 text-white border-blue-400 ring-2 ring-blue-300' : 
                                invoice.status === 'pending' ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-300' : 
                                'bg-red-500 text-white border-red-400 ring-2 ring-red-300'
                              }`}
                              onClick={() => {
                                const statuses = ['pending', 'sent', 'paid', 'not_sent'];
                                const currentIndex = statuses.indexOf(invoice.status);
                                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                handleInvoiceStatusChange(invoice.id, nextStatus);
                              }}
                            >
                              {invoice.status === 'paid' ? '✓ Paid' : 
                               invoice.status === 'sent' ? '→ Sent' : 
                               invoice.status === 'pending' ? '⏳ Pending' : 
                               '✗ Not Sent'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-2 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingInvoice(invoice)}
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-medium rounded-full px-4"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(invoice.id, 'sent')}
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-medium rounded-full px-4"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(invoice.id, 'paid')}
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-medium rounded-full px-4"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Paid
                          </Button>
                        )}
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

      {/* View/Edit Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Invoice Number</Label>
                  <p className="text-lg font-semibold">{viewingInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Select
                      value={viewingInvoice.status}
                      onValueChange={(value) => {
                        handleInvoiceStatusChange(viewingInvoice.id, value);
                        setViewingInvoice({...viewingInvoice, status: value});
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="not_sent">Not Sent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Task</Label>
                  <p className="text-sm">{getTaskInfo(viewingInvoice.taskId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Technician</Label>
                  <p className="text-sm">{getTechnicianName(viewingInvoice.technicianId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Amount</Label>
                  <p className="text-lg font-semibold">{viewingInvoice.amount} €</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Due Date</Label>
                  <p className="text-sm">{viewingInvoice.dueDate ? new Date(viewingInvoice.dueDate).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Task Date</Label>
                  <p className="text-sm">{viewingInvoice.taskDate ? new Date(viewingInvoice.taskDate).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Payment Date</Label>
                  <p className="text-sm">{viewingInvoice.paymentDate ? new Date(viewingInvoice.paymentDate).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setEditingInvoice(viewingInvoice);
                  setViewingInvoice(null);
                }}>
                  Edit Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-invoice-number">Invoice Number</Label>
                  <Input
                    id="edit-invoice-number"
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) => setEditingInvoice({...editingInvoice, invoiceNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingInvoice.status}
                    onValueChange={(value) => setEditingInvoice({...editingInvoice, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="not_sent">Not Sent</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount (€)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({...editingInvoice, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-technician">Technician</Label>
                  <Select
                    value={editingInvoice.technicianId?.toString()}
                    onValueChange={(value) => setEditingInvoice({...editingInvoice, technicianId: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(technicians as any[]).map((tech: any) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.firstName} {tech.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editingInvoice.dueDate}
                    onChange={(e) => setEditingInvoice({...editingInvoice, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-payment-date">Payment Date</Label>
                  <Input
                    id="edit-payment-date"
                    type="date"
                    value={editingInvoice.paymentDate || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, paymentDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingInvoice.description || ''}
                  onChange={(e) => setEditingInvoice({...editingInvoice, description: e.target.value})}
                  placeholder="Invoice description"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingInvoice(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateInvoiceMutation.mutate({
                      id: editingInvoice.id,
                      data: {
                        invoiceNumber: editingInvoice.invoiceNumber,
                        status: editingInvoice.status,
                        amount: editingInvoice.amount,
                        technicianId: editingInvoice.technicianId,
                        dueDate: editingInvoice.dueDate,
                        paymentDate: editingInvoice.paymentDate,
                        description: editingInvoice.description
                      }
                    });
                    setEditingInvoice(null);
                  }}
                  disabled={updateInvoiceMutation.isPending}
                >
                  {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
