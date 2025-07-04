import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { TrendingUp, Users, Calendar, Target, Award, DollarSign, BarChart3, PieChart, Activity, Zap, Sparkles, Crown, Star } from 'lucide-react';
import { safeToFixed, safeFormatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MonthlyMetricsViewProps {
  data: ProcessedTeacherData[];
}

const MonthlyMetricsView: React.FC<MonthlyMetricsViewProps> = ({
  data
}) => {
  const [selectedMetric, setSelectedMetric] = useState('visits');

  // Filter out "All Teachers" rows from data processing
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.teacherName && 
      item.teacherName.toLowerCase() !== 'all teachers' &&
      item.teacherName.toLowerCase() !== 'all trainers' &&
      item.teacherName.toLowerCase() !== 'total' &&
      item.teacherName.toLowerCase() !== 'summary'
    );
  }, [data]);

  // Group data by teacher and month with proper null checks - using filtered data
  const monthlyData = useMemo(() => {
    if (!filteredData || !Array.isArray(filteredData)) {
      return {};
    }
    const grouped = filteredData.reduce((acc, item) => {
      if (!item || !item.teacherName) {
        return acc;
      }
      const month = item.period || 'Unknown';
      const teacher = item.teacherName;
      if (!acc[teacher]) {
        acc[teacher] = {};
      }
      if (!acc[teacher][month]) {
        acc[teacher][month] = {
          visits: 0,
          cancellations: 0,
          lateCancellations: 0,
          noShows: 0,
          newMembers: 0,
          retained: 0,
          converted: 0,
          classes: 0,
          uniqueMembers: 0,
          revenue: 0,
          retentionRate: 0,
          conversionRate: 0
        };
      }
      acc[teacher][month].visits += item.totalVisits || 0;
      acc[teacher][month].cancellations += item.cancellations || 0;
      acc[teacher][month].lateCancellations += item.lateCancellations || 0;
      acc[teacher][month].noShows += item.noShows || 0;
      acc[teacher][month].newMembers += item.newClients || 0;
      acc[teacher][month].retained += item.retainedClients || 0;
      acc[teacher][month].converted += item.convertedClients || 0;
      acc[teacher][month].classes += item.totalClasses || 0;
      acc[teacher][month].uniqueMembers += item.uniqueClients || 0;
      acc[teacher][month].revenue += item.totalRevenue || 0;
      acc[teacher][month].retentionRate = item.retentionRate || 0;
      acc[teacher][month].conversionRate = item.conversionRate || 0;
      return acc;
    }, {} as Record<string, Record<string, any>>);
    return grouped;
  }, [filteredData]);

  // Get all unique months sorted with null checks
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    if (monthlyData && typeof monthlyData === 'object') {
      Object.values(monthlyData).forEach(teacherData => {
        if (teacherData && typeof teacherData === 'object') {
          Object.keys(teacherData).forEach(month => {
            if (month) months.add(month);
          });
        }
      });
    }
    return Array.from(months).sort();
  }, [monthlyData]);

  // Get all teachers with null checks
  const teachers = useMemo(() => {
    if (!monthlyData || typeof monthlyData !== 'object') {
      return [];
    }
    return Object.keys(monthlyData).filter(teacher => teacher && teacher.trim() !== '');
  }, [monthlyData]);

  // Calculate totals for each month and metric
  const calculateTotals = (metric: string) => {
    if (!allMonths || !teachers || !monthlyData) {
      return [];
    }
    return allMonths.map(month => {
      const total = teachers.reduce((sum, teacher) => {
        const teacherData = monthlyData[teacher];
        const monthData = teacherData && teacherData[month];
        return sum + (monthData && monthData[metric] ? monthData[metric] : 0);
      }, 0);
      return {
        month,
        total
      };
    });
  };

  // Calculate summary statistics - using filtered data
  const totalMetrics = useMemo(() => {
    if (!filteredData || !Array.isArray(filteredData)) {
      return {
        totalVisits: 0,
        totalNewMembers: 0,
        totalConverted: 0,
        totalRetained: 0,
        totalRevenue: 0,
        totalClasses: 0,
        avgRetentionRate: 0,
        avgConversionRate: 0
      };
    }
    const totals = filteredData.reduce((acc, item) => {
      if (!item) return acc;
      acc.totalVisits += item.totalVisits || 0;
      acc.totalNewMembers += item.newClients || 0;
      acc.totalConverted += item.convertedClients || 0;
      acc.totalRetained += item.retainedClients || 0;
      acc.totalRevenue += item.totalRevenue || 0;
      acc.totalClasses += item.totalClasses || 0;
      return acc;
    }, {
      totalVisits: 0,
      totalNewMembers: 0,
      totalConverted: 0,
      totalRetained: 0,
      totalRevenue: 0,
      totalClasses: 0
    });
    return {
      ...totals,
      avgRetentionRate: totals.totalNewMembers > 0 ? totals.totalRetained / totals.totalNewMembers * 100 : 0,
      avgConversionRate: totals.totalNewMembers > 0 ? totals.totalConverted / totals.totalNewMembers * 100 : 0
    };
  }, [filteredData]);

  // Metric configurations
  const metrics = [{
    key: 'visits',
    label: 'Total Visits',
    icon: <Activity className="h-4 w-4" />,
    color: 'from-blue-500 to-blue-600',
    formatter: (value: number) => value.toLocaleString()
  }, {
    key: 'newMembers',
    label: 'New Members',
    icon: <Users className="h-4 w-4" />,
    color: 'from-green-500 to-emerald-600',
    formatter: (value: number) => value.toLocaleString()
  }, {
    key: 'retained',
    label: 'Retained Members',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'from-teal-500 to-cyan-600',
    formatter: (value: number) => value.toLocaleString()
  }, {
    key: 'converted',
    label: 'Converted Members',
    icon: <Target className="h-4 w-4" />,
    color: 'from-purple-500 to-violet-600',
    formatter: (value: number) => value.toLocaleString()
  }, {
    key: 'revenue',
    label: 'Revenue',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'from-amber-500 to-orange-500',
    formatter: (value: number) => safeFormatCurrency(value)
  }, {
    key: 'retentionRate',
    label: 'Retention Rate (%)',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'from-indigo-500 to-blue-600',
    formatter: (value: number) => `${safeToFixed(value, 1)}%`
  }, {
    key: 'conversionRate',
    label: 'Conversion Rate (%)',
    icon: <PieChart className="h-4 w-4" />,
    color: 'from-rose-500 to-pink-600',
    formatter: (value: number) => `${safeToFixed(value, 1)}%`
  }, {
    key: 'classes',
    label: 'Classes Taught',
    icon: <Award className="h-4 w-4" />,
    color: 'from-violet-500 to-purple-600',
    formatter: (value: number) => value.toLocaleString()
  }];
  
  const selectedMetricConfig = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // Render metric table
  const renderMetricTable = () => {
    const totals = calculateTotals(selectedMetric);
    const totalSum = totals.reduce((sum, t) => sum + (t?.total || 0), 0);
    
    return (
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/20">
          <CardTitle className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedMetricConfig.color} shadow-lg`}>
              {selectedMetricConfig.icon}
            </div>
            <div>
              <div className="text-xl font-bold flex items-center gap-2 text-white">
                {selectedMetricConfig.label}
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
              <div className="text-sm text-white/80 font-medium">Month-on-Month Analysis</div>
            </div>
            <Badge className="ml-auto bg-white/20 text-white border-white/30 px-4 py-2 font-bold">
              <Crown className="h-4 w-4 mr-2" />
              Total: {selectedMetricConfig.formatter(totalSum)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                  <TableHead className="text-white font-bold text-center min-w-[140px] px-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Teacher
                    </div>
                  </TableHead>
                  {allMonths.map(month => (
                    <TableHead key={month} className="text-white font-bold text-center min-w-[140px] px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {month}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-white font-bold text-center min-w-[140px] px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      Total
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher, index) => {
                  const teacherTotal = allMonths.reduce((sum, month) => {
                    const teacherData = monthlyData[teacher];
                    const monthData = teacherData && teacherData[month];
                    return sum + (monthData && monthData[selectedMetric] ? monthData[selectedMetric] : 0);
                  }, 0);
                  
                  return (
                    <TableRow 
                      key={teacher} 
                      className="animate-fade-in border-b border-slate-200/30 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white/90 transition-all duration-300" 
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-bold sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-r border-slate-200/30 min-w-[180px] text-slate-800 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${selectedMetricConfig.color} shadow-sm`}></div>
                          <span className="truncate">{teacher}</span>
                        </div>
                      </TableCell>
                      {allMonths.map(month => {
                        const teacherData = monthlyData[teacher];
                        const monthData = teacherData && teacherData[month];
                        const value = monthData && monthData[selectedMetric] ? monthData[selectedMetric] : 0;
                        return (
                          <TableCell key={month} className="text-center min-w-[140px] font-semibold text-slate-800 px-4">
                            <Badge className={`bg-gradient-to-r ${selectedMetricConfig.color} text-white shadow-md hover:shadow-lg transition-all duration-200 px-3 py-1 font-bold`}>
                              {selectedMetricConfig.formatter(value)}
                            </Badge>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold min-w-[140px] bg-slate-50/80 border-l border-slate-200/50 text-slate-800 sticky right-0 z-10">
                        <Badge className="bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg px-3 py-1 font-bold">
                          {selectedMetricConfig.formatter(teacherTotal)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="border-t-2 border-slate-300/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                  <TableCell className="font-bold sticky left-0 z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-r border-white/20 min-w-[180px] text-white px-6">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span className="font-bold">Total</span>
                    </div>
                  </TableCell>
                  {totals.map(({ month, total }) => (
                    <TableCell key={month} className="text-center font-bold text-white min-w-[140px] px-4">
                      <span className="font-bold text-lg">
                        {selectedMetricConfig.formatter(total)}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-white min-w-[140px] bg-slate-600/20 border-l border-white/30 sticky right-0 z-20">
                    <span className="font-bold text-lg">
                      {selectedMetricConfig.formatter(totalSum)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Early return if no data
  if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="animate-fade-in bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No data available for monthly metrics view.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-blue-50/80 border-b border-blue-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <Activity className="h-4 w-4" />
              Total Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-blue-800">{totalMetrics.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">Across all teachers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-green-100/80 to-emerald-50/80 border-b border-green-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <Users className="h-4 w-4" />
              New Members
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-800">{totalMetrics.totalNewMembers.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">New acquisitions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-100/80 to-violet-50/80 border-b border-purple-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-purple-800">{totalMetrics.totalConverted.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-bold">
                <Star className="h-3 w-3 mr-1" />
                {safeToFixed(totalMetrics.avgConversionRate, 1)}%
              </Badge>
              <span className="text-xs text-purple-600 font-medium">avg rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-amber-100/80 to-orange-50/80 border-b border-amber-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-amber-800">{safeFormatCurrency(totalMetrics.totalRevenue)}</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">Generated revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Metric Selector */}
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold text-xl">
              Monthly Metrics Analysis
            </span>
            <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
              {metrics.map(metric => (
                <TabsTrigger 
                  key={metric.key} 
                  value={metric.key} 
                  className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg hover:bg-white/80"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color} text-white shadow-md`}>
                    {metric.icon}
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{metric.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Monthly Metrics Table */}
      {renderMetricTable()}
    </div>
  );
};

export default MonthlyMetricsView;