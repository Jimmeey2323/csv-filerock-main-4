
import Papa from 'papaparse';

interface ParseOptions {
  header: boolean;
  skipEmptyLines: boolean;
  transformHeader?: (header: string) => string;
}

export const parseCSV = (
  file: File,
  options: ParseOptions = { header: true, skipEmptyLines: true }
): Promise<{data: any[]; meta: Papa.ParseMeta}> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...options,
      complete: (results) => {
        resolve({
          data: results.data,
          meta: results.meta,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const categorizeFiles = (files: File[]) => {
  const categorized = {
    new: undefined as File | undefined,
    bookings: undefined as File | undefined,
    payments: undefined as File | undefined,
    unknown: [] as File[],
  };

  const filePatterns = {
    new: 'new',
    bookings: 'bookings',
    payments: 'payments?',
  };

  files.forEach(file => {
    const fileName = file.name.toLowerCase();
    
    if (new RegExp(filePatterns.new, 'i').test(fileName)) {
      categorized.new = file;
    } else if (new RegExp(filePatterns.bookings, 'i').test(fileName)) {
      categorized.bookings = file;
    } else if (new RegExp(filePatterns.payments, 'i').test(fileName)) {
      categorized.payments = file;
    } else {
      categorized.unknown.push(file);
    }
  });

  return categorized;
};

export const formatDateString = (dateStr: string): string => {
  // Handle date formats like "2025-03-01, 10:15 AM"
  try {
    if (!dateStr) return '';
    
    console.log("Formatting date:", dateStr);
    
    // Check if the date is already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log("Date already in YYYY-MM-DD format:", dateStr);
      return dateStr;
    }
    
    // Extract date part from formats like "2025-03-11, 9:37 AM"
    const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      console.log("Extracted date from string:", dateMatch[1]);
      return dateMatch[1];
    }
    
    // Remove commas and any time component
    const parts = dateStr.split(',');
    const cleanedDateStr = parts[0].trim();
    
    // Parse the date
    const date = new Date(cleanedDateStr);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.log("Invalid date after parsing:", dateStr);
      return dateStr;
    }
    
    // Return formatted date YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    console.log("Formatted date result:", formattedDate);
    return formattedDate;
  } catch (e) {
    console.error("Error formatting date:", dateStr, e);
    return dateStr;
  }
};

export const cleanFirstVisitValue = (visitValue: string): string => {
  // Remove "Class - " prefix if present
  if (visitValue && typeof visitValue === 'string') {
    const cleanedValue = visitValue.replace(/^Class\s*-\s*/i, '').trim();
    console.log(`Cleaned first visit value from "${visitValue}" to "${cleanedValue}"`);
    return cleanedValue;
  }
  return visitValue || '';
};

export const getMonthYearFromDate = (dateStr: string): string => {
  try {
    const date = new Date(formatDateString(dateStr));
    if (isNaN(date.getTime())) return 'Unknown';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
  } catch (e) {
    return 'Unknown';
  }
};

export const getFileTypes = () => {
  return {
    new: 'new',
    bookings: 'bookings',
    payments: 'payments?',
  };
};

// Helper function to check if a string matches any pattern in an array of patterns
export const matchesPattern = (value: string, patterns: string | string[]): boolean => {
  if (!value) return false;
  
  const patternsArray = typeof patterns === 'string' ? [patterns] : patterns;
  const regex = new RegExp(patternsArray.join('|'), 'i');
  
  return regex.test(value);
};

// Helper function to format numbers with commas for thousands
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Get search history from local storage
const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error("Error retrieving search history:", e);
    return [];
  }
};

// Add search term to history
const addToSearchHistory = (term: string): void => {
  if (!term.trim()) return;
  
  try {
    const history = getSearchHistory();
    // Add to beginning, remove duplicates
    const newHistory = [term, ...history.filter(item => item !== term)].slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  } catch (e) {
    console.error("Error saving search history:", e);
  }
};

// Parse date with timezone considerations
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Try direct parsing
    const directDate = new Date(dateStr);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }
    
    // Try parsing with different formats
    // Format: "2025-03-11, 9:37 AM"
    const dateTimeMatch = dateStr.match(/(\d{4}-\d{2}-\d{2}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (dateTimeMatch) {
      const [_, dateStr, hours, minutes, ampm] = dateTimeMatch;
      const hr = parseInt(hours, 10) + (ampm.toUpperCase() === 'PM' && parseInt(hours, 10) !== 12 ? 12 : 0);
      const date = new Date(`${dateStr}T${hr.toString().padStart(2, '0')}:${minutes}:00`);
      console.log(`Parsed date from "${dateStr}" to:`, date.toISOString());
      return date;
    }
    
    return null;
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
    return null;
  }
};

// Compare dates safely
export const isDateAfter = (dateA: string, dateB: string): boolean => {
  try {
    const dateAObj = parseDate(dateA);
    const dateBObj = parseDate(dateB);
    
    if (!dateAObj || !dateBObj) {
      console.error("Could not parse dates for comparison:", dateA, dateB);
      return false;
    }
    
    const result = dateAObj.getTime() > dateBObj.getTime();
    console.log(`Comparing dates: "${dateA}" > "${dateB}" = ${result}`);
    return result;
  } catch (e) {
    console.error("Error comparing dates:", dateA, dateB, e);
    return false;
  }
};
