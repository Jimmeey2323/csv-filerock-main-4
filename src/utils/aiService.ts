export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'insight' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data?: any;
  timestamp: Date;
}

export interface AIAnalysisRequest {
  data: any[];
  context: string;
  analysisType: 'performance' | 'conversion' | 'retention' | 'revenue' | 'general';
  filters?: Record<string, any>;
}

export interface AIResponse {
  insights: AIInsight[];
  summary: string;
  recommendations: string[];
  confidence: number;
}

class AIService {
  private static instance: AIService;
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string | null = null;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Provider Management
  addProvider(id: string, provider: AIProvider): void {
    this.providers.set(id, provider);
    this.saveProvidersToStorage();
  }

  removeProvider(id: string): void {
    this.providers.delete(id);
    if (this.activeProvider === id) {
      this.activeProvider = null;
    }
    this.saveProvidersToStorage();
  }

  setActiveProvider(id: string): void {
    if (this.providers.has(id)) {
      this.activeProvider = id;
      localStorage.setItem('ai_active_provider', id);
    }
  }

  getActiveProvider(): AIProvider | null {
    if (!this.activeProvider) return null;
    return this.providers.get(this.activeProvider) || null;
  }

  getProviders(): Array<{ id: string; provider: AIProvider }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({ id, provider }));
  }

  // Load providers from localStorage
  loadProvidersFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai_providers');
      if (stored) {
        const providers = JSON.parse(stored);
        this.providers = new Map(Object.entries(providers));
      }
      
      const activeProvider = localStorage.getItem('ai_active_provider');
      if (activeProvider && this.providers.has(activeProvider)) {
        this.activeProvider = activeProvider;
      }
    } catch (error) {
      console.error('Error loading AI providers from storage:', error);
    }
  }

  private saveProvidersToStorage(): void {
    try {
      const providersObj = Object.fromEntries(this.providers);
      localStorage.setItem('ai_providers', JSON.stringify(providersObj));
    } catch (error) {
      console.error('Error saving AI providers to storage:', error);
    }
  }

  // AI Analysis Methods
  async analyzeData(request: AIAnalysisRequest): Promise<AIResponse> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      const response = await this.callAI(provider, prompt);
      return this.parseAIResponse(response, request);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze data with AI');
    }
  }

  async generateInsights(data: any[], context: string): Promise<AIInsight[]> {
    const provider = this.getActiveProvider();
    if (!provider) {
      return this.generateFallbackInsights(data, context);
    }

    try {
      const prompt = this.buildInsightsPrompt(data, context);
      const response = await this.callAI(provider, prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.generateFallbackInsights(data, context);
    }
  }

  async generateRecommendations(data: any[], problemArea: string): Promise<string[]> {
    const provider = this.getActiveProvider();
    if (!provider) {
      return this.generateFallbackRecommendations(data, problemArea);
    }

    try {
      const prompt = this.buildRecommendationsPrompt(data, problemArea);
      const response = await this.callAI(provider, prompt);
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateFallbackRecommendations(data, problemArea);
    }
  }

  async summarizeData(data: any[], focus: string): Promise<string> {
    const provider = this.getActiveProvider();
    if (!provider) {
      return this.generateFallbackSummary(data, focus);
    }

    try {
      const prompt = this.buildSummaryPrompt(data, focus);
      const response = await this.callAI(provider, prompt);
      return this.parseSummary(response);
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateFallbackSummary(data, focus);
    }
  }

  // Private Methods
  private async callAI(provider: AIProvider, prompt: string): Promise<string> {
    const requestBody = this.buildRequestBody(provider, prompt);
    
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.extractResponseText(provider, data);
  }

  private buildRequestBody(provider: AIProvider, prompt: string): any {
    // Different providers have different request formats
    switch (provider.name.toLowerCase()) {
      case 'openai':
        return {
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        };
      
      case 'anthropic':
        return {
          model: provider.model,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        };
      
      case 'deepseek':
        return {
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        };
      
      case 'gemini':
        return {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          },
        };
      
      case 'groq':
        return {
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        };
      
      default:
        return {
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        };
    }
  }

  private extractResponseText(provider: AIProvider, data: any): string {
    switch (provider.name.toLowerCase()) {
      case 'openai':
      case 'deepseek':
      case 'groq':
        return data.choices?.[0]?.message?.content || '';
      
      case 'anthropic':
        return data.content?.[0]?.text || '';
      
      case 'gemini':
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      default:
        return data.choices?.[0]?.message?.content || data.content || '';
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const dataPreview = JSON.stringify(request.data.slice(0, 5), null, 2);
    
    return `
Analyze the following studio performance data and provide insights:

Context: ${request.context}
Analysis Type: ${request.analysisType}
Data Sample (first 5 records):
${dataPreview}

Total Records: ${request.data.length}

Please provide:
1. Key insights and patterns
2. Performance trends
3. Areas of concern
4. Opportunities for improvement
5. Specific actionable recommendations

Format your response as JSON with the following structure:
{
  "summary": "Brief overview of findings",
  "insights": [
    {
      "type": "insight|recommendation|warning|opportunity|trend",
      "title": "Insight title",
      "description": "Detailed description",
      "confidence": 0.8,
      "priority": "high|medium|low|critical",
      "category": "performance|conversion|retention|revenue"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
`;
  }

  private buildInsightsPrompt(data: any[], context: string): string {
    const summary = this.generateDataSummary(data);
    
    return `
Generate actionable insights for studio performance data:

Context: ${context}
Data Summary: ${summary}

Focus on:
- Performance patterns and trends
- Conversion and retention opportunities
- Revenue optimization
- Teacher performance variations
- Location-specific insights

Provide 5-8 specific, actionable insights in JSON format:
[
  {
    "type": "insight|recommendation|warning|opportunity|trend",
    "title": "Brief title",
    "description": "Detailed insight",
    "confidence": 0.9,
    "priority": "high|medium|low|critical",
    "category": "performance|conversion|retention|revenue",
    "actionable": true
  }
]
`;
  }

  private buildRecommendationsPrompt(data: any[], problemArea: string): string {
    return `
Based on the studio performance data, provide specific recommendations for: ${problemArea}

Data context: ${this.generateDataSummary(data)}

Provide 3-5 specific, actionable recommendations as a JSON array:
["recommendation 1", "recommendation 2", "recommendation 3"]

Focus on practical steps that can be implemented immediately.
`;
  }

  private buildSummaryPrompt(data: any[], focus: string): string {
    return `
Summarize the key findings from this studio performance data with focus on: ${focus}

Data: ${this.generateDataSummary(data)}

Provide a concise 2-3 sentence summary highlighting the most important insights.
`;
  }

  private generateDataSummary(data: any[]): string {
    if (!data || data.length === 0) return 'No data available';
    
    const totalRecords = data.length;
    const sampleData = data.slice(0, 3);
    const keys = Object.keys(data[0] || {});
    
    return `${totalRecords} records with fields: ${keys.join(', ')}. Sample: ${JSON.stringify(sampleData)}`;
  }

  private parseAIResponse(response: string, request: AIAnalysisRequest): AIResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        insights: parsed.insights || [],
        summary: parsed.summary || '',
        recommendations: parsed.recommendations || [],
        confidence: 0.8,
      };
    } catch (error) {
      return this.createFallbackResponse(request);
    }
  }

  private parseInsights(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.map(insight => ({
        ...insight,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      })) : [];
    } catch (error) {
      return [];
    }
  }

  private parseRecommendations(response: string): string[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  private parseSummary(response: string): string {
    return response.trim();
  }

  // Fallback methods when AI is not available
  private generateFallbackInsights(data: any[], context: string): AIInsight[] {
    const insights: AIInsight[] = [];
    
    if (data.length === 0) {
      return [{
        id: 'fallback-1',
        type: 'insight',
        title: 'No Data Available',
        description: 'Upload and process data to see AI-generated insights.',
        confidence: 1.0,
        actionable: false,
        priority: 'low',
        category: 'general',
        timestamp: new Date(),
      }];
    }

    // Generate basic insights based on data patterns
    const totalRecords = data.length;
    insights.push({
      id: 'fallback-data-volume',
      type: 'insight',
      title: 'Data Volume Analysis',
      description: `Analyzing ${totalRecords} records. Consider segmenting data for deeper insights.`,
      confidence: 0.9,
      actionable: true,
      priority: 'medium',
      category: 'general',
      timestamp: new Date(),
    });

    return insights;
  }

  private generateFallbackRecommendations(data: any[], problemArea: string): string[] {
    return [
      `Focus on improving ${problemArea} through targeted analysis`,
      'Consider implementing data-driven decision making processes',
      'Regular monitoring and review of key performance indicators',
    ];
  }

  private generateFallbackSummary(data: any[], focus: string): string {
    return `Analysis of ${data.length} records focusing on ${focus}. Configure AI provider for detailed insights.`;
  }

  private createFallbackResponse(request: AIAnalysisRequest): AIResponse {
    return {
      insights: this.generateFallbackInsights(request.data, request.context),
      summary: this.generateFallbackSummary(request.data, request.analysisType),
      recommendations: this.generateFallbackRecommendations(request.data, request.analysisType),
      confidence: 0.5,
    };
  }
}

export const aiService = AIService.getInstance();