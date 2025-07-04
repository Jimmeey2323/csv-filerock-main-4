import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Package,
  User,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Eye,
  FileText,
  Target,
  Award,
  Sparkles,
  Crown,
  Star,
  Clock
} from 'lucide-react';
import { safeFormatCurrency, safeFormatDate, safeToFixed, daysBetweenDates } from '@/lib/utils';

interface ConversionSummaryProps {
  newClientData: any[];
  salesData: any[];
  bookingsData: any[];
}

interface ProcessedClient {
  memberID: string;
  firstName: string;
  lastName: string;
  email: string;
  firstVisitDate: string;
  firstVisitLocation: string;
  membershipUsed: string;
  teacher: string;
  firstPurchaseDate: string | null;
  firstPurchaseProduct: string | null;
  firstPurchaseValue: number | null;
  conversionStatus: 'converted' | 'not_converted';
  conversionDetails: string;
  daysToConversion: number | null;
  validationErrors: string[];
  conversionReason: string;
}

const ConversionSummaryTable: React.FC<ConversionSummaryProps> = ({
  newClientData,
  salesData,
  bookingsData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('firstVisitDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Enhanced data processing with detailed conversion analysis
  const processedData = useMemo(() => {
    if (!newClientData || !Array.isArray(newClientData) || newClientData.length === 0) {
      return [];
    }

    const processed: ProcessedClient[] = [];

    newClientData.forEach((client, index) => {
      // Skip 'All Trainers' rows
      if (client.Teacher && client.Teacher.toLowerCase().includes('all trainers')) {
        return;
      }

      const validationErrors: string[] = [];
      
      // Extract and validate client data
      const memberID = client['Member ID'] || client.memberID || client.id || `client_${index}`;
      const firstName = client['First name'] || client.firstName || '';
      const lastName = client['Last name'] || client.lastName || '';
      const email = client['Email'] || client.email || '';
      const firstVisitDate = client['First visit at'] || client.firstVisitAt || client.date || '';
      const firstVisitLocation = client['First visit location'] || client.location || '';
      const membershipUsed = client['Membership used'] || client.membershipUsed || '';
      const teacher = client['Teacher'] || client.teacher || 'Unknown';

      // Validate required fields
      if (!email) validationErrors.push('Missing email address');
      if (!firstVisitDate) validationErrors.push('Missing first visit date');
      if (!firstName && !lastName) validationErrors.push('Missing client name');

      // Validate date format
      const visitDate = new Date(firstVisitDate);
      if (firstVisitDate && isNaN(visitDate.getTime())) {
        validationErrors.push('Invalid first visit date format');
      }

      // Enhanced sales matching with detailed conversion logic
      const matchingSales = salesData.filter(sale => {
        // Match by email or member ID
        const emailMatch = (
          sale['Customer email'] === email ||
          sale['Paying Customer email'] === email ||
          sale.email === email
        );
        
        const memberIDMatch = (
          sale['Member ID'] === memberID ||
          sale.memberID === memberID
        );

        return emailMatch || memberIDMatch;
      });

      // Apply strict conversion criteria
      const validSales = matchingSales.filter(sale => {
        const saleDate = new Date(sale['Date'] || sale.date || '');
        const saleValue = parseFloat(String(sale['Sale value'] || sale.value || '0').replace(/[^0-9.-]+/g, ''));
        const category = (sale['Category'] || sale.category || '').toLowerCase();
        const product = (sale['Item'] || sale.item || sale.product || '').toLowerCase();
        
        // Enhanced filtering criteria
        const validSaleValue = saleValue >= 1000; // Minimum ₹1000
        const notTwoForOne = !product.includes('2 for 1');
        const notExcludedCategory = !category.includes('money-credits') && 
                                   !category.includes('retail') && 
                                   !category.includes('product');
        const saleDateValid = !isNaN(saleDate.getTime());
        const saleDateAfterVisit = saleDateValid && saleDate >= visitDate;
        const notRefunded = sale['Refunded'] !== 'YES';

        return validSaleValue && notTwoForOne && notExcludedCategory && saleDateAfterVisit && notRefunded;
      });

      // Determine conversion status and details
      let conversionStatus: 'converted' | 'not_converted' = 'not_converted';
      let conversionDetails = '';
      let conversionReason = '';
      let firstPurchaseDate: string | null = null;
      let firstPurchaseProduct: string | null = null;
      let firstPurchaseValue: number | null = null;
      let daysToConversion: number | null = null;

      if (validSales.length > 0) {
        // Sort by date to get first purchase
        const sortedSales = validSales.sort((a, b) => {
          const dateA = new Date(a['Date'] || a.date || '');
          const dateB = new Date(b['Date'] || b.date || '');
          return dateA.getTime() - dateB.getTime();
        });

        const firstSale = sortedSales[0];
        const purchaseDate = new Date(firstSale['Date'] || firstSale.date || '');
        
        conversionStatus = 'converted';
        firstPurchaseDate = firstSale['Date'] || firstSale.date || '';
        firstPurchaseProduct = firstSale['Item'] || firstSale.item || firstSale.product || '';
        firstPurchaseValue = parseFloat(String(firstSale['Sale value'] || firstSale.value || '0').replace(/[^0-9.-]+/g, ''));
        
        // Calculate days to conversion
        if (!isNaN(purchaseDate.getTime()) && !isNaN(visitDate.getTime())) {
          daysToConversion = Math.ceil((purchaseDate.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        conversionReason = `Successfully converted after ${daysToConversion || 0} days`;
        conversionDetails = `Converted with "${firstPurchaseProduct}" for ${safeFormatCurrency(firstPurchaseValue || 0)} on ${safeFormatDate(firstPurchaseDate)}`;
      } else {
        // Detailed analysis of why they didn't convert
        const allSalesForClient = matchingSales;
        
        if (allSalesForClient.length === 0) {
          conversionReason = 'No purchase records found';
          conversionDetails = 'Client has no purchase history in the system';
        } else {
          const reasons: string[] = [];
          let hasValidPurchases = false;
          
          allSalesForClient.forEach(sale => {
            const saleDate = new Date(sale['Date'] || sale.date || '');
            const saleValue = parseFloat(String(sale['Sale value'] || sale.value || '0').replace(/[^0-9.-]+/g, ''));
            const category = (sale['Category'] || sale.category || '').toLowerCase();
            const product = (sale['Item'] || sale.item || sale.product || '').toLowerCase();
            
            hasValidPurchases = true;
            
            if (saleValue < 1000) reasons.push(`Low value purchase: ${safeFormatCurrency(saleValue)} (min: ₹1000)`);
            if (product.includes('2 for 1')) reasons.push('Excluded "2 For 1" product');
            if (category.includes('money-credits') || category.includes('retail') || category.includes('product')) {
              reasons.push(`Excluded category: ${sale['Category']}`);
            }
            if (saleDate < visitDate) reasons.push('Purchase before first visit');
            if (sale['Refunded'] === 'YES') reasons.push('Purchase was refunded');
          });

          if (hasValidPurchases) {
            conversionReason = `Has purchases but none qualify: ${reasons.slice(0, 2).join(', ')}`;
            conversionDetails = `Found ${allSalesForClient.length} purchase(s) but none meet conversion criteria: ${reasons.join('; ')}`;
          } else {
            conversionReason = 'No valid purchase data';
            conversionDetails = 'Client purchase data is incomplete or invalid';
          }
        }
      }

      processed.push({
        memberID,
        firstName,
        lastName,
        email,
        firstVisitDate,
        firstVisitLocation,
        membershipUsed,
        teacher,
        firstPurchaseDate,
        firstPurchaseProduct,
        firstPurchaseValue,
        conversionStatus,
        conversionDetails,
        conversionReason,
        daysToConversion,
        validationErrors
      });
    });

    return processed;
  }, [newClientData, salesData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = processedData;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.teacher.toLowerCase().includes(searchLower) ||
        client.firstVisitLocation.toLowerCase().includes(searchLower) ||
        client.conversionReason.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.conversionStatus === statusFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      let valueA: any = a[sortColumn as keyof ProcessedClient];
      let valueB: any = b[sortColumn as keyof ProcessedClient];

      // Handle null values
      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return sortDirection === 'asc' ? -1 : 1;
      if (valueB === null) return sortDirection === 'asc' ? 1 : -1;

      // Handle dates
      if (sortColumn.includes('Date')) {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      // Handle numbers
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Handle strings
      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();
      
      if (stringA < stringB) return sortDirection === 'asc' ? -1 : 1;
      if (stringA > stringB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [processedData, searchTerm, statusFilter, sortColumn, sortDirection]);

  // Calculate enhanced summary statistics
  const summaryStats = useMemo(() => {
    const total = processedData.length;
    const converted = processedData.filter(c => c.conversionStatus === 'converted').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    const totalRevenue = processedData.reduce((sum, c) => sum + (c.firstPurchaseValue || 0), 0);
    
    const convertedClients = processedData.filter(c => c.daysToConversion !== null);
    const avgDaysToConversion = convertedClients.length > 0 
      ? convertedClients.reduce((sum, c) => sum + (c.daysToConversion || 0), 0) / convertedClients.length 
      : 0;
    
    const dataQualityIssues = processedData.filter(c => c.validationErrors.length > 0).length;
    const avgRevenuePerConversion = converted > 0 ? totalRevenue / converted : 0;

    // Conversion reasons analysis
    const reasonsAnalysis = processedData.reduce((acc, client) => {
      if (client.conversionStatus === 'not_converted') {
        const reason = client.conversionReason;
        acc[reason] = (acc[reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      converted,
      notConverted: total - converted,
      conversionRate,
      totalRevenue,
      avgDaysToConversion,
      avgRevenuePerConversion,
      dataQualityIssues,
      reasonsAnalysis
    };
  }, [processedData]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getConversionStatusBadge = (status: 'converted' | 'not_converted') => {
    if (status === 'converted') {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <CheckCircle className="h-3.5 w-3.5" />
          Converted
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <XCircle className="h-3.5 w-3.5" />
          Not Converted
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-blue-50/80 border-b border-blue-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <User className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-blue-800">{summaryStats.total.toLocaleString()}</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">Analyzed clients</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-green-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-green-100/80 to-emerald-50/80 border-b border-green-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <Target className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-800 flex items-center gap-2">
              {safeToFixed(summaryStats.conversionRate, 1)}%
              {summaryStats.conversionRate > 15 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
            </div>
            <p className="text-xs text-green-600 mt-1 font-medium">{summaryStats.converted} converted</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-100/80 to-violet-50/80 border-b border-purple-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-purple-800">{safeFormatCurrency(summaryStats.totalRevenue)}</div>
            <p className="text-xs text-purple-600 mt-1 font-medium">From conversions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-amber-100/80 to-orange-50/80 border-b border-amber-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" />
              Avg Days to Convert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-amber-800">{safeToFixed(summaryStats.avgDaysToConversion, 0)}</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">Average timeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Quality Alert */}
      {summaryStats.dataQualityIssues > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Data Quality Alert:</span>
              <span>{summaryStats.dataQualityIssues} records have validation issues</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters and Controls */}
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-luxury rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
              Conversion Analysis Filters
            </span>
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients, teachers, locations, reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="converted">Converted Only</SelectItem>
                <SelectItem value="not_converted">Not Converted Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="bg-white/90 border-white/40 hover:bg-white/95 rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Data Table */}
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-luxury overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white text-xl">Detailed Conversion Analysis</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 font-semibold">
              <Eye className="h-4 w-4 mr-2" />
              {filteredAndSortedData.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 border-b border-white/20">
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'firstName' ? sortDirection : undefined} 
                    onSort={() => handleSort('firstName')} 
                    className="text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client Name
                    </div>
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'email' ? sortDirection : undefined} 
                    onSort={() => handleSort('email')} 
                    className="text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'firstVisitDate' ? sortDirection : undefined} 
                    onSort={() => handleSort('firstVisitDate')} 
                    className="text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      First Visit
                    </div>
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'firstPurchaseDate' ? sortDirection : undefined} 
                    onSort={() => handleSort('firstPurchaseDate')} 
                    className="text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      First Purchase
                    </div>
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'firstPurchaseValue' ? sortDirection : undefined} 
                    onSort={() => handleSort('firstPurchaseValue')} 
                    className="text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Purchase Value
                    </div>
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortColumn === 'conversionStatus' ? sortDirection : undefined} 
                    onSort={() => handleSort('conversionStatus')} 
                    className="text-white font-semibold text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Conversion Details
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((client, index) => (
                  <TableRow 
                    key={`${client.email}-${index}`} 
                    className="animate-fade-in hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-100/50" 
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{`${client.firstName} ${client.lastName}`.trim() || 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{client.teacher}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex flex-col">
                        <span>{client.email}</span>
                        <span className="text-xs text-slate-500">{client.firstVisitLocation}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {safeFormatDate(client.firstVisitDate)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex flex-col">
                        <span>{client.firstPurchaseDate ? safeFormatDate(client.firstPurchaseDate) : 'N/A'}</span>
                        {client.daysToConversion && (
                          <span className="text-xs font-semibold text-blue-600">
                            {client.daysToConversion} days
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-600">
                          {client.firstPurchaseValue ? safeFormatCurrency(client.firstPurchaseValue) : 'N/A'}
                        </span>
                        {client.firstPurchaseProduct && (
                          <span className="text-xs text-slate-500">{client.firstPurchaseProduct}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getConversionStatusBadge(client.conversionStatus)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-2 cursor-help">
                              {client.conversionStatus === 'converted' ? 
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> : 
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              }
                              <span className="text-sm text-slate-600 break-words line-clamp-2">
                                {client.conversionReason}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-sm">
                            <div className="space-y-2">
                              <p className="font-medium">Full Conversion Details:</p>
                              <p className="text-sm">{client.conversionDetails}</p>
                              {client.validationErrors.length > 0 && (
                                <div>
                                  <p className="font-medium text-amber-600">Data Quality Issues:</p>
                                  <ul className="text-sm list-disc list-inside">
                                    {client.validationErrors.map((error, idx) => (
                                      <li key={idx}>{error}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-t-2 border-slate-300/50 bg-gradient-to-r from-slate-800/95 via-slate-700/95 to-slate-800/95">
                  <TableCell className="font-bold text-white" colSpan={5}>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>SUMMARY TOTALS</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-white">
                    {summaryStats.converted} / {summaryStats.total}
                  </TableCell>
                  <TableCell className="font-bold text-white">
                    {safeToFixed(summaryStats.conversionRate, 1)}% conversion rate • Avg: {safeFormatCurrency(summaryStats.avgRevenuePerConversion)}/conversion
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversion Reasons Analysis */}
      {Object.keys(summaryStats.reasonsAnalysis).length > 0 && (
        <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-luxury rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
                Non-Conversion Reasons Analysis
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summaryStats.reasonsAnalysis)
                .sort(([,a], [,b]) => b - a)
                .map(([reason, count]) => (
                <div key={reason} className="p-4 bg-gradient-to-br from-slate-50/80 to-white/70 rounded-xl border border-slate-100/80 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{reason}</span>
                    <Badge variant="outline" className="text-xs">
                      {count} clients
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{((count / summaryStats.notConverted) * 100).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">of non-conversions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversionSummaryTable;