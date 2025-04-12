
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { RequestLog, RequestStatus } from '@/services/wafService';
import { cn } from '@/lib/utils';

interface RecentLogsProps {
  logs: RequestLog[];
}

const RecentLogs = ({ logs }: RecentLogsProps) => {
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.ALLOWED:
        return "bg-waf-success";
      case RequestStatus.BLOCKED:
        return "bg-waf-danger";
      case RequestStatus.FLAGGED:
        return "bg-waf-warning";
      default:
        return "bg-waf-muted";
    }
  };

  return (
    <Card className="waf-card col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Recent Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {logs.slice(0, 10).map((log) => (
            <div 
              key={log.id} 
              className={cn(
                "border border-zinc-800 rounded-md p-3",
                log.status === RequestStatus.BLOCKED && "border-l-4 border-l-waf-danger",
                log.status === RequestStatus.FLAGGED && "border-l-4 border-l-waf-warning"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn("h-2 w-2 rounded-full", getStatusColor(log.status))} />
                  <span className="font-mono text-sm">{log.ipAddress}</span>
                  {log.country && (
                    <span className="text-xs bg-zinc-800 px-1 rounded">{log.country}</span>
                  )}
                </div>
                <span className="text-xs text-waf-muted">
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </span>
              </div>
              <div className="mt-2 font-mono text-xs text-waf-muted truncate">
                <span className="text-waf-accent">{log.method}</span> {log.path}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={log.status === RequestStatus.BLOCKED ? "destructive" : 
                               log.status === RequestStatus.FLAGGED ? "outline" : "secondary"}>
                  {log.status.toUpperCase()}
                </Badge>
                {log.attackType && (
                  <Badge variant="outline" className="bg-zinc-800">
                    {log.attackType}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentLogs;
