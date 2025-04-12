import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import wafService, { AttackType, RequestStatus } from '@/services/wafService';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestFilterProps {
  onTest: (result: RequestStatus) => void;
}

const RequestFilter = ({ onTest }: RequestFilterProps) => {
  const [request, setRequest] = useState({
    path: "/api/users?id=1",
    method: "GET",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0"
  });
  
  const [isIPBlocked, setIsIPBlocked] = useState(false);

  useEffect(() => {
    const checkIPStatus = () => {
      setIsIPBlocked(wafService.isIPBlocked(request.ipAddress));
    };
    
    checkIPStatus();
    
    window.addEventListener('blockedIPsChanged', checkIPStatus);
    
    return () => {
      window.removeEventListener('blockedIPsChanged', checkIPStatus);
    };
  }, [request.ipAddress]);

  const handleTest = () => {
    if (isIPBlocked) {
      toast.error("Request Blocked", {
        description: `IP ${request.ipAddress} is blocked and cannot make requests.`
      });
      onTest(RequestStatus.BLOCKED);
      return;
    }
    
    const result = wafService.processRequest(request);
    onTest(result);
    
    switch (result) {
      case RequestStatus.BLOCKED:
        toast.error("Request Blocked", {
          description: "This request was identified as a potential threat."
        });
        break;
      case RequestStatus.FLAGGED:
        toast.warning("Request Flagged", {
          description: "This request was flagged for review."
        });
        break;
      case RequestStatus.ALLOWED:
        toast.success("Request Allowed", {
          description: "This request passed all security checks."
        });
        break;
    }
  };

  const injectAttack = (type: AttackType) => {
    let payload = "";
    
    switch (type) {
      case AttackType.SQL_INJECTION:
        payload = "' OR 1=1 --";
        setRequest({...request, path: `/api/users?id=${payload}`});
        break;
      case AttackType.XSS:
        payload = "<script>alert('XSS')</script>";
        setRequest({...request, path: `/search?q=${payload}`});
        break;
      case AttackType.PATH_TRAVERSAL:
        payload = "../../../etc/passwd";
        setRequest({...request, path: `/download?file=${payload}`});
        break;
      case AttackType.COMMAND_INJECTION:
        payload = "; cat /etc/passwd";
        setRequest({...request, path: `/process?cmd=${payload}`});
        break;
      default:
        break;
    }
  };

  return (
    <Card className="waf-card bg-gradient-to-br from-indigo-950 to-purple-900 border border-indigo-500/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-900/60 to-purple-800/50 rounded-t-lg border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-300" />
          <CardTitle className="text-lg font-medium text-indigo-100">Request Tester</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {isIPBlocked && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-md p-3 flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-300" />
            <p className="text-sm text-red-200">
              This IP address is blocked and cannot make requests.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-indigo-200">Path</label>
            <Input
              value={request.path}
              onChange={e => setRequest({...request, path: e.target.value})}
              className="bg-indigo-950/70 border-indigo-700/50 text-white font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-indigo-200">Method</label>
              <Select 
                onValueChange={method => setRequest({...request, method})}
                defaultValue={request.method}
              >
                <SelectTrigger className="bg-indigo-950/70 border-indigo-700/50 text-white">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border-indigo-700/50">
                  <SelectItem value="GET" className="text-white">GET</SelectItem>
                  <SelectItem value="POST" className="text-white">POST</SelectItem>
                  <SelectItem value="PUT" className="text-white">PUT</SelectItem>
                  <SelectItem value="DELETE" className="text-white">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-indigo-200">IP Address</label>
              <Input
                value={request.ipAddress}
                onChange={e => setRequest({...request, ipAddress: e.target.value})}
                className={cn(
                  "bg-indigo-950/70 border-indigo-700/50 text-white font-mono",
                  isIPBlocked && "border-red-500 bg-red-900/30"
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-indigo-200">User Agent</label>
            <Input
              value={request.userAgent}
              onChange={e => setRequest({...request, userAgent: e.target.value})}
              className="bg-indigo-950/70 border-indigo-700/50 text-white font-mono text-xs"
            />
          </div>
          <Button 
            onClick={handleTest} 
            disabled={isIPBlocked}
            className={cn(
              "w-full",
              isIPBlocked
                ? "bg-gray-700 hover:bg-gray-700 cursor-not-allowed opacity-70"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            Test Request
          </Button>
          <div className="pt-2">
            <p className="text-sm text-indigo-300 mb-2">Quick Attack Tests:</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="request-tester-btn text-xs bg-red-900/40 text-red-100 border-red-700/50 hover:bg-red-800/60"
                onClick={() => injectAttack(AttackType.SQL_INJECTION)}
              >
                SQL Injection
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="request-tester-btn text-xs bg-orange-900/40 text-orange-100 border-orange-700/50 hover:bg-orange-800/60"
                onClick={() => injectAttack(AttackType.XSS)}
              >
                XSS
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="request-tester-btn text-xs bg-blue-900/40 text-blue-100 border-blue-700/50 hover:bg-blue-800/60"
                onClick={() => injectAttack(AttackType.PATH_TRAVERSAL)}
              >
                Path Traversal
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="request-tester-btn text-xs bg-green-900/40 text-green-100 border-green-700/50 hover:bg-green-800/60"
                onClick={() => injectAttack(AttackType.COMMAND_INJECTION)}
              >
                Cmd Injection
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestFilter;
