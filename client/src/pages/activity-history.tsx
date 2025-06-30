import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  Settings, 
  FileText,
  Users,
  ClipboardList,
  Activity,
  Calendar,
  Clock,
  Eye
} from 'lucide-react';

interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view';
  ip: string;
}

export default function ActivityHistory() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  // Mock activity data - في التطبيق الحقيقي، هذا سيأتي من API
  const mockActivities: ActivityLog[] = [
    {
      id: 1,
      timestamp: '2025-06-18T16:30:00Z',
      user: 'Admin User',
      action: 'Created Task',
      resource: 'Task #TK-000001',
      details: 'Emergency repair - Client: Ahmed Ali',
      type: 'create',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      timestamp: '2025-06-18T16:25:00Z',
      user: 'Admin User',
      action: 'Added Technician',
      resource: 'Technician: Mohammad Hassan',
      details: 'Telegram ID: @mhass_tech',
      type: 'create',
      ip: '192.168.1.100'
    },
    {
      id: 3,
      timestamp: '2025-06-18T16:20:00Z',
      user: 'Admin User',
      action: 'Updated Settings',
      resource: 'Bot Configuration',
      details: 'Changed bot token and enabled notifications',
      type: 'update',
      ip: '192.168.1.100'
    },
    {
      id: 4,
      timestamp: '2025-06-18T16:15:00Z',
      user: 'Admin User',
      action: 'Generated Invoice',
      resource: 'Invoice #INV-000001',
      details: 'Amount: €150.00 for Task #TK-000001',
      type: 'create',
      ip: '192.168.1.100'
    },
    {
      id: 5,
      timestamp: '2025-06-18T16:10:00Z',
      user: 'Admin User',
      action: 'Viewed Report',
      resource: 'Monthly Performance Report',
      details: 'Generated performance analytics',
      type: 'view',
      ip: '192.168.1.100'
    },
    {
      id: 6,
      timestamp: '2025-06-18T16:00:00Z',
      user: 'Admin User',
      action: 'Login',
      resource: 'Dashboard Access',
      details: 'Successful authentication',
      type: 'login',
      ip: '192.168.1.100'
    }
  ];

  const getActionIcon = (type: string) => {
    const icons = {
      create: ClipboardList,
      update: Settings,
      delete: FileText,
      login: User,
      logout: User,
      view: Eye,
    };
    const Icon = icons[type as keyof typeof icons] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (type: string) => {
    const colors = {
      create: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
      update: 'bg-blue-500/20 text-blue-700 border-blue-200',
      delete: 'bg-red-500/20 text-red-700 border-red-200',
      login: 'bg-purple-500/20 text-purple-700 border-purple-200',
      logout: 'bg-gray-500/20 text-gray-700 border-gray-200',
      view: 'bg-amber-500/20 text-amber-700 border-amber-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-700 border-gray-200';
  };

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = actionFilter === 'all' || activity.type === actionFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Activity History</h1>
        <p className="text-muted-foreground">Track all system activities and user actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockActivities.length}</p>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {mockActivities.filter(a => a.type === 'create').length}
                </p>
                <p className="text-sm text-muted-foreground">Created Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">Today</p>
                <p className="text-sm text-muted-foreground">Last Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Recent Activities ({filteredActivities.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{activity.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getActionColor(activity.type)} flex items-center space-x-1`}
                        >
                          {getActionIcon(activity.type)}
                          <span>{activity.action}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{activity.resource}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{activity.details}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{activity.ip}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}