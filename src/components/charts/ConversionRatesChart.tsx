
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConversionRateData {
  name: string;
  retention: number;
  conversion: number;
  trial: number;
  referral: number;
  influencer: number;
}

interface ConversionRatesChartProps {
  data: ConversionRateData[];
}

const ConversionRatesChart: React.FC<ConversionRatesChartProps> = ({ data }) => {
  const COLORS = {
    retention: '#4f46e5',
    conversion: '#10B981',
    trial: '#F59E0B',
    referral: '#EC4899',
    influencer: '#8B5CF6'
  };

  // Format data for the chart
  const formattedData = data.map(item => ({
    name: item.name,
    'Retention Rate': item.retention,
    'Conversion Rate': item.conversion,
    'Trial Conversion': item.trial,
    'Referral Conversion': item.referral,
    'Influencer Conversion': item.influencer,
  }));

  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[350px] animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Conversion Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No conversion data available</p>
        </CardContent>
      </Card>
    );
  }

  console.log("Conversion rates chart data:", formattedData);

  return (
    <Card className="w-full animate-fade-in bg-white/60 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Conversion Rate Comparison by Teacher
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Retention Rate" fill={COLORS.retention} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Conversion Rate" fill={COLORS.conversion} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Trial Conversion" fill={COLORS.trial} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Referral Conversion" fill={COLORS.referral} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Influencer Conversion" fill={COLORS.influencer} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionRatesChart;

