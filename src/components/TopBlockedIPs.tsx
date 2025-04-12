
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import wafService from '@/services/wafService';
import { Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface TopBlockedIPsProps {
  data: Array<{ ip: string; count: number }>;
}

const TopBlockedIPs = ({ data }: TopBlockedIPsProps) => {
  const [blockedIPs, setBlockedIPs] = React.useState<Set<string>>(
    new Set(wafService.getBlockedIPs())
  );

  // Update blocked IPs when data changes or from localStorage
  useEffect(() => {
    const handleBlockedIPsChange = () => {
      setBlockedIPs(new Set(wafService.getBlockedIPs()));
    };

    // Register event listener for real-time updates
    window.addEventListener('blockedIPsChanged', handleBlockedIPsChange);
    
    // Initial set
    handleBlockedIPsChange();
    
    return () => {
      window.removeEventListener('blockedIPsChanged', handleBlockedIPsChange);
    };
  }, [data]);

  const handleToggleBlock = (ip: string) => {
    const newBlockedIPs = new Set(blockedIPs);
    
    if (newBlockedIPs.has(ip)) {
      newBlockedIPs.delete(ip);
      wafService.toggleBlockIP(ip, false);
      toast.success(`IP ${ip} has been unblocked`);
    } else {
      newBlockedIPs.add(ip);
      wafService.toggleBlockIP(ip, true);
      toast.error(`IP ${ip} has been blocked`);
    }
    
    setBlockedIPs(newBlockedIPs);
  };

  return (
    <Card className="waf-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-waf-danger" />
          <CardTitle className="text-lg font-medium">Top Blocked IPs</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map(({ ip, count }) => (
              <div key={ip} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <div 
                      className={cn(
                        "h-2 w-2 rounded-full mr-2",
                        blockedIPs.has(ip) 
                          ? "bg-waf-danger animate-threat-ping" 
                          : "bg-waf-muted"
                      )}
                    />
                    <span className="font-mono text-sm">{ip}</span>
                  </div>
                  <p className="text-xs text-waf-muted ml-4">Blocked {count} times</p>
                </div>
                <Button 
                  variant={blockedIPs.has(ip) ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleToggleBlock(ip)}
                  className="flex items-center gap-1"
                >
                  {blockedIPs.has(ip) ? (
                    <>
                      <ShieldOff className="h-3.5 w-3.5 mr-1" />
                      <span>Unblock</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      <span>Block</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-waf-muted">No blocked IPs</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopBlockedIPs;
