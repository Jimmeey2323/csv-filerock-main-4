import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import ProcessingLoader from '@/components/ProcessingLoader';
import ResultsTable from '@/components/ResultsTable';
import RawDataView from '@/components/RawDataView';
import MonthlyMetricsView from '@/components/MonthlyMetricsView';
import SalesMetricsView from '@/components/SalesMetricsView';
import PerformanceInsightsView from '@/components/PerformanceInsightsView';
import KanbanView from '@/components/KanbanView';
import ConversionSummaryTable from '@/components/ConversionSummaryTable';
import { parseCSV, categorizeFiles, getFileTypes } from '@/utils/csvParser';
import { processData, ProcessedTeacherData, ProcessingProgress } from '@/utils/dataProcessor';
import { deduplicateClientsByEmail } from '@/utils/deduplication';
import Logo from '@/components/Logo';
import AIInsights from '@/components/AIInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText, Table, BarChart, TrendingUp, Target, DollarSign, Filter, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Local storage keys
const STORAGE_KEYS = {
  PROCESSED_DATA: 'studio-stats-processed-data',
  FILTERED_DATA: 'studio-stats-filtered-data',
  LOCATIONS: 'studio-stats-locations',
  TEACHERS: 'studio-stats-teachers',
  PERIODS: 'studio-stats-periods',
  RAW_DATA: 'studio-stats-raw-data',
  PROCESSING_RESULTS: 'studio-stats-processing-results'
};

// Storage utilities with size management
const storageUtils = {
  // Save data to localStorage with error handling and size management
  saveToStorage: (key: string, data: any) => {
    try {
      const dataStr = JSON.stringify(data);
      const sizeInMB = new Blob([dataStr]).size / (1024 * 1024);
      
      // If data is too large (>2MB), don't store raw data in localStorage
      if (sizeInMB > 2 && key.includes('raw')) {
        console.warn(`Data too large for localStorage (${sizeInMB.toFixed(2)}MB), skipping storage for ${key}`);
        return false;
      }
      
      localStorage.setItem(key, dataStr);
      return true;
    } catch (error) {
      console.error(`Error saving to storage for key ${key}:`, error);
      // If it's a QuotaExceededError, notify the user
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error('Storage limit exceeded. Some data might not be saved between sessions.');
      }
      return false;
    }
  },
  // Load data from localStorage with error handling
  loadFromStorage: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading from storage for key ${key}:`, error);
      return null;
    }
  },
  // Clear specific localStorage keys
  clearStorage: (keys: string[]) => {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error clearing storage for key ${key}:`, error);
      }
    });
  }
};

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedTeacherData[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessedTeacherData[]>([]);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'detailed'>('table');
  const [dataMode, setDataMode] = useState<'teacher' | 'studio'>('teacher');
  const [activeTab, setActiveTab] = useState('analytics');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [rawData, setRawData] = useState({
    newClientData: [],
    bookingsData: [],
    paymentsData: [],
    processingResults: {
      included: [],
      excluded: [],
      newClients: [],
      convertedClients: [],
      retainedClients: []
    }
  });

  // Add state for managing filters - SINGLE GLOBAL FILTER STATE
  const [globalFilters, setGlobalFilters] = useState({
    location: '',
    teacher: '',
    period: '',
    search: ''
  });

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedProcessedData = storageUtils.loadFromStorage(STORAGE_KEYS.PROCESSED_DATA);
    const savedFilteredData = storageUtils.loadFromStorage(STORAGE_KEYS.FILTERED_DATA);
    const savedLocations = storageUtils.loadFromStorage(STORAGE_KEYS.LOCATIONS);
    const savedTeachers = storageUtils.loadFromStorage(STORAGE_KEYS.TEACHERS);
    const savedPeriods = storageUtils.loadFromStorage(STORAGE_KEYS.PERIODS);
    const savedRawData = storageUtils.loadFromStorage(STORAGE_KEYS.RAW_DATA);
    const savedProcessingResults = storageUtils.loadFromStorage(STORAGE_KEYS.PROCESSING_RESULTS);
    
    if (savedProcessedData) {
      setProcessedData(savedProcessedData);
      setResultsVisible(true);
    }
    if (savedFilteredData) {
      setFilteredData(savedFilteredData);
    }
    if (savedLocations) {
      setLocations(savedLocations);
    }
    if (savedTeachers) {
      setTeachers(savedTeachers);
    }
    if (savedPeriods) {
      setPeriods(savedPeriods);
    }
    if (savedRawData) {
      setRawData(prev => ({ ...prev, ...savedRawData }));
    }
    if (savedProcessingResults) {
      setRawData(prev => ({ ...prev, processingResults: savedProcessingResults }));
    }

    // Set results visible if we have processed data
    if (savedProcessedData && savedProcessedData.length > 0) {
      setResultsVisible(true);
      // Show a toast to inform user that previous data was loaded
      toast.success('Previous session data loaded successfully');
    }
  }, []);

  // Save processed data, filtered data, and metadata to localStorage when they change
  useEffect(() => {
    if (processedData.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.PROCESSED_DATA, processedData);
    }
    if (filteredData.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.FILTERED_DATA, filteredData);
    }
    if (locations.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.LOCATIONS, locations);
    }
    if (teachers.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.TEACHERS, teachers);
    }
    if (periods.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.PERIODS, periods);
    }
  }, [processedData, filteredData, locations, teachers, periods]);

  // Save raw data separately (with size check)
  useEffect(() => {
    if (rawData.newClientData.length > 0 || rawData.bookingsData.length > 0 || rawData.paymentsData.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.RAW_DATA, {
        newClientData: rawData.newClientData,
        bookingsData: rawData.bookingsData,
        paymentsData: rawData.paymentsData
      });
    }
    if (rawData.processingResults.included.length > 0 || rawData.processingResults.excluded.length > 0) {
      storageUtils.saveToStorage(STORAGE_KEYS.PROCESSING_RESULTS, rawData.processingResults);
    }
  }, [rawData]);

  // Update progress
  const updateProgress = useCallback((progressData: ProcessingProgress) => {
    setProgress(progressData.progress);
    setCurrentStep(progressData.currentStep);
  }, []);

  // Handle file upload
  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  // Remove a file
  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  // Process files
  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Please upload files first');
      return;
    }

    // Categorize files
    const categorized = categorizeFiles(files);
    if (!categorized.new) {
      toast.error('Missing New client file. Please upload a file with "new" in the name');
      return;
    }
    if (!categorized.bookings) {
      toast.error('Missing Bookings file. Please upload a file with "bookings" in the name');
      return;
    }

    // Clear previous data before processing new files
    setProcessedData([]);
    setFilteredData([]);
    setLocations([]);
    setTeachers([]);
    setPeriods([]);
    setRawData({
      newClientData: [],
      bookingsData: [],
      paymentsData: [],
      processingResults: {
        included: [],
        excluded: [],
        newClients: [],
        convertedClients: [],
        retainedClients: []
      }
    });

    // Clear localStorage when processing new files
    storageUtils.clearStorage(Object.values(STORAGE_KEYS));
    setIsProcessing(true);
    updateProgress({
      progress: 0,
      currentStep: 'Starting processing...'
    });
    
    try {
      // Parse CSV files
      updateProgress({
        progress: 10,
        currentStep: 'Parsing CSV files...'
      });
      const newFileResult = await parseCSV(categorized.new);
      const bookingsFileResult = await parseCSV(categorized.bookings);

      // Check if payments file exists
      let salesFileResult = {
        data: []
      };
      if (categorized.payments) {
        salesFileResult = await parseCSV(categorized.payments);
      }

      // Save raw data for the Raw Data View
      const initialRawData = {
        newClientData: newFileResult.data || [],
        bookingsData: bookingsFileResult.data || [],
        paymentsData: salesFileResult.data || [],
        processingResults: {
          included: [],
          excluded: [],
          newClients: [],
          convertedClients: [],
          retainedClients: []
        }
      };
      setRawData(initialRawData);

      // Process data
      updateProgress({
        progress: 30,
        currentStep: 'Processing data...'
      });
      const result = await processData(newFileResult.data || [], bookingsFileResult.data || [], salesFileResult.data || [], updateProgress);

      // Update state with processed data
      setProcessedData(result.processedData || []);
      setFilteredData(result.processedData || []);
      setLocations(result.locations || []);
      setTeachers(result.teachers || []);
      setPeriods(result.periods || []);

      // Update raw data processing results with the results from processing
      setRawData(prev => ({
        ...prev,
        processingResults: {
          included: result.includedRecords || [],
          excluded: result.excludedRecords || [],
          newClients: result.newClientRecords || [],
          convertedClients: result.convertedClientRecords || [],
          retainedClients: result.retainedClientRecords || []
        }
      }));

      // Show success and finish processing
      updateProgress({
        progress: 100,
        currentStep: 'Finalizing...'
      });
      
      // Wait a moment for the final progress to show, then show results
      setTimeout(() => {
        setIsProcessing(false);
        setResultsVisible(true);
        toast.success('Files processed successfully! Dashboard is now ready.');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing files:', error);
      setIsProcessing(false);
      toast.error('Error processing files. Please check your file format and try again');
    }
  }, [files, updateProgress]);

  // SINGLE GLOBAL FILTER HANDLER
  const handleGlobalFilterChange = useCallback((filters: {
    location?: string;
    teacher?: string;
    period?: string;
    search?: string;
  }) => {
    const newFilters = {
      location: filters.location !== undefined ? filters.location : globalFilters.location,
      teacher: filters.teacher !== undefined ? filters.teacher : globalFilters.teacher,
      period: filters.period !== undefined ? filters.period : globalFilters.period,
      search: filters.search !== undefined ? filters.search : globalFilters.search
    };
    
    setGlobalFilters(newFilters);
    
    let filtered = [...processedData];

    // Filter by location
    if (newFilters.location && newFilters.location !== 'all-locations') {
      filtered = filtered.filter(item => item.location === newFilters.location);
    }

    // Filter by teacher
    if (newFilters.teacher && newFilters.teacher !== 'all-teachers') {
      filtered = filtered.filter(item => item.teacherName === newFilters.teacher);
    }

    // Filter by period
    if (newFilters.period && newFilters.period !== 'all-periods') {
      filtered = filtered.filter(item => item.period === newFilters.period);
    }

    // Filter by search (teacher name or location)
    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.teacherName && item.teacherName.toLowerCase().includes(searchLower)) || 
        (item.location && item.location.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredData(filtered);
  }, [processedData, globalFilters]);

  // Apply fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('container')?.classList.remove('opacity-0');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = Object.values(globalFilters).some(Boolean);

  // Clear saved data and reset to upload screen
  const handleResetApp = useCallback(() => {
    // Clear localStorage
    storageUtils.clearStorage(Object.values(STORAGE_KEYS));

    // Reset state
    setResultsVisible(false);
    setProcessedData([]);
    setFilteredData([]);
    setLocations([]);
    setTeachers([]);
    setPeriods([]);
    setFiles([]);
    setGlobalFilters({
      location: '',
      teacher: '',
      period: '',
      search: ''
    });
    setRawData({
      newClientData: [],
      bookingsData: [],
      paymentsData: [],
      processingResults: {
        included: [],
        excluded: [],
        newClients: [],
        convertedClients: [],
        retainedClients: []
      }
    });
    toast.success('Application reset. You can upload new files');
  }, []);

  return (
    <div className="min-h-screen">
      {!resultsVisible ? (
        <div className="min-h-screen">
          <FileUploader 
            onFilesAdded={handleFilesAdded} 
            onProcessFiles={handleProcessFiles}
            files={files}
            onRemoveFile={handleRemoveFile}
            accept=".csv" 
            maxFiles={10} 
          />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container flex justify-between items-center py-3 bg-neutral-50">
              <Logo size="md" />
            </div>
          </header>
          
          <main id="container" className="container py-8 transition-opacity duration-500 opacity-100">
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <button onClick={handleResetApp} className="text-sm text-destructive hover:underline">
                    Reset data
                  </button>
                  <button onClick={() => {
                    setResultsVisible(false);
                  }} className="text-sm text-primary hover:underline">
                    Process new files
                  </button>
                </div>
              </div>
              
              <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen} className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {isInsightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle insights</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-2">
                  <AIInsights data={filteredData} isFiltered={hasActiveFilters} />
                </CollapsibleContent>
              </Collapsible>

              {/* SINGLE GLOBAL FILTER BAR */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={globalFilters.location === '' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleGlobalFilterChange({ location: '' })}
                  >
                    All Locations
                  </Button>
                  {locations.slice(0, 5).map(location => (
                    <Button 
                      key={location}
                      variant={globalFilters.location === location ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleGlobalFilterChange({ location })}
                    >
                      {location}
                    </Button>
                  ))}
                  
                  <Button 
                    variant={globalFilters.teacher === '' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleGlobalFilterChange({ teacher: '' })}
                  >
                    All Teachers
                  </Button>
                  {teachers.slice(0, 3).map(teacher => (
                    <Button 
                      key={teacher}
                      variant={globalFilters.teacher === teacher ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleGlobalFilterChange({ teacher })}
                    >
                      {teacher}
                    </Button>
                  ))}
                  
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGlobalFilterChange({ location: '', teacher: '', period: '', search: '' })}
                      className="ml-auto"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="analytics" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span>Analytics Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="conversion-summary" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>Conversion Summary</span>
                  </TabsTrigger>
                  <TabsTrigger value="monthly-metrics" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Monthly Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="sales-metrics" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Sales Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="performance-insights" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Performance Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center gap-2">
                    <div className="h-4 w-4 grid grid-cols-2 gap-0.5">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                    <span>Kanban View</span>
                  </TabsTrigger>
                  <TabsTrigger value="raw-data" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Raw Data & Processing</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analytics" className="mt-0">
                  <div className="space-y-6">
                    <ResultsTable 
                      data={filteredData} 
                      locations={locations} 
                      isLoading={false} 
                      viewMode={viewMode} 
                      dataMode={dataMode} 
                      onFilterChange={handleGlobalFilterChange} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="conversion-summary" className="mt-0">
                  <ConversionSummaryTable 
                    newClientData={rawData.newClientData || []} 
                    salesData={rawData.paymentsData || []} 
                    bookingsData={rawData.bookingsData || []} 
                  />
                </TabsContent>

                <TabsContent value="monthly-metrics" className="mt-0">
                  <MonthlyMetricsView data={filteredData} />
                </TabsContent>

                <TabsContent value="sales-metrics" className="mt-0">
                  <SalesMetricsView data={filteredData} paymentsData={rawData.paymentsData || []} />
                </TabsContent>

                <TabsContent value="performance-insights" className="mt-0">
                  <PerformanceInsightsView data={filteredData} />
                </TabsContent>
                
                <TabsContent value="kanban" className="mt-0">
                  <KanbanView data={filteredData} />
                </TabsContent>
                
                <TabsContent value="raw-data" className="mt-0">
                  <RawDataView 
                    newClientData={rawData.newClientData || []} 
                    bookingsData={rawData.bookingsData || []} 
                    paymentsData={rawData.paymentsData || []} 
                    processingResults={rawData.processingResults || {
                      included: [],
                      excluded: [],
                      newClients: [],
                      convertedClients: [],
                      retainedClients: []
                    }} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>

          <footer className="border-t bg-white/80 backdrop-blur-sm py-4 mt-8">
            <div className="container text-center text-xs text-muted-foreground">
              Studio Stats Analytics Dashboard • {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      )}

      {/* Processing Loader */}
      <ProcessingLoader isProcessing={isProcessing} progress={progress} currentStep={currentStep} />
    </div>
  );
};

export default Index;