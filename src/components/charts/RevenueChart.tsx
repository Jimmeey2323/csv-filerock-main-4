
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChevronUp, CreditCard } from 'lucide-react';

interface RevenueChartProps {
  data: { week: string; revenue: number }[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  useEffect(() => {
    // Debug log the chart data
    console.log("Revenue chart received data:", data);
  }, [data]);

  if (!data || data.length === 0) {
    console.log("No revenue data available for the chart");
    return (
      <Card className="w-full h-[350px] animate-fade-in bg-white/80 backdrop-blur-sm shadow-sm border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
            Revenue by Week
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format dates to be more readable and sort them
  const formattedData = data.map(item => {
    console.log(`Formatting date: ${item.week} with revenue: ${item.revenue}`);
    
    // Ensure revenue is a valid number
    const safeRevenue = typeof item.revenue === 'number' && !isNaN(item.revenue) 
      ? item.revenue 
      : 0;
      
    return {
      ...item,
      revenue: safeRevenue,
      weekLabel: item.week ? new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
    };
  });

  // Sort data by date
  const sortedData = [...formattedData].sort((a, b) => {
    if (!a.week) return -1;
    if (!b.week) return 1;
    return new Date(a.week).getTime() - new Date(b.week).getTime();
  });

  // Calculate total revenue safely
  const totalRevenue = sortedData.reduce((sum, item) => {
    return sum + (typeof item.revenue === 'number' ? item.revenue : 0);
  }, 0);
  
  // Calculate percent change
  const percentChange = sortedData.length > 1 ? 
    ((sortedData[sortedData.length-1].revenue - sortedData[0].revenue) / sortedData[0].revenue * 100).toFixed(1) : 0;
  
  const isPositiveChange = parseFloat(percentChange as string) >= 0;
  
  console.log("Revenue chart processed data:", sortedData);
  console.log("Total revenue for chart:", totalRevenue);

  const getBarColor = (index: number) => {
    // Create a gradient of blues for the bars
    const baseColors = [
      '#2563eb', // Blue-600
      '#3b82f6', // Blue-500
      '#60a5fa', // Blue-400
      '#93c5fd', // Blue-300
      '#bfdbfe', // Blue-200
      '#dbeafe', // Blue-100
    ];
    
    // Use modulo to cycle through colors for many bars
    return baseColors[index % baseColors.length];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm">{`Week of ${label}`}</p>
          <p className="font-medium text-lg">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-[350px] animate-fade-in bg-white/80 backdrop-blur-sm shadow-sm border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
            Revenue by Week
          </CardTitle>
          <div className="flex items-center">
            <span className="text-2xl font-bold mr-2 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              ₹{totalRevenue.toLocaleString()}
            </span>
            {percentChange !== '0' && (
              <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isPositiveChange ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPositiveChange ? <ChevronUp className="h-3 w-3 mr-0.5" /> : null}
                {isPositiveChange ? '+' : ''}{percentChange}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[270px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              barGap={8}
              barCategoryGap={16}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis 
                dataKey="weekLabel"
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                width={80}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="url(#revenueGradient)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                animationDuration={1500}
                animationBegin={200}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} className="hover:brightness-110 transition-all duration-300" />
                ))}
                <LabelList dataKey="revenue" position="top" formatter={(value: number) => `₹${value >= 1000 ? `${Math.floor(value/1000)}k` : value}`} fill="#64748b" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
