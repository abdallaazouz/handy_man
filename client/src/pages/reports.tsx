import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ClipboardList, 
  Euro,
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  FileText
} from 'lucide-react';
import { ExportUtils, TaskReportData, TechnicianReportData, InvoiceReportData } from '@/lib/export-utils';

export default function Reports() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [reportType, setReportType] = useState<'tasks' | 'technicians' | 'invoices'>('tasks');

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: technicians = [], isLoading: techniciansLoading } = useQuery({
    queryKey: ['/api/technicians'],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const isLoading = tasksLoading || techniciansLoading || invoicesLoading;

  // Helper functions for data processing
  const getTaskReportData = (): TaskReportData[] => {
    return tasks
      .filter((task: any) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (technicianFilter !== 'all' && task.technicianIds?.[0] !== parseInt(technicianFilter)) return false;
        if (dateFilter && !task.scheduledDate?.includes(dateFilter)) return false;
        return true;
      })
      .map((task: any) => {
        const assignedTech = technicians.find((tech: any) => 
          task.technicianIds?.includes(tech.id)
        );
        return {
          id: task.id,
          taskNumber: task.taskNumber || task.taskId,
          title: task.title,
          status: task.status,
          technicianName: assignedTech ? `${assignedTech.firstName} ${assignedTech.lastName || ''}`.trim() : 'Unassigned',
          clientName: task.clientName,
          scheduledDate: task.scheduledDate || '',
          location: task.location || '',
          paymentStatus: task.paymentStatus || 'pending'
        };
      });
  };

  const getTechnicianReportData = (): TechnicianReportData[] => {
    return technicians.map((tech: any) => {
      const techTasks = tasks.filter((task: any) => 
        task.technicianIds?.includes(tech.id)
      );
      const completedTasks = techTasks.filter((task: any) => task.status === 'completed');
      const techInvoices = invoices.filter((inv: any) => 
        inv.technicianId === tech.id.toString()
      );
      const totalRevenue = techInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0);
      
      return {
        id: tech.id,
        name: `${tech.firstName} ${tech.lastName || ''}`.trim(),
        phone: tech.phone || 'N/A',
        completedTasks: completedTasks.length,
        performanceRating: Math.min(5, Math.max(1, Math.round((completedTasks.length / Math.max(techTasks.length, 1)) * 5))),
        totalRevenue
      };
    });
  };

  const getInvoiceReportData = (): InvoiceReportData[] => {
    return invoices
      .filter((invoice: any) => {
        if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
        if (technicianFilter !== 'all' && invoice.technicianId !== technicianFilter) return false;
        if (dateFilter && !invoice.issueDate?.includes(dateFilter)) return false;
        return true;
      })
      .map((invoice: any) => {
        const tech = technicians.find((t: any) => t.id.toString() === invoice.technicianId);
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          technicianName: tech ? `${tech.firstName} ${tech.lastName || ''}`.trim() : 'Unknown',
          amount: parseFloat(invoice.amount),
          status: invoice.status,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          paidDate: invoice.paidDate
        };
      });
  };

  // Export functions
  const handleExportPDF = (type: 'tasks' | 'technicians' | 'invoices') => {
    try {
      let doc;
      let fileName;
      
      console.log('Starting PDF export for type:', type);
      
      switch (type) {
        case 'tasks':
          const taskData = getTaskReportData();
          console.log('Task data:', taskData);
          doc = ExportUtils.generateTaskReportPDF(taskData, t.language || 'de');
          fileName = (t.language || 'de') === 'de' ? 'Aufgabenbericht' : 'Task_Report';
          break;
        case 'technicians':
          const techData = getTechnicianReportData();
          console.log('Technician data:', techData);
          doc = ExportUtils.generateTechnicianReportPDF(techData, t.language || 'de');
          fileName = (t.language || 'de') === 'de' ? 'Technikerbericht' : 'Technician_Report';
          break;
        case 'invoices':
          const invoiceData = getInvoiceReportData();
          console.log('Invoice data:', invoiceData);
          doc = ExportUtils.generateInvoiceReportPDF(invoiceData, t.language || 'de');
          fileName = (t.language || 'de') === 'de' ? 'Rechnungsbericht' : 'Invoice_Report';
          break;
      }
      
      console.log('PDF document created, downloading...');
      ExportUtils.downloadPDF(doc, `${fileName}_${new Date().toISOString().split('T')[0]}`);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = (type: 'tasks' | 'technicians' | 'invoices') => {
    try {
      let data;
      let fileName;
      let sheetName;
      
      switch (type) {
        case 'tasks':
          data = getTaskReportData();
          fileName = language === 'de' ? 'Aufgabenbericht' : 'Task_Report';
          sheetName = language === 'de' ? 'Aufgaben' : 'Tasks';
          break;
        case 'technicians':
          data = getTechnicianReportData();
          fileName = language === 'de' ? 'Technikerbericht' : 'Technician_Report';
          sheetName = language === 'de' ? 'Techniker' : 'Technicians';
          break;
        case 'invoices':
          data = getInvoiceReportData();
          fileName = language === 'de' ? 'Rechnungsbericht' : 'Invoice_Report';
          sheetName = language === 'de' ? 'Rechnungen' : 'Invoices';
          break;
      }
      
      ExportUtils.exportToExcel(data, `${fileName}_${new Date().toISOString().split('T')[0]}`, sheetName);
      toast({
        title: "Success",
        description: "Excel report generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Excel report",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const tasksByStatus = {
    pending: tasks.filter((t: any) => t.status === 'pending').length,
    sent: tasks.filter((t: any) => t.status === 'sent').length,
    accepted: tasks.filter((t: any) => t.status === 'accepted').length,
    rejected: tasks.filter((t: any) => t.status === 'rejected').length,
    in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
  };

  const technicianStats = technicians.map((tech: any) => {
    const techTasks = tasks.filter((t: any) => t.technicianId === tech.id);
    const completedTasks = techTasks.filter((t: any) => t.status === 'completed').length;
    const techInvoices = invoices.filter((i: any) => i.technicianId === tech.id);
    const revenue = techInvoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

    return {
      id: tech.id,
      name: `${tech.firstName} ${tech.lastName}`,
      totalTasks: techTasks.length,
      completedTasks,
      revenue,
      isActive: tech.isActive,
    };
  });

  // Chart data
  const statusChartData = [
    { name: 'Pending', value: tasksByStatus.pending, color: '#f59e0b' },
    { name: 'Sent', value: tasksByStatus.sent, color: '#3b82f6' },
    { name: 'Accepted', value: tasksByStatus.accepted, color: '#10b981' },
    { name: 'Rejected', value: tasksByStatus.rejected, color: '#ef4444' },
    { name: 'In Progress', value: tasksByStatus.in_progress, color: '#8b5cf6' },
    { name: 'Completed', value: tasksByStatus.completed, color: '#059669' },
  ].filter(item => item.value > 0);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthTasks = tasks.filter((task: any) => {
      const taskDate = new Date(task.createdAt);
      return taskDate.getMonth() === date.getMonth() && 
             taskDate.getFullYear() === date.getFullYear();
    }).length;

    const monthRevenue = invoices
      .filter((invoice: any) => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate.getMonth() === date.getMonth() && 
               invoiceDate.getFullYear() === date.getFullYear() &&
               invoice.status === 'paid';
      })
      .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.amount), 0);

    return {
      month: date.toLocaleDateString('en', { month: 'short' }),
      tasks: monthTasks,
      revenue: monthRevenue,
    };
  }).reverse();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const totalRevenue = invoices
    .filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

  const avgTasksPerTechnician = technicians.length > 0 
    ? Math.round(tasks.length / technicians.length * 100) / 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => handleExportPDF(reportType)}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('actions.export_pdf')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExportExcel(reportType)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t('actions.export_excel')}
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('reports.comprehensive_data')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'tasks' | 'technicians' | 'invoices') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">{t('reports.task_report')}</SelectItem>
                  <SelectItem value="technicians">{t('reports.technician_report')}</SelectItem>
                  <SelectItem value="invoices">{t('reports.invoice_report')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="statusFilter">{t('reports.filter_by_status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">{t('status.pending')}</SelectItem>
                  <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('status.completed')}</SelectItem>
                  <SelectItem value="paid">{t('status.paid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="technicianFilter">{t('reports.filter_by_technician')}</Label>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map((tech: any) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.firstName} {tech.lastName || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFilter">{t('reports.filter_by_date')}</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Report Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {reportType === 'tasks' && t('reports.task_report')}
            {reportType === 'technicians' && t('reports.technician_report')}
            {reportType === 'invoices' && t('reports.invoice_report')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === 'tasks' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.task_number')}</TableHead>
                  <TableHead>{t('table.title')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.technician')}</TableHead>
                  <TableHead>{t('table.client')}</TableHead>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('table.location')}</TableHead>
                  <TableHead>{t('table.payment')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTaskReportData().map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.taskNumber}</TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.technicianName}</TableCell>
                    <TableCell>{task.clientName}</TableCell>
                    <TableCell>{task.scheduledDate}</TableCell>
                    <TableCell>{task.location}</TableCell>
                    <TableCell>
                      <Badge variant={task.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {task.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportType === 'technicians' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.phone')}</TableHead>
                  <TableHead>{t('reports.completed_tasks')}</TableHead>
                  <TableHead>{t('reports.performance_rating')}</TableHead>
                  <TableHead>{t('reports.total_revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTechnicianReportData().map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell>{tech.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tech.completedTasks}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {'★'.repeat(tech.performanceRating)}
                        {'☆'.repeat(5 - tech.performanceRating)}
                        <span className="ml-1 text-sm text-muted-foreground">
                          {tech.performanceRating}/5
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">€{tech.totalRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportType === 'invoices' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.invoice_number')}</TableHead>
                  <TableHead>{t('table.client')}</TableHead>
                  <TableHead>{t('table.technician')}</TableHead>
                  <TableHead>{t('table.amount')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.issue_date')}</TableHead>
                  <TableHead>{t('table.due_date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getInvoiceReportData().map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.technicianName}</TableCell>
                    <TableCell className="font-medium">€{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{technicians.length}</p>
                <p className="text-sm text-muted-foreground">Technicians</p>
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
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{avgTasksPerTechnician}</p>
                <p className="text-sm text-muted-foreground">Avg Tasks/Tech</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Tasks Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Tasks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Technician Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Total Tasks</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No technician data available
                    </TableCell>
                  </TableRow>
                ) : (
                  technicianStats
                    .sort((a, b) => b.completedTasks - a.completedTasks)
                    .map((tech) => {
                      const successRate = tech.totalTasks > 0 
                        ? Math.round((tech.completedTasks / tech.totalTasks) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={tech.id}>
                          <TableCell className="font-medium">{tech.name}</TableCell>
                          <TableCell>{tech.totalTasks}</TableCell>
                          <TableCell>{tech.completedTasks}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full"
                                  style={{ width: `${successRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{successRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell>€{tech.revenue.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={tech.isActive ? "default" : "secondary"}>
                              {tech.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
