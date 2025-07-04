
/**
 * Utility functions to handle deduplication of data records
 */

/**
 * Deduplicate records by a specified key field
 * @param records Array of records to deduplicate
 * @param keyField Field to use as unique identifier
 * @returns Array of deduplicated records
 */
const deduplicateRecords = <T extends Record<string, any>>(
  records: T[],
  keyField: string
): T[] => {
  const seen = new Set();
  return records.filter(record => {
    // Get the key value, with fallbacks for different field name patterns
    const keyValue = record[keyField] || 
                    record[keyField.toLowerCase()] || 
                    record[keyField.charAt(0).toUpperCase() + keyField.slice(1)];
    
    if (!keyValue) return true; // Keep records without the key field
    
    if (!seen.has(keyValue)) {
      seen.add(keyValue);
      return true;
    }
    return false;
  });
};

/**
 * Deduplicate client records by email
 * @param records Array of client records
 * @returns Array of deduplicated client records
 */
export const deduplicateClientsByEmail = <T extends Record<string, any>>(records: T[]): T[] => {
  return deduplicateRecords(records, 'email');
};
