
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AttackType } from '@/services/wafService';

interface AttackDistributionProps {
  data: Record<AttackType, number>;
}

// Enhanced color scheme with better contrast
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#ec4899', // pink
  '#64748b'  // slate
];

// Brighter hover colors for better visibility
const HOVER_COLORS = [
  '#dc2626', // bright red
  '#ea580c', // bright orange
  '#2563eb', // bright blue
  '#16a34a', // bright green
  '#9333ea', // bright purple
  '#db2777', // bright pink
  '#475569'  // bright slate
];

const AttackDistribution = ({ data }: AttackDistributionProps) => {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <Card className="waf-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Attack Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  activeIndex={[]}
                  activeShape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, name, value } = props;
                    return (
                      <g>
                        <text x={cx} y={cy - 15} textAnchor="middle" fill="#fff" className="text-sm font-semibold">
                          {name}
                        </text>
                        <text x={cx} y={cy + 15} textAnchor="middle" fill="#fff" className="text-sm">
                          {value} requests
                        </text>
                      </g>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#0f172a"
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} requests`, 'Blocked']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    borderColor: '#475569',
                    color: '#f8fafc',
                    fontWeight: 'bold',
                    padding: '10px',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  itemStyle={{
                    padding: '4px 0',
                  }}
                  wrapperStyle={{
                    zIndex: 1000,
                  }}
                />
                <Legend 
                  formatter={(value, entry, index) => (
                    <span style={{ color: '#f8fafc', marginLeft: '6px' }}>{value}</span>
                  )}
                  iconSize={10}
                  iconType="circle"
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: '10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-waf-muted">No attacks detected</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttackDistribution;
