
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a number with the specified number of decimal places.
 * Returns a fallback value if the input is not a valid number.
 */
export function safeToFixed(value: any, decimals: number = 2, fallback: string = 'N/A'): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toFixed(decimals);
}

/**
 * Safely formats a number with locale string formatting.
 * Returns a fallback value if the input is not a valid number.
 */
function safeToLocaleString(value: any, fallback: string = 'N/A'): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toLocaleString();
}

/**
 * Safely formats a number as currency without decimals
 * Returns a fallback value if the input is not a valid number.
 */
export function safeFormatCurrency(value: any, currency: string = '₹', fallback: string = 'N/A'): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return fallback;
  }
  return `${currency}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Safely formats a date string or Date object to a readable string
 * Returns a fallback value if the input is not a valid date.
 */
export function safeFormatDate(value: any, format: 'short' | 'medium' | 'long' = 'medium', fallback: string = 'N/A'): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'medium':
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      case 'long':
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    return fallback;
  }
}

/**
 * Determines if one date is after another date, accounting for different formats
 */
function isDateAfter(date1: string | Date, date2: string | Date): boolean {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1 > d2;
  } catch (error) {
    return false;
  }
}

/**
 * Converts a camelCase string to Title Case
 */
function convertCamelToTitle(camelCase: string): string {
  if (!camelCase) return '';
  
  // Add space before uppercase letters and capitalize the first letter
  const withSpaces = camelCase.replace(/([A-Z])/g, ' $1');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/**
 * Returns a cursor class based on whether an element has click handler
 */
function getCursorClass(hasClickHandler: boolean | undefined): string {
  return hasClickHandler ? 'cursor-pointer' : '';
}

/**
 * Calculates the number of days between two dates
 */
export function daysBetweenDates(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate conversion span - days between first visit and first purchase
 */
export function calculateConversionSpan(firstVisitDate: string | Date, firstPurchaseDate: string | Date): string {
  if (!firstVisitDate || !firstPurchaseDate) return 'N/A';
  
  try {
    const firstVisit = new Date(firstVisitDate);
    const firstPurchase = new Date(firstPurchaseDate);
    
    // Check if dates are valid
    if (isNaN(firstVisit.getTime()) || isNaN(firstPurchase.getTime())) {
      return 'N/A';
    }
    
    const days = daysBetweenDates(firstVisitDate, firstPurchaseDate);
    return days > 0 ? `${days} days` : '0 days';
  } catch (error) {
    console.error('Error calculating conversion span:', error, { firstVisitDate, firstPurchaseDate });
    return 'N/A';
  }
}

/**
 * Calculate retention span - days between first visit and latest visit
 */
export function calculateRetentionSpan(firstVisitDate: string | Date, lastVisitDate: string | Date): string {
  if (!firstVisitDate || !lastVisitDate) return 'N/A';
  
  try {
    const firstVisit = new Date(firstVisitDate);
    const lastVisit = new Date(lastVisitDate);
    
    // Check if dates are valid
    if (isNaN(firstVisit.getTime()) || isNaN(lastVisit.getTime())) {
      return 'N/A';
    }
    
    const days = daysBetweenDates(firstVisitDate, lastVisitDate);
    return days > 0 ? `${days} days` : '0 days';
  } catch (error) {
    console.error('Error calculating retention span:', error, { firstVisitDate, lastVisitDate });
    return 'N/A';
  }
}

/**
 * Extract first visit post trial date from client data
 */
function extractFirstVisitPostTrialDate(clientVisits: any[]): string {
  if (!clientVisits || !Array.isArray(clientVisits) || clientVisits.length === 0) {
    return '';
  }
  
  try {
    // Sort visits by date
    const sortedVisits = [...clientVisits].sort((a, b) => {
      const dateA = new Date(a.date || a.Date || a['Visit date'] || a.visitDate || '');
      const dateB = new Date(b.date || b.Date || b['Visit date'] || b.visitDate || '');
      
      // Check if dates are valid
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    // Return the earliest visit date that is not the first visit
    if (sortedVisits.length > 1) {
      const secondVisit = sortedVisits[1];
      const date = secondVisit.date || secondVisit.Date || secondVisit['Visit date'] || secondVisit.visitDate || '';
      
      // Check if the returned date is valid
      if (date && !isNaN(new Date(date).getTime())) {
        return date;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting first visit post trial date:', error);
    return '';
  }
}

/**
 * Format client name from various data formats
 */
export function formatClientName(client: any): string {
  if (!client) return 'Unknown';
  
  if (client['First name'] && client['Last name']) {
    return `${client['First name']} ${client['Last name']}`;
  } else if (client.firstName && client.lastName) {
    return `${client.firstName} ${client.lastName}`;
  } else if (client.name) {
    return client.name;
  } else if (client.customerName) {
    return client.customerName;
  } else if (client['Email'] || client.email) {
    return client['Email'] || client.email;
  }
  
  return 'Unknown';
}

/**
 * Groups an array by a key and calculates aggregates
 */
function groupAndAggregate<T extends Record<string, any>>(
  data: T[],
  groupKey: string,
  aggregations: Record<string, (items: T[]) => any>
): Array<T & { isGroupHeader: boolean; groupValue: string }> {
  if (!data || data.length === 0) return [];
  
  // Group the data
  const groups = data.reduce((acc, item) => {
    const key = item[groupKey] || 'Other';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
  
  // Create result with group headers
  const result: Array<T & { isGroupHeader: boolean; groupValue: string }> = [];
  
  Object.entries(groups).forEach(([key, items]) => {
    // Add the group header with aggregated values
    const groupHeaderItem = { ...items[0] } as T;
    const groupHeader = {
      ...groupHeaderItem,
      isGroupHeader: true,
      groupValue: key
    } as T & { isGroupHeader: boolean; groupValue: string };
    
    // Calculate aggregates for the group
    Object.entries(aggregations).forEach(([aggKey, aggFn]) => {
      (groupHeader as any)[aggKey] = aggFn(items);
    });
    
    result.push(groupHeader);
    
    // Add the items
    items.forEach(item => {
      result.push({ ...item, isGroupHeader: false, groupValue: key } as T & { isGroupHeader: boolean; groupValue: string });
    });
  });
  
  return result;
}

/**
 * Calculate the sum of a numeric property in an array
 */
function sum<T>(items: T[], key: keyof T): number {
  return items.reduce((total, item) => {
    const value = Number(item[key]) || 0;
    return total + value;
  }, 0);
}

/**
 * Calculate the average of a numeric property in an array
 */
function average<T>(items: T[], key: keyof T): number {
  if (items.length === 0) return 0;
  return sum(items, key) / items.length;
}

/**
 * Sort data by a column
 */
export function sortDataByColumn<T>(data: T[], column: keyof T, direction: 'asc' | 'desc'): T[] {
  return [...data].sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];
    
    // Handle dates
    if (typeof valueA === 'string' && typeof valueB === 'string' && 
        (column.toString().toLowerCase().includes('date') || 
         valueA.match(/^\d{4}-\d{2}-\d{2}/) || 
         valueB.match(/^\d{4}-\d{2}-\d{2}/))) {
      const dateA = new Date(valueA);
      const dateB = new Date(valueB);
      
      // If valid dates
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return direction === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
    }
    
    // Handle numbers
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle strings (case insensitive)
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc' 
        ? valueA.localeCompare(valueB, undefined, { sensitivity: 'base' })
        : valueB.localeCompare(valueA, undefined, { sensitivity: 'base' });
    }
    
    // Handle other cases
    if (valueA === undefined) return direction === 'asc' ? -1 : 1;
    if (valueB === undefined) return direction === 'asc' ? 1 : -1;
    
    // Default comparison
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
