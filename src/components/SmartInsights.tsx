import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  RefreshCw,
  Sparkles,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Star,
  Wand2
} from 'lucide-react';
import { aiService, AIInsight, AIAnalysisRequest } from '@/utils/aiService';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { toast } from 'sonner';

interface SmartInsightsProps {
  data: ProcessedTeacherData[];
  context: string;
  analysisType?: 'performance' | 'conversion' | 'retention' | 'revenue' | 'general';
  isFiltered?: boolean;
  onInsightAction?: (insight: AIInsight) => void;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({
  data,
  context,
  analysisType = 'general',
  isFiltered = false,
  onInsightAction
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    if (data && data.length > 0) {
      generateInsights();
    }
  }, [data, analysisType]);

  const generateInsights = useCallback(async () => {
    if (!data || data.length === 0) {
      setInsights([{
        id: 'no-data',
        type: 'insight',
        title: 'No Data Available',
        description: 'Upload and process data files to see AI-powered insights and recommendations.',
        confidence: 1.0,
        actionable: false,
        priority: 'low',
        category: 'general',
        timestamp: new Date()
      }]);
      return;
    }

    setIsLoading(true);
    
    try {
      const analysisRequest: AIAnalysisRequest = {
        data,
        context: `${context}${isFiltered ? ' (filtered data)' : ''}`,
        analysisType,
        filters: isFiltered ? { filtered: true } : undefined
      };

      // Check if AI provider is configured
      const activeProvider = aiService.getActiveProvider();
      
      if (activeProvider) {
        // Use AI service for intelligent insights
        const [aiInsights, aiSummary, aiRecommendations] = await Promise.all([
          aiService.generateInsights(data, context),
          aiService.summarizeData(data, analysisType),
          aiService.generateRecommendations(data, analysisType)
        ]);
        
        setInsights(aiInsights);
        setSummary(aiSummary);
        setRecommendations(aiRecommendations);
        setLastAnalysis(new Date());
        
        toast.success('AI insights generated successfully');
      } else {
        // Fallback to rule-based insights
        const fallbackInsights = generateRuleBasedInsights(data, context, analysisType);
        setInsights(fallbackInsights);
        setSummary(generateRuleBasedSummary(data, analysisType));
        setRecommendations(generateRuleBasedRecommendations(data, analysisType));
        setLastAnalysis(new Date());
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
      
      // Fallback to rule-based insights on error
      const fallbackInsights = generateRuleBasedInsights(data, context, analysisType);
      setInsights(fallbackInsights);
      setSummary(generateRuleBasedSummary(data, analysisType));
      setRecommendations(generateRuleBasedRecommendations(data, analysisType));
    } finally {
      setIsLoading(false);
    }
  }, [data, context, analysisType, isFiltered]);

  const generateRuleBasedInsights = (
    data: ProcessedTeacherData[], 
    context: string, 
    type: string
  ): AIInsight[] => {
    const insights: AIInsight[] = [];
    
    // Calculate overall metrics
    const totalNewClients = data.reduce((sum, item) => sum + item.newClients, 0);
    const totalRetained = data.reduce((sum, item) => sum + item.retainedClients, 0);
    const totalConverted = data.reduce((sum, item) => sum + item.convertedClients, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    const avgRetentionRate = totalNewClients > 0 ? (totalRetained / totalNewClients) * 100 : 0;
    const avgConversionRate = totalNewClients > 0 ? (totalConverted / totalNewClients) * 100 : 0;
    
    // Performance insights
    if (avgRetentionRate > 60) {
      insights.push({
        id: 'high-retention',
        type: 'insight',
        title: 'Excellent Client Retention',
        description: `Your studios maintain a ${avgRetentionRate.toFixed(1)}% retention rate, which is above industry standards. This indicates strong client satisfaction and effective engagement strategies.`,
        confidence: 0.9,
        actionable: true,
        priority: 'high',
        category: 'retention',
        timestamp: new Date()
      });
    } else if (avgRetentionRate < 30) {
      insights.push({
        id: 'low-retention',
        type: 'warning',
        title: 'Retention Rate Needs Attention',
        description: `Current retention rate of ${avgRetentionRate.toFixed(1)}% is below optimal levels. Focus on improving first-time client experience and follow-up engagement.`,
        confidence: 0.85,
        actionable: true,
        priority: 'critical',
        category: 'retention',
        timestamp: new Date()
      });
    }

    // Conversion insights
    if (avgConversionRate > 20) {
      insights.push({
        id: 'high-conversion',
        type: 'insight',
        title: 'Strong Conversion Performance',
        description: `${avgConversionRate.toFixed(1)}% conversion rate demonstrates effective sales processes and compelling value propositions.`,
        confidence: 0.9,
        actionable: true,
        priority: 'high',
        category: 'conversion',
        timestamp: new Date()
      });
    } else if (avgConversionRate < 10) {
      insights.push({
        id: 'low-conversion',
        type: 'opportunity',
        title: 'Conversion Optimization Opportunity',
        description: `Current ${avgConversionRate.toFixed(1)}% conversion rate suggests room for improvement in trial-to-membership conversion strategies.`,
        confidence: 0.8,
        actionable: true,
        priority: 'high',
        category: 'conversion',
        timestamp: new Date()
      });
    }

    // Revenue insights
    const avgRevenuePerClient = totalConverted > 0 ? totalRevenue / totalConverted : 0;
    if (avgRevenuePerClient > 5000) {
      insights.push({
        id: 'high-revenue-per-client',
        type: 'insight',
        title: 'High Client Value',
        description: `Average revenue per client of ₹${avgRevenuePerClient.toFixed(0)} indicates successful upselling and premium service positioning.`,
        confidence: 0.85,
        actionable: true,
        priority: 'medium',
        category: 'revenue',
        timestamp: new Date()
      });
    }

    // Teacher performance insights
    const topTeacher = [...data].sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (topTeacher && topTeacher.conversionRate > 0) {
      insights.push({
        id: 'top-performer',
        type: 'insight',
        title: 'Top Performing Teacher',
        description: `${topTeacher.teacherName} leads with ${topTeacher.conversionRate.toFixed(1)}% conversion rate. Consider sharing their best practices across the team.`,
        confidence: 0.95,
        actionable: true,
        priority: 'medium',
        category: 'performance',
        timestamp: new Date()
      });
    }

    // Location insights
    const locationData = data.reduce((acc, item) => {
      if (!acc[item.location]) {
        acc[item.location] = { newClients: 0, retainedClients: 0, revenue: 0 };
      }
      acc[item.location].newClients += item.newClients;
      acc[item.location].retainedClients += item.retainedClients;
      acc[item.location].revenue += item.totalRevenue;
      return acc;
    }, {} as Record<string, { newClients: number; retainedClients: number; revenue: number }>);

    const topLocation = Object.entries(locationData)
      .map(([location, stats]) => ({
        location,
        retentionRate: stats.newClients > 0 ? (stats.retainedClients / stats.newClients) * 100 : 0,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.retentionRate - a.retentionRate)[0];

    if (topLocation && topLocation.retentionRate > 0) {
      insights.push({
        id: 'top-location',
        type: 'insight',
        title: 'Best Performing Location',
        description: `${topLocation.location} shows the highest retention rate at ${topLocation.retentionRate.toFixed(1)}%. Analyze their operational practices for replication.`,
        confidence: 0.9,
        actionable: true,
        priority: 'medium',
        category: 'performance',
        timestamp: new Date()
      });
    }

    return insights;
  };

  const generateRuleBasedSummary = (data: ProcessedTeacherData[], type: string): string => {
    const totalNewClients = data.reduce((sum, item) => sum + item.newClients, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
    const avgConversionRate = data.length > 0 ? 
      data.reduce((sum, item) => sum + item.conversionRate, 0) / data.length : 0;

    return `Analysis of ${data.length} teacher records shows ${totalNewClients} new clients generating ₹${totalRevenue.toLocaleString()} in revenue with an average ${avgConversionRate.toFixed(1)}% conversion rate. ${
      avgConversionRate > 15 ? 'Performance is strong with good conversion rates.' : 
      'There are opportunities to improve conversion and retention rates.'
    }`;
  };

  const generateRuleBasedRecommendations = (data: ProcessedTeacherData[], type: string): string[] => {
    const recommendations: string[] = [];
    
    const avgRetentionRate = data.length > 0 ? 
      data.reduce((sum, item) => sum + item.retentionRate, 0) / data.length : 0;
    const avgConversionRate = data.length > 0 ? 
      data.reduce((sum, item) => sum + item.conversionRate, 0) / data.length : 0;

    if (avgRetentionRate < 40) {
      recommendations.push('Implement a structured follow-up program for new clients within 48 hours of their first visit');
      recommendations.push('Create personalized onboarding sequences to improve early client engagement');
    }

    if (avgConversionRate < 15) {
      recommendations.push('Review and optimize trial-to-membership conversion processes');
      recommendations.push('Train staff on consultative selling techniques and value proposition communication');
    }

    recommendations.push('Conduct regular performance reviews with teachers to share best practices');
    recommendations.push('Implement client feedback systems to identify improvement opportunities');

    return recommendations;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'recommendation': return <Target className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-indigo-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const handleInsightAction = (insight: AIInsight) => {
    if (onInsightAction) {
      onInsightAction(insight);
    }
    toast.success('Insight action triggered');
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm rounded-lg border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Generating AI Insights...
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Wand2 className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground">Analyzing your data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm rounded-lg border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Insights & Recommendations
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastAnalysis && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {lastAnalysis.toLocaleTimeString()}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Actions ({recommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card
                    key={insight.id}
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      insight.priority === 'critical' ? 'border-red-200 bg-red-50/50' :
                      insight.priority === 'high' ? 'border-amber-200 bg-amber-50/50' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => insight.actionable && handleInsightAction(insight)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                            {getPriorityBadge(insight.priority)}
                            <Badge variant="outline" className="text-xs">
                              {insight.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(insight.confidence * 100)}% confidence
                              </Badge>
                              {insight.actionable && (
                                <Badge variant="success" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Actionable
                                </Badge>
                              )}
                            </div>
                            {insight.actionable && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Executive Summary</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {summary || 'No summary available. Configure an AI provider for detailed analysis.'}
                  </p>
                  
                  {data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-blue-800">
                          {data.reduce((sum, item) => sum + item.newClients, 0)}
                        </div>
                        <div className="text-xs text-blue-600">New Clients</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-green-800">
                          {((data.reduce((sum, item) => sum + item.retainedClients, 0) / 
                             Math.max(data.reduce((sum, item) => sum + item.newClients, 0), 1)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-green-600">Retention</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-purple-800">
                          {((data.reduce((sum, item) => sum + item.convertedClients, 0) / 
                             Math.max(data.reduce((sum, item) => sum + item.newClients, 0), 1)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-purple-600">Conversion</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-amber-800">
                          ₹{(data.reduce((sum, item) => sum + item.totalRevenue, 0) / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-amber-600">Revenue</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((recommendation, index) => (
                  <Card key={index} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{recommendation}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Action Item #{index + 1}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success('Recommendation noted')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark as Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No specific recommendations available. Configure an AI provider for personalized action items.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SmartInsights;