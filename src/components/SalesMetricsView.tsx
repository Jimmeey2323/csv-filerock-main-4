import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { safeFormatCurrency, safeToFixed } from '@/lib/utils';
import { 
  DollarSign, 
  Package, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target,
  BarChart3,
  PieChart,
  ShoppingCart,
  CreditCard,
  Users,
  Star,
  Crown,
  Zap,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesMetricsViewProps {
  data: ProcessedTeacherData[];
  paymentsData: any[];
}

interface SalesMetrics {
  totalRevenue: number;
  totalTransactions: number;
  totalUnits: number;
  averageTransactionValue: number;
  averageUnitValue: number;
  unitsPerTransaction: number;
}

interface ProductSales {
  product: string;
  category: string;
  revenue: number;
  transactions: number;
  units: number;
  avgTransactionValue: number;
  avgUnitValue: number;
  upt: number;
  growth?: number;
  previousRevenue?: number;
}

interface LocationSales {
  location: string;
  revenue: number;
  transactions: number;
  units: number;
  avgTransactionValue: number;
  avgUnitValue: number;
  upt: number;
  growth?: number;
  previousRevenue?: number;
}

interface MonthlySales {
  month: string;
  revenue: number;
  transactions: number;
  units: number;
  avgTransactionValue: number;
  growth: number;
  previousRevenue: number;
}

const SalesMetricsView: React.FC<SalesMetricsViewProps> = ({ data, paymentsData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'growth' | 'transactions'>('revenue');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  // Clean and normalize product names
  const cleanProductName = (product: string): string => {
    if (!product) return 'Unknown';
    return product
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Extract category from product name
  const extractCategory = (product: string): string => {
    const cleaned = cleanProductName(product);
    if (cleaned.includes('Class') || cleaned.includes('Session')) return 'Classes';
    if (cleaned.includes('Package') || cleaned.includes('Bundle')) return 'Packages';
    if (cleaned.includes('Membership')) return 'Memberships';
    if (cleaned.includes('Retail') || cleaned.includes('Product')) return 'Retail';
    if (cleaned.includes('Workshop') || cleaned.includes('Event')) return 'Events';
    return 'Other';
  };

  // Process payments data by month with enhanced analytics
  const salesByMonth = useMemo(() => {
    if (!paymentsData || !Array.isArray(paymentsData)) return {};

    const monthlyData: Record<string, {
      products: Record<string, ProductSales>;
      categories: Record<string, ProductSales>;
      locations: Record<string, LocationSales>;
      totals: SalesMetrics;
    }> = {};

    paymentsData.forEach(payment => {
      const date = payment.Date || payment.date || payment['Payment Date'] || payment['Transaction Date'];
      const product = cleanProductName(payment.Product || payment.Item || payment['Product Name'] || 'Unknown');
      const category = extractCategory(product);
      const location = payment.Location || payment.Studio || payment['Studio Location'] || 'Unknown';
      const revenue = parseFloat(payment.Price || payment.Amount || payment.Revenue || payment.Value || payment['Sale value'] || 0);
      const quantity = parseInt(payment.Quantity || payment.Units || payment.Qty || 1);

      if (!date || revenue <= 0) return;

      const month = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!monthlyData[month]) {
        monthlyData[month] = {
          products: {},
          categories: {},
          locations: {},
          totals: {
            totalRevenue: 0,
            totalTransactions: 0,
            totalUnits: 0,
            averageTransactionValue: 0,
            averageUnitValue: 0,
            unitsPerTransaction: 0
          }
        };
      }

      // Update product sales
      if (!monthlyData[month].products[product]) {
        monthlyData[month].products[product] = {
          product,
          category,
          revenue: 0,
          transactions: 0,
          units: 0,
          avgTransactionValue: 0,
          avgUnitValue: 0,
          upt: 0
        };
      }

      monthlyData[month].products[product].revenue += revenue;
      monthlyData[month].products[product].transactions += 1;
      monthlyData[month].products[product].units += quantity;

      // Update category sales
      if (!monthlyData[month].categories[category]) {
        monthlyData[month].categories[category] = {
          product: category,
          category,
          revenue: 0,
          transactions: 0,
          units: 0,
          avgTransactionValue: 0,
          avgUnitValue: 0,
          upt: 0
        };
      }

      monthlyData[month].categories[category].revenue += revenue;
      monthlyData[month].categories[category].transactions += 1;
      monthlyData[month].categories[category].units += quantity;

      // Update location sales
      if (!monthlyData[month].locations[location]) {
        monthlyData[month].locations[location] = {
          location,
          revenue: 0,
          transactions: 0,
          units: 0,
          avgTransactionValue: 0,
          avgUnitValue: 0,
          upt: 0
        };
      }

      monthlyData[month].locations[location].revenue += revenue;
      monthlyData[month].locations[location].transactions += 1;
      monthlyData[month].locations[location].units += quantity;

      // Update totals
      monthlyData[month].totals.totalRevenue += revenue;
      monthlyData[month].totals.totalTransactions += 1;
      monthlyData[month].totals.totalUnits += quantity;
    });

    // Calculate averages and growth rates
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    sortedMonths.forEach((month, index) => {
      const monthData = monthlyData[month];
      const previousMonth = index > 0 ? monthlyData[sortedMonths[index - 1]] : null;

      // Calculate totals averages
      monthData.totals.averageTransactionValue = monthData.totals.totalTransactions > 0 
        ? monthData.totals.totalRevenue / monthData.totals.totalTransactions 
        : 0;
      monthData.totals.averageUnitValue = monthData.totals.totalUnits > 0 
        ? monthData.totals.totalRevenue / monthData.totals.totalUnits 
        : 0;
      monthData.totals.unitsPerTransaction = monthData.totals.totalTransactions > 0 
        ? monthData.totals.totalUnits / monthData.totals.totalTransactions 
        : 0;

      // Calculate product averages and growth
      Object.values(monthData.products).forEach(product => {
        product.avgTransactionValue = product.transactions > 0 ? product.revenue / product.transactions : 0;
        product.avgUnitValue = product.units > 0 ? product.revenue / product.units : 0;
        product.upt = product.transactions > 0 ? product.units / product.transactions : 0;
        
        // Calculate growth
        if (previousMonth && previousMonth.products[product.product]) {
          const prevRevenue = previousMonth.products[product.product].revenue;
          product.previousRevenue = prevRevenue;
          product.growth = prevRevenue > 0 ? ((product.revenue - prevRevenue) / prevRevenue) * 100 : 0;
        }
      });

      // Calculate category averages and growth
      Object.values(monthData.categories).forEach(category => {
        category.avgTransactionValue = category.transactions > 0 ? category.revenue / category.transactions : 0;
        category.avgUnitValue = category.units > 0 ? category.revenue / category.units : 0;
        category.upt = category.transactions > 0 ? category.units / category.transactions : 0;
        
        // Calculate growth
        if (previousMonth && previousMonth.categories[category.product]) {
          const prevRevenue = previousMonth.categories[category.product].revenue;
          category.previousRevenue = prevRevenue;
          category.growth = prevRevenue > 0 ? ((category.revenue - prevRevenue) / prevRevenue) * 100 : 0;
        }
      });

      // Calculate location averages and growth
      Object.values(monthData.locations).forEach(location => {
        location.avgTransactionValue = location.transactions > 0 ? location.revenue / location.transactions : 0;
        location.avgUnitValue = location.units > 0 ? location.revenue / location.units : 0;
        location.upt = location.transactions > 0 ? location.units / location.transactions : 0;
        
        // Calculate growth
        if (previousMonth && previousMonth.locations[location.location]) {
          const prevRevenue = previousMonth.locations[location.location].revenue;
          location.previousRevenue = prevRevenue;
          location.growth = prevRevenue > 0 ? ((location.revenue - prevRevenue) / prevRevenue) * 100 : 0;
        }
      });
    });

    return monthlyData;
  }, [paymentsData]);

  // Get all months sorted
  const allMonths = useMemo(() => {
    return Object.keys(salesByMonth).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [salesByMonth]);

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    return allMonths.map((month, index) => {
      const monthData = salesByMonth[month];
      const previousMonth = index > 0 ? salesByMonth[allMonths[index - 1]] : null;
      
      let growth = 0;
      if (previousMonth && previousMonth.totals.totalRevenue > 0) {
        growth = ((monthData.totals.totalRevenue - previousMonth.totals.totalRevenue) / previousMonth.totals.totalRevenue) * 100;
      }

      return {
        month,
        revenue: monthData.totals.totalRevenue,
        transactions: monthData.totals.totalTransactions,
        units: monthData.totals.totalUnits,
        avgTransactionValue: monthData.totals.averageTransactionValue,
        growth,
        previousRevenue: previousMonth ? previousMonth.totals.totalRevenue : 0
      } as MonthlySales;
    });
  }, [allMonths, salesByMonth]);

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    return allMonths.reduce((acc, month) => {
      const monthData = salesByMonth[month];
      if (monthData) {
        acc.totalRevenue += monthData.totals.totalRevenue;
        acc.totalTransactions += monthData.totals.totalTransactions;
        acc.totalUnits += monthData.totals.totalUnits;
      }
      return acc;
    }, {
      totalRevenue: 0,
      totalTransactions: 0,
      totalUnits: 0,
      averageTransactionValue: 0,
      averageUnitValue: 0,
      unitsPerTransaction: 0
    });
  }, [allMonths, salesByMonth]);

  // Calculate derived metrics
  overallTotals.averageTransactionValue = overallTotals.totalTransactions > 0 
    ? overallTotals.totalRevenue / overallTotals.totalTransactions 
    : 0;
  overallTotals.averageUnitValue = overallTotals.totalUnits > 0 
    ? overallTotals.totalRevenue / overallTotals.totalUnits 
    : 0;
  overallTotals.unitsPerTransaction = overallTotals.totalTransactions > 0 
    ? overallTotals.totalUnits / overallTotals.totalTransactions 
    : 0;

  // Get top performers with growth analysis
  const getTopPerformers = (type: 'products' | 'categories' | 'locations', limit: number = 10) => {
    const allItems: any[] = [];
    
    allMonths.forEach(month => {
      const monthData = salesByMonth[month];
      if (monthData) {
        Object.values(monthData[type]).forEach(item => {
          const existingItem = allItems.find(existing => 
            type === 'locations' ? existing.location === (item as any).location : existing.product === (item as any).product
          );
          
          if (existingItem) {
            existingItem.revenue += item.revenue;
            existingItem.transactions += item.transactions;
            existingItem.units += item.units;
            if (item.growth !== undefined) {
              existingItem.totalGrowth = (existingItem.totalGrowth || 0) + item.growth;
              existingItem.growthCount = (existingItem.growthCount || 0) + 1;
            }
          } else {
            allItems.push({ 
              ...item,
              totalGrowth: item.growth || 0,
              growthCount: item.growth !== undefined ? 1 : 0
            });
          }
        });
      }
    });

    // Calculate averages and average growth
    allItems.forEach(item => {
      item.avgTransactionValue = item.transactions > 0 ? item.revenue / item.transactions : 0;
      item.avgUnitValue = item.units > 0 ? item.revenue / item.units : 0;
      item.upt = item.transactions > 0 ? item.units / item.transactions : 0;
      item.avgGrowth = item.growthCount > 0 ? item.totalGrowth / item.growthCount : 0;
    });

    // Sort based on selected criteria
    return allItems.sort((a, b) => {
      switch (sortBy) {
        case 'growth':
          return (b.avgGrowth || 0) - (a.avgGrowth || 0);
        case 'transactions':
          return b.transactions - a.transactions;
        default:
          return b.revenue - a.revenue;
      }
    }).slice(0, limit);
  };

  // Filter data based on search and period
  const filterData = (items: any[]) => {
    let filtered = items;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.product && item.product.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  };

  // Render enhanced sales table with growth indicators
  const renderSalesTable = (items: any[], type: 'product' | 'category' | 'location', title: string) => {
    const filteredItems = filterData(items);
    
    if (!filteredItems || filteredItems.length === 0) {
      return (
        <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardTitle className="flex items-center gap-2">
              {type === 'product' && <Package className="h-5 w-5" />}
              {type === 'category' && <Target className="h-5 w-5" />}
              {type === 'location' && <MapPin className="h-5 w-5" />}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      );
    }

    const sortedItems = filteredItems.sort((a, b) => {
      switch (sortBy) {
        case 'growth':
          return (b.avgGrowth || 0) - (a.avgGrowth || 0);
        case 'transactions':
          return b.transactions - a.transactions;
        default:
          return b.revenue - a.revenue;
      }
    });

    return (
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === 'product' && <Package className="h-5 w-5" />}
              {type === 'category' && <Target className="h-5 w-5" />}
              {type === 'location' && <MapPin className="h-5 w-5" />}
              {title}
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {sortedItems.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                  <TableHead className="text-white font-semibold">
                    {type === 'location' ? 'Location' : type === 'category' ? 'Category' : 'Product'}
                  </TableHead>
                  {type === 'product' && <TableHead className="text-white font-semibold">Category</TableHead>}
                  <TableHead className="text-white font-semibold text-right">Revenue</TableHead>
                  <TableHead className="text-white font-semibold text-right">Growth</TableHead>
                  <TableHead className="text-white font-semibold text-right">Transactions</TableHead>
                  <TableHead className="text-white font-semibold text-right">Units</TableHead>
                  <TableHead className="text-white font-semibold text-right">Avg Transaction</TableHead>
                  <TableHead className="text-white font-semibold text-right">UPT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                    <TableCell className="font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {index < 3 && <Crown className="h-4 w-4 text-amber-500" />}
                        {type === 'location' ? item.location : item.product}
                      </div>
                    </TableCell>
                    {type === 'product' && (
                      <TableCell>
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                          {item.category}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-semibold text-slate-800">
                      {safeFormatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.avgGrowth !== undefined ? (
                        <Badge className={`${item.avgGrowth >= 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} flex items-center gap-1`}>
                          {item.avgGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {safeToFixed(Math.abs(item.avgGrowth), 1)}%
                        </Badge>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {item.transactions.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {item.units.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-800">
                      {safeFormatCurrency(item.avgTransactionValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        {safeToFixed(item.upt, 2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Early return if no payments data
  if (!paymentsData || !Array.isArray(paymentsData) || paymentsData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-medium mb-2">No Sales Data Available</h3>
                <p className="text-muted-foreground">
                  No payments data available for sales metrics analysis. Please ensure you've uploaded a payments/sales CSV file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allMonths.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No sales data available for the selected period.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-100/80 to-emerald-50/80 border-b border-green-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-800">
              {safeFormatCurrency(overallTotals.totalRevenue)}
            </div>
            <p className="text-xs text-green-600 mt-1">All periods</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-blue-50/80 border-b border-blue-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <CreditCard className="h-4 w-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-blue-800">
              {overallTotals.totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">Total transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-100/80 to-violet-50/80 border-b border-purple-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Package className="h-4 w-4" />
              Units Sold
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-purple-800">
              {overallTotals.totalUnits.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">Total units</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-3 bg-gradient-to-r from-amber-100/80 to-orange-50/80 border-b border-amber-200/50">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <BarChart3 className="h-4 w-4" />
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-amber-800">
              {safeFormatCurrency(overallTotals.averageTransactionValue)}
            </div>
            <p className="text-xs text-amber-600 mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Controls */}
      <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-luxury rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-white/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent font-bold">
              Sales Analytics Controls
            </span>
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: 'revenue' | 'growth' | 'transactions') => setSortBy(value)}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="growth">Growth Rate</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="bg-white/90 border-white/40 focus:border-primary/50 rounded-xl">
                <SelectValue placeholder="Filter period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {allMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSortBy('revenue');
                setFilterPeriod('all');
              }}
              className="bg-white/90 border-white/40 hover:bg-white/95 rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Sales Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-white/40 shadow-sm rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2 rounded-lg">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2 rounded-lg">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 rounded-lg">
            <Target className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2 rounded-lg">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="performers" className="flex items-center gap-2 rounded-lg">
            <Award className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {allMonths.map(month => {
              const monthData = salesByMonth[month];
              if (!monthData) return null;

              return (
                <Card key={month} className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {month} - Sales Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="text-sm text-green-700 flex items-center gap-2 font-medium">
                          <DollarSign className="h-4 w-4" />
                          Total Revenue
                        </div>
                        <div className="text-2xl font-bold text-green-800 mt-1">
                          {safeFormatCurrency(monthData.totals.totalRevenue)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-700 font-medium">Transactions</div>
                        <div className="text-2xl font-bold text-blue-800 mt-1">
                          {monthData.totals.totalTransactions.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="text-sm text-purple-700 font-medium">Units Sold</div>
                        <div className="text-2xl font-bold text-purple-800 mt-1">
                          {monthData.totals.totalUnits.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                        <div className="text-sm text-amber-700 font-medium">Avg Transaction</div>
                        <div className="text-2xl font-bold text-amber-800 mt-1">
                          {safeFormatCurrency(monthData.totals.averageTransactionValue)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                        <div className="text-sm text-red-700 font-medium">Avg Unit Value</div>
                        <div className="text-2xl font-bold text-red-800 mt-1">
                          {safeFormatCurrency(monthData.totals.averageUnitValue)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                        <div className="text-sm text-teal-700 font-medium">UPT</div>
                        <div className="text-2xl font-bold text-teal-800 mt-1">
                          {safeToFixed(monthData.totals.unitsPerTransaction, 2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/20">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Sales Trends & Growth Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/20">
                      <TableHead className="text-white font-semibold">Month</TableHead>
                      <TableHead className="text-white font-semibold text-right">Revenue</TableHead>
                      <TableHead className="text-white font-semibold text-right">Growth</TableHead>
                      <TableHead className="text-white font-semibold text-right">Transactions</TableHead>
                      <TableHead className="text-white font-semibold text-right">Avg Transaction</TableHead>
                      <TableHead className="text-white font-semibold text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyTrends.map((trend, index) => (
                      <TableRow key={trend.month} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                        <TableCell className="font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            {trend.month}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-800">
                          {safeFormatCurrency(trend.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {index > 0 ? (
                            <Badge className={`${trend.growth >= 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} flex items-center gap-1 justify-center`}>
                              {trend.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {safeToFixed(Math.abs(trend.growth), 1)}%
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {trend.transactions.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          {safeFormatCurrency(trend.avgTransactionValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            {trend.units.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="border-t-2 border-slate-300/50 bg-gradient-to-r from-slate-800/95 via-slate-700/95 to-slate-800/95">
                      <TableCell className="font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          TOTALS
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {safeFormatCurrency(overallTotals.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {monthlyTrends.length > 1 ? (
                          <Badge className="bg-white/20 text-white border-white/30">
                            Avg: {safeToFixed(monthlyTrends.slice(1).reduce((sum, t) => sum + t.growth, 0) / (monthlyTrends.length - 1), 1)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {overallTotals.totalTransactions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {safeFormatCurrency(overallTotals.averageTransactionValue)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {overallTotals.totalUnits.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-6">
            {allMonths.map(month => {
              const monthData = salesByMonth[month];
              if (!monthData) return null;

              return (
                <div key={month}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {month}
                  </h3>
                  {renderSalesTable(Object.values(monthData.products), 'product', 'Sales by Product')}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-6">
            {allMonths.map(month => {
              const monthData = salesByMonth[month];
              if (!monthData) return null;

              return (
                <div key={month}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {month}
                  </h3>
                  {renderSalesTable(Object.values(monthData.categories), 'category', 'Sales by Category')}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <div className="space-y-6">
            {allMonths.map(month => {
              const monthData = salesByMonth[month];
              if (!monthData) return null;

              return (
                <div key={month}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {month}
                  </h3>
                  {renderSalesTable(Object.values(monthData.locations), 'location', 'Sales by Location')}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="performers">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury overflow-hidden rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Top 10 Products (All Time)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Rank</TableHead>
                          <TableHead className="font-semibold">Product</TableHead>
                          <TableHead className="font-semibold text-right">Revenue</TableHead>
                          <TableHead className="font-semibold text-right">Growth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTopPerformers('products', 10).map((product, index) => (
                          <TableRow key={index} className="hover:bg-slate-50/80">
                            <TableCell>
                              <Badge className={`${index < 3 ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : 'bg-slate-100 text-slate-700'} flex items-center gap-1`}>
                                {index < 3 && <Star className="h-3 w-3" />}
                                #{index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{product.product}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {safeFormatCurrency(product.revenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.avgGrowth !== undefined ? (
                                <Badge className={`${product.avgGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center gap-1`}>
                                  {product.avgGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {safeToFixed(Math.abs(product.avgGrowth), 1)}%
                                </Badge>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Locations */}
              <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-luxury overflow-hidden rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top 10 Locations (All Time)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Rank</TableHead>
                          <TableHead className="font-semibold">Location</TableHead>
                          <TableHead className="font-semibold text-right">Revenue</TableHead>
                          <TableHead className="font-semibold text-right">Growth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTopPerformers('locations', 10).map((location, index) => (
                          <TableRow key={index} className="hover:bg-slate-50/80">
                            <TableCell>
                              <Badge className={`${index < 3 ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : 'bg-slate-100 text-slate-700'} flex items-center gap-1`}>
                                {index < 3 && <Star className="h-3 w-3" />}
                                #{index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{location.location}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {safeFormatCurrency(location.revenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {location.avgGrowth !== undefined ? (
                                <Badge className={`${location.avgGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center gap-1`}>
                                  {location.avgGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {safeToFixed(Math.abs(location.avgGrowth), 1)}%
                                </Badge>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesMetricsView;