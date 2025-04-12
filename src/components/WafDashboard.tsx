
import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import StatsCard from './StatsCard';
import TrafficChart from './TrafficChart';
import AttackDistribution from './AttackDistribution';
import TopBlockedIPs from './TopBlockedIPs';
import RecentLogs from './RecentLogs';
import FirewallRules from './FirewallRules';
import RequestFilter from './RequestFilter';
import AISecurityInsights from './AISecurityInsights';
import wafService, { RequestStatus } from '@/services/wafService';

const WafDashboard = () => {
  const [stats, setStats] = useState(wafService.getStats());
  const [logs, setLogs] = useState(wafService.getLogs());
  const [rules, setRules] = useState(wafService.getRules());
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    setStats(wafService.getStats());
    setLogs(wafService.getLogs());
    setRules(wafService.getRules());
  }, [updateTrigger]);

  const handleTestRequest = (result: RequestStatus) => {
    // Trigger a refresh of the data
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon={<Activity />}
          description="Total requests processed"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Blocked Requests"
          value={stats.blockedRequests.toLocaleString()}
          icon={<Shield />}
          description="Malicious requests blocked"
          className="border-l-waf-danger border-l-4"
          trend={{ value: 12, isPositive: false }}
        />
        <StatsCard
          title="Flagged Requests"
          value={stats.flaggedRequests.toLocaleString()}
          icon={<AlertTriangle />}
          description="Suspicious requests flagged"
          className="border-l-waf-warning border-l-4"
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Success Rate"
          value={`${((stats.allowedRequests / stats.totalRequests) * 100).toFixed(1)}%`}
          icon={<CheckCircle />}
          description="Clean requests passed through"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart data={stats.requestsOverTime} />
        </div>
        <div>
          <AISecurityInsights logs={logs} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AttackDistribution data={stats.attacksByType} />
        <TopBlockedIPs data={stats.topBlockedIPs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentLogs logs={logs} />
        <RequestFilter onTest={handleTestRequest} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FirewallRules rules={rules} />
      </div>
    </div>
  );
};

export default WafDashboard;
