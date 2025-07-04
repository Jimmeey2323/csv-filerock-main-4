
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { safeToFixed, safeFormatCurrency } from '@/lib/utils';

interface PerformanceMetricCardProps {
  title: string;
  value: string | number;
  secondaryValue?: string;
  icon: React.ReactNode;
  status?: 'positive' | 'neutral' | 'negative';
  tooltip?: string;
  trend?: {
    value: number;
    label?: string;
  };
  onCustomClick?: (e: React.MouseEvent) => void;
  isAnimated?: boolean;
}

const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  secondaryValue,
  icon,
  status,
  tooltip,
  trend,
  onCustomClick,
  isAnimated = true
}) => {
  const getStatusColor = () => {
    if (!status) return 'border-blue-200 hover:border-blue-300';
    if (status === 'positive') return 'border-green-200 hover:border-green-300';
    if (status === 'neutral') return 'border-amber-200 hover:border-amber-300';
    return 'border-red-200 hover:border-red-300';
  };

  const getIconColor = () => {
    if (!status) return 'text-blue-500';
    if (status === 'positive') return 'text-green-500';
    if (status === 'neutral') return 'text-amber-500';
    return 'text-red-500';
  };

  // Safely display the value by ensuring it's a string
  const displayValue = value !== undefined && value !== null ? String(value) : 'N/A';

  return (
    <Card 
      className={`
        bg-white border-2 transition-all duration-300 cursor-pointer
        ${getStatusColor()}
        ${isAnimated ? 'hover:shadow-lg hover:-translate-y-1 hover:scale-105' : ''}
        animate-fade-in
      `} 
      onClick={onCustomClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-700 truncate">{title}</h3>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="max-w-xs text-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-2xl font-bold ${getIconColor()}`}>
                {displayValue}
              </span>
              {secondaryValue && (
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${status === 'positive' ? 'bg-green-50 text-green-700 border border-green-200' : 
                    status === 'neutral' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                    'bg-red-50 text-red-700 border border-red-200'}
                `}>
                  {secondaryValue.includes('%') && <Percent className="mr-1 h-3 w-3" />}
                  {secondaryValue}
                </span>
              )}
            </div>

            {trend && trend.value !== undefined && (
              <div className={`text-xs flex items-center ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {safeToFixed(Math.abs(trend.value), 1)}%
                {trend.label && <span className="ml-1 text-gray-500">{trend.label}</span>}
              </div>
            )}
          </div>
          
          <div className={`${getIconColor()} transition-transform duration-300 ${isAnimated ? 'group-hover:scale-110' : ''}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricCard;
