import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, BarChart2, Award, Brain, Sparkles, Settings, Wand2 } from 'lucide-react';
import { ProcessedTeacherData } from '@/utils/dataProcessor';
import { aiService } from '@/utils/aiService';
import SmartInsights from './SmartInsights';
import AIProviderSetup from './AIProviderSetup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AIInsightsProps {
  data: ProcessedTeacherData[];
  isFiltered: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ data, isFiltered }) => {
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  useEffect(() => {
    checkAIConfiguration();
  }, []);

  const checkAIConfiguration = () => {
    const activeProvider = aiService.getActiveProvider();
    setIsAIConfigured(!!activeProvider);
  };

  const handleProviderConfigured = () => {
    checkAIConfiguration();
    setIsSetupOpen(false);
  };

  if (!isAIConfigured) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-luxury animate-fade-in rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-indigo-50/80 border-b border-blue-200/50">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Brain className="h-5 w-5" />
            AI-Powered Analytics
            <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Unlock AI-Powered Insights
              </h3>
              <p className="text-blue-700 mb-4">
                Configure an AI provider to get intelligent analysis, predictive insights, and personalized recommendations for your studio performance data.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                  Smart Performance Analysis
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Lightbulb className="h-4 w-4" />
                  Actionable Recommendations
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <BarChart2 className="h-4 w-4" />
                  Predictive Trends
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Award className="h-4 w-4" />
                  Optimization Opportunities
                </div>
              </div>
            </div>
            
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure AI Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Provider Setup
                  </DialogTitle>
                </DialogHeader>
                <AIProviderSetup onProviderConfigured={handleProviderConfigured} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SmartInsights
      data={data}
      context={`Studio performance analytics ${isFiltered ? 'with applied filters' : 'for all data'}`}
      analysisType="general"
      isFiltered={isFiltered}
      onInsightAction={(insight) => {
        console.log('Insight action:', insight);
      }}
    />
  );
};

export default AIInsights;