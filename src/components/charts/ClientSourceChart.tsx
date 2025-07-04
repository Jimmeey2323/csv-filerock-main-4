
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface ClientSourceChartProps {
  data: { source: string; count: number }[];
}

const COLORS = ['#4f46e5', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#EC4899', '#8B5CF6', '#10B981'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.8}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={5} textAnchor={textAnchor} fill="#333" fontSize={13}>
        {`${payload.source}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={25} textAnchor={textAnchor} fill="#333" fontSize={13}>
        {`${value} clients (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const ClientSourceChart: React.FC<ClientSourceChartProps> = ({ data }) => {
  const { toast } = useToast();
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!data || data.length === 0 || data.every(item => item.count === 0)) {
    return (
      <Card className="w-full h-[350px] animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Client Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No client source data available</p>
        </CardContent>
      </Card>
    );
  }

  // Filter out zero values
  const filteredData = data.filter(item => item.count > 0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieClick = (data: any) => {
    toast({
      title: "Client Source Details",
      description: `${data.name}: ${data.value} clients (${(data.percent * 100).toFixed(0)}%)`,
    });
  };

  const totalClients = filteredData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="w-full h-[350px] animate-fade-in bg-white/60 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>Client Acquisition Sources</span>
          <span className="text-sm font-normal text-muted-foreground">{totalClients} total clients</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              onMouseEnter={onPieEnter}
              onClick={onPieClick}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [`${value} clients`, props.payload.source]}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ClientSourceChart;
