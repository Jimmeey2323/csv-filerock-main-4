import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  LayoutDashboard, 
  ListFilter, 
  Table as TableIcon, 
  PieChart as PieChartIcon, 
  UserRound, 
  DollarSign, 
  Percent, 
  Calendar, 
  ArrowUpDown, 
  Users,
  TrendingUp,
  TrendingDown,
  Check,
  Clock,
  Info,
  CalendarCheck,
  X,
  Award,
  FileText,
  Filter,
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  RefreshCcw,
  UserX,
  Sparkles,
  Crown,
  Star
} from 'lucide-react';
import RevenueChart from '@/components/charts/RevenueChart';
import ConversionRatesChart from '@/components/charts/ConversionRatesChart';
import ClientSourceChart from '@/components/charts/ClientSourceChart';
import { safeToFixed, safeFormatCurrency, safeFormatDate, daysBetweenDates } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Extend the ProcessedTeacherData interface to include excludedClientDetails
declare module '@/utils/dataProcessor' {
  interface ProcessedTeacherData {
    excludedClientDetails?: any[];
  }
}

interface DrillDownAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProcessedTeacherData | null;
  type: 'teacher' | 'studio' | 'location' | 'period' | 'totals';
  metricType?: 'conversion' | 'retention' | 'all';
}

const DrillDownAnalytics: React.FC<DrillDownAnalyticsProps> = ({
  isOpen,
  onClose,
  data,
  type,
  metricType = 'all'
}) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Use the useEffect hook to update the active tab based on metricType
  React.useEffect(() => {
    if (metricType === 'conversion') {
      setActiveTab('conversion-summary');
    } else if (metricType === 'retention') {
      setActiveTab('retention-summary');
    } else {
      setActiveTab('overview');
    }
  }, [metricType]);
  
  if (!data) return null;

  // Format label based on type
  const getEntityLabel = () => {
    switch (type) {
      case 'teacher':
        return `Teacher: ${data.teacherName}`;
      case 'studio':
        return `Studio: All Studios`;
      case 'location':
        return `Location: ${data.location}`;
      case 'period':
        return `Period: ${data.period}`;
      case 'totals':
        return `Aggregate Data: All Teachers & Studios`;
      default:
        return data.teacherName;
    }
  };
  
  // Handle sorting columns
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Sort data based on column and direction
  const sortData = (data: any[]) => {
    if (!sortColumn || !data || data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      
      // Handle dates
      if (typeof valueA === 'string' && typeof valueB === 'string' && 
          (sortColumn.toLowerCase().includes('date') || valueA.includes('-') || valueB.includes('-'))) {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return sortDirection === 'asc' ? 
            dateA.getTime() - dateB.getTime() : 
            dateB.getTime() - dateA.getTime();
        }
      }
      
      // Handle numbers
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Handle strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' ? 
          valueA.localeCompare(valueB) : 
          valueB.localeCompare(valueA);
      }
      
      return 0;
    });
  };
  
  // Calculate conversion span
  const getConversionSpan = (client: any) => {
    const firstVisit = client.firstVisit || client.date;
    const firstPurchase = client.firstPurchaseDate || client.purchaseDate;
    
    if (firstVisit && firstPurchase) {
      const days = daysBetweenDates(firstVisit, firstPurchase);
      return days;
    }
    return null;
  };

  // Get conversion status icon and badge
  const getConversionStatusBadge = (client: any) => {
    if (client.conversionStatus === 'converted') {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <CheckCircle className="h-3.5 w-3.5" />
          Converted
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <XCircle className="h-3.5 w-3.5" />
          Not Converted
        </Badge>
      );
    }
  };
  
  const renderClientTable = (clients: any[], title: string) => {
    // Sort the data if a sort column is selected
    const sortedClients = sortData(clients);
    
    return (
      <Card className="w-full bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm border-b border-white/20">
          <CardTitle className="text-lg flex items-center gap-2">
            {title.includes('Converted') ? <Award className="h-5 w-5 text-emerald-500" /> : 
             title.includes('Retained') ? <Check className="h-5 w-5 text-blue-500" /> :
             title.includes('Excluded') ? <X className="h-5 w-5 text-red-500" /> :
             title.includes('New') ? <UserPlus className="h-5 w-5 text-blue-500" /> :
             <UserRound className="h-5 w-5 text-primary" />}
            <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
              {title}
            </span>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            {sortedClients.length} {title.toLowerCase()} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px] rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 border-b border-white/20">
                  <TableHead sortable sortDirection={sortColumn === 'name' ? sortDirection : undefined} onSort={() => handleSort('name')} className="text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Name
                    </div>
                  </TableHead>
                  <TableHead sortable sortDirection={sortColumn === 'email' ? sortDirection : undefined} onSort={() => handleSort('email')} className="text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead sortable sortDirection={sortColumn === 'firstVisit' ? sortDirection : undefined} onSort={() => handleSort('firstVisit')} className="text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      First Visit
                    </div>
                  </TableHead>
                  {(title.includes('New')) && <>
                    <TableHead className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Reason/Details
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'firstPurchaseDate' ? sortDirection : undefined} onSort={() => handleSort('firstPurchaseDate')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        First Purchase Date
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'firstPurchaseItem' ? sortDirection : undefined} onSort={() => handleSort('firstPurchaseItem')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        First Purchase Item
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'purchaseValue' ? sortDirection : undefined} onSort={() => handleSort('purchaseValue')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Purchase Value
                      </div>
                    </TableHead>
                  </>}
                  {(title.includes('Converted') && !title.includes('New')) && <>
                    <TableHead sortable sortDirection={sortColumn === 'firstPurchaseDate' ? sortDirection : undefined} onSort={() => handleSort('firstPurchaseDate')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        First Purchase Date
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'firstPurchaseItem' ? sortDirection : undefined} onSort={() => handleSort('firstPurchaseItem')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        First Purchase Item
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'purchaseValue' ? sortDirection : undefined} onSort={() => handleSort('purchaseValue')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Purchase Value
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'conversionSpan' ? sortDirection : undefined} onSort={() => handleSort('conversionSpan')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Conversion Span
                      </div>
                    </TableHead>
                  </>}
                  {title.includes('Retained') && <>
                    <TableHead sortable sortDirection={sortColumn === 'visitsPostTrial' ? sortDirection : undefined} onSort={() => handleSort('visitsPostTrial')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Visits Post Trial
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'firstVisitPostTrial' ? sortDirection : undefined} onSort={() => handleSort('firstVisitPostTrial')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        First Visit Post Trial
                      </div>
                    </TableHead>
                    <TableHead sortable sortDirection={sortColumn === 'membershipUsed' ? sortDirection : undefined} onSort={() => handleSort('membershipUsed')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Membership Used
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Retention Details
                      </div>
                    </TableHead>
                  </>}
                  {title.includes('Excluded') && (
                    <TableHead sortable sortDirection={sortColumn === 'reason' ? sortDirection : undefined} onSort={() => handleSort('reason')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Exclusion Reason
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client, idx) => {
                  const conversionSpan = getConversionSpan(client);
                  
                  return (
                    <TableRow key={`${client.email}-${idx}`} className="animate-fade-in hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-100/50" style={{ animationDelay: `${idx * 30}ms` }}>
                      <TableCell className="font-medium text-slate-800">{client.name || client.customerName || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{client.email || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{safeFormatDate(client.firstVisit || client.date)}</TableCell>
                      {(title.includes('New')) && <>
                        <TableCell>
                          {getConversionStatusBadge(client)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-start gap-2">
                            {client.conversionStatus === 'converted' ? 
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> : 
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            }
                            <div className="text-sm text-slate-600 break-words">
                              <div className="font-medium">{client.conversionReason || 'No reason available'}</div>
                              {client.firstPurchaseDate && client.firstVisit && (
                                <div className="text-xs text-slate-500 mt-1">
                                  First visit: {safeFormatDate(client.firstVisit)} → 
                                  Purchase: {safeFormatDate(client.firstPurchaseDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          {client.firstPurchaseDate ? safeFormatDate(client.firstPurchaseDate) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {client.firstPurchaseItem || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold text-green-700">
                          {client.purchaseValue ? safeFormatCurrency(client.purchaseValue) : 'N/A'}
                        </TableCell>
                      </>}
                      {(title.includes('Converted') && !title.includes('New')) && <>
                        <TableCell className="font-medium text-emerald-600">
                          {safeFormatDate(client.firstPurchaseDate || client.purchaseDate || client.date)}
                        </TableCell>
                        <TableCell className="text-slate-600">{client.firstPurchaseItem || client.purchaseItem || client.membershipType || 'N/A'}</TableCell>
                        <TableCell className="font-semibold text-green-700">{client.purchaseValue || client.value ? safeFormatCurrency(client.purchaseValue || client.value) : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600 font-medium">
                              {conversionSpan !== null ? `${conversionSpan} days` : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                      </>}
                      {title.includes('Retained') && <>
                        <TableCell className="text-slate-600">{client.visitsPostTrial || client.visitCount || client.totalVisitsPostTrial || '0'}</TableCell>
                        <TableCell className="text-slate-600">{safeFormatDate(client.firstVisitPostTrial || 'N/A')}</TableCell>
                        <TableCell className="text-slate-600">{client.membershipUsed || client.membershipType || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-slate-600 break-words">
                            <div className="font-medium">{client.reason || 'Client returned after initial visit'}</div>
                            {client.firstVisit && client.firstVisitPostTrial && (
                              <div className="text-xs text-slate-500 mt-1">
                                First visit: {safeFormatDate(client.firstVisit)} → 
                                Return visit: {safeFormatDate(client.firstVisitPostTrial)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </>}
                      {title.includes('Excluded') && (
                        <TableCell className="text-red-600 font-medium">{client.reason || 'No reason specified'}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Create properly formatted data for ClientSourceChart
  const clientSourceData = [{
    source: 'Trials',
    count: data.trials || 0
  }, {
    source: 'Referrals',
    count: data.referrals || 0
  }, {
    source: 'Hosted',
    count: data.hosted || 0
  }, {
    source: 'Influencer',
    count: data.influencerSignups || 0
  }, {
    source: 'Others',
    count: data.others || 0
  }];

  // Convert revenue data format for RevenueChart
  const revenueChartData = data.revenueByWeek || [];

  // Create properly formatted ConversionRateData
  const conversionRateData = {
    name: 'Current Period',
    conversion: data.conversionRate,
    retention: data.retentionRate,
    trial: data.trials || 0,
    referral: data.referrals || 0,
    influencer: data.influencerSignups || 0
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-6xl h-[85vh]'} p-0 overflow-hidden animate-scale-in bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl`}>
        <DialogHeader className="sticky top-0 z-20 bg-gradient-to-r from-slate-50/95 to-white/95 backdrop-blur-xl pt-6 px-6 shadow-sm border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                {type === 'teacher' ? <UserRound className="h-5 w-5 text-primary" /> :
                 type === 'location' ? <LayoutDashboard className="h-5 w-5 text-primary" /> :
                 <BarChartIcon className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-2xl bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
                  {getEntityLabel()} Analytics
                </DialogTitle>
                <DialogDescription className="text-slate-600 font-medium">
                  Detailed performance metrics and client data analysis
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-white/80 hover:bg-white border-white/40 hover:border-white/60 transition-all duration-200"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Separator className="mt-4 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
        </DialogHeader>
        
        <div className="px-6 overflow-auto flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4 h-full">
            <TabsList className="grid grid-cols-5 gap-2 mb-6 bg-slate-100/80 backdrop-blur-sm p-2 rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-2 animate-fade-in data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200" style={{ animationDelay: '100ms' }}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="new-clients" className="flex items-center gap-2 animate-fade-in data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200" style={{ animationDelay: '200ms' }}>
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">New Clients</span>
              </TabsTrigger>
              <TabsTrigger value="retention-summary" className="flex items-center gap-2 animate-fade-in data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200" style={{ animationDelay: '300ms' }}>
                <RefreshCcw className="h-4 w-4" />
                <span className="font-medium">Retention Summary</span>
              </TabsTrigger>
              <TabsTrigger value="conversion-summary" className="flex items-center gap-2 animate-fade-in data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200" style={{ animationDelay: '400ms' }}>
                <Target className="h-4 w-4" />
                <span className="font-medium">Conversion Summary</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 animate-fade-in data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200" style={{ animationDelay: '500ms' }}>
                <BarChartIcon className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 h-full overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-white/40 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl animate-fade-in rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Performance Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col p-4 bg-gradient-to-br from-blue-50/80 to-blue-100/60 rounded-xl border border-blue-200/50 animate-fade-in shadow-sm" style={{ animationDelay: '150ms' }}>
                        <span className="text-sm text-blue-700 flex items-center gap-1 font-medium">
                          <UserRound className="h-4 w-4" />
                          New Clients
                        </span>
                        <span className="text-2xl font-bold text-blue-800">{data.newClients}</span>
                      </div>
                      <div className="flex flex-col p-4 bg-gradient-to-br from-green-50/80 to-green-100/60 rounded-xl border border-green-200/50 animate-fade-in shadow-sm" style={{ animationDelay: '200ms' }}>
                        <span className="text-sm text-green-700 flex items-center gap-1 font-medium">
                          <Check className="h-4 w-4" />
                          Retained Clients
                        </span>
                        <span className="text-2xl font-bold flex items-center text-green-800">
                          {data.retainedClients} 
                          <Badge className="ml-2 flex items-center gap-1" variant={data.retentionRate > 50 ? "retention" : "excluded"}>
                            {data.retentionRate > 50 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {safeToFixed(data.retentionRate, 1)}%
                          </Badge>
                        </span>
                      </div>
                      <div className="flex flex-col p-4 bg-gradient-to-br from-purple-50/80 to-purple-100/60 rounded-xl border border-purple-200/50 animate-fade-in shadow-sm" style={{ animationDelay: '250ms' }}>
                        <span className="text-sm text-purple-700 flex items-center gap-1 font-medium">
                          <Award className="h-4 w-4" />
                          Converted Clients
                        </span>
                        <span className="text-2xl font-bold flex items-center text-purple-800">
                          {data.convertedClients}
                          <Badge className="ml-2 flex items-center gap-1" variant={data.conversionRate > 10 ? "conversion" : "excluded"}>
                            {data.conversionRate > 10 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {safeToFixed(data.conversionRate, 1)}%
                          </Badge>
                        </span>
                      </div>
                      <div className="flex flex-col p-4 bg-gradient-to-br from-amber-50/80 to-amber-100/60 rounded-xl border border-amber-200/50 animate-fade-in shadow-sm" style={{ animationDelay: '300ms' }}>
                        <span className="text-sm text-amber-700 flex items-center gap-1 font-medium">
                          <DollarSign className="h-4 w-4" />
                          Total Revenue
                        </span>
                        <span className="text-2xl font-bold text-amber-800">{safeFormatCurrency(data.totalRevenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden" style={{ animationDelay: '350ms' }}>
                  <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-primary" />
                      <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Client Sources</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center p-4">
                    <ClientSourceChart data={clientSourceData} />
                  </CardContent>
                </Card>
              </div>
              
              <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden" style={{ animationDelay: '400ms' }}>
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Revenue by Week</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <RevenueChart data={revenueChartData} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="new-clients" className="space-y-6 h-full overflow-auto">
              <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">New Client Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Detailed breakdown of new client acquisition and reasons for inclusion/exclusion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex space-x-4">
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '150ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <UserPlus className="h-5 w-5 text-slate-500" />
                        New Clients
                      </h3>
                      <p className="text-4xl font-bold text-primary mt-3 flex items-center justify-center">
                        {data.newClients > 10 ? <TrendingUp className="h-6 w-6 mr-2 text-green-500" /> : <TrendingDown className="h-6 w-6 mr-2 text-red-500" />}
                        {data.newClients}
                      </p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        Total new acquisitions
                      </p>
                    </div>
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <UserX className="h-5 w-5 text-slate-500" />
                        Excluded Clients
                      </h3>
                      <p className="text-4xl font-bold mt-3 text-slate-800">{data.excludedClientDetails?.length || 0}</p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        Friends, family, staff exclusions
                      </p>
                    </div>
                  </div>
                  
                  {data.newClientDetails && data.newClientDetails.length > 0 && 
                    renderClientTable(data.newClientDetails, "New Clients with Conversion Status")}
                  
                  {data.excludedClientDetails && data.excludedClientDetails.length > 0 && 
                    renderClientTable(data.excludedClientDetails, "Excluded Clients")}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="retention-summary" className="space-y-6 h-full overflow-auto">
              <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Retention Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Detailed breakdown of client retention patterns with visit history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex space-x-4">
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '150ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <RefreshCcw className="h-5 w-5 text-slate-500" />
                        Retention Rate
                      </h3>
                      <p className="text-4xl font-bold text-primary mt-3 flex items-center justify-center">
                        {data.retentionRate > 50 ? <TrendingUp className="h-6 w-6 mr-2 text-green-500" /> : <TrendingDown className="h-6 w-6 mr-2 text-red-500" />}
                        {safeToFixed(data.retentionRate, 1)}%
                      </p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        {data.retentionRate > 50 ? 'Above average' : 'Below average'}
                      </p>
                    </div>
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <UserCheck className="h-5 w-5 text-slate-500" />
                        Retained Clients
                      </h3>
                      <p className="text-4xl font-bold mt-3 text-slate-800">{data.retainedClients}</p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        out of {data.newClients} new clients
                      </p>
                    </div>
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '250ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <X className="h-5 w-5 text-slate-500" />
                        No Show Rate
                      </h3>
                      <p className="text-4xl font-bold mt-3 flex items-center justify-center text-slate-800">
                        {data.noShowRate < 10 ? <TrendingDown className="h-6 w-6 mr-2 text-green-500" /> : <TrendingUp className="h-6 w-6 mr-2 text-red-500" />}
                        {safeToFixed(data.noShowRate, 1)}%
                      </p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        {data.noShowRate < 10 ? 'Good' : 'Needs improvement'}
                      </p>
                    </div>
                  </div>
                  
                  {data.retainedClientDetails && data.retainedClientDetails.length > 0 && 
                    renderClientTable(data.retainedClientDetails, "Retained Clients")}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conversion-summary" className="space-y-6 h-full overflow-auto">
              <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Conversion Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Detailed breakdown of client conversion journey with purchase details and timeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex space-x-4">
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '150ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <Percent className="h-5 w-5 text-slate-500" />
                        Conversion Rate
                      </h3>
                      <p className="text-4xl font-bold text-primary mt-3 flex items-center justify-center">
                        {data.conversionRate > 10 ? <TrendingUp className="h-6 w-6 mr-2 text-green-500" /> : <TrendingDown className="h-6 w-6 mr-2 text-red-500" />}
                        {safeToFixed(data.conversionRate, 1)}%
                      </p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        {data.conversionRate > 10 ? 'Above average' : 'Below average'}
                      </p>
                    </div>
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <Award className="h-5 w-5 text-slate-500" />
                        Converted Clients
                      </h3>
                      <p className="text-4xl font-bold mt-3 text-slate-800">{data.convertedClients}</p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        out of {data.newClients} new clients
                      </p>
                    </div>
                    <div className="flex-1 p-6 border border-white/40 rounded-xl text-center bg-gradient-to-br from-white/80 to-white/60 shadow-lg animate-fade-in" style={{ animationDelay: '250ms' }}>
                      <h3 className="text-lg font-medium flex items-center justify-center gap-2 text-slate-700">
                        <DollarSign className="h-5 w-5 text-slate-500" />
                        Avg. Revenue
                      </h3>
                      <p className="text-4xl font-bold mt-3 text-slate-800">{safeFormatCurrency(data.averageRevenuePerClient)}</p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        per converted client
                      </p>
                    </div>
                  </div>
                  
                  {data.convertedClientDetails && data.convertedClientDetails.length > 0 && 
                    renderClientTable(data.convertedClientDetails, "Converted Clients")}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6 h-full overflow-auto">
              <Card className="shadow-lg border-white/40 animate-fade-in bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Performance Analytics</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Charts and visual analytics for comprehensive performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="shadow-lg border-white/30 bg-white/80 animate-fade-in rounded-xl overflow-hidden" style={{ animationDelay: '150ms' }}>
                      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-primary" />
                          <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Client Acquisition</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ConversionRatesChart data={[conversionRateData]} />
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-white/30 bg-white/80 animate-fade-in rounded-xl overflow-hidden" style={{ animationDelay: '200ms' }}>
                      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">Attendance Patterns</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col p-4 border border-white/40 rounded-xl bg-gradient-to-br from-white/80 to-white/60 shadow-sm">
                            <span className="text-sm text-slate-600 flex items-center gap-1 font-medium">
                              <X className="h-3 w-3" />
                              No Show Rate
                            </span>
                            <span className="text-xl font-bold flex items-center text-slate-800">
                              {safeToFixed(data.noShowRate, 1)}%
                              {data.noShowRate < 10 ? 
                                <TrendingDown className="h-4 w-4 ml-2 text-green-500" /> : 
                                <TrendingUp className="h-4 w-4 ml-2 text-red-500" />
                              }
                            </span>
                          </div>
                          <div className="flex flex-col p-4 border border-white/40 rounded-xl bg-gradient-to-br from-white/80 to-white/60 shadow-sm">
                            <span className="text-sm text-slate-600 flex items-center gap-1 font-medium">
                              <Filter className="h-3 w-3" />
                              Late Cancellation
                            </span>
                            <span className="text-xl font-bold flex items-center text-slate-800">
                              {safeToFixed(data.lateCancellationRate, 1)}%
                              {data.lateCancellationRate < 5 ? 
                                <TrendingDown className="h-4 w-4 ml-2 text-green-500" /> : 
                                <TrendingUp className="h-4 w-4 ml-2 text-red-500" />
                              }
                            </span>
                          </div>
                          <div className="flex flex-col p-4 border border-white/40 rounded-xl bg-gradient-to-br from-white/80 to-white/60 shadow-sm">
                            <span className="text-sm text-slate-600 flex items-center gap-1 font-medium">
                              <Check className="h-3 w-3" />
                              Retention Rate
                            </span>
                            <span className="text-xl font-bold flex items-center text-slate-800">
                              {safeToFixed(data.retentionRate, 1)}%
                              {data.retentionRate > 50 ? 
                                <TrendingUp className="h-4 w-4 ml-2 text-green-500" /> : 
                                <TrendingDown className="h-4 w-4 ml-2 text-red-500" />
                              }
                            </span>
                          </div>
                          <div className="flex flex-col p-4 border border-white/40 rounded-xl bg-gradient-to-br from-white/80 to-white/60 shadow-sm">
                            <span className="text-sm text-slate-600 flex items-center gap-1 font-medium">
                              <Award className="h-3 w-3" />
                              Conversion Rate
                            </span>
                            <span className="text-xl font-bold flex items-center text-slate-800">
                              {safeToFixed(data.conversionRate, 1)}%
                              {data.conversionRate > 10 ? 
                                <TrendingUp className="h-4 w-4 ml-2 text-green-500" /> : 
                                <TrendingDown className="h-4 w-4 ml-2 text-red-500" />
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sticky bottom-0 bg-gradient-to-r from-slate-50/95 to-white/95 backdrop-blur-xl p-6 border-t border-white/20">
          <Button onClick={onClose} className="animate-scale-in bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg">
            <Eye className="h-4 w-4 mr-2" />
            Close Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DrillDownAnalytics;