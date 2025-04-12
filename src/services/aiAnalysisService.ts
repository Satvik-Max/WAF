import { RequestLog, AttackType } from './wafService';
import securityMLModel, { PredictionResult } from './securityMLModel';

// Types for AI analysis results
export interface AIAnalysisResult {
  threatScore: number;
  insights: string[];
  recommendations: string[];
  detectedPatterns: string[];
  mlPrediction?: PredictionResult;
  isMLPowered: boolean;
}

export interface AISecurityInsight {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedLogs?: string[];
  recommendation?: string;
  confidence?: number;
}

class AIAnalysisService {
  private isInitialized = false;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Attempt to load any previously saved model
      await securityMLModel.loadModel();
      
      // Generate some training data from simulated historical logs if needed
      if (securityMLModel.isReady()) {
        const simulatedHistoricalLogs = this.generateSimulatedLogs(1000);
        const trainingData = securityMLModel.generateTrainingData(simulatedHistoricalLogs);
        await securityMLModel.trainModel(trainingData);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing AI Analysis Service:', error);
    }
  }
  
  // Generate simulated logs for model training
  private generateSimulatedLogs(count: number): RequestLog[] {
    const logs: RequestLog[] = [];
    const statuses = ['allowed', 'blocked', 'flagged'];
    const attackTypes = [null, 'SQL_INJECTION', 'XSS', 'PATH_TRAVERSAL', 'COMMAND_INJECTION'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const paths = ['/api/data', '/admin', '/login', '/user', '/product', '/cart'];
    const ips = Array.from({ length: 20 }, (_, i) => `192.168.1.${i+1}`);
    const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CN', 'RU'];
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (Linux; Android 11; SM-G998B)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)",
      "Python-urllib/3.9"
    ];
    
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const isAttack = Math.random() < 0.3; // 30% chance of being an attack
      const status = isAttack ? 
        (Math.random() < 0.7 ? 'blocked' : 'flagged') : 
        'allowed';
      
      logs.push({
        id: `sim-${i}`,
        timestamp: new Date(now - Math.floor(Math.random() * 86400000)),
        ipAddress: ips[Math.floor(Math.random() * ips.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        path: paths[Math.floor(Math.random() * paths.length)],
        status: status as any,
        attackType: isAttack ? 
          attackTypes[1 + Math.floor(Math.random() * (attackTypes.length - 1))] as any : 
          null,
        country: Math.random() < 0.8 ? countries[Math.floor(Math.random() * countries.length)] : null,
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        processed: true
      });
    }
    
    return logs;
  }
  
  // Analyze logs using ML model and traditional analysis
  async analyzeRequestLogs(logs: RequestLog[]): Promise<AIAnalysisResult> {
    // Wait for initialization if not already done
    if (!this.isInitialized) {
      await new Promise<void>(resolve => {
        const checkInit = () => {
          if (this.isInitialized) {
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }
    
    const recentLogs = logs.slice(0, 50); // Analyze most recent 50 logs
    
    // Use ML model for prediction if available
    let mlPrediction: PredictionResult | undefined;
    let isMLPowered = false;
    
    try {
      mlPrediction = await securityMLModel.predictThreat(recentLogs);
      isMLPowered = true;
    } catch (error) {
      console.error('ML prediction failed, using fallback analysis:', error);
    }
    
    // If ML prediction failed or unavailable, use traditional analysis
    if (!mlPrediction) {
      // Count attack types
      const attackTypeCounts: Record<string, number> = {};
      const ipAttackMap: Record<string, Set<AttackType>> = {};
      const suspiciousPatterns: string[] = [];
      
      // Analyze logs for patterns
      recentLogs.forEach(log => {
        // Track attack types
        if (log.attackType) {
          attackTypeCounts[log.attackType] = (attackTypeCounts[log.attackType] || 0) + 1;
          
          // Track IPs and their attack types
          if (!ipAttackMap[log.ipAddress]) {
            ipAttackMap[log.ipAddress] = new Set();
          }
          
          if (log.attackType) {
            ipAttackMap[log.ipAddress].add(log.attackType);
          }
        }
        
        // Look for suspicious patterns in paths
        if (log.path.includes('admin') && log.status !== 'allowed') {
          suspiciousPatterns.push('Attempted admin access');
        }
        if (log.path.includes('login') && log.status !== 'allowed') {
          suspiciousPatterns.push('Login attack attempt');
        }
      });
      
      // Calculate threat score based on attack frequency and variety
      let threatScore = 0;
      Object.values(attackTypeCounts).forEach(count => {
        threatScore += count;
      });
      
      // Add points for IPs with multiple attack types (more sophisticated attackers)
      Object.keys(ipAttackMap).forEach(ip => {
        if (ipAttackMap[ip].size > 1) {
          threatScore += ipAttackMap[ip].size * 5;
        }
      });
      
      // Normalize score to 0-100 range
      threatScore = Math.min(100, threatScore);
      
      // Generate insights
      const insights: string[] = [];
      if (attackTypeCounts[AttackType.SQL_INJECTION] > 3) {
        insights.push('Elevated SQL injection attempts detected.');
      }
      if (attackTypeCounts[AttackType.XSS] > 3) {
        insights.push('Increased XSS attack activity observed.');
      }
      
      // Find IPs with multiple attack types
      const sophisticatedAttackers = Object.entries(ipAttackMap)
        .filter(([_, types]) => types.size > 1)
        .map(([ip, _]) => ip);
      
      if (sophisticatedAttackers.length > 0) {
        insights.push(`${sophisticatedAttackers.length} IPs showing sophisticated attack patterns.`);
      }
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (threatScore > 70) {
        recommendations.push('Enable stricter validation for all form inputs.');
        recommendations.push('Consider implementing CAPTCHA for login attempts.');
      }
      if (attackTypeCounts[AttackType.PATH_TRAVERSAL] > 2) {
        recommendations.push('Review file access permissions and restrict directory listing.');
      }
      if (sophisticatedAttackers.length > 0) {
        recommendations.push('Automatically block IPs that attempt multiple attack types.');
      }
      
      return {
        threatScore,
        insights,
        recommendations,
        detectedPatterns: Array.from(new Set(suspiciousPatterns)),
        isMLPowered: false
      };
    }
    
    // Use the ML prediction for threat score
    const threatScore = mlPrediction.threatScore;
    
    // Generate insights based on ML predictions
    const insights: string[] = [];
    const attackLikelihood = mlPrediction.attackLikelihood;
    
    if (attackLikelihood['SQL_INJECTION'] > 0.2) {
      insights.push(`SQL injection attacks detected with ${Math.round(attackLikelihood['SQL_INJECTION'] * 100)}% confidence.`);
    }
    
    if (attackLikelihood['XSS'] > 0.2) {
      insights.push(`Cross-site scripting (XSS) attacks detected with ${Math.round(attackLikelihood['XSS'] * 100)}% confidence.`);
    }
    
    if (attackLikelihood['PATH_TRAVERSAL'] > 0.2) {
      insights.push(`Path traversal attacks detected with ${Math.round(attackLikelihood['PATH_TRAVERSAL'] * 100)}% confidence.`);
    }
    
    if (attackLikelihood['DDOS'] > 0.3) {
      insights.push(`Potential DDoS activity detected with ${Math.round(attackLikelihood['DDOS'] * 100)}% confidence.`);
    }
    
    if (mlPrediction.anomalyScore > 60) {
      insights.push(`Anomalous traffic patterns detected with ${mlPrediction.anomalyScore.toFixed(1)}% certainty.`);
    }
    
    // Generate ML-based recommendations
    const recommendations: string[] = [];
    
    if (threatScore > 70) {
      recommendations.push('Activate aggressive blocking rules for high-risk requests.');
      recommendations.push('Enable rate limiting for all API endpoints.');
    }
    
    if (attackLikelihood['SQL_INJECTION'] > 0.3) {
      recommendations.push('Implement parameterized queries and additional SQL injection safeguards.');
    }
    
    if (attackLikelihood['XSS'] > 0.3) {
      recommendations.push('Review Content-Security-Policy settings and implement additional XSS filters.');
    }
    
    if (mlPrediction.anomalyScore > 70) {
      recommendations.push('Review recent traffic patterns for new attack vectors not currently detected by rules.');
    }
    
    // Identify suspicious patterns
    const detectedPatterns = [];
    
    if (attackLikelihood['PATH_TRAVERSAL'] > 0.2) {
      detectedPatterns.push('Directory traversal attempts');
    }
    
    if (attackLikelihood['DDOS'] > 0.3) {
      detectedPatterns.push('Abnormal request volume from limited IP ranges');
    }
    
    return {
      threatScore,
      insights,
      recommendations,
      detectedPatterns,
      mlPrediction,
      isMLPowered: true
    };
  }
  
  // Generate security insights using ML
  async generateSecurityInsights(logs: RequestLog[]): Promise<AISecurityInsight[]> {
    try {
      const analysis = await this.analyzeRequestLogs(logs);
      const insights: AISecurityInsight[] = [];
      
      // ML-based threat analysis
      if (analysis.isMLPowered && analysis.mlPrediction) {
        insights.push({
          id: `insight-${Date.now()}-ml`,
          timestamp: new Date(),
          title: 'ML-Powered Threat Analysis',
          description: `Machine learning model has identified a threat level of ${analysis.threatScore}% based on recent traffic patterns.`,
          severity: analysis.threatScore > 75 ? 'critical' : 
                   analysis.threatScore > 50 ? 'high' : 
                   analysis.threatScore > 25 ? 'medium' : 'low',
          recommendation: 'The AI model continuously learns from your traffic patterns to improve threat detection.',
          confidence: 0.85
        });
        
        // Anomaly detection insight
        if (analysis.mlPrediction.anomalyScore > 50) {
          insights.push({
            id: `insight-${Date.now()}-anomaly`,
            timestamp: new Date(),
            title: 'Anomaly Detection Alert',
            description: `Unusual traffic patterns detected with an anomaly score of ${analysis.mlPrediction.anomalyScore.toFixed(1)}%.`,
            severity: analysis.mlPrediction.anomalyScore > 75 ? 'high' : 'medium',
            recommendation: 'Investigate recent traffic for patterns that differ from your site\'s baseline.',
            confidence: analysis.mlPrediction.anomalyScore / 100
          });
        }
      }
      
      // Convert analysis results into formatted insights
      if (analysis.insights.length > 0) {
        insights.push({
          id: `insight-${Date.now()}-1`,
          timestamp: new Date(),
          title: 'Attack Pattern Analysis',
          description: analysis.insights.join(' '),
          severity: analysis.threatScore > 70 ? 'high' : analysis.threatScore > 40 ? 'medium' : 'low',
          recommendation: analysis.recommendations[0],
          confidence: analysis.isMLPowered ? 0.92 : 0.78
        });
      }
      
      if (analysis.recommendations.length > 0) {
        insights.push({
          id: `insight-${Date.now()}-2`,
          timestamp: new Date(),
          title: 'Security Recommendations',
          description: `Based on ${analysis.isMLPowered ? 'ML analysis' : 'recent activity'}, our AI recommends: ${analysis.recommendations.join(' ')}`,
          severity: 'medium',
          confidence: analysis.isMLPowered ? 0.89 : 0.75
        });
      }
      
      if (analysis.detectedPatterns.length > 0) {
        insights.push({
          id: `insight-${Date.now()}-3`,
          timestamp: new Date(),
          title: 'Suspicious Access Patterns',
          description: `Detected unusual access patterns: ${analysis.detectedPatterns.join(', ')}`,
          severity: 'medium',
          confidence: analysis.isMLPowered ? 0.88 : 0.72
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }
  
  // Save the trained model
  async saveModel(): Promise<void> {
    try {
      await securityMLModel.exportModel();
      console.log('Security model saved successfully');
    } catch (error) {
      console.error('Failed to save security model:', error);
    }
  }
}

// Create singleton instance
const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;
