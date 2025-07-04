import { formatDateString, getMonthYearFromDate, cleanFirstVisitValue, matchesPattern, isDateAfter, parseDate } from './csvParser';



// Define types for our data structures
interface NewRecord {
  'First name': string;
  'Last name': string;
  'Email': string;
  'Phone number': string;
  'Payment method': string;
  'Membership used': string;
  'First visit at': string;
  'First visit': string;
  'First visit location': string;
  'Visit type': string;
  'Home location': string;
  'Teacher'?: string; // This will be added during processing
}

interface BookingRecord {
  'Sale Date': string;
  'Class Name': string;
  'Class Date': string;
  'Location': string;
  'Teacher': string;
  'Customer Email': string; // Corrected to match header
  'Payment Method': string; // Corrected to match header
  'Membership used': string;
  'Sale Value': string | number; // Corrected to match header
  'Sales tax': string | number;
  'Cancelled': string;
  'Late Cancelled': string;
  'No Show': string;
  'Sold by': string;
  'Refunded': string;
  'Home location': string;
  'Category'?: string;
}

interface SaleRecord {
  // Sales structure fields with correct column names
  'Category': string;
  'Item': string;
  'Date': string;
  'Sale value': string | number;
  'Tax': string | number;
  'Refunded': string;
  'Payment method': string;
  'Payment status': string;
  'Sold by': string;
  'Paying Customer email': string;
  'Paying Customer name': string;
  'Customer email': string;
  'Customer name': string;
  'Location': string;
  'Note': string;
}

interface ClientDetail {
  email: string;
  name: string;
  date: string;
  value?: number;
  visitCount?: number;
  membershipType?: string;
  conversionStatus?: 'converted' | 'not_converted';
  conversionReason?: string;
  firstPurchaseDate?: string;
  firstPurchaseItem?: string;
  purchaseValue?: number;
  firstVisit?: string;
  firstVisitPostTrial?: string;
  reason?: string;
}

export interface ProcessedTeacherData {
  teacherName: string;
  location: string;
  period: string;
  newClients: number;
  trials: number;
  referrals: number;
  hosted: number;
  influencerSignups: number;
  others: number;
  retainedClients: number;
  retentionRate: number;
  convertedClients: number;
  conversionRate: number;
  totalRevenue: number;
  averageRevenuePerClient: number;
  noShowRate: number;
  lateCancellationRate: number;
  firstTimeBuyerRate: number;
  influencerConversionRate: number;
  referralConversionRate: number;
  trialToMembershipConversion: number;
  // Added missing properties for detailed analysis
  totalVisits: number;
  cancellations: number;
  lateCancellations: number;
  noShows: number;
  totalClasses: number;
  uniqueClients: number;
  newClientDetails: ClientDetail[];
  retainedClientDetails: ClientDetail[];
  convertedClientDetails: ClientDetail[];
  excludedClientDetails?: ClientDetail[];
  revenueByWeek?: { week: string; revenue: number }[];
  clientsBySource?: { source: string; count: number }[];
}

// For progress tracking
export interface ProcessingProgress {
  progress: number;
  currentStep: string;
}

// Process all the data
export const processData = (
  newData: NewRecord[],
  bookingsData: BookingRecord[],
  salesData: SaleRecord[],
  updateProgress: (progress: ProcessingProgress) => void
): Promise<{
  processedData: ProcessedTeacherData[];
  locations: string[];
  teachers: string[];
  periods: string[];
  includedRecords: any[];
  excludedRecords: any[];
  newClientRecords: any[];
  convertedClientRecords: any[];
  retainedClientRecords: any[];
}> => {
  return new Promise((resolve) => {
    updateProgress({ progress: 5, currentStep: "Cleaning and validating data..." });
    
    // Step 1: Clean and normalize data
    setTimeout(() => {
      console.log("Original new data sample:", newData.slice(0, 2));
      console.log("Original bookings data sample:", bookingsData.slice(0, 2));
      console.log("Original sales data sample:", salesData ? salesData.slice(0, 2) : "No sales data");
      
      // Format dates consistently
      const cleanedNewData = newData.map(record => ({
        ...record,
        'First visit at': formatDateString(record['First visit at'] || ''),
        'First visit': cleanFirstVisitValue(record['First visit'] || ''),
      }));
      
      const cleanedBookingsData = bookingsData.map(record => ({
        ...record,
        'Class Date': formatDateString(record['Class Date'] || ''),
        'Sale Date': formatDateString(record['Sale Date'] || ''),
        'Sale Value': typeof record['Sale Value'] === 'string' 
          ? parseFloat(record['Sale Value'].replace(/[^0-9.-]+/g, '')) || 0 
          : record['Sale Value'] || 0,
        'Class Name': cleanFirstVisitValue(record['Class Name'] || ''),
      }));
      
      console.log("Processing sales data for conversions...");
      const cleanedSalesData = salesData ? salesData.map(record => {
        // Use the correct field names as per the headers
        const dateValue = formatDateString(record['Date'] || '');
        
        // Handle sale value with the correct field name
        const saleValue = typeof record['Sale value'] === 'string' 
          ? parseFloat(record['Sale value'].replace(/[^0-9.-]+/g, '')) || 0 
          : (record['Sale value'] as number) || 0;
        
        return {
          ...record,
          'Date': dateValue,
          'Sale value': saleValue,
        };
      }) : [];

      console.log("Cleaned new data sample:", cleanedNewData.slice(0, 2));
      console.log("Cleaned bookings data sample:", cleanedBookingsData.slice(0, 2));
      console.log("Cleaned sales data sample:", cleanedSalesData.slice(0, 2));
      
      updateProgress({ progress: 20, currentStep: "Matching records and extracting teacher data..." });
      
      // Step 2: Match New records with Bookings to get teacher names
      setTimeout(() => {
        const enrichedNewData = cleanedNewData.map(newRecord => {
          console.log(`Looking for booking match for: ${newRecord['Email']} - ${newRecord['First visit']} - ${newRecord['First visit at']} - ${newRecord['First visit location']}`);
          
          const matchingBooking = cleanedBookingsData.find(booking => {
            const emailMatch = booking['Customer Email'] === newRecord['Email']; // Corrected field name
            const nameMatch = booking['Class Name'] === newRecord['First visit'];
            const dateMatch = booking['Class Date'] === newRecord['First visit at'];
            const locationMatch = booking['Location'] === newRecord['First visit location'];
            
            if (emailMatch && nameMatch && dateMatch && locationMatch) {
              console.log(`Found matching booking for ${newRecord['Email']}, teacher: ${booking['Teacher']}`);
              return true;
            }
            return false;
          });
          
          return {
            ...newRecord,
            'Teacher': matchingBooking ? matchingBooking['Teacher'] : 'Unknown'
          };
        });
        
        console.log("Enriched new data with teacher names:", enrichedNewData.slice(0, 2));
        
        updateProgress({ progress: 40, currentStep: "Calculating metrics by location, teacher, and period..." });
        
        // Step 3: Process data by location, teacher, and period
        setTimeout(() => {
          // Get unique locations, teachers, and periods (months)
          const locations = [...new Set(enrichedNewData.map(record => record['First visit location']))];
          
          // Extract all teacher names from bookings
          const teachers = [...new Set(cleanedBookingsData
            .map(record => record['Teacher'])
            .filter(teacher => teacher && teacher !== 'Unknown'))];
          
          // Get all unique periods (month-year)
          const allPeriods = enrichedNewData.map(record => 
            getMonthYearFromDate(record['First visit at'])
          );
          const periods = [...new Set(allPeriods)];
          
          console.log("Found locations:", locations);
          console.log("Found teachers:", teachers);
          console.log("Found periods:", periods);
          
          updateProgress({ progress: 60, currentStep: "Calculating client acquisition metrics..." });
          
          // Step 4: Calculate metrics for each teacher, location, and period
          setTimeout(() => {
            const processedData: ProcessedTeacherData[] = [];
            
            // Also process by studio
            const studioData: { [key: string]: ProcessedTeacherData } = {};
            
            // Arrays to hold records for our new properties
            const includedRecords: any[] = [];
            const excludedRecords: any[] = [];
            const newClientRecords: any[] = [];
            const convertedClientRecords: any[] = [];
            const retainedClientRecords: any[] = [];
            
            // First, identify excluded records globally
            enrichedNewData.forEach(record => {
              const membershipPattern = matchesPattern(record['Membership used'] || '', "friends|family|staff");
              const firstVisitPattern = matchesPattern(record['First visit'] || '', "friends|family|staff");
              
              if (membershipPattern || firstVisitPattern) {
                excludedRecords.push({
                  ...record,
                  name: `${record['First name']} ${record['Last name']}`,
                  email: record['Email'],
                  firstVisit: record['First visit at'],
                  reason: membershipPattern 
                    ? `Friends, family, or staff membership: "${record['Membership used']}"` 
                    : `Friends, family, or staff class type: "${record['First visit']}"`
                });
              }
            });
            
            // Group data by teacher, location, and period
            teachers.forEach(teacher => {
              locations.forEach(location => {
                periods.forEach(period => {
                  // Get new clients for this teacher, location, and period - now with improved exclusion logic
                  const teacherNewClients = enrichedNewData.filter(record => 
                    record['Teacher'] === teacher &&
                    record['First visit location'] === location &&
                    getMonthYearFromDate(record['First visit at']) === period &&
                    !matchesPattern(record['Membership used'] || '', "friends|family|staff") &&
                    !matchesPattern(record['First visit'] || '', "friends|family|staff")
                  );
                  
                  if (teacherNewClients.length === 0) return; // Skip if no data
                  
                  console.log(`Processing ${teacher} at ${location} for period ${period}. Found ${teacherNewClients.length} new clients`);
                  
                  // Add records to our tracking arrays
                  teacherNewClients.forEach(client => {
                    includedRecords.push({
                      ...client,
                      reason: "Matched teacher, location, and period criteria"
                    });
                  });
                  
                  // Calculate booking metrics for this teacher, location, and period
                  const teacherBookings = cleanedBookingsData.filter(booking => 
                    booking['Teacher'] === teacher &&
                    booking['Location'] === location &&
                    getMonthYearFromDate(booking['Class Date']) === period
                  );

                  const totalVisits = teacherBookings.filter(booking => 
                    booking['Cancelled'] === 'NO' && 
                    booking['Late Cancelled'] === 'NO' && 
                    booking['No Show'] === 'NO'
                  ).length;

                  const cancellations = teacherBookings.filter(booking => booking['Cancelled'] === 'YES').length;
                  const lateCancellations = teacherBookings.filter(booking => booking['Late Cancelled'] === 'YES').length;
                  const noShows = teacherBookings.filter(booking => booking['No Show'] === 'YES').length;
                  
                  // Get unique classes taught
                  const uniqueClassNames = [...new Set(teacherBookings.map(booking => booking['Class Name']))];
                  const totalClasses = uniqueClassNames.length;
                  
                  // Get unique clients who visited
                  const uniqueClientEmails = [...new Set(teacherBookings.map(booking => booking['Customer Email']))];
                  const uniqueClients = uniqueClientEmails.length;
                  
                  // Calculate client acquisition metrics
                  const newClientsCount = teacherNewClients.length;
                  
                  const trials = teacherNewClients.filter(record => 
                    matchesPattern(record['Membership used'] || '', "Studio Open Barre Class|Newcomers 2 For 1")
                  ).length;
                  
                  const referrals = teacherNewClients.filter(record => 
                    record['Membership used'] === 'Studio Complimentary Referral Class'
                  ).length;
                  
                  const hosted = teacherNewClients.filter(record => 
                    matchesPattern(record['First visit'] || '', "hosted|x|p57|physique|weword|rugby|outdoor|birthday|bridal|shower")
                  ).length;
                  
                  const influencerSignups = teacherNewClients.filter(record => 
                    matchesPattern(record['Membership used'] || '', "sign-up|link|influencer|twain|ooo|lrs|x|p57|physique|complimentary")
                  ).length;
                  
                  const others = newClientsCount - (trials + referrals + hosted + influencerSignups);
                  
                  updateProgress({ progress: 80, currentStep: "Calculating retention and revenue metrics..." });
                  
                  // Get email addresses of these new clients
                  const newClientEmails = teacherNewClients.map(record => record['Email']);
                  console.log(`New client emails for ${teacher}:`, newClientEmails);
                  
                  // UPDATED RETENTION LOGIC: Check visits after first visit based on "2 For 1" requirement
                  const returnVisits = cleanedBookingsData.filter(booking => {
                    // Get matching client record
                    const matchingClient = teacherNewClients.find(client => 
                      client['Email'] === booking['Customer Email']
                    );
                    
                    if (!matchingClient) return false;
                    
                    // Ensure this isn't the first visit (date must be strictly after first visit)
                    const isAfterFirstVisit = isDateAfter(booking['Class Date'], matchingClient['First visit at']);
                    
                    // Check all cancellation fields are "NO"
                    const notCancelled = booking['Cancelled'] === 'NO';
                    const notLateCancelled = booking['Late Cancelled'] === 'NO';
                    const notNoShow = booking['No Show'] === 'NO'; 
                    
                    return isAfterFirstVisit && notCancelled && notLateCancelled && notNoShow;
                  });
                  
                  console.log(`Found ${returnVisits.length} return visits for all clients of ${teacher}`);
                  
                  // NEW RETENTION LOGIC: Apply "2 For 1" specific rules
                  const retainedClientEmails = [];
                  
                  teacherNewClients.forEach(client => {
                    const clientEmail = client['Email'];
                    const firstVisitValue = client['First visit'] || '';
                    const clientReturnVisits = returnVisits.filter(visit => visit['Customer Email'] === clientEmail);
                    
                    console.log(`Checking retention for ${clientEmail}: First visit "${firstVisitValue}", Return visits: ${clientReturnVisits.length}`);
                    
                    let isRetained = false;
                    let retentionReason = '';
                    
                    // Check if first visit contains "2 For 1"
                    if (firstVisitValue.toLowerCase().includes('2 for 1')) {
                      // Needs 2 visits after first visit to be retained
                      isRetained = clientReturnVisits.length >= 2;
                      retentionReason = isRetained 
                        ? `Had ${clientReturnVisits.length} return visits after '2 For 1' trial (required: 2)` 
                        : `Only ${clientReturnVisits.length} return visits after '2 For 1' trial (required: 2)`;
                      console.log(`"2 For 1" client ${clientEmail}: ${clientReturnVisits.length} return visits, retained: ${isRetained}`);
                    } else {
                      // Needs 1 visit after first visit to be retained
                      isRetained = clientReturnVisits.length >= 1;
                      retentionReason = isRetained 
                        ? `Had ${clientReturnVisits.length} return visits after initial trial (required: 1)` 
                        : `Only ${clientReturnVisits.length} return visits after initial trial (required: 1)`;
                      console.log(`Non-"2 For 1" client ${clientEmail}: ${clientReturnVisits.length} return visits, retained: ${isRetained}`);
                    }
                    
                    if (isRetained) {
                      retainedClientEmails.push(clientEmail);
                      
                      // Add this client to retained records with full client information
                      const retainedClient = {
                        name: `${client['First name']} ${client['Last name']}`,
                        email: clientEmail,
                        firstVisit: client['First visit at'],
                        visitsPostTrial: clientReturnVisits.length,
                        reason: retentionReason,
                        firstVisitPostTrial: clientReturnVisits[0]?.['Class Date'] || 'N/A',
                        membershipUsed: client['Membership used']
                      };
                      retainedClientRecords.push(retainedClient);
                    }
                  });
                  
                  const retainedClientsCount = retainedClientEmails.length;
                  
                  // Calculate retention rate
                  const retentionRate = newClientsCount > 0 
                    ? (retainedClientsCount / newClientsCount) * 100 
                    : 0;
                  
                  console.log(`Retention: ${retainedClientsCount}/${newClientsCount} (${retentionRate.toFixed(1)}%)`);
                  
                  // UPDATED CONVERSION LOGIC: New stricter criteria
                  if (cleanedSalesData.length === 0) {
                    console.error("No sales data available for calculating conversions");
                  } else {
                    console.log(`Processing ${cleanedSalesData.length} sales records for conversion metrics`);
                  }
                  
                  // Create a map to track conversion status for each new client
                  const clientConversionMap = new Map<string, {
                    isConverted: boolean;
                    reason: string;
                    firstPurchaseDate?: string;
                    firstPurchaseItem?: string;
                    purchaseValue?: number;
                  }>();
                  
                  // Initialize all new clients as not converted
                  teacherNewClients.forEach(client => {
                    clientConversionMap.set(client['Email'], {
                      isConverted: false,
                      reason: 'No qualifying purchase found'
                    });
                  });
                  
                  // Find converted clients with UPDATED STRICTER LOGIC
                  const convertedClients = cleanedSalesData.filter(sale => {
                    // Find matching new client record
                    const matchingClient = teacherNewClients.find(client => {
                      const emailMatch = (
                        client['Email'] === sale['Customer email'] || 
                        client['Email'] === sale['Paying Customer email']
                      );
                      
                      return emailMatch;
                    });
                    
                    if (!matchingClient) {
                      return false;
                    }
                    
                    const clientEmail = matchingClient['Email'];

                    function isDateOnOrAfter(dateA: string, dateB: string): boolean {
                      if (!dateA || !dateB) return false;
                      const a = new Date(dateA);
                      const b = new Date(dateB);
                      return a.getTime() >= b.getTime();
                    }

                    function isDateOnOrAfter(dateA: string, dateB: string): boolean {
                      if (!dateA || !dateB) return false;
                      const a = new Date(dateA);
                      const b = new Date(dateB);
                      return a.getTime() >= b.getTime();
                    }
                    
                    // UPDATED CONVERSION CONDITIONS:
                    // 1. Sale date >= First visit date
                    const saleDate = sale['Date'] || '';
                    const firstVisitDate = matchingClient['First visit at'];
                    const saleDateAfterVisit = isDateOnOrAfter(saleDate, firstVisitDate);


                    
                    // 2. Category doesn't contain 'money-credits', 'retail', or 'product' (case insensitive)
                    const category = (sale['Category'] || '').toLowerCase();
                    const notExcludedCategory = !category.includes('money-credits') && 
                                               !category.includes('retail') && 
                                               !category.includes('product');
                    
                    // 3. Item doesn't contain '2 for 1' (case insensitive)
                    const item = (sale['Item'] || '').toLowerCase();
                    const not2For1Item = !item.includes('2 for 1');
                    
                    // 4. Sale value >= 1000 (UPDATED from > 0 to >= 1000)
                    const saleValue = typeof sale['Sale value'] === 'number' ? 
                      sale['Sale value'] : parseFloat(String(sale['Sale value'] || '0').replace(/[^0-9.-]+/g, ''));
                    const hasMinimumSaleValue = saleValue >= 1000;
                    
                    // 5. Not refunded
                    const notRefunded = sale['Refunded'] !== 'YES';
                    
                    // Determine conversion reason with detailed explanations
                    let conversionReason = '';
                    if (!saleDateAfterVisit) {
                      conversionReason = `Purchase date (${saleDate}) is before first visit date (${firstVisitDate})`;
                    } else if (!notExcludedCategory) {
                      conversionReason = `Excluded category: "${sale['Category']}" (contains money-credits/retail/product)`;
                    } else if (!not2For1Item) {
                      conversionReason = `Excluded item: "${sale['Item']}" (contains "2 for 1")`;
                    } else if (!hasMinimumSaleValue) {
                      conversionReason = `Sale value ₹${saleValue} is below minimum ₹1000`;
                    } else if (!notRefunded) {
                      conversionReason = `Purchase was refunded: "${sale['Item']}"`;
                    } else {
                      conversionReason = `Converted with "${sale['Item']}" for ₹${saleValue} on ${saleDate}`;
                    }
                    
                    // Log detailed diagnostics
                    console.log("UPDATED Conversion conditions check:", {
                      email: matchingClient['Email'],
                      saleDateAfterVisit,
                      notExcludedCategory,
                      not2For1Item,
                      hasMinimumSaleValue,
                      notRefunded,
                      saleValue,
                      category,
                      item,
                      refunded: sale['Refunded'],
                      conversionReason
                    });
                    
                    const isConverted = saleDateAfterVisit && notExcludedCategory && not2For1Item && hasMinimumSaleValue && notRefunded;
                    
                    // Update conversion status for this client
                    const currentStatus = clientConversionMap.get(clientEmail);
                    if (isConverted && (!currentStatus?.isConverted)) {
                      // This is the first qualifying purchase for this client
                      clientConversionMap.set(clientEmail, {
                        isConverted: true,
                        reason: conversionReason,
                        firstPurchaseDate: sale['Date'],
                        firstPurchaseItem: sale['Item'],
                        purchaseValue: saleValue
                      });
                    } else if (!isConverted && currentStatus && !currentStatus.isConverted) {
                      // Update the reason why they didn't convert (keep the most recent reason)
                      clientConversionMap.set(clientEmail, {
                        ...currentStatus,
                        reason: conversionReason
                      });
                    }
                    
                    // Add to converted records if it matches all criteria
                    if (isConverted && matchingClient) {
                      const convertedClient = {
                        name: `${matchingClient['First name']} ${matchingClient['Last name']}`,
                        email: clientEmail,
                        firstVisit: matchingClient['First visit at'],
                        purchaseDate: sale['Date'],
                        saleValue: saleValue,
                        purchaseItem: sale['Item'],
                        firstPurchaseDate: sale['Date'],
                        firstPurchaseItem: sale['Item'],
                        purchaseValue: saleValue,
                        reason: "Made qualifying purchase after initial visit"
                      };
                      convertedClientRecords.push(convertedClient);
                    }
                    
                    return isConverted;
                  });
                  
                  console.log(`Found ${convertedClients.length} converted clients for ${teacher}`);
                  
                  // Count unique converted clients
                  const convertedClientEmails = [...new Set(convertedClients.map(sale => 
                    sale['Customer email'] || sale['Paying Customer email'] || ''))];
                  const convertedClientsCount = convertedClientEmails.length;
                  
                  // Create detailed new client list with conversion status
                  const newClientDetails = teacherNewClients.map(client => {
                    const conversionInfo = clientConversionMap.get(client['Email']) || {
                      isConverted: false,
                      reason: 'No conversion data available'
                    };
                    
                    return {
                      email: client['Email'],
                      name: `${client['First name']} ${client['Last name']}`,
                      date: client['First visit at'],
                      firstVisit: client['First visit at'],
                      membershipType: client['Membership used'],
                      conversionStatus: conversionInfo.isConverted ? 'converted' as const : 'not_converted' as const,
                      conversionReason: conversionInfo.reason,
                      firstPurchaseDate: conversionInfo.firstPurchaseDate,
                      firstPurchaseItem: conversionInfo.firstPurchaseItem,
                      purchaseValue: conversionInfo.purchaseValue
                    };
                  });
                  
                  // Add new client details to tracking
                  newClientDetails.forEach(client => {
                    newClientRecords.push({
                      ...client,
                      reason: "First time visitor"
                    });
                  });
                  
                  // Create detailed converted client list
                  const convertedClientDetails = convertedClientEmails.map(email => {
                    const clientSales = convertedClients
                      .filter(sale => (sale['Customer email'] || sale['Paying Customer email']) === email)
                      .sort((a, b) => {
                        const dateA = new Date(a['Date'] || '');
                        const dateB = new Date(b['Date'] || '');
                        return dateA.getTime() - dateB.getTime();
                      });
                    
                    const totalValue = clientSales.reduce((sum, sale) => {
                      const saleValue = typeof sale['Sale value'] === 'number' ? 
                        sale['Sale value'] : parseFloat(String(sale['Sale value'] || '0').replace(/[^0-9.-]+/g, ''));
                      return sum + saleValue;
                    }, 0);
                    
                    const clientInfo = teacherNewClients.find(client => client['Email'] === email);
                    const firstPurchaseDate = clientSales.length > 0 ? clientSales[0]['Date'] : '';
                    
                    return {
                      email,
                      name: clientInfo ? `${clientInfo['First name']} ${clientInfo['Last name']}` : 'Unknown',
                      date: firstPurchaseDate,
                      firstVisit: clientInfo ? clientInfo['First visit at'] : '',
                      value: totalValue,
                      firstPurchaseDate,
                      membershipType: clientSales[0]?.['Item'] || '',
                      conversionStatus: 'converted' as const,
                      conversionReason: `Converted with ${clientSales[0]?.['Item']} for ₹${totalValue}`,
                      firstPurchaseItem: clientSales[0]?.['Item'],
                      purchaseValue: totalValue
                    };
                  });

                  // Create detailed retained client list
                  const retainedClientDetails = retainedClientEmails.map(email => {
                    const clientVisits = returnVisits.filter(visit => visit['Customer Email'] === email);
                    const clientInfo = teacherNewClients.find(client => client['Email'] === email);
                    
                    return {
                      email,
                      name: clientInfo ? `${clientInfo['First name']} ${clientInfo['Last name']}` : 'Unknown',
                      date: clientVisits[0]?.['Class Date'] || '',
                      firstVisit: clientInfo ? clientInfo['First visit at'] : '',
                      visitCount: clientVisits.length,
                      membershipType: clientInfo?.['Membership used'] || '',
                      firstVisitPostTrial: clientVisits[0]?.['Class Date'] || 'N/A',
                      visitsPostTrial: clientVisits.length
                    };
                  });

                  // Calculate conversion rate
                  const conversionRate = newClientsCount > 0 
                    ? (convertedClientsCount / newClientsCount) * 100 
                    : 0;
                  
                  console.log(`Conversion: ${convertedClientsCount}/${newClientsCount} (${conversionRate.toFixed(1)}%)`);
                  
                  // Calculate revenue metrics
                  const totalRevenue = convertedClients.reduce((sum, sale) => {
                    const saleValue = typeof sale['Sale value'] === 'number' ? 
                      sale['Sale value'] : parseFloat(String(sale['Sale value'] || '0').replace(/[^0-9.-]+/g, ''));
                    return sum + saleValue;
                  }, 0);
                  
                  console.log(`Total revenue: ${totalRevenue}`);
                  
                  const averageRevenuePerClient = convertedClientsCount > 0 
                    ? totalRevenue / convertedClientsCount 
                    : 0;
                  
                  // Calculate rates
                  const noShowRate = teacherBookings.length > 0 
                    ? (noShows / teacherBookings.length) * 100 
                    : 0;
                  
                  const lateCancellationRate = teacherBookings.length > 0 
                    ? (lateCancellations / teacherBookings.length) * 100 
                    : 0;
                  
                  // Calculate advanced sales insights
                  const firstTimeBuyers = convertedClientsCount;
                  const firstTimeBuyerRate = newClientsCount > 0 
                    ? (firstTimeBuyers / newClientsCount) * 100 
                    : 0;
                  
                  // Influencer conversion
                  const influencerConvertedCount = convertedClients.filter(sale => {
                    const email = sale['Customer email'] || sale['Paying Customer email'] || '';
                    return teacherNewClients.some(client => 
                      client['Email'] === email && 
                      matchesPattern(client['Membership used'] || '', "sign-up|link|influencer|twain|ooo|lrs|x|p57|physique|complimentary")
                    );
                  }).length;
                  
                  const influencerConversionRate = influencerSignups > 0 
                    ? (influencerConvertedCount / influencerSignups) * 100 
                    : 0;
                  
                  // Referral conversion
                  const referralConvertedCount = convertedClients.filter(sale => {
                    const email = sale['Customer email'] || sale['Paying Customer email'] || '';
                    return teacherNewClients.some(client => 
                      client['Email'] === email && 
                      client['Membership used'] === 'Studio Complimentary Referral Class'
                    );
                  }).length;
                  
                  const referralConversionRate = referrals > 0 
                    ? (referralConvertedCount / referrals) * 100 
                    : 0;
                  
                  // Trial to membership conversion
                  const trialConvertedCount = convertedClients.filter(sale => {
                    const email = sale['Customer email'] || sale['Paying Customer email'] || '';
                    return teacherNewClients.some(client => 
                      client['Email'] === email && 
                      matchesPattern(client['Membership used'] || '', "Studio Open Barre Class|Newcomers 2 For 1")
                    );
                  }).length;
                  
                  const trialToMembershipConversion = trials > 0 
                    ? (trialConvertedCount / trials) * 100 
                    : 0;
                  
                  // Create weekly revenue data for charts
                  const revenueByWeek = convertedClients.reduce((acc, sale) => {
                    const dateStr = sale['Date'] || '';
                    if (!dateStr) return acc;
                    
                    const date = parseDate(dateStr);
                    if (!date) return acc;
                    
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    const weekKey = weekStart.toISOString().split('T')[0];
                    
                    const existing = acc.find(item => item.week === weekKey);
                    const saleValue = typeof sale['Sale value'] === 'number' ? 
                      sale['Sale value'] : parseFloat(String(sale['Sale value'] || '0').replace(/[^0-9.-]+/g, ''));
                      
                    if (existing) {
                      existing.revenue += saleValue;
                    } else {
                      acc.push({ week: weekKey, revenue: saleValue });
                    }
                    
                    return acc;
                  }, [] as { week: string; revenue: number }[]);
                  
                  console.log("Revenue by week data:", revenueByWeek);
                  
                  // Create client source data for charts
                  const clientsBySource = [
                    { source: 'Trials', count: trials },
                    { source: 'Referrals', count: referrals },
                    { source: 'Hosted', count: hosted },
                    { source: 'Influencer', count: influencerSignups },
                    { source: 'Others', count: others }
                  ];
                  
                  // Add to processed data
                  processedData.push({
                    teacherName: teacher,
                    location,
                    period,
                    newClients: newClientsCount,
                    trials,
                    referrals,
                    hosted,
                    influencerSignups,
                    others,
                    retainedClients: retainedClientsCount,
                    retentionRate,
                    convertedClients: convertedClientsCount,
                    conversionRate,
                    totalRevenue,
                    averageRevenuePerClient,
                    noShowRate,
                    lateCancellationRate,
                    firstTimeBuyerRate,
                    influencerConversionRate,
                    referralConversionRate,
                    trialToMembershipConversion,
                    // Added missing properties
                    totalVisits,
                    cancellations,
                    lateCancellations,
                    noShows,
                    totalClasses,
                    uniqueClients,
                    newClientDetails,
                    retainedClientDetails,
                    convertedClientDetails,
                    excludedClientDetails: excludedRecords.filter(excluded => 
                      excluded['Teacher'] === teacher &&
                      excluded['First visit location'] === location &&
                      getMonthYearFromDate(excluded['First visit at']) === period
                    ),
                    revenueByWeek,
                    clientsBySource
                  });
                  
                  // Combine data for studio view
                  if (!studioData[location]) {
                    studioData[location] = {
                      teacherName: 'All Teachers',
                      location,
                      period,
                      newClients: 0,
                      trials: 0,
                      referrals: 0,
                      hosted: 0,
                      influencerSignups: 0,
                      others: 0,
                      retainedClients: 0,
                      retentionRate: 0,
                      convertedClients: 0,
                      conversionRate: 0,
                      totalRevenue: 0,
                      averageRevenuePerClient: 0,
                      noShowRate: 0,
                      lateCancellationRate: 0,
                      firstTimeBuyerRate: 0,
                      influencerConversionRate: 0,
                      referralConversionRate: 0,
                      trialToMembershipConversion: 0,
                      // Added missing properties with initial values
                      totalVisits: 0,
                      cancellations: 0,
                      lateCancellations: 0,
                      noShows: 0,
                      totalClasses: 0,
                      uniqueClients: 0,
                      newClientDetails: [],
                      retainedClientDetails: [],
                      convertedClientDetails: [],
                      excludedClientDetails: [],
                      revenueByWeek: [],
                      clientsBySource: []
                    };
                  }
                  
                  // Add this teacher's data to the studio total
                  const studio = studioData[location];
                  studio.newClients += newClientsCount;
                  studio.trials += trials;
                  studio.referrals += referrals;
                  studio.hosted += hosted;
                  studio.influencerSignups += influencerSignups;
                  studio.others += others;
                  studio.retainedClients += retainedClientsCount;
                  studio.convertedClients += convertedClientsCount;
                  studio.totalRevenue += totalRevenue;
                  
                  // Add the new metrics to studio totals
                  studio.totalVisits += totalVisits;
                  studio.cancellations += cancellations;
                  studio.lateCancellations += lateCancellations;
                  studio.noShows += noShows;
                  studio.totalClasses += totalClasses;
                  studio.uniqueClients += uniqueClients;
                  
                  // Combine client details
                  studio.newClientDetails = [...studio.newClientDetails, ...newClientDetails];
                  studio.retainedClientDetails = [...studio.retainedClientDetails, ...retainedClientDetails];
                  studio.convertedClientDetails = [...studio.convertedClientDetails, ...convertedClientDetails];
                  studio.excludedClientDetails = [...(studio.excludedClientDetails || []), ...excludedRecords.filter(excluded => 
                    excluded['First visit location'] === location &&
                    getMonthYearFromDate(excluded['First visit at']) === period
                  )];
                  
                  // Combine revenue by week data
                  revenueByWeek.forEach(weekData => {
                    const existingWeek = studio.revenueByWeek.find(w => w.week === weekData.week);
                    if (existingWeek) {
                      existingWeek.revenue += weekData.revenue;
                    } else {
                      studio.revenueByWeek.push({ ...weekData });
                    }
                  });
                  
                  // Update studio client source data
                  if (!studio.clientsBySource.length) {
                    studio.clientsBySource = [...clientsBySource];
                  } else {
                    studio.clientsBySource.forEach((source, index) => {
                      source.count += clientsBySource[index].count;
                    });
                  }
                });
              });
            });
            
            // Calculate rates for studios
            Object.values(studioData).forEach(studio => {
              // Calculate retention rate
              studio.retentionRate = studio.newClients > 0 
                ? (studio.retainedClients / studio.newClients) * 100 
                : 0;
              
              // Calculate conversion rate
              studio.conversionRate = studio.newClients > 0 
                ? (studio.convertedClients / studio.newClients) * 100 
                : 0;
              
              // Calculate average revenue per client
              studio.averageRevenuePerClient = studio.convertedClients > 0 
                ? studio.totalRevenue / studio.convertedClients 
                : 0;
              
              // Add studio data to processedData
              processedData.push(studio);
            });
            
            updateProgress({ progress: 100, currentStep: "Processing complete!" });
            
            // Sort periods chronologically (descending)
            const sortedPeriods = [...periods].sort((a, b) => {
              const dateA = new Date(a);
              const dateB = new Date(b);
              return dateB.getTime() - dateA.getTime();
            });
            
            // Sort teachers alphabetically
            const sortedTeachers = [...teachers].sort();
            
            // Return processed data along with the records we need
            resolve({
              processedData,
              locations,
              teachers: sortedTeachers,
              periods: sortedPeriods,
              includedRecords,
              excludedRecords,
              newClientRecords,
              convertedClientRecords,
              retainedClientRecords
            });
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  });
};