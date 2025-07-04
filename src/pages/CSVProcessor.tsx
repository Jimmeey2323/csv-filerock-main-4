import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/FileUploader';
import CSVAnalyzer from '@/components/CSVAnalyzer';
import { CSVProcessingResult } from '@/utils/csvProcessor';
import { ArrowLeft, FileSpreadsheet, BarChart3, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CSVProcessor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<CSVProcessingResult[]>([]);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    // Filter for CSV files only
    const csvFiles = newFiles.filter(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFiles.length !== newFiles.length) {
      toast.warning('Only CSV files are supported');
    }
    
    setFiles(prevFiles => [...prevFiles, ...csvFiles]);
    
    if (csvFiles.length > 0) {
      setActiveTab('analyze');
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const handleAnalysisComplete = useCallback((results: CSVProcessingResult[]) => {
    setProcessingResults(results);
    toast.success(`Successfully analyzed ${results.length} CSV file${results.length !== 1 ? 's' : ''}`);
  }, []);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessingResults([]);
    setActiveTab('upload');
  }, []);

  const handleExportAll = useCallback(() => {
    if (processingResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create a combined dataset
    const combinedData = processingResults.reduce((acc, result) => {
      const dataWithSource = result.data.map(row => ({
        ...row,
        _source_file: result.fileName
      }));
      return [...acc, ...dataWithSource];
    }, [] as any[]);

    // Export as JSON
    const json = JSON.stringify(combinedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'combined_csv_data.json';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Combined data exported successfully');
  }, [processingResults]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">CSV File Processor</h1>
              <p className="text-sm text-muted-foreground">
                Upload, analyze, and process CSV files with advanced analytics
              </p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              {processingResults.length > 0 && (
                <Button onClick={handleExportAll}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2" disabled={files.length === 0}>
              <BarChart3 className="h-4 w-4" />
              Analyze Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  CSV File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFilesAdded={handleFilesAdded}
                  onProcessFiles={() => setActiveTab('analyze')}
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  accept=".csv"
                  maxFiles={10}
                />
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      {files.length} CSV file{files.length !== 1 ? 's' : ''} ready for analysis
                    </p>
                    <Button onClick={() => setActiveTab('analyze')}>
                      Start Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-6">
            <CSVAnalyzer 
              files={files} 
              onAnalysisComplete={handleAnalysisComplete}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm py-4 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          CSV File Processor • Advanced Analytics & Data Processing
        </div>
      </footer>
    </div>
  );
};

export default CSVProcessor;