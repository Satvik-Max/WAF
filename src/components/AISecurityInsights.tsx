
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, Brain, Lightbulb, Sparkles, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RequestLog } from '@/services/wafService';
import aiAnalysisService, { AISecurityInsight } from '@/services/aiAnalysisService';
import { cn } from '@/lib/utils';

interface AISecurityInsightsProps {
  logs: RequestLog[];
}

const AISecurityInsights = ({ logs }: AISecurityInsightsProps) => {
  const [insights, setInsights] = useState<AISecurityInsight[]>([]);
  const [threatScore, setThreatScore] = useState(0);
  const [isMLPowered, setIsMLPowered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    
    const fetchInsights = async () => {
      try {
        // Get insights from the AI service
        const aiInsights = await aiAnalysisService.generateSecurityInsights(logs);
        setInsights(aiInsights);
        
        // Get the analysis for threat score
        const analysis = await aiAnalysisService.analyzeRequestLogs(logs);
        setThreatScore(analysis.threatScore);
        setIsMLPowered(analysis.isMLPowered);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
        // Fallback to empty insights
        setInsights([]);
        setThreatScore(0);
        setIsMLPowered(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsights();
  }, [logs]);
  
  // Helper to determine badge color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 hover:bg-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  // Helper to get threat level text
  const getThreatLevelText = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Minimal';
  };
  
  // Get threat level color
  const getThreatLevelColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-blue-500';
    return 'text-green-500';
  };

  // Get indicator color for progress bar
  const getIndicatorColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-blue-500";
    return "bg-green-500";
  };
  
  // Loading skeleton UI
  if (isLoading) {
    return (
      <Card className="waf-card bg-gradient-to-br from-indigo-950 to-purple-900 border border-indigo-500/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-900/60 to-purple-800/50 rounded-t-lg border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-300 animate-pulse" />
              <CardTitle className="text-lg font-medium text-indigo-100">AI Security Insights</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-indigo-200">Loading ML model...</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-5 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-indigo-700/40 rounded w-3/4"></div>
            <div className="h-8 bg-indigo-700/40 rounded"></div>
            <div className="h-20 bg-indigo-700/30 rounded"></div>
            <div className="h-20 bg-indigo-700/30 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="waf-card bg-gradient-to-br from-indigo-950 to-purple-900 border border-indigo-500/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-900/60 to-purple-800/50 rounded-t-lg border-b border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMLPowered ? (
              <Sparkles className="h-5 w-5 text-yellow-300" />
            ) : (
              <Brain className="h-5 w-5 text-indigo-300" />
            )}
            <CardTitle className="text-lg font-medium text-indigo-100">
              {isMLPowered ? 'ML-Powered Security Insights' : 'AI Security Insights'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-200">Threat Level:</span>
            <span className={`font-medium ${getThreatLevelColor(threatScore)}`}>
              {getThreatLevelText(threatScore)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-5 space-y-4">
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-indigo-300">Threat Score</span>
            <span className="text-xs font-medium text-indigo-200">{threatScore}%</span>
          </div>
          <Progress 
            value={threatScore} 
            className={cn("h-2", getIndicatorColor(threatScore))}
          />
        </div>
        
        {isMLPowered && (
          <div className="bg-indigo-900/30 border border-indigo-600/20 rounded-md px-3 py-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-xs text-indigo-200">
              Using machine learning model for advanced threat detection
            </span>
          </div>
        )}
        
        {insights.length === 0 ? (
          <div className="text-center py-6 text-indigo-300">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Not enough data for AI analysis</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {insights.map((insight) => (
              <div 
                key={insight.id} 
                className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-700/30"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-indigo-100 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {insight.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    {insight.confidence && (
                      <span className="text-xs text-indigo-400">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    )}
                    <Badge className={getSeverityColor(insight.severity)}>
                      {insight.severity}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-indigo-200 mb-2">{insight.description}</p>
                {insight.recommendation && (
                  <div className="flex items-start gap-1 mt-2 text-xs text-indigo-300">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-yellow-400" />
                    <span>{insight.recommendation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISecurityInsights;
