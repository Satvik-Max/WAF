import { toast } from "sonner";

// Attack pattern types
export enum AttackType {
  SQL_INJECTION = "SQL Injection",
  XSS = "Cross-Site Scripting",
  PATH_TRAVERSAL = "Path Traversal",
  COMMAND_INJECTION = "Command Injection",
  SUSPICIOUS_IP = "Suspicious IP",
  RATE_LIMIT = "Rate Limit Exceeded",
  OTHER = "Other Threat"
}

// Request status
export enum RequestStatus {
  ALLOWED = "allowed",
  BLOCKED = "blocked",
  FLAGGED = "flagged"
}

// Firewall rule interface
export interface FirewallRule {
  id: string;
  name: string;
  pattern: string;
  type: AttackType;
  action: "block" | "allow" | "flag";
  enabled: boolean;
  createdAt: Date;
}

// Request log interface
export interface RequestLog {
  id: string;
  timestamp: Date;
  ipAddress: string;
  path: string;
  method: string;
  userAgent: string;
  status: RequestStatus;
  attackType?: AttackType;
  country?: string;
  processed: boolean;
}

// Stats interface
export interface WafStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  flaggedRequests: number;
  attacksByType: Record<AttackType, number>;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  requestsOverTime: Array<{ timestamp: Date; count: number; blocked: number }>;
}

// Custom event for blocked IPs changes
const createBlockedIPsChangedEvent = () => new CustomEvent('blockedIPsChanged');

class WafService {
  private rules: FirewallRule[] = [];
  private logs: RequestLog[] = [];
  private blockedIPs: Set<string> = new Set();
  private stats: WafStats = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    flaggedRequests: 0,
    attacksByType: {
      [AttackType.SQL_INJECTION]: 0,
      [AttackType.XSS]: 0,
      [AttackType.PATH_TRAVERSAL]: 0,
      [AttackType.COMMAND_INJECTION]: 0,
      [AttackType.SUSPICIOUS_IP]: 0,
      [AttackType.RATE_LIMIT]: 0,
      [AttackType.OTHER]: 0
    },
    topBlockedIPs: [],
    requestsOverTime: []
  };

  constructor() {
    this.loadFromLocalStorage();
    
    // If no stored data was found, initialize with defaults
    if (this.rules.length === 0) {
      this.initializeDefaultRules();
    }
    
    if (this.logs.length === 0) {
      this.generateMockData();
    }
  }

  // Load data from localStorage
  private loadFromLocalStorage() {
    try {
      // Load rules
      const storedRules = localStorage.getItem('waf_rules');
      if (storedRules) {
        this.rules = JSON.parse(storedRules, (key, value) => {
          // Convert ISO date strings back to Date objects
          if (key === 'createdAt' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
      }

      // Load logs
      const storedLogs = localStorage.getItem('waf_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs, (key, value) => {
          // Convert ISO date strings back to Date objects
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
      }

      // Load blocked IPs
      const storedBlockedIPs = localStorage.getItem('waf_blocked_ips');
      if (storedBlockedIPs) {
        this.blockedIPs = new Set(JSON.parse(storedBlockedIPs));
      }

      // Load stats
      const storedStats = localStorage.getItem('waf_stats');
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats, (key, value) => {
          // Convert ISO date strings back to Date objects
          if ((key === 'timestamp' || key === 'date') && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        
        this.stats = {
          ...parsedStats,
          // Ensure we have all attack types in the stats
          attacksByType: {
            ...this.stats.attacksByType,
            ...parsedStats.attacksByType
          }
        };
      }
    } catch (error) {
      console.error("Error loading WAF data from localStorage:", error);
      // If loading fails, we'll use the default data
    }
  }

  // Save data to localStorage
  private saveToLocalStorage() {
    try {
      localStorage.setItem('waf_rules', JSON.stringify(this.rules));
      localStorage.setItem('waf_logs', JSON.stringify(this.logs));
      localStorage.setItem('waf_blocked_ips', JSON.stringify([...this.blockedIPs]));
      localStorage.setItem('waf_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error("Error saving WAF data to localStorage:", error);
      toast.error("Failed to save WAF data to local storage");
    }
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: "rule-1",
        name: "SQL Injection Protection",
        pattern: "('|--|;|drop\\s+table|select\\s+\\*)",
        type: AttackType.SQL_INJECTION,
        action: "block",
        enabled: true,
        createdAt: new Date()
      },
      {
        id: "rule-2",
        name: "XSS Protection",
        pattern: "(<script>|javascript:|onerror=|onload=)",
        type: AttackType.XSS,
        action: "block",
        enabled: true,
        createdAt: new Date()
      },
      {
        id: "rule-3",
        name: "Path Traversal Protection",
        pattern: "(\\.\\.|%2e%2e|\\/etc\\/passwd)",
        type: AttackType.PATH_TRAVERSAL,
        action: "block",
        enabled: true,
        createdAt: new Date()
      },
      {
        id: "rule-4",
        name: "Command Injection Protection",
        pattern: "(;\\s*[a-z]+|`.*`|\\|\\s*[a-z]+)",
        type: AttackType.COMMAND_INJECTION,
        action: "block",
        enabled: true,
        createdAt: new Date()
      },
      {
        id: "rule-5",
        name: "Log Suspicious IPs",
        pattern: "",
        type: AttackType.SUSPICIOUS_IP,
        action: "flag",
        enabled: true,
        createdAt: new Date()
      }
    ];
  }

  // Generate mock data for the dashboard
  private generateMockData() {
    const ipAddresses = [
      "192.168.1.1", "10.0.0.1", "172.16.0.1", "8.8.8.8", 
      "1.1.1.1", "203.0.113.1", "198.51.100.1", "192.0.2.1"
    ];
    
    const paths = [
      "/login", "/admin", "/dashboard", "/api/user", 
      "/api/products", "/checkout", "/profile", "/settings"
    ];
    
    const methods = ["GET", "POST", "PUT", "DELETE"];
    
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (Linux; Android 11; SM-G998B)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)",
      "Python-urllib/3.9"
    ];
    
    const countries = ["US", "CN", "RU", "UK", "DE", "FR", "JP", "BR"];
    
    const attackPatterns = [
      "' OR 1=1 --",
      "<script>alert('XSS')</script>",
      "../../../etc/passwd",
      "; cat /etc/passwd",
      "DROP TABLE users",
      "javascript:alert(document.cookie)",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fwindows/win.ini"
    ];

    // Generate 100 random logs
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 120));
      
      const isAttack = Math.random() < 0.35;
      const isSuspiciousIP = Math.random() < 0.2;
      
      const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
      let path = paths[Math.floor(Math.random() * paths.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      let status = RequestStatus.ALLOWED;
      let attackType: AttackType | undefined = undefined;
      
      if (isAttack) {
        const attackPattern = attackPatterns[Math.floor(Math.random() * attackPatterns.length)];
        path = `${path}?q=${attackPattern}`;
        
        if (attackPattern.includes("'") || attackPattern.includes("DROP")) {
          attackType = AttackType.SQL_INJECTION;
        } else if (attackPattern.includes("<script>") || attackPattern.includes("javascript:")) {
          attackType = AttackType.XSS;
        } else if (attackPattern.includes("../") || attackPattern.includes("%2e%2e")) {
          attackType = AttackType.PATH_TRAVERSAL;
        } else if (attackPattern.includes(";") || attackPattern.includes("cat")) {
          attackType = AttackType.COMMAND_INJECTION;
        } else {
          attackType = AttackType.OTHER;
        }
        
        status = Math.random() < 0.8 ? RequestStatus.BLOCKED : RequestStatus.FLAGGED;
        
        if (status === RequestStatus.BLOCKED) {
          this.blockedIPs.add(ipAddress);
          this.stats.blockedRequests++;
          this.stats.attacksByType[attackType]++;
        } else {
          this.stats.flaggedRequests++;
        }
      } else if (isSuspiciousIP) {
        status = RequestStatus.FLAGGED;
        attackType = AttackType.SUSPICIOUS_IP;
        this.stats.flaggedRequests++;
      } else {
        this.stats.allowedRequests++;
      }
      
      const log: RequestLog = {
        id: `req-${i+1}`,
        timestamp,
        ipAddress,
        path,
        method,
        userAgent,
        status,
        attackType,
        country,
        processed: true
      };
      
      this.logs.push(log);
      this.stats.totalRequests++;
    }
    
    // Sort logs by timestamp (newest first)
    this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Calculate top blocked IPs
    const blockedIPCounts: Record<string, number> = {};
    this.logs
      .filter(log => log.status === RequestStatus.BLOCKED)
      .forEach(log => {
        blockedIPCounts[log.ipAddress] = (blockedIPCounts[log.ipAddress] || 0) + 1;
      });
      
    this.stats.topBlockedIPs = Object.entries(blockedIPCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    // Generate requests over time data (last 24 hours, hourly)
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - i);
      timestamp.setMinutes(0, 0, 0);
      
      const requestsInHour = Math.floor(Math.random() * 50) + 10;
      const blockedInHour = Math.floor(Math.random() * requestsInHour * 0.4);
      
      this.stats.requestsOverTime.unshift({
        timestamp,
        count: requestsInHour,
        blocked: blockedInHour
      });
    }
  }
  
  // Process a new request
  processRequest(request: Partial<RequestLog>): RequestStatus {
    const id = `req-${this.logs.length + 1}`;
    const timestamp = new Date();
    const log: RequestLog = {
      id,
      timestamp,
      ipAddress: request.ipAddress || "0.0.0.0",
      path: request.path || "/",
      method: request.method || "GET",
      userAgent: request.userAgent || "Unknown",
      status: RequestStatus.ALLOWED,
      processed: false
    };

    // Check if IP is blocked - automatic rejection
    if (this.blockedIPs.has(log.ipAddress)) {
      log.status = RequestStatus.BLOCKED;
      log.attackType = AttackType.SUSPICIOUS_IP;
      this.logs.unshift(log);
      this.updateStats(log);
      
      // Update top blocked IPs
      this.updateTopBlockedIPs(log.ipAddress);
      
      this.saveToLocalStorage();
      return RequestStatus.BLOCKED;
    }

    // Check against rules
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      // Skip IP rule as it's handled separately
      if (rule.type === AttackType.SUSPICIOUS_IP) continue;
      
      const regex = new RegExp(rule.pattern, "i");
      if (regex.test(log.path)) {
        log.attackType = rule.type;
        
        if (rule.action === "block") {
          log.status = RequestStatus.BLOCKED;
          this.logs.unshift(log);
          this.updateStats(log);
          this.saveToLocalStorage();
          return RequestStatus.BLOCKED;
        } else if (rule.action === "flag") {
          log.status = RequestStatus.FLAGGED;
          this.logs.unshift(log);
          this.updateStats(log);
          this.saveToLocalStorage();
          return RequestStatus.FLAGGED;
        }
      }
    }

    // No rule matched, request is allowed
    log.status = RequestStatus.ALLOWED;
    this.logs.unshift(log);
    this.updateStats(log);
    this.saveToLocalStorage();
    return RequestStatus.ALLOWED;
  }

  // Update stats when a new request is processed
  private updateStats(log: RequestLog) {
    this.stats.totalRequests++;
    
    if (log.status === RequestStatus.BLOCKED) {
      this.stats.blockedRequests++;
      if (log.attackType) {
        this.stats.attacksByType[log.attackType]++;
      }
    } else if (log.status === RequestStatus.FLAGGED) {
      this.stats.flaggedRequests++;
    } else {
      this.stats.allowedRequests++;
    }
    
    // Update requests over time
    const hour = new Date(log.timestamp);
    hour.setMinutes(0, 0, 0);
    
    const hourData = this.stats.requestsOverTime.find(
      item => item.timestamp.getTime() === hour.getTime()
    );
    
    if (hourData) {
      hourData.count++;
      if (log.status === RequestStatus.BLOCKED) {
        hourData.blocked++;
      }
    }
    
    // If this is a blocked request, update top blocked IPs
    if (log.status === RequestStatus.BLOCKED) {
      this.updateTopBlockedIPs(log.ipAddress);
    }
  }
  
  // Update top blocked IPs list
  private updateTopBlockedIPs(ipAddress: string) {
    const existingIPIndex = this.stats.topBlockedIPs.findIndex(item => item.ip === ipAddress);
    
    if (existingIPIndex !== -1) {
      // Increment count for existing IP
      this.stats.topBlockedIPs[existingIPIndex].count++;
    } else {
      // Add new IP with count 1
      this.stats.topBlockedIPs.push({ ip: ipAddress, count: 1 });
    }
    
    // Sort by count (descending)
    this.stats.topBlockedIPs.sort((a, b) => b.count - a.count);
    
    // Keep only top 10
    if (this.stats.topBlockedIPs.length > 10) {
      this.stats.topBlockedIPs = this.stats.topBlockedIPs.slice(0, 10);
    }
  }

  // Block or unblock an IP
  toggleBlockIP(ip: string, block: boolean): void {
    if (block) {
      this.blockedIPs.add(ip);
    } else {
      this.blockedIPs.delete(ip);
    }
    
    // Dispatch event for real-time updates
    window.dispatchEvent(createBlockedIPsChangedEvent());
    
    // Update the top blocked IPs if blocking
    if (block) {
      this.updateTopBlockedIPs(ip);
    }
    
    this.saveToLocalStorage();
  }

  // Add a new rule
  addRule(rule: Omit<FirewallRule, 'id' | 'createdAt'>): FirewallRule {
    const newRule: FirewallRule = {
      ...rule,
      id: `rule-${this.rules.length + 1}`,
      createdAt: new Date()
    };
    
    this.rules.push(newRule);
    toast.success(`Rule "${rule.name}" has been added`);
    this.saveToLocalStorage();
    return newRule;
  }

  // Update an existing rule
  updateRule(id: string, updates: Partial<FirewallRule>): FirewallRule | null {
    const ruleIndex = this.rules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return null;
    
    const updatedRule = {
      ...this.rules[ruleIndex],
      ...updates
    };
    
    this.rules[ruleIndex] = updatedRule;
    toast.success(`Rule "${updatedRule.name}" has been updated`);
    this.saveToLocalStorage();
    return updatedRule;
  }

  // Delete a rule
  deleteRule(id: string): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return false;
    
    const ruleName = this.rules[ruleIndex].name;
    this.rules.splice(ruleIndex, 1);
    toast.success(`Rule "${ruleName}" has been deleted`);
    this.saveToLocalStorage();
    return true;
  }

  // Get all rules
  getRules(): FirewallRule[] {
    return [...this.rules];
  }

  // Get all logs
  getLogs(): RequestLog[] {
    return [...this.logs];
  }

  // Get stats
  getStats(): WafStats {
    return {...this.stats};
  }

  // Check if an IP is blocked
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Get all blocked IPs
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

// Create a singleton instance
const wafService = new WafService();
export default wafService;
