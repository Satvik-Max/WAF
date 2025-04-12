
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from 'date-fns';

interface TrafficChartProps {
  data: Array<{
    timestamp: Date;
    count: number;
    blocked: number;
  }>;
}

const TrafficChart = ({ data }: TrafficChartProps) => {
  const formattedData = data.map(item => ({
    time: format(new Date(item.timestamp), 'HH:00'),
    all: item.count,
    blocked: item.blocked,
    allowed: item.count - item.blocked,
  }));

  return (
    <Card className="waf-card col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Traffic Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc'
                }} 
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="allowed" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="blocked" 
                stackId="1" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;
