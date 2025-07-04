import Papa from 'papaparse';

export interface CSVProcessingOptions {
  delimiter?: string;
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
  encoding?: string;
}

export interface CSVProcessingResult {
  data: any[];
  meta: Papa.ParseMeta;
  errors: Papa.ParseError[];
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  preview: any[];
}

export interface CSVValidationRule {
  column: string;
  type: 'required' | 'email' | 'date' | 'number' | 'phone' | 'custom';
  message?: string;
  validator?: (value: any) => boolean;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    column: string;
    value: any;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    column: string;
    value: any;
    message: string;
  }>;
}

/**
 * Enhanced CSV processing with validation and error handling
 */
export class CSVProcessor {
  private static instance: CSVProcessor;
  
  public static getInstance(): CSVProcessor {
    if (!CSVProcessor.instance) {
      CSVProcessor.instance = new CSVProcessor();
    }
    return CSVProcessor.instance;
  }

  /**
   * Process a CSV file with enhanced options and validation
   */
  async processCSV(
    file: File, 
    options: CSVProcessingOptions = {},
    validationRules: CSVValidationRule[] = []
  ): Promise<CSVProcessingResult> {
    const defaultOptions: CSVProcessingOptions = {
      header: true,
      skipEmptyLines: true,
      delimiter: '',
      encoding: 'UTF-8',
      ...options
    };

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      Papa.parse(file, {
        ...defaultOptions,
        complete: (results) => {
          const processingTime = Date.now() - startTime;
          
          try {
            const processedResult = this.processResults(results, file, validationRules);
            
            console.log(`CSV processing completed in ${processingTime}ms:`, {
              fileName: file.name,
              rows: processedResult.rowCount,
              columns: processedResult.columnCount,
              errors: processedResult.errors.length
            });
            
            resolve(processedResult);
          } catch (error) {
            console.error('Error processing CSV results:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
        chunk: (results, parser) => {
          // Handle large files in chunks if needed
          if (results.errors.length > 100) {
            parser.abort();
            reject(new Error('Too many parsing errors. File may be corrupted.'));
          }
        }
      });
    });
  }

  /**
   * Process multiple CSV files concurrently
   */
  async processMultipleCSVs(
    files: File[],
    options: CSVProcessingOptions = {},
    validationRules: CSVValidationRule[] = []
  ): Promise<CSVProcessingResult[]> {
    const maxConcurrent = 3; // Limit concurrent processing
    const results: CSVProcessingResult[] = [];
    
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(file => 
        this.processCSV(file, options, validationRules)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Error processing batch ${i / maxConcurrent + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Validate CSV data against rules
   */
  validateCSVData(data: any[], rules: CSVValidationRule[]): CSVValidationResult {
    const errors: CSVValidationResult['errors'] = [];
    const warnings: CSVValidationResult['warnings'] = [];

    data.forEach((row, rowIndex) => {
      rules.forEach(rule => {
        const value = row[rule.column];
        const validation = this.validateField(value, rule);
        
        if (!validation.isValid) {
          errors.push({
            row: rowIndex + 1,
            column: rule.column,
            value,
            message: validation.message || `Invalid ${rule.type} in column ${rule.column}`
          });
        }
        
        if (validation.warning) {
          warnings.push({
            row: rowIndex + 1,
            column: rule.column,
            value,
            message: validation.warning
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect CSV file structure and suggest column mappings
   */
  analyzeCSVStructure(data: any[]): {
    suggestedMappings: Record<string, string>;
    dataTypes: Record<string, string>;
    statistics: Record<string, any>;
  } {
    if (!data || data.length === 0) {
      return { suggestedMappings: {}, dataTypes: {}, statistics: {} };
    }

    const headers = Object.keys(data[0]);
    const suggestedMappings: Record<string, string> = {};
    const dataTypes: Record<string, string> = {};
    const statistics: Record<string, any> = {};

    headers.forEach(header => {
      // Suggest mappings based on header names
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('email')) {
        suggestedMappings[header] = 'email';
      } else if (lowerHeader.includes('name')) {
        suggestedMappings[header] = 'name';
      } else if (lowerHeader.includes('date')) {
        suggestedMappings[header] = 'date';
      } else if (lowerHeader.includes('phone')) {
        suggestedMappings[header] = 'phone';
      } else if (lowerHeader.includes('revenue') || lowerHeader.includes('amount') || lowerHeader.includes('value')) {
        suggestedMappings[header] = 'currency';
      }

      // Detect data types
      const sampleValues = data.slice(0, 100).map(row => row[header]).filter(v => v != null);
      dataTypes[header] = this.detectDataType(sampleValues);

      // Calculate statistics
      statistics[header] = this.calculateColumnStatistics(sampleValues, dataTypes[header]);
    });

    return { suggestedMappings, dataTypes, statistics };
  }

  /**
   * Clean and normalize CSV data
   */
  cleanCSVData(data: any[]): any[] {
    return data.map(row => {
      const cleanedRow: any = {};
      
      Object.keys(row).forEach(key => {
        let value = row[key];
        
        // Trim whitespace
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        // Handle empty strings
        if (value === '') {
          value = null;
        }
        
        // Clean header names
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        cleanedRow[cleanKey] = value;
      });
      
      return cleanedRow;
    });
  }

  /**
   * Export processed data to various formats
   */
  exportData(data: any[], format: 'csv' | 'json' | 'xlsx', filename: string): void {
    switch (format) {
      case 'csv':
        this.exportToCSV(data, filename);
        break;
      case 'json':
        this.exportToJSON(data, filename);
        break;
      case 'xlsx':
        console.warn('XLSX export not implemented yet');
        break;
    }
  }

  // Private methods

  private processResults(
    results: Papa.ParseResult<any>, 
    file: File, 
    validationRules: CSVValidationRule[]
  ): CSVProcessingResult {
    const data = results.data || [];
    const headers = results.meta.fields || [];
    const preview = data.slice(0, 10);
    
    // Clean the data
    const cleanedData = this.cleanCSVData(data);
    
    // Validate if rules provided
    let validationResult: CSVValidationResult | null = null;
    if (validationRules.length > 0) {
      validationResult = this.validateCSVData(cleanedData, validationRules);
    }

    return {
      data: cleanedData,
      meta: results.meta,
      errors: results.errors || [],
      fileName: file.name,
      fileSize: file.size,
      rowCount: cleanedData.length,
      columnCount: headers.length,
      headers,
      preview
    };
  }

  private validateField(value: any, rule: CSVValidationRule): { 
    isValid: boolean; 
    message?: string; 
    warning?: string; 
  } {
    switch (rule.type) {
      case 'required':
        return {
          isValid: value != null && value !== '',
          message: rule.message || `${rule.column} is required`
        };
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: !value || emailRegex.test(value),
          message: rule.message || `Invalid email format in ${rule.column}`
        };
        
      case 'date':
        const dateValue = new Date(value);
        return {
          isValid: !value || !isNaN(dateValue.getTime()),
          message: rule.message || `Invalid date format in ${rule.column}`
        };
        
      case 'number':
        return {
          isValid: !value || !isNaN(Number(value)),
          message: rule.message || `Invalid number format in ${rule.column}`
        };
        
      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return {
          isValid: !value || phoneRegex.test(value.replace(/\s/g, '')),
          message: rule.message || `Invalid phone format in ${rule.column}`
        };
        
      case 'custom':
        if (rule.validator) {
          return {
            isValid: rule.validator(value),
            message: rule.message || `Custom validation failed for ${rule.column}`
          };
        }
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  }

  private detectDataType(values: any[]): string {
    if (values.length === 0) return 'unknown';
    
    const nonNullValues = values.filter(v => v != null && v !== '');
    if (nonNullValues.length === 0) return 'empty';
    
    // Check if all values are numbers
    if (nonNullValues.every(v => !isNaN(Number(v)))) {
      return 'number';
    }
    
    // Check if all values are dates
    if (nonNullValues.every(v => !isNaN(Date.parse(v)))) {
      return 'date';
    }
    
    // Check if all values are emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (nonNullValues.every(v => emailRegex.test(v))) {
      return 'email';
    }
    
    return 'text';
  }

  private calculateColumnStatistics(values: any[], dataType: string): any {
    const nonNullValues = values.filter(v => v != null && v !== '');
    const stats: any = {
      totalCount: values.length,
      nonNullCount: nonNullValues.length,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: new Set(nonNullValues).size
    };

    if (dataType === 'number') {
      const numbers = nonNullValues.map(v => Number(v));
      stats.min = Math.min(...numbers);
      stats.max = Math.max(...numbers);
      stats.average = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      stats.median = this.calculateMedian(numbers);
    }

    if (dataType === 'text') {
      stats.averageLength = nonNullValues.reduce((sum, v) => sum + String(v).length, 0) / nonNullValues.length;
      stats.maxLength = Math.max(...nonNullValues.map(v => String(v).length));
      stats.minLength = Math.min(...nonNullValues.map(v => String(v).length));
    }

    return stats;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  }

  private exportToJSON(data: any[], filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  }
}

// Export singleton instance
export const csvProcessor = CSVProcessor.getInstance();