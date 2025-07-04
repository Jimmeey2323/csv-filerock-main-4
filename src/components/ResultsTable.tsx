import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, TrendingUp, TrendingDown, DollarSign, Target, Award, Search, Filter, Eye, BarChart3, PieChart, Calendar, MapPin, User, Percent, Star, Crown, Zap, ArrowUpRight, ArrowDownRight, Minus, Activity, Sparkles } from 'lucide-react';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { safeToFixed, safeFormatCurrency } from '@/lib/utils';
import DrillDownAnalytics from './DrillDownAnalytics';
import PerformanceMetricCard from './cards/PerformanceMetricCard';
import StudioMetricCard from './cards/StudioMetricCard';
import RevenueChart from './charts/RevenueChart';
import ConversionRatesChart from './charts/ConversionRatesChart';
import ClientSourceChart from './charts/ClientSourceChart';
import TableViewOptions from './TableViewOptions';

interface ResultsTableProps {
  data: ProcessedTeacherData[];
  locations: string[];
  isLoading: boolean;
  viewMode: 'table' | 'cards' | 'detailed';
  dataMode: 'teacher' | 'studio';
  onFilterChange: (filters: any) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  locations,
  isLoading,
  viewMode,
  dataMode,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('conversionRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [drillDownData, setDrillDownData] = useState<ProcessedTeacherData | null>(null);
  const [drillDownType, setDrillDownType] = useState<'teacher' | 'studio' | 'location' | 'period' | 'totals'>('teacher');
  const [drillDownMetricType, setDrillDownMetricType] = useState<'conversion' | 'retention' | 'all'>('all');
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([
    'teacherName', 'location', 'period', 'newClients', 'retainedClients', 
    'retentionRate', 'convertedClients', 'conversionRate', 'totalRevenue',
    'trials', 'referrals', 'hosted', 'influencerSignups', 'others',
    'averageRevenuePerClient', 'noShowRate', 'lateCancellationRate'
  ]);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [activeView, setActiveView] = useState('table');

  // Filter out "All Trainers" rows from the data - ENHANCED FILTERING
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.teacherName && 
      item.teacherName.toLowerCase() !== 'all trainers' &&
      item.teacherName.toLowerCase() !== 'all teachers' &&
      item.teacherName.toLowerCase() !== 'total' &&
      item.teacherName.toLowerCase() !== 'summary'
    );
  }, [data]);

  // Get unique values for filters (excluding "All Trainers")
  const uniqueTeachers = useMemo(() => {
    return [...new Set(filteredData.map(item => item.teacherName).filter(Boolean))].sort();
  }, [filteredData]);

  const uniquePeriods = useMemo(() => {
    return [...new Set(filteredData.map(item => item.period).filter(Boolean))].sort();
  }, [filteredData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = filteredData.filter(item => {
      const matchesSearch = !searchTerm || item.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) || item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !selectedLocation || item.location === selectedLocation;
      const matchesTeacher = !selectedTeacher || item.teacherName === selectedTeacher;
      const matchesPeriod = !selectedPeriod || item.period === selectedPeriod;
      return matchesSearch && matchesLocation && matchesTeacher && matchesPeriod;
    });

    // Sort data
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof ProcessedTeacherData] as number;
        const bValue = b[sortColumn as keyof ProcessedTeacherData] as number;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    return filtered;
  }, [filteredData, searchTerm, selectedLocation, selectedTeacher, selectedPeriod, sortColumn, sortDirection]);

  // Group data if needed
  const groupedData = useMemo(() => {
    if (groupBy === 'none') return filteredAndSortedData;
    const groups: Record<string, ProcessedTeacherData[]> = {};
    filteredAndSortedData.forEach(item => {
      const key = item[groupBy as keyof ProcessedTeacherData] as string || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).flatMap(([groupKey, items]) => [
      // Group header
      {
        ...items[0],
        isGroupHeader: true,
        groupValue: groupKey,
        newClients: items.reduce((sum, item) => sum + item.newClients, 0),
        retainedClients: items.reduce((sum, item) => sum + item.retainedClients, 0),
        convertedClients: items.reduce((sum, item) => sum + item.convertedClients, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
        trials: items.reduce((sum, item) => sum + (item.trials || 0), 0),
        referrals: items.reduce((sum, item) => sum + (item.referrals || 0), 0),
        hosted: items.reduce((sum, item) => sum + (item.hosted || 0), 0),
        influencerSignups: items.reduce((sum, item) => sum + (item.influencerSignups || 0), 0),
        others: items.reduce((sum, item) => sum + (item.others || 0), 0),
        averageRevenuePerClient: items.reduce((sum, item) => sum + (item.averageRevenuePerClient || 0), 0) / items.length,
        noShowRate: items.reduce((sum, item) => sum + (item.noShowRate || 0), 0) / items.length,
        lateCancellationRate: items.reduce((sum, item) => sum + (item.lateCancellationRate || 0), 0) / items.length,
        retentionRate: items.reduce((sum, item) => sum + item.newClients, 0) > 0 ? 
          (items.reduce((sum, item) => sum + item.retainedClients, 0) / items.reduce((sum, item) => sum + item.newClients, 0)) * 100 : 0,
        conversionRate: items.reduce((sum, item) => sum + item.newClients, 0) > 0 ? 
          (items.reduce((sum, item) => sum + item.convertedClients, 0) / items.reduce((sum, item) => sum + item.newClients, 0)) * 100 : 0
      } as ProcessedTeacherData & {
        isGroupHeader: boolean;
        groupValue: string;
      }, 
      ...items.map(item => ({
        ...item,
        isGroupHeader: false,
        groupValue: groupKey
      }))
    ]);
  }, [filteredAndSortedData, groupBy]);

  // Calculate summary metrics - UPDATED to exclude "All Teachers" rows
  const summaryMetrics = useMemo(() => {
    // Use filteredAndSortedData which already excludes "All Teachers" rows
    const totalNewClients = filteredAndSortedData.reduce((sum, item) => sum + item.newClients, 0);
    const totalRetained = filteredAndSortedData.reduce((sum, item) => sum + item.retainedClients, 0);
    const totalConverted = filteredAndSortedData.reduce((sum, item) => sum + item.convertedClients, 0);
    const totalRevenue = filteredAndSortedData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalNoShows = filteredAndSortedData.reduce((sum, item) => sum + (item.noShows || 0), 0);
    const totalTrials = filteredAndSortedData.reduce((sum, item) => sum + (item.trials || 0), 0);
    const totalReferrals = filteredAndSortedData.reduce((sum, item) => sum + (item.referrals || 0), 0);
    const totalHosted = filteredAndSortedData.reduce((sum, item) => sum + (item.hosted || 0), 0);
    const totalInfluencerSignups = filteredAndSortedData.reduce((sum, item) => sum + (item.influencerSignups || 0), 0);
    const totalOthers = filteredAndSortedData.reduce((sum, item) => sum + (item.others || 0), 0);
    
    return {
      totalNewClients,
      totalRetained,
      totalConverted,
      totalRevenue,
      totalNoShows,
      totalTrials,
      totalReferrals,
      totalHosted,
      totalInfluencerSignups,
      totalOthers,
      avgRetentionRate: totalNewClients > 0 ? totalRetained / totalNewClients * 100 : 0,
      avgConversionRate: totalNewClients > 0 ? totalConverted / totalNewClients * 100 : 0,
      avgRevenuePerClient: totalConverted > 0 ? totalRevenue / totalConverted : 0,
      avgNoShowRate: totalNewClients > 0 ? totalNoShows / totalNewClients * 100 : 0,
      avgLateCancellationRate: filteredAndSortedData.length > 0 ? 
        filteredAndSortedData.reduce((sum, item) => sum + (item.lateCancellationRate || 0), 0) / filteredAndSortedData.length : 0
    };
  }, [filteredAndSortedData]);

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }, [sortColumn]);

  const handleDrillDown = useCallback((rowData: ProcessedTeacherData, type: 'teacher' | 'studio' = 'teacher', metricType: 'conversion' | 'retention' | 'all' = 'all') => {
    setDrillDownData(rowData);
    setDrillDownType(type);
    setDrillDownMetricType(metricType);
    setIsDrillDownOpen(true);
  }, []);

  const getRetentionBadge = (rate: number) => {
    if (rate >= 70) {
      return <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Crown className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowUpRight className="h-3 w-3" />
        </Badge>;
    } else if (rate >= 50) {
      return <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Star className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowUpRight className="h-3 w-3" />
        </Badge>;
    } else if (rate >= 30) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Zap className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <Minus className="h-3 w-3" />
        </Badge>;
    } else {
      return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <TrendingDown className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowDownRight className="h-3 w-3" />
        </Badge>;
    }
  };

  const getConversionBadge = (rate: number) => {
    if (rate >= 25) {
      return <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Crown className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowUpRight className="h-3 w-3" />
        </Badge>;
    } else if (rate >= 15) {
      return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Award className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowUpRight className="h-3 w-3" />
        </Badge>;
    } else if (rate >= 8) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <Target className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <Minus className="h-3 w-3" />
        </Badge>;
    } else {
      return <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 font-semibold">
          <TrendingDown className="h-3.5 w-3.5" />
          {safeToFixed(rate, 1)}%
          <ArrowDownRight className="h-3 w-3" />
        </Badge>;
    }
  };

  const availableColumns = [
    'teacherName', 'location', 'period', 'newClients', 'retainedClients', 
    'retentionRate', 'convertedClients', 'conversionRate', 'totalRevenue',
    'trials', 'referrals', 'hosted', 'influencerSignups', 'others',
    'averageRevenuePerClient', 'noShowRate', 'lateCancellationRate'
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  return <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceMetricCard title="Total New Clients" value={summaryMetrics.totalNewClients.toLocaleString()} icon={<Users className="h-5 w-5" />} status="neutral" tooltip="Total number of new clients across all filtered data" />
        <PerformanceMetricCard title="Avg Retention Rate" value={`${safeToFixed(summaryMetrics.avgRetentionRate, 1)}%`} icon={<TrendingUp className="h-5 w-5" />} status={summaryMetrics.avgRetentionRate >= 50 ? "positive" : summaryMetrics.avgRetentionRate >= 30 ? "neutral" : "negative"} tooltip="Average retention rate across all filtered data" />
        <PerformanceMetricCard title="Avg Conversion Rate" value={`${safeToFixed(summaryMetrics.avgConversionRate, 1)}%`} icon={<Target className="h-5 w-5" />} status={summaryMetrics.avgConversionRate >= 15 ? "positive" : summaryMetrics.avgConversionRate >= 8 ? "neutral" : "negative"} tooltip="Average conversion rate across all filtered data" />
        <PerformanceMetricCard title="Total Revenue" value={safeFormatCurrency(summaryMetrics.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} status="positive" tooltip="Total revenue generated across all filtered data" />
      </div>

      {/* Table View Options */}
      <TableViewOptions activeView={activeView} onViewChange={setActiveView} onGroupByChange={setGroupBy} onVisibilityChange={setVisibleColumns} onSortChange={handleSort} availableColumns={availableColumns} visibleColumns={visibleColumns} activeGroupBy={groupBy} activeSort={{
      column: sortColumn,
      direction: sortDirection
    }} />

      {/* Filters */}
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
              Advanced Filters
            </span>
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teachers, locations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl" />
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(location => <SelectItem key={location} value={location}>{location}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teachers</SelectItem>
                {uniqueTeachers.map(teacher => <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Periods</SelectItem>
                {uniquePeriods.map(period => <SelectItem key={period} value={period}>{period}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedLocation('');
            setSelectedTeacher('');
            setSelectedPeriod('');
          }} className="bg-white/90 border-white/40 hover:bg-white/95 rounded-xl transition-all duration-200 hover:shadow-md">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white text-4xl">Performance Analytics</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 font-semibold">
              <Activity className="h-4 w-4 mr-2" />
              {filteredAndSortedData.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 border-b border-white/20">
                  {visibleColumns.includes('teacherName') && <TableHead sortable sortDirection={sortColumn === 'teacherName' ? sortDirection : undefined} onSort={() => handleSort('teacherName')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Teacher
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('location') && <TableHead sortable sortDirection={sortColumn === 'location' ? sortDirection : undefined} onSort={() => handleSort('location')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('period') && <TableHead sortable sortDirection={sortColumn === 'period' ? sortDirection : undefined} onSort={() => handleSort('period')} className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Period
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('newClients') && <TableHead sortable sortDirection={sortColumn === 'newClients' ? sortDirection : undefined} onSort={() => handleSort('newClients')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        New Clients
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('retainedClients') && <TableHead sortable sortDirection={sortColumn === 'retainedClients' ? sortDirection : undefined} onSort={() => handleSort('retainedClients')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Retained
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('retentionRate') && <TableHead sortable sortDirection={sortColumn === 'retentionRate' ? sortDirection : undefined} onSort={() => handleSort('retentionRate')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Retention Rate
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('convertedClients') && <TableHead sortable sortDirection={sortColumn === 'convertedClients' ? sortDirection : undefined} onSort={() => handleSort('convertedClients')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Target className="h-4 w-4" />
                        Converted
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('conversionRate') && <TableHead sortable sortDirection={sortColumn === 'conversionRate' ? sortDirection : undefined} onSort={() => handleSort('conversionRate')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Target className="h-4 w-4" />
                        Conversion Rate
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('totalRevenue') && <TableHead sortable sortDirection={sortColumn === 'totalRevenue' ? sortDirection : undefined} onSort={() => handleSort('totalRevenue')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Revenue
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('trials') && <TableHead sortable sortDirection={sortColumn === 'trials' ? sortDirection : undefined} onSort={() => handleSort('trials')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Activity className="h-4 w-4" />
                        Trials
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('referrals') && <TableHead sortable sortDirection={sortColumn === 'referrals' ? sortDirection : undefined} onSort={() => handleSort('referrals')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Referrals
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('hosted') && <TableHead sortable sortDirection={sortColumn === 'hosted' ? sortDirection : undefined} onSort={() => handleSort('hosted')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-4 w-4" />
                        Hosted
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('influencerSignups') && <TableHead sortable sortDirection={sortColumn === 'influencerSignups' ? sortDirection : undefined} onSort={() => handleSort('influencerSignups')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4" />
                        Influencer
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('others') && <TableHead sortable sortDirection={sortColumn === 'others' ? sortDirection : undefined} onSort={() => handleSort('others')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Others
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('averageRevenuePerClient') && <TableHead sortable sortDirection={sortColumn === 'averageRevenuePerClient' ? sortDirection : undefined} onSort={() => handleSort('averageRevenuePerClient')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Percent className="h-4 w-4" />
                        Avg Revenue/Client
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('noShowRate') && <TableHead sortable sortDirection={sortColumn === 'noShowRate' ? sortDirection : undefined} onSort={() => handleSort('noShowRate')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        No Show Rate
                      </div>
                    </TableHead>}
                  {visibleColumns.includes('lateCancellationRate') && <TableHead sortable sortDirection={sortColumn === 'lateCancellationRate' ? sortDirection : undefined} onSort={() => handleSort('lateCancellationRate')} className="text-white font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Late Cancel Rate
                      </div>
                    </TableHead>}
                  <TableHead className="text-white font-semibold text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      Actions
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedData.map((row, index) => {
                const isGroupHeader = (row as any).isGroupHeader;
                return <TableRow key={index} className={`
                        transition-all duration-200 hover:bg-slate-50/80 border-b border-slate-100/50 cursor-pointer
                        ${isGroupHeader ? 'bg-gradient-to-r from-slate-100/80 to-slate-50/80 font-semibold border-l-4 border-l-primary' : ''}
                      `} isGroupHeader={isGroupHeader} onClick={() => !isGroupHeader && handleDrillDown(row, 'teacher', 'all')}>
                      {visibleColumns.includes('teacherName') && <TableCell className="font-medium text-slate-800">
                          {isGroupHeader ? `${groupBy}: ${(row as any).groupValue}` : row.teacherName}
                        </TableCell>}
                      {visibleColumns.includes('location') && <TableCell className="text-slate-700">
                          {isGroupHeader ? '' : row.location}
                        </TableCell>}
                      {visibleColumns.includes('period') && <TableCell className="text-slate-700">
                          {isGroupHeader ? '' : row.period}
                        </TableCell>}
                      {visibleColumns.includes('newClients') && <TableCell className="text-center">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold px-3 py-1 rounded-lg">
                            {row.newClients}
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes('retainedClients') && <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold px-3 py-1 rounded-lg">
                            {row.retainedClients}
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes('retentionRate') && <TableCell className="text-center">
                          {getRetentionBadge(row.retentionRate)}
                        </TableCell>}
                      {visibleColumns.includes('convertedClients') && <TableCell className="text-center">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-semibold px-3 py-1 rounded-lg">
                            {row.convertedClients}
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes('conversionRate') && <TableCell className="text-center">
                          {getConversionBadge(row.conversionRate)}
                        </TableCell>}
                      {visibleColumns.includes('totalRevenue') && <TableCell className="text-center font-semibold text-slate-800">
                          {safeFormatCurrency(row.totalRevenue)}
                        </TableCell>}
                      {visibleColumns.includes('trials') && <TableCell className="text-center font-medium text-slate-800">
                          {row.trials || 0}
                        </TableCell>}
                      {visibleColumns.includes('referrals') && <TableCell className="text-center font-medium text-slate-800">
                          {row.referrals || 0}
                        </TableCell>}
                      {visibleColumns.includes('hosted') && <TableCell className="text-center font-medium text-slate-800">
                          {row.hosted || 0}
                        </TableCell>}
                      {visibleColumns.includes('influencerSignups') && <TableCell className="text-center font-medium text-slate-800">
                          {row.influencerSignups || 0}
                        </TableCell>}
                      {visibleColumns.includes('others') && <TableCell className="text-center font-medium text-slate-800">
                          {row.others || 0}
                        </TableCell>}
                      {visibleColumns.includes('averageRevenuePerClient') && <TableCell className="text-center font-semibold text-slate-800">
                          {safeFormatCurrency(row.averageRevenuePerClient)}
                        </TableCell>}
                      {visibleColumns.includes('noShowRate') && <TableCell className="text-center">
                          <Badge className={`${(row.noShowRate || 0) > 10 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'} font-semibold px-3 py-1 rounded-lg`}>
                            {safeToFixed(row.noShowRate || 0, 1)}%
                          </Badge>
                        </TableCell>}
                      {visibleColumns.includes('lateCancellationRate') && <TableCell className="text-center">
                          <Badge className={`${(row.lateCancellationRate || 0) > 5 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'} font-semibold px-3 py-1 rounded-lg`}>
                            {safeToFixed(row.lateCancellationRate || 0, 1)}%
                          </Badge>
                        </TableCell>}
                      <TableCell className="text-center">
                        {!isGroupHeader && <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleDrillDown(row, 'teacher', 'all');
                      }} className="bg-white/90 hover:bg-white border-slate-200 hover:border-primary/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>}
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
              <TableFooter>
                <TableRow className="border-t-2 border-slate-300/50 bg-gradient-to-r from-slate-800/95 via-slate-700/95 to-slate-800/95 cursor-pointer hover:from-slate-700/95 hover:via-slate-600/95 hover:to-slate-700/95 transition-all duration-200" onClick={() => {
                  // Create a totals object for drill down using the filtered data
                  const totalsData: ProcessedTeacherData = {
                    teacherName: 'All Teachers',
                    location: 'All Locations',
                    period: 'All Periods',
                    newClients: summaryMetrics.totalNewClients,
                    retainedClients: summaryMetrics.totalRetained,
                    convertedClients: summaryMetrics.totalConverted,
                    retentionRate: summaryMetrics.avgRetentionRate,
                    conversionRate: summaryMetrics.avgConversionRate,
                    totalRevenue: summaryMetrics.totalRevenue,
                    averageRevenuePerClient: summaryMetrics.avgRevenuePerClient,
                    trials: summaryMetrics.totalTrials,
                    referrals: summaryMetrics.totalReferrals,
                    hosted: summaryMetrics.totalHosted,
                    influencerSignups: summaryMetrics.totalInfluencerSignups,
                    others: summaryMetrics.totalOthers,
                    noShowRate: summaryMetrics.avgNoShowRate,
                    lateCancellationRate: summaryMetrics.avgLateCancellationRate,
                    firstTimeBuyerRate: 0,
                    influencerConversionRate: 0,
                    referralConversionRate: 0,
                    trialToMembershipConversion: 0,
                    totalVisits: 0,
                    cancellations: 0,
                    lateCancellations: 0,
                    noShows: 0,
                    totalClasses: 0,
                    uniqueClients: 0,
                    newClientDetails: [],
                    retainedClientDetails: [],
                    convertedClientDetails: []
                  };
                  handleDrillDown(totalsData, 'totals', 'all');
                }}>
                  {visibleColumns.includes('teacherName') && <TableCell className="font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>TOTALS</span>
                      </div>
                    </TableCell>}
                  {visibleColumns.includes('location') && <TableCell className="font-bold text-white">-</TableCell>}
                  {visibleColumns.includes('period') && <TableCell className="font-bold text-white">-</TableCell>}
                  {visibleColumns.includes('newClients') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalNewClients}</TableCell>}
                  {visibleColumns.includes('retainedClients') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalRetained}</TableCell>}
                  {visibleColumns.includes('retentionRate') && <TableCell className="text-center font-bold text-white">{safeToFixed(summaryMetrics.avgRetentionRate, 1)}%</TableCell>}
                  {visibleColumns.includes('convertedClients') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalConverted}</TableCell>}
                  {visibleColumns.includes('conversionRate') && <TableCell className="text-center font-bold text-white">{safeToFixed(summaryMetrics.avgConversionRate, 1)}%</TableCell>}
                  {visibleColumns.includes('totalRevenue') && <TableCell className="text-center font-bold text-white">{safeFormatCurrency(summaryMetrics.totalRevenue)}</TableCell>}
                  {visibleColumns.includes('trials') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalTrials}</TableCell>}
                  {visibleColumns.includes('referrals') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalReferrals}</TableCell>}
                  {visibleColumns.includes('hosted') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalHosted}</TableCell>}
                  {visibleColumns.includes('influencerSignups') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalInfluencerSignups}</TableCell>}
                  {visibleColumns.includes('others') && <TableCell className="text-center font-bold text-white">{summaryMetrics.totalOthers}</TableCell>}
                  {visibleColumns.includes('averageRevenuePerClient') && <TableCell className="text-center font-bold text-white">{safeFormatCurrency(summaryMetrics.avgRevenuePerClient)}</TableCell>}
                  {visibleColumns.includes('noShowRate') && <TableCell className="text-center font-bold text-white">{safeToFixed(summaryMetrics.avgNoShowRate, 1)}%</TableCell>}
                  {visibleColumns.includes('lateCancellationRate') && <TableCell className="text-center font-bold text-white">{safeToFixed(summaryMetrics.avgLateCancellationRate, 1)}%</TableCell>}
                  <TableCell className="text-center font-bold text-white">
                    <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20">
                      <Eye className="h-3 w-3 mr-1" />
                      View Totals
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          
          {/* Summary Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">Table Summary:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>{filteredAndSortedData.length}</strong> individual teachers displayed (excluding summary rows)</li>
              <li>• Total new clients: <strong>{summaryMetrics.totalNewClients.toLocaleString()}</strong></li>
              <li>• Average conversion rate: <strong>{safeToFixed(summaryMetrics.avgConversionRate, 1)}%</strong></li>
              <li>• Average retention rate: <strong>{safeToFixed(summaryMetrics.avgRetentionRate, 1)}%</strong></li>
              <li>• Total revenue generated: <strong>{safeFormatCurrency(summaryMetrics.totalRevenue)}</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Drill Down Modal */}
      <DrillDownAnalytics isOpen={isDrillDownOpen} onClose={() => setIsDrillDownOpen(false)} data={drillDownData} type={drillDownType} metricType={drillDownMetricType} />
    </div>;
};

export default ResultsTable;