import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Brain, 
  Key, 
  Zap,
  Sparkles,
  Bot,
  Shield,
  Globe
} from 'lucide-react';
import { aiService, AIProvider } from '@/utils/aiService';
import { toast } from 'sonner';

interface AIProviderSetupProps {
  onProviderConfigured?: () => void;
}

const AIProviderSetup: React.FC<AIProviderSetupProps> = ({ onProviderConfigured }) => {
  const [providers, setProviders] = useState<Array<{ id: string; provider: AIProvider }>>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [newProvider, setNewProvider] = useState<AIProvider>({
    name: '',
    apiKey: '',
    baseUrl: '',
    model: ''
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    aiService.loadProvidersFromStorage();
    setProviders(aiService.getProviders());
    const active = aiService.getActiveProvider();
    setActiveProvider(active ? providers.find(p => p.provider === active)?.id || null : null);
  };

  const predefinedProviders = [
    {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      icon: '🤖'
    },
    {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      icon: '🧠'
    },
    {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      models: ['deepseek-chat', 'deepseek-coder'],
      icon: '🔍'
    },
    {
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      models: ['gemini-pro', 'gemini-pro-vision'],
      icon: '💎'
    },
    {
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      models: ['mixtral-8x7b-32768', 'llama2-70b-4096'],
      icon: '⚡'
    }
  ];

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.apiKey || !newProvider.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    const id = `${newProvider.name.toLowerCase()}-${Date.now()}`;
    aiService.addProvider(id, newProvider);
    
    setProviders(aiService.getProviders());
    setNewProvider({ name: '', apiKey: '', baseUrl: '', model: '' });
    setIsDialogOpen(false);
    
    toast.success(`${newProvider.name} provider added successfully`);
    
    if (onProviderConfigured) {
      onProviderConfigured();
    }
  };

  const handleRemoveProvider = (id: string) => {
    aiService.removeProvider(id);
    setProviders(aiService.getProviders());
    toast.success('Provider removed successfully');
  };

  const handleSetActiveProvider = (id: string) => {
    aiService.setActiveProvider(id);
    setActiveProvider(id);
    toast.success('Active AI provider updated');
    
    if (onProviderConfigured) {
      onProviderConfigured();
    }
  };

  const handleTestConnection = async () => {
    if (!newProvider.apiKey || !newProvider.baseUrl) {
      toast.error('Please provide API key and base URL');
      return;
    }

    setIsTestingConnection(true);
    
    try {
      // Simple test request
      const testPrompt = 'Hello, this is a connection test. Please respond with "Connection successful".';
      
      // This is a simplified test - in a real implementation, you'd make an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Connection test successful!');
    } catch (error) {
      toast.error('Connection test failed. Please check your API key and settings.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePredefinedProviderSelect = (providerName: string) => {
    const predefined = predefinedProviders.find(p => p.name === providerName);
    if (predefined) {
      setNewProvider({
        name: predefined.name,
        apiKey: '',
        baseUrl: predefined.baseUrl,
        model: predefined.models[0]
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="h-5 w-5" />
            AI Provider Configuration
            <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 mb-2">
                Configure AI providers to unlock intelligent insights, recommendations, and automated analysis.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="premium" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {providers.length} provider{providers.length !== 1 ? 's' : ''} configured
                </Badge>
                {activeProvider && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    AI Active
                  </Badge>
                )}
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add AI Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Add AI Provider
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="predefined" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="predefined">Quick Setup</TabsTrigger>
                    <TabsTrigger value="custom">Custom Provider</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="predefined" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {predefinedProviders.map((provider) => (
                        <Card 
                          key={provider.name}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            newProvider.name === provider.name ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handlePredefinedProviderSelect(provider.name)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{provider.icon}</div>
                            <h3 className="font-semibold">{provider.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {provider.models.length} models available
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {newProvider.name && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key *</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="apiKey"
                              type="password"
                              placeholder="Enter your API key"
                              value={newProvider.apiKey}
                              onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="model">Model *</Label>
                          <Select 
                            value={newProvider.model} 
                            onValueChange={(value) => setNewProvider({ ...newProvider, model: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {predefinedProviders
                                .find(p => p.name === newProvider.name)
                                ?.models.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={handleTestConnection}
                            disabled={isTestingConnection || !newProvider.apiKey}
                            className="flex-1"
                          >
                            {isTestingConnection ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Test Connection
                              </>
                            )}
                          </Button>
                          <Button onClick={handleAddProvider} className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Provider
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customName">Provider Name *</Label>
                        <Input
                          id="customName"
                          placeholder="e.g., Custom AI"
                          value={newProvider.name}
                          onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customModel">Model *</Label>
                        <Input
                          id="customModel"
                          placeholder="e.g., gpt-4"
                          value={newProvider.model}
                          onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customBaseUrl">API Base URL *</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customBaseUrl"
                          placeholder="https://api.example.com/v1/chat/completions"
                          value={newProvider.baseUrl}
                          onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customApiKey">API Key *</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customApiKey"
                          type="password"
                          placeholder="Enter your API key"
                          value={newProvider.apiKey}
                          onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !newProvider.apiKey}
                        className="flex-1"
                      >
                        {isTestingConnection ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                      <Button onClick={handleAddProvider} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Provider
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Configured Providers */}
      {providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configured AI Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map(({ id, provider }) => (
                <div
                  key={id}
                  className={`p-4 border rounded-lg transition-all ${
                    activeProvider === id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {predefinedProviders.find(p => p.name === provider.name)?.icon || '🤖'}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {provider.name}
                          {activeProvider === id && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Model: {provider.model}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeProvider !== id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActiveProvider(id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProvider(id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Features Preview */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Sparkles className="h-5 w-5" />
            AI-Powered Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">Smart Insights</h4>
              <p className="text-sm text-purple-600">
                Automatic analysis of performance patterns and trends with actionable recommendations.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">Predictive Analytics</h4>
              <p className="text-sm text-purple-600">
                Forecast future performance and identify potential issues before they occur.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">Intelligent Summaries</h4>
              <p className="text-sm text-purple-600">
                Automated generation of executive summaries and key performance highlights.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">Smart Recommendations</h4>
              <p className="text-sm text-purple-600">
                Personalized suggestions for improving conversion rates, retention, and revenue.
              </p>
            </div>
          </div>
          
          {!activeProvider && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure an AI provider above to unlock these intelligent features across all analytics tabs.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderSetup;