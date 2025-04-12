
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, icon, description, className, trend }: StatsCardProps) => {
  return (
    <Card className={cn("waf-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-waf-muted">{title}</CardTitle>
        {icon && <div className="h-5 w-5 text-waf-muted">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-waf-muted">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-1">
            <span className={cn(
              "text-xs",
              trend.isPositive ? "text-waf-success" : "text-waf-danger"
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </span>
            <span className="text-xs text-waf-muted ml-1">from last 24h</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
