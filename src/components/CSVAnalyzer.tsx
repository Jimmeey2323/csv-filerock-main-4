import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Eye,
  TrendingUp,
  Database,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { csvProcessor, CSVProcessingResult, CSVValidationRule } from '@/utils/csvProcessor';
import { toast } from 'sonner';

interface CSVAnalyzerProps {
  files: File[];
  onAnalysisComplete?: (results: CSVProcessingResult[]) => void;
}

const CSVAnalyzer: React.FC<CSVAnalyzerProps> = ({ files, onAnalysisComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CSVProcessingResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<CSVProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Process files when they change
  useEffect(() => {
    if (files.length > 0) {
      handleProcessFiles();
    }
  }, [files]);

  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const validationRules: CSVValidationRule[] = [
        { column: 'Email', type: 'email', message: 'Invalid email format' },
        { column: 'email', type: 'email', message: 'Invalid email format' },
        { column: 'Customer Email', type: 'email', message: 'Invalid email format' },
        { column: 'Date', type: 'date', message: 'Invalid date format' },
        { column: 'Class Date', type: 'date', message: 'Invalid date format' },
        { column: 'First visit at', type: 'date', message: 'Invalid date format' }
      ];

      const processingResults: CSVProcessingResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress((i / files.length) * 100);
        
        try {
          const result = await csvProcessor.processCSV(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ','
          }, validationRules);
          
          processingResults.push(result);
          
          toast.success(`Processed ${file.name} successfully`, {
            description: `${result.rowCount} rows, ${result.columnCount} columns`
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`, {
            description: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      setProgress(100);
      setResults(processingResults);
      setSelectedResult(processingResults[0] || null);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(processingResults);
      }
      
      toast.success('All files processed successfully!');
      
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  }, [files, onAnalysisComplete]);

  const handleExportData = useCallback((result: CSVProcessingResult, format: 'csv' | 'json') => {
    const filename = result.fileName.replace(/\.[^/.]+$/, '');
    csvProcessor.exportData(result.data, format, `${filename}_processed`);
    toast.success(`Exported ${filename} as ${format.toUpperCase()}`);
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <FileText className="h-4 w-4" />
              Files Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{results.length}</div>
            <p className="text-xs text-blue-600 mt-1">CSV files analyzed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <Database className="h-4 w-4" />
              Total Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {results.reduce((sum, r) => sum + r.rowCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Data records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <BarChart3 className="h-4 w-4" />
              Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {results.reduce((sum, r) => sum + r.columnCount, 0)}
            </div>
            <p className="text-xs text-purple-600 mt-1">Total fields</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <Activity className="h-4 w-4" />
              File Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {(results.reduce((sum, r) => sum + r.fileSize, 0) / 1024 / 1024).toFixed(1)}MB
            </div>
            <p className="text-xs text-amber-600 mt-1">Total size</p>
          </CardContent>
        </Card>
      </div>

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Processed Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResult === result 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">{result.fileName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.rowCount.toLocaleString()} rows • {result.columnCount} columns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.errors.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {result.errors.length} errors
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {(result.fileSize / 1024).toFixed(1)}KB
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataPreview = () => {
    if (!selectedResult) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a file to preview its data</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Data Preview: {selectedResult.fileName}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportData(selectedResult, 'csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportData(selectedResult, 'json')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedResult.headers.map((header, index) => (
                      <TableHead key={index} className="font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedResult.preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {selectedResult.headers.map((header, colIndex) => (
                        <TableCell key={colIndex} className="max-w-[200px] truncate">
                          {row[header] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedResult.preview.length < selectedResult.rowCount && (
          <p className="text-sm text-muted-foreground text-center">
            Showing first {selectedResult.preview.length} of {selectedResult.rowCount.toLocaleString()} rows
          </p>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!selectedResult) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a file to view analytics</p>
        </div>
      );
    }

    const analysis = csvProcessor.analyzeCSVStructure(selectedResult.data);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Column Analysis: {selectedResult.fileName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Non-null Count</TableHead>
                    <TableHead>Unique Values</TableHead>
                    <TableHead>Statistics</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedResult.headers.map((header, index) => {
                    const stats = analysis.statistics[header];
                    const dataType = analysis.dataTypes[header];
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dataType}</Badge>
                        </TableCell>
                        <TableCell>{stats?.nonNullCount || 0}</TableCell>
                        <TableCell>{stats?.uniqueCount || 0}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {dataType === 'number' && stats && (
                            <div className="text-xs">
                              Min: {stats.min}, Max: {stats.max}, Avg: {stats.average?.toFixed(2)}
                            </div>
                          )}
                          {dataType === 'text' && stats && (
                            <div className="text-xs">
                              Avg length: {stats.averageLength?.toFixed(1)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Data Quality Issues */}
        {selectedResult.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Data Quality Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedResult.errors.slice(0, 10).map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      Row {error.row}: {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
                {selectedResult.errors.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {selectedResult.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (isProcessing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Processing CSV Files...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Processing {files.length} file{files.length !== 1 ? 's' : ''}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No CSV Files Processed</h3>
            <p className="text-muted-foreground">Upload CSV files to begin analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Data Preview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="preview">
          {renderDataPreview()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSVAnalyzer;