
import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  LayoutGrid, 
  List, 
  BarChart, 
  PieChart,
  Calendar,
  SlidersHorizontal,
  User,
  Store,
  MapPin,
  Eye,
  ArrowUpDown,
  Settings,
  Sparkles
} from 'lucide-react';

interface TableViewOptionsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onGroupByChange: (field: string) => void;
  onVisibilityChange: (columns: string[]) => void;
  onSortChange: (column: string, direction: 'asc' | 'desc') => void;
  availableColumns: string[];
  visibleColumns: string[];
  activeGroupBy: string;
  activeSort: { column: string; direction: 'asc' | 'desc' };
}

const TableViewOptions: React.FC<TableViewOptionsProps> = ({
  activeView,
  onViewChange,
  onGroupByChange,
  onVisibilityChange,
  onSortChange,
  availableColumns,
  visibleColumns,
  activeGroupBy,
  activeSort
}) => {
  const views = [
    { id: 'table', label: 'Table', icon: Table },
    { id: 'cards', label: 'Cards', icon: LayoutGrid },
    { id: 'detailed', label: 'Detailed', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'trends', label: 'Trends', icon: PieChart },
  ];

  const handleColumnVisibilityChange = (column: string, isChecked: boolean) => {
    if (isChecked) {
      onVisibilityChange([...visibleColumns, column]);
    } else {
      onVisibilityChange(visibleColumns.filter(col => col !== column));
    }
  };

  const handleGroupByChange = (value: string) => {
    console.log('TableViewOptions: Group by changed to:', value);
    onGroupByChange(value);
  };

  const getGroupByDisplayName = (value: string) => {
    switch (value) {
      case 'teacherName': return 'Teacher';
      case 'location': return 'Location';
      case 'period': return 'Period';
      case 'none': return 'None';
      default: return value.charAt(0).toUpperCase() + value.slice(1);
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl shadow-luxury border border-white/30">
        {/* Glassmorphic background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60 backdrop-blur-xl" />
        
        {/* Subtle animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-pulse-soft" />
        
        {/* Content */}
        <div className="relative flex justify-between items-center p-4">
          <Tabs value={activeView} onValueChange={onViewChange} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-white/60 backdrop-blur-md border border-white/40 shadow-subtle">
              {views.map(view => (
                <TabsTrigger 
                  key={view.id} 
                  value={view.id} 
                  className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white/90 data-[state=active]:shadow-md data-[state=active]:backdrop-blur-xl data-[state=active]:border data-[state=active]:border-white/50 hover:bg-white/70 group"
                >
                  <view.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="font-medium bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">{view.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-3 ml-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 gap-3 bg-white/80 hover:bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:border-white/60 transition-all duration-300 hover:shadow-md hover:scale-[1.02] group"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Settings className="h-4 w-4 text-slate-600 transition-transform duration-300 group-hover:rotate-45" />
                      <Sparkles className="h-2 w-2 text-blue-500 absolute -top-1 -right-1 opacity-60 animate-pulse-soft" />
                    </div>
                    <span className="text-slate-700 font-medium">Table Options</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-white/40 shadow-luxury animate-scale-in rounded-xl overflow-hidden">
                {/* Premium header with gradient */}
                <div className="bg-gradient-to-r from-slate-50/80 to-white/90 p-3 border-b border-white/30">
                  <DropdownMenuLabel className="text-slate-800 font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse-soft" />
                    Table Configuration
                  </DropdownMenuLabel>
                </div>
                
                <div className="p-1 space-y-1">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white/90 transition-all duration-300 rounded-lg group">
                      <SlidersHorizontal className="mr-3 h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">Group By</span>
                      {activeGroupBy && activeGroupBy !== 'none' && (
                        <Badge variant="luxury" className="ml-auto animate-fade-in">
                          {getGroupByDisplayName(activeGroupBy)}
                        </Badge>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-white/95 backdrop-blur-xl border-white/40 shadow-luxury animate-scale-in rounded-xl overflow-hidden">
                        <DropdownMenuRadioGroup value={activeGroupBy} onValueChange={handleGroupByChange}>
                          <DropdownMenuRadioItem value="none" className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg">
                            <span className="mr-3 h-4 w-4" />
                            <span className="font-medium">None</span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="teacherName" className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg group">
                            <User className="mr-3 h-4 w-4 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-medium">Teacher</span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="location" className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg group">
                            <MapPin className="mr-3 h-4 w-4 text-green-500 transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-medium">Location</span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="period" className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg group">
                            <Calendar className="mr-3 h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-medium">Period</span>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white/90 transition-all duration-300 rounded-lg group">
                      <Eye className="mr-3 h-4 w-4 text-violet-500 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">Column Visibility</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-h-80 overflow-y-auto bg-white/95 backdrop-blur-xl border-white/40 shadow-luxury animate-scale-in rounded-xl">
                        <div className="p-2 space-y-1">
                          {availableColumns.map(column => (
                            <DropdownMenuCheckboxItem
                              key={column}
                              checked={visibleColumns.includes(column)}
                              onCheckedChange={(checked) => 
                                handleColumnVisibilityChange(column, checked as boolean)
                              }
                              className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg font-medium"
                            >
                              {column}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white/90 transition-all duration-300 rounded-lg group">
                      <ArrowUpDown className="mr-3 h-4 w-4 text-cyan-500 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">Sort By</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-white/95 backdrop-blur-xl border-white/40 shadow-luxury animate-scale-in rounded-xl">
                        <div className="p-2 space-y-1">
                          {availableColumns.map(column => (
                            <DropdownMenuSub key={column}>
                              <DropdownMenuSubTrigger className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 justify-between transition-all duration-300 rounded-lg group">
                                <span className="font-medium">{column}</span>
                                {activeSort.column === column && (
                                  <Badge variant="luxury" className="ml-auto animate-fade-in">
                                    {activeSort.direction === 'asc' ? 'Asc' : 'Desc'}
                                  </Badge>
                                )}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-white/95 backdrop-blur-xl border-white/40 shadow-luxury animate-scale-in rounded-xl">
                                  <DropdownMenuItem 
                                    onClick={() => onSortChange(column, 'asc')}
                                    className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg group"
                                  >
                                    <ArrowUpDown className="mr-3 h-4 w-4 rotate-180 text-slate-600 transition-transform duration-300 group-hover:scale-110" />
                                    <span className="font-medium">Ascending</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => onSortChange(column, 'desc')}
                                    className="hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 transition-all duration-300 rounded-lg group"
                                  >
                                    <ArrowUpDown className="mr-3 h-4 w-4 text-slate-600 transition-transform duration-300 group-hover:scale-110" />
                                    <span className="font-medium">Descending</span>
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                          ))}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableViewOptions;
