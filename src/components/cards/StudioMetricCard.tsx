
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { safeToFixed, safeFormatCurrency } from '@/lib/utils';

interface StudioMetricCardProps {
  title: string;
  value: string | number;
  location: string;
  metrics?: {
    label: string;
    value: string | number;
    status?: 'positive' | 'neutral' | 'negative';
  }[];
  icon: React.ReactNode;
  tooltip?: string;
  onCustomClick?: (e: React.MouseEvent) => void;
  formatType?: 'date' | 'currency' | 'number' | 'percent' | 'default';
  variant?: 'default' | 'elevated' | 'premium';
}

const StudioMetricCard: React.FC<StudioMetricCardProps> = ({
  title,
  value,
  location,
  metrics = [],
  icon,
  tooltip,
  onCustomClick,
  formatType = 'default',
  variant = 'default',
}) => {
  // Format value based on formatType
  const formatDisplayValue = (val: string | number): string => {
    if (val === undefined || val === null) return 'N/A';
    
    if (typeof val === 'string' && val.trim() === '') return 'N/A';
    
    switch(formatType) {
      case 'date':
        return val ? new Date(String(val)).toLocaleDateString() : 'N/A';
      case 'currency':
        return safeFormatCurrency(val);
      case 'number':
        return typeof val === 'number' ? val.toLocaleString() : String(val);
      case 'percent':
        return typeof val === 'number' ? `${safeToFixed(val, 1)}%` : String(val);
      default:
        return String(val);
    }
  };

  // Safely display the value by ensuring it's a string
  const displayValue = formatDisplayValue(value);

  const cardClasses = {
    default: "card-hover bg-white/60 backdrop-blur-sm",
    elevated: "card-hover bg-white/80 backdrop-blur-sm shadow-md",
    premium: "card-hover bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-sm shadow-md border-primary/10",
  };

  return (
    <Card 
      className={cardClasses[variant]}
      onClick={onCustomClick} // Use the prop if provided
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              {title}
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="max-w-xs text-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayValue}
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-1">
              {location}
            </div>
          </div>
          <div className="text-primary">
            {icon}
          </div>
        </div>
        
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {metrics.map((metric, index) => {
              // Safely convert metric value to string
              const metricDisplayValue = formatDisplayValue(metric.value);
                
              return (
                <div key={index} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className={`text-sm font-medium ${
                    metric.status === 'positive' ? 'text-green-600' : 
                    metric.status === 'negative' ? 'text-red-600' : 
                    'text-amber-600'
                  }`}>
                    {metricDisplayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudioMetricCard;
