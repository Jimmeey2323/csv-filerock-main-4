import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ComposedChart, Line } from 'recharts';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { Target, Award, TrendingUp, TrendingDown, Users, Star, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { safeToFixed, safeFormatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PerformanceInsightsViewProps {
  data: ProcessedTeacherData[];
}

const PerformanceInsightsView: React.FC<PerformanceInsightsViewProps> = ({
  data
}) => {
  // Performance analysis calculations - filter out "All Trainers" rows
  const performanceData = React.useMemo(() => {
    // Filter out any "All Trainers" or summary rows
    const filteredData = data.filter(item => 
      item.teacherName && 
      item.teacherName.toLowerCase() !== 'all trainers' &&
      item.teacherName.toLowerCase() !== 'total' &&
      item.teacherName.toLowerCase() !== 'summary'
    );

    // Group by teacher and calculate performance metrics
    const teacherPerformance = filteredData.reduce((acc, item) => {
      if (!acc[item.teacherName]) {
        acc[item.teacherName] = {
          teacherName: item.teacherName,
          location: item.location,
          totalRevenue: 0,
          totalVisits: 0,
          newClients: 0,
          convertedClients: 0,
          retainedClients: 0,
          noShows: 0,
          cancellations: 0,
          totalClasses: 0
        };
      }
      const teacher = acc[item.teacherName];
      teacher.totalRevenue += item.totalRevenue || 0;
      teacher.totalVisits += item.totalVisits || 0;
      teacher.newClients += item.newClients || 0;
      teacher.convertedClients += item.convertedClients || 0;
      teacher.retainedClients += item.retainedClients || 0;
      teacher.noShows += item.noShows || 0;
      teacher.cancellations += item.cancellations || 0;
      teacher.totalClasses += item.totalClasses || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate performance scores and rankings
    return Object.values(teacherPerformance).map((teacher: any) => {
      const conversionRate = teacher.newClients > 0 ? teacher.convertedClients / teacher.newClients * 100 : 0;
      const retentionRate = teacher.newClients > 0 ? teacher.retainedClients / teacher.newClients * 100 : 0;
      const noShowRate = teacher.totalVisits > 0 ? teacher.noShows / teacher.totalVisits * 100 : 0;
      const cancellationRate = teacher.totalVisits > 0 ? teacher.cancellations / teacher.totalVisits * 100 : 0;
      const revenuePerClient = teacher.newClients > 0 ? teacher.totalRevenue / teacher.newClients : 0;
      const classUtilization = teacher.totalClasses > 0 ? teacher.totalVisits / teacher.totalClasses : 0;

      // Performance score calculation (weighted)
      const performanceScore = conversionRate * 0.25 + retentionRate * 0.25 + (100 - noShowRate) * 0.15 + (100 - cancellationRate) * 0.15 + Math.min(revenuePerClient / 100, 100) * 0.1 + Math.min(classUtilization / 10, 100) * 0.1;
      
      return {
        ...teacher,
        conversionRate: safeToFixed(conversionRate, 1),
        retentionRate: safeToFixed(retentionRate, 1),
        noShowRate: safeToFixed(noShowRate, 1),
        cancellationRate: safeToFixed(cancellationRate, 1),
        revenuePerClient: safeToFixed(revenuePerClient, 0),
        classUtilization: safeToFixed(classUtilization, 1),
        performanceScore: safeToFixed(performanceScore, 1)
      };
    }).sort((a, b) => parseFloat(b.performanceScore) - parseFloat(a.performanceScore));
  }, [data]);

  // Top performers and insights
  const topPerformer = performanceData[0];
  const averagePerformance = performanceData.reduce((sum, p) => sum + parseFloat(p.performanceScore), 0) / performanceData.length;

  // Performance categories
  const highPerformers = performanceData.filter(p => parseFloat(p.performanceScore) > averagePerformance + 10);
  const lowPerformers = performanceData.filter(p => parseFloat(p.performanceScore) < averagePerformance - 10);

  // Chart configurations
  const chartConfig = {
    performanceScore: {
      label: 'Performance Score',
      color: 'hsl(var(--chart-1))'
    },
    conversionRate: {
      label: 'Conversion Rate',
      color: 'hsl(var(--chart-2))'
    },
    retentionRate: {
      label: 'Retention Rate',
      color: 'hsl(var(--chart-3))'
    },
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-4))'
    }
  };

  // Performance distribution data for pie chart
  const performanceDistribution = [{
    name: 'High Performers',
    value: highPerformers.length,
    color: 'hsl(var(--chart-1))'
  }, {
    name: 'Average Performers',
    value: performanceData.length - highPerformers.length - lowPerformers.length,
    color: 'hsl(var(--chart-2))'
  }, {
    name: 'Low Performers',
    value: lowPerformers.length,
    color: 'hsl(var(--chart-3))'
  }];

  // Calculate totals for the footer
  const totals = React.useMemo(() => {
    return performanceData.reduce((acc, teacher) => {
      acc.totalRevenue += teacher.totalRevenue;
      acc.totalVisits += teacher.totalVisits;
      acc.newClients += teacher.newClients;
      acc.convertedClients += teacher.convertedClients;
      acc.retainedClients += teacher.retainedClients;
      acc.noShows += teacher.noShows;
      acc.cancellations += teacher.cancellations;
      acc.totalClasses += teacher.totalClasses;
      return acc;
    }, {
      totalRevenue: 0,
      totalVisits: 0,
      newClients: 0,
      convertedClients: 0,
      retainedClients: 0,
      noShows: 0,
      cancellations: 0,
      totalClasses: 0
    });
  }, [performanceData]);

  const avgConversionRate = totals.newClients > 0 ? totals.convertedClients / totals.newClients * 100 : 0;
  const avgRetentionRate = totals.newClients > 0 ? totals.retainedClients / totals.newClients * 100 : 0;
  const avgNoShowRate = totals.totalVisits > 0 ? totals.noShows / totals.totalVisits * 100 : 0;
  const avgRevenuePerClient = totals.newClients > 0 ? totals.totalRevenue / totals.newClients : 0;
  const avgClassUtilization = totals.totalClasses > 0 ? totals.totalVisits / totals.totalClasses : 0;

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Star className="h-4 w-4 text-yellow-500" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">{topPerformer?.teacherName || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{topPerformer?.performanceScore || 0} score</Badge>
              <span className="text-xs text-muted-foreground">{topPerformer?.location || ''}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in border-l-4 border-l-blue-500" style={{
        animationDelay: '100ms'
      }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              High Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPerformers.length}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {safeToFixed(highPerformers.length / performanceData.length * 100, 0)}% of team
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in border-l-4 border-l-orange-500" style={{
        animationDelay: '200ms'
      }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToFixed(averagePerformance, 1)}</div>
            <Progress value={averagePerformance} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="animate-fade-in border-l-4 border-l-red-500" style={{
        animationDelay: '300ms'
      }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowPerformers.length}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">trainers need support</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in" style={{
        animationDelay: '400ms'
      }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Performance Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={performanceDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({
                  name,
                  value
                }) => `${name}: ${value}`}>
                    {performanceDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{
        animationDelay: '500ms'
      }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Performance vs Revenue Correlation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={performanceData} margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
              }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" dataKey="performanceScore" name="Performance Score" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="number" dataKey="totalRevenue" name="Revenue" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip cursor={{
                  strokeDasharray: '3 3'
                }} content={<ChartTooltipContent formatter={(value, name, props) => [name === 'totalRevenue' ? safeFormatCurrency(value as number) : value, name === 'totalRevenue' ? 'Revenue' : 'Performance Score']} labelFormatter={(_, props) => props?.[0]?.payload?.teacherName || ''} />} />
                  <Scatter dataKey="totalRevenue" fill="var(--color-revenue)" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Rankings */}
      <Card className="animate-fade-in" style={{
      animationDelay: '600ms'
    }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Teacher Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80
            }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="teacherName" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="performanceScore" fill="var(--color-performanceScore)" name="Performance Score" />
                <Line type="monotone" dataKey="conversionRate" stroke="var(--color-conversionRate)" strokeWidth={2} dot={{
                fill: 'var(--color-conversionRate)',
                r: 4
              }} name="Conversion Rate (%)" />
                <Line type="monotone" dataKey="retentionRate" stroke="var(--color-retentionRate)" strokeWidth={2} dot={{
                fill: 'var(--color-retentionRate)',
                r: 4
              }} name="Retention Rate (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Performance Table */}
      <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="h-5 w-5 text-primary" />
            Detailed Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table maxHeight="500px">
            <TableHeader>
              <TableRow className="bg-zinc-900 whitespace-nowrap">
                <TableHead className="w-16 text-center text-white">Rank</TableHead>
                <TableHead className="min-w-[160px] text-white">Teacher</TableHead>
                <TableHead className="min-w-[120px] text-white">Location</TableHead>
                <TableHead className="w-24 text-center text-white">Score</TableHead>
                <TableHead className="w-24 text-center text-white">Conv %</TableHead>
                <TableHead className="w-24 text-center text-white">Ret %</TableHead>
                <TableHead className="w-24 text-center text-white">No Show %</TableHead>
                <TableHead className="w-28 text-center text-white">Rev/Client</TableHead>
                <TableHead className="w-24 text-center text-white">Util</TableHead>
                <TableHead className="w-20 text-center text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((teacher, index) => {
                const isHigh = highPerformers.includes(teacher);
                const isLow = lowPerformers.includes(teacher);
                return (
                  <TableRow key={teacher.teacherName} className="animate-fade-in border-b border-slate-200/30" style={{ animationDelay: `${800 + index * 50}ms` }}>
                    <TableCell className="text-center">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs">
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">{teacher.teacherName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{teacher.location}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-slate-800">{teacher.performanceScore}</span>
                        {parseFloat(teacher.performanceScore) > averagePerformance ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-800">{teacher.conversionRate}%</TableCell>
                    <TableCell className="text-center font-medium text-slate-800">{teacher.retentionRate}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={parseFloat(teacher.noShowRate) > 10 ? "destructive" : "secondary"} className="text-xs">
                        {teacher.noShowRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-800">{safeFormatCurrency(parseFloat(teacher.revenuePerClient))}</TableCell>
                    <TableCell className="text-center font-medium text-slate-800">{teacher.classUtilization}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isHigh ? "default" : isLow ? "destructive" : "secondary"} className="flex items-center gap-1 text-xs">
                        {isHigh ? <Star className="h-3 w-3" /> : isLow ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {isHigh ? 'High' : isLow ? 'Low' : 'Avg'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="border-t-2 border-slate-300/50 bg-gradient-to-r from-slate-800/95 via-slate-700/95 to-slate-800/95">
                <TableCell className="font-bold text-white text-center" colSpan={3}>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>TOTALS / AVERAGE</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold text-white">{safeToFixed(averagePerformance, 1)}</TableCell>
                <TableCell className="text-center font-bold text-white">{safeToFixed(avgConversionRate, 1)}%</TableCell>
                <TableCell className="text-center font-bold text-white">{safeToFixed(avgRetentionRate, 1)}%</TableCell>
                <TableCell className="text-center font-bold text-white">{safeToFixed(avgNoShowRate, 1)}%</TableCell>
                <TableCell className="text-center font-bold text-white">{safeFormatCurrency(avgRevenuePerClient)}</TableCell>
                <TableCell className="text-center font-bold text-white">{safeToFixed(avgClassUtilization, 1)}</TableCell>
                <TableCell className="text-center font-bold text-white">{performanceData.length}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          
          {/* Summary Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">Performance Summary:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>{highPerformers.length}</strong> high performers ({safeToFixed(highPerformers.length / performanceData.length * 100, 0)}% of team)</li>
              <li>• Average team performance score: <strong>{safeToFixed(averagePerformance, 1)}</strong></li>
              <li>• Team conversion rate: <strong>{safeToFixed(avgConversionRate, 1)}%</strong></li>
              <li>• Team retention rate: <strong>{safeToFixed(avgRetentionRate, 1)}%</strong></li>
              <li>• <strong>{lowPerformers.length}</strong> teachers need performance support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceInsightsView;
