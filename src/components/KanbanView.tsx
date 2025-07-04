
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, MapPin, Calendar, TrendingUp, TrendingDown, DollarSign, Users, Settings, Search } from 'lucide-react';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { safeFormatCurrency, safeFormatDate } from '@/lib/utils';

interface KanbanViewProps {
  data: ProcessedTeacherData[];
}

const KanbanView: React.FC<KanbanViewProps> = ({ data }) => {
  const [groupBy, setGroupBy] = useState<'location' | 'period' | 'performance'>('location');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'conversion' | 'retention' | 'revenue'>('name');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Group data based on selected grouping
  const groupedData = useMemo(() => {
    const groups: Record<string, ProcessedTeacherData[]> = {};
    
    filteredData.forEach(item => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'location':
          groupKey = item.location || 'Unknown Location';
          break;
        case 'period':
          groupKey = item.period || 'Unknown Period';
          break;
        case 'performance':
          const conversionRate = item.conversionRate || 0;
          const retentionRate = item.retentionRate || 0;
          const avgPerformance = (conversionRate + retentionRate) / 2;
          
          if (avgPerformance >= 70) groupKey = 'High Performance (70%+)';
          else if (avgPerformance >= 50) groupKey = 'Medium Performance (50-70%)';
          else groupKey = 'Needs Improvement (<50%)';
          break;
        default:
          groupKey = 'Others';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    // Sort items within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.teacherName || '').localeCompare(b.teacherName || '');
          case 'conversion':
            return (b.conversionRate || 0) - (a.conversionRate || 0);
          case 'retention':
            return (b.retentionRate || 0) - (a.retentionRate || 0);
          case 'revenue':
            return (b.totalRevenue || 0) - (a.totalRevenue || 0);
          default:
            return 0;
        }
      });
    });

    return groups;
  }, [filteredData, groupBy, sortBy]);

  const getPerformanceBadge = (conversionRate: number, retentionRate: number) => {
    const avgPerformance = (conversionRate + retentionRate) / 2;
    
    if (avgPerformance >= 70) {
      return <Badge variant="success" className="gap-1">
        <TrendingUp className="h-3 w-3" />
        High Performer
      </Badge>;
    } else if (avgPerformance >= 50) {
      return <Badge variant="warning" className="gap-1">
        <TrendingUp className="h-3 w-3" />
        Good Performer
      </Badge>;
    } else {
      return <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Needs Focus
      </Badge>;
    }
  };

  const renderTeacherCard = (teacher: ProcessedTeacherData) => (
    <Card key={`${teacher.teacherName}-${teacher.location}-${teacher.period}`} className="mb-3 hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary/30">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{teacher.teacherName || 'Unknown Teacher'}</span>
            </div>
            {getPerformanceBadge(teacher.conversionRate || 0, teacher.retentionRate || 0)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{teacher.location || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{teacher.period || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">{teacher.conversionRate?.toFixed(1) || '0'}%</div>
              <div className="text-xs text-blue-600">Conversion</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-700">{teacher.retentionRate?.toFixed(1) || '0'}%</div>
              <div className="text-xs text-green-600">Retention</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold">{teacher.newClients || 0}</div>
              <div className="text-muted-foreground">New</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{teacher.convertedClients || 0}</div>
              <div className="text-muted-foreground">Converted</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{teacher.retainedClients || 0}</div>
              <div className="text-muted-foreground">Retained</div>
            </div>
          </div>

          {teacher.totalRevenue && (
            <div className="flex items-center justify-center gap-1 pt-2 border-t">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="font-semibold text-green-700">
                {safeFormatCurrency(teacher.totalRevenue)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kanban View Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-by">Group By</Label>
              <Select value={groupBy} onValueChange={(value: 'location' | 'period' | 'performance') => setGroupBy(value)}>
                <SelectTrigger id="group-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="period">Time Period</SelectItem>
                  <SelectItem value="performance">Performance Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: 'name' | 'conversion' | 'retention' | 'revenue') => setSortBy(value)}>
                <SelectTrigger id="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Teacher Name</SelectItem>
                  <SelectItem value="conversion">Conversion Rate</SelectItem>
                  <SelectItem value="retention">Retention Rate</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search Teachers</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by teacher name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(groupedData).map(([groupName, teachers]) => (
          <Card key={groupName} className="flex flex-col">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold">{groupName}</span>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {teachers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <ScrollArea className="h-[600px] pr-2">
                {teachers.length > 0 ? (
                  teachers.map(renderTeacherCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No teachers in this group</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No teachers match your search criteria.' : 'No teacher data available to display.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KanbanView;
