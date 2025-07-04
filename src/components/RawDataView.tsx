import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Filter, AlertTriangle, Calendar, CalendarCheck, Clock, Users, UserCheck, UserPlus, UserX, ArrowUpDown, RefreshCcw, Activity, Sparkles, Crown, Star } from 'lucide-react';
import { safeFormatCurrency, safeFormatDate, daysBetweenDates, sortDataByColumn, calculateConversionSpan, calculateRetentionSpan, formatClientName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RawDataProps {
  newClientData: any[];
  bookingsData: any[];
  paymentsData: any[];
  processingResults: {
    included: any[];
    excluded: any[];
    newClients: any[];
    convertedClients: any[];
    retainedClients: any[];
  };
}

const RawDataView: React.FC<RawDataProps> = ({
  newClientData,
  bookingsData,
  paymentsData,
  processingResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('processing');
  const [clientRecordTab, setClientRecordTab] = useState('new');
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Summary counts - using useMemo for performance
  const counts = useMemo(() => {
    const newClientCount = processingResults.newClients?.length || 0;
    const convertedClientCount = processingResults.convertedClients?.length || 0;
    const retainedClientCount = processingResults.retainedClients?.length || 0;
    const excludedCount = processingResults.excluded?.length || 0;
    const includedCount = processingResults.included?.length || 0;
    
    return {
      newClientCount,
      excludedCount,
      includedCount,
      totalClientsCount: newClientCount,
      conversionRate: newClientCount > 0 ? (convertedClientCount / newClientCount * 100).toFixed(1) : 0,
      retentionRate: newClientCount > 0 ? (retainedClientCount / newClientCount * 100).toFixed(1) : 0
    };
  }, [processingResults]);

  // Helper function to deduplicate records by email
  const deduplicateByEmail = (records: any[]) => {
    if (!records || !Array.isArray(records)) return [];
    const seen = new Set();
    return records.filter(item => {
      const email = item['Email'] || item.email || item['Customer Email'] || item['Paying Customer email'] || '';
      if (email && !seen.has(email)) {
        seen.add(email);
        return true;
      }
      return false;
    });
  };

  // Filter client records based on search term
  const filterClientRecords = (records: any[]) => {
    if (!records || !Array.isArray(records) || records.length === 0) return [];
    if (!clientSearchTerm) return records;
    return records.filter(record => {
      const clientName = formatClientName(record).toLowerCase();
      const clientEmail = (record['Email'] || record.email || record['Customer Email'] || '').toLowerCase();
      const searchTermLower = clientSearchTerm.toLowerCase();
      
      const location = (record['First visit location'] || record.location || record.studio || record.Studio || '').toLowerCase();
      const reason = (record.reason || '').toLowerCase();
      
      return clientName.includes(searchTermLower) || 
             clientEmail.includes(searchTermLower) ||
             location.includes(searchTermLower) ||
             reason.includes(searchTermLower);
    });
  };

  // Handle search input event
  useEffect(() => {
    if (currentTab !== 'processing') {
      setClientSearchTerm('');
      setFilterField('');
      setFilterValue('');
    }
  }, [currentTab]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filterData = (data: any[]) => {
    if (!data || !Array.isArray(data)) return [];

    let filtered = data;
    if (searchTerm) {
      filtered = filtered.filter(item => Object.values(item).some(val => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())));
    }

    if (filterField && filterValue) {
      filtered = filtered.filter(item => {
        const itemValue = item[filterField];
        return itemValue && itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    if (sortColumn) {
      filtered = sortDataByColumn(filtered, sortColumn, sortDirection);
    }
    return filtered;
  };

  // Helper functions
  const getClientEmail = (client: any) => {
    if (!client) return '';
    return client['Email'] || client.email || client['Customer Email'] || client['Paying Customer email'] || '';
  };

  const getFirstVisitDate = (client: any) => {
    if (!client) return '';
    return client['First visit at'] || client.firstVisit || client.date || client['Class Date'] || '';
  };

  const getFirstPurchaseDate = (client: any) => {
    if (!client) return '';
    return client['First purchase date'] || client.purchaseDate || client.date || client.firstPurchaseDate || client['Date'] || '';
  };

  const getStudioLocation = (client: any) => {
    if (!client) return '';
    return client['First visit location'] || client.location || client.studio || client.Studio || client['Location'] || 'N/A';
  };

  const getFirstVisitPostTrial = (client: any) => {
    if (!client) return '';

    if (client.firstVisitPostTrial) return client.firstVisitPostTrial;
    if (client.postTrialVisitDate) return client.postTrialVisitDate;
    if (client.visitsPostTrial && client.visitsPostTrial.length > 0) {
      return client.visitsPostTrial[0].date;
    }

    const visits = bookingsData.filter(booking => {
      const bookingEmail = booking['Customer Email'] || booking.email || '';
      const clientEmail = getClientEmail(client);
      return bookingEmail === clientEmail;
    });
    
    if (visits.length > 1) {
      const sortedVisits = visits.sort((a, b) => {
        const dateA = new Date(a['Class Date'] || a.date || a['Visit date'] || '');
        const dateB = new Date(b['Class Date'] || b.date || b['Visit date'] || '');
        return dateA.getTime() - dateB.getTime();
      });

      if (sortedVisits.length > 1) {
        return sortedVisits[1]['Class Date'] || sortedVisits[1].date || sortedVisits[1]['Visit date'] || '';
      }
    }
    return '';
  };

  const uniqueExcludedRecords = useMemo(() => deduplicateByEmail(processingResults.excluded || []), [processingResults.excluded]);
  const hasProcessingData = useMemo(() => processingResults && (processingResults.included && processingResults.included.length > 0 || processingResults.excluded && processingResults.excluded.length > 0 || processingResults.newClients && processingResults.newClients.length > 0 || processingResults.convertedClients && processingResults.convertedClients.length > 0 || processingResults.retainedClients && processingResults.retainedClients.length > 0), [processingResults]);

  const filteredClientRecords = useMemo(() => {
    switch (clientRecordTab) {
      case 'new':
        return filterClientRecords(processingResults.newClients || []);
      case 'converted':
        return filterClientRecords(processingResults.convertedClients || []);
      case 'retained':
        return filterClientRecords(processingResults.retainedClients || []);
      case 'excluded':
        return filterClientRecords(uniqueExcludedRecords || []);
      default:
        return [];
    }
  }, [clientRecordTab, clientSearchTerm, processingResults, uniqueExcludedRecords]);

  const renderDataTable = (data: any[], type: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-xl font-medium mb-2">No {type} Data Available</p>
          <p className="text-muted-foreground max-w-md">
            No {type.toLowerCase()} data was found. Please ensure you've uploaded the correct CSV files.
          </p>
        </div>
      );
    }
    const filteredData = filterData(data);
    const columns = Object.keys(filteredData[0] || {});

    const filterFields = columns.filter(col => !['id', 'uuid'].includes(col.toLowerCase()));
    
    return (
      <Card className="shadow-lg bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
                  {type} Data
                </span>
                <Badge variant="luxury" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {filteredData.length} rows
                </Badge>
              </CardTitle>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  id="search-data-input" 
                  placeholder="Search data..." 
                  className="pl-10 bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  autoComplete="off" 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger className="w-[180px] bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                    <SelectValue placeholder="Filter by field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select field</SelectItem>
                    {filterFields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}
                  </SelectContent>
                </Select>
                
                {filterField && (
                  <Input 
                    placeholder="Filter value..." 
                    className="w-[180px] bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl" 
                    value={filterValue} 
                    onChange={e => setFilterValue(e.target.value)} 
                    autoComplete="off" 
                  />
                )}
                
                {(filterField || searchTerm) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setFilterField('');
                      setFilterValue('');
                      setSearchTerm('');
                    }}
                    className="bg-white/90 border-white/40 hover:bg-white/95 rounded-xl"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px] rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 border-b border-white/20">
                  {columns.map(column => (
                    <TableHead 
                      key={column} 
                      sortable 
                      sortDirection={sortColumn === column ? sortDirection : undefined} 
                      onSort={() => handleSort(column)}
                      className="text-white font-semibold"
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex} 
                    className="animate-fade-in hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-100/50" 
                    style={{ animationDelay: `${rowIndex * 30}ms` }}
                  >
                    {columns.map(column => (
                      <TableCell key={`${rowIndex}-${column}`} className="text-slate-700">
                        {column.toLowerCase().includes('date') && row[column] ? 
                          safeFormatDate(row[column], 'medium') : 
                          column.toLowerCase().includes('value') || column.toLowerCase().includes('revenue') || column.toLowerCase().includes('price') ? 
                            safeFormatCurrency(row[column]) : 
                            row[column] !== undefined ? row[column].toString() : ''
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderClientDetailsTables = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Client Details
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Search clients, locations, reasons..." 
                className="pl-10 w-64 bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl" 
                value={clientSearchTerm} 
                onChange={e => setClientSearchTerm(e.target.value)} 
                autoComplete="off" 
              />
            </div>
          </div>
        </div>
        
        <Tabs value={clientRecordTab} onValueChange={setClientRecordTab}>
          <TabsList className="grid grid-cols-4 mb-6 bg-slate-100/80 backdrop-blur-sm p-2 rounded-xl">
            <TabsTrigger value="new" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
              <UserPlus className="h-4 w-4" /> 
              New Clients 
              <Badge variant="luxury" className="ml-1">{processingResults.newClients?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="converted" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
              <UserCheck className="h-4 w-4" /> 
              Converted 
              <Badge variant="luxury" className="ml-1">{processingResults.convertedClients?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="retained" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
              <RefreshCcw className="h-4 w-4" /> 
              Retained 
              <Badge variant="luxury" className="ml-1">{processingResults.retainedClients?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="excluded" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
              <UserX className="h-4 w-4" /> 
              Excluded 
              <Badge variant="luxury" className="ml-1">{uniqueExcludedRecords?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                        <TableHead className="text-white font-semibold">Client</TableHead>
                        <TableHead className="text-white font-semibold">Email</TableHead>
                        <TableHead className="text-white font-semibold">First Visit</TableHead>
                        <TableHead className="text-white font-semibold">Studio/Location</TableHead>
                        <TableHead className="text-white font-semibold">Teacher</TableHead>
                        <TableHead className="text-white font-semibold">Membership Used</TableHead>
                        <TableHead className="text-white font-semibold">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientRecords.length > 0 ? filteredClientRecords.map((client, index) => (
                        <TableRow key={index} className="animate-fade-in hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                          <TableCell className="font-medium text-slate-800">{formatClientName(client)}</TableCell>
                          <TableCell className="text-slate-600">{getClientEmail(client)}</TableCell>
                          <TableCell className="text-slate-600">{safeFormatDate(getFirstVisitDate(client), 'medium')}</TableCell>
                          <TableCell className="text-slate-600">{getStudioLocation(client)}</TableCell>
                          <TableCell className="text-slate-600">{client.teacherName || client.teacher || client.Teacher || 'N/A'}</TableCell>
                          <TableCell className="text-slate-600">{client['Membership used'] || client.membershipUsed || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="shadow-sm">
                              {client.reason || 'First time visitor'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-slate-500">
                            {clientSearchTerm ? 'No clients matching your search.' : 'No new client records available.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="converted">
            <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                        <TableHead className="text-white font-semibold">Client</TableHead>
                        <TableHead className="text-white font-semibold">Email</TableHead>
                        <TableHead className="text-white font-semibold">First Visit</TableHead>
                        <TableHead className="text-white font-semibold">First Purchase</TableHead>
                        <TableHead className="text-white font-semibold">Item Purchased</TableHead>
                        <TableHead className="text-white font-semibold">Value</TableHead>
                        <TableHead className="text-white font-semibold">Conversion Span</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientRecords.length > 0 ? filteredClientRecords.map((client, index) => {
                        const firstVisit = getFirstVisitDate(client);
                        const firstPurchase = getFirstPurchaseDate(client);
                        const conversionSpan = calculateConversionSpan(firstVisit, firstPurchase);
                        return (
                          <TableRow key={index} className="animate-fade-in hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                            <TableCell className="font-medium text-slate-800">{formatClientName(client)}</TableCell>
                            <TableCell className="text-slate-600">{getClientEmail(client)}</TableCell>
                            <TableCell className="text-slate-600">{safeFormatDate(firstVisit, 'medium')}</TableCell>
                            <TableCell className="text-slate-600">{safeFormatDate(firstPurchase, 'medium')}</TableCell>
                            <TableCell className="text-slate-600">{client.item || client.purchaseItem || client.Item || client['Item'] || 'N/A'}</TableCell>
                            <TableCell className="font-semibold text-green-700">{safeFormatCurrency(client.saleValue || client.value || client['Sale value'] || client.Price)}</TableCell>
                            <TableCell>
                              <Badge variant="conversion" className="flex items-center gap-1 shadow-sm">
                                <Clock className="h-3 w-3" />
                                {conversionSpan}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-slate-500">
                            {clientSearchTerm ? 'No clients matching your search.' : 'No converted client records available.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="retained">
            <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                        <TableHead className="text-white font-semibold">Client</TableHead>
                        <TableHead className="text-white font-semibold">Email</TableHead>
                        <TableHead className="text-white font-semibold">First Visit</TableHead>
                        <TableHead className="text-white font-semibold">First Visit Post-Trial</TableHead>
                        <TableHead className="text-white font-semibold">Total Visits</TableHead>
                        <TableHead className="text-white font-semibold">Studio/Location</TableHead>
                        <TableHead className="text-white font-semibold">Retention Span</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientRecords.length > 0 ? filteredClientRecords.map((client, index) => {
                        const firstVisit = getFirstVisitDate(client);
                        const firstVisitPostTrial = getFirstVisitPostTrial(client);
                        const retentionSpan = calculateRetentionSpan(firstVisit, firstVisitPostTrial || client.lastVisitDate || '');
                        return (
                          <TableRow key={index} className="animate-fade-in hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                            <TableCell className="font-medium text-slate-800">{formatClientName(client)}</TableCell>
                            <TableCell className="text-slate-600">{getClientEmail(client)}</TableCell>
                            <TableCell className="text-slate-600">{safeFormatDate(firstVisit, 'medium')}</TableCell>
                            <TableCell className="text-slate-600">{safeFormatDate(firstVisitPostTrial, 'medium')}</TableCell>
                            <TableCell className="text-slate-600">{client.visitsCount || client.totalVisits || '1+'}</TableCell>
                            <TableCell className="text-slate-600">{getStudioLocation(client)}</TableCell>
                            <TableCell>
                              <Badge variant="retention" className="flex items-center gap-1 shadow-sm">
                                <RefreshCcw className="h-3 w-3" />
                                {retentionSpan}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-slate-500">
                            {clientSearchTerm ? 'No clients matching your search.' : 'No retained client records available.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="excluded">
            <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                        <TableHead className="text-white font-semibold">Client</TableHead>
                        <TableHead className="text-white font-semibold">Email</TableHead>
                        <TableHead className="text-white font-semibold">First Visit</TableHead>
                        <TableHead className="text-white font-semibold">Studio/Location</TableHead>
                        <TableHead className="text-white font-semibold">Membership Used</TableHead>
                        <TableHead className="text-white font-semibold">Reason for Exclusion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientRecords.length > 0 ? filteredClientRecords.map((client, index) => (
                        <TableRow key={index} className="animate-fade-in hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                          <TableCell className="font-medium text-slate-800">{formatClientName(client)}</TableCell>
                          <TableCell className="text-slate-600">{getClientEmail(client)}</TableCell>
                          <TableCell className="text-slate-600">{safeFormatDate(getFirstVisitDate(client), 'medium')}</TableCell>
                          <TableCell className="text-slate-600">{getStudioLocation(client)}</TableCell>
                          <TableCell className="text-slate-600">{client['Membership used'] || client.membershipUsed || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="excluded" className="flex items-center gap-1 shadow-sm">
                              <AlertTriangle className="h-3 w-3" />
                              {client.reason || 'Unknown reason'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                            {clientSearchTerm ? 'No clients matching your search.' : 'No excluded client records available.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderProcessingTab = () => {
    if (!hasProcessingData) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-xl font-medium mb-2">No Processing Data Available</p>
          <p className="text-muted-foreground max-w-md">
            No processed data was found. Please ensure you've processed your CSV files correctly.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-lg bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
                  Processing Summary
                </span>
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-blue-200/50" style={{ animationDelay: '100ms' }}>
                  <div className="text-sm text-blue-700 flex items-center font-medium">
                    <Users className="h-4 w-4 mr-2" />
                    New Clients
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {counts.newClientCount}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-indigo-200/50" style={{ animationDelay: '200ms' }}>
                  <div className="text-sm text-indigo-700 flex items-center font-medium">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Included
                  </div>
                  <div className="text-2xl font-bold text-indigo-800">
                    {counts.includedCount}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50/80 to-red-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-red-200/50" style={{ animationDelay: '300ms' }}>
                  <div className="text-sm text-red-700 flex items-center font-medium">
                    <UserX className="h-4 w-4 mr-2" />
                    Excluded
                  </div>
                  <div className="text-2xl font-bold text-red-800">
                    {counts.excludedCount}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50/80 to-green-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-green-200/50" style={{ animationDelay: '400ms' }}>
                  <div className="text-sm text-green-700 flex items-center font-medium">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Converted
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {processingResults.convertedClients?.length || 0}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-purple-200/50" style={{ animationDelay: '500ms' }}>
                  <div className="text-sm text-purple-700 flex items-center font-medium">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Conversion Rate
                  </div>
                  <div className="text-2xl font-bold text-purple-800 flex items-center gap-1">
                    {counts.conversionRate}%
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-50/80 to-teal-100/60 rounded-xl p-4 animate-scale-in shadow-sm border border-teal-200/50" style={{ animationDelay: '600ms' }}>
                  <div className="text-sm text-teal-700 flex items-center font-medium">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Retention Rate
                  </div>
                  <div className="text-2xl font-bold text-teal-800 flex items-center gap-1">
                    {counts.retentionRate}%
                    <Crown className="h-4 w-4 text-teal-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {renderClientDetailsTables()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 bg-slate-100/80 backdrop-blur-sm p-2 rounded-xl">
          <TabsTrigger value="processing" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Processing Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
            <FileText className="h-4 w-4" />
            <span className="font-medium">New Clients ({newClientData?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Bookings ({bookingsData?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Payments ({paymentsData?.length || 0})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="processing">
          {renderProcessingTab()}
        </TabsContent>
        
        <TabsContent value="new">
          {renderDataTable(newClientData || [], 'New Client')}
        </TabsContent>
        
        <TabsContent value="bookings">
          {renderDataTable(bookingsData || [], 'Bookings')}
        </TabsContent>
        
        <TabsContent value="payments">
          {renderDataTable(paymentsData || [], 'Payments')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RawDataView;