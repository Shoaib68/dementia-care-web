/**
 * Shared Analytics Utilities
 * 
 * Common utilities for calculating metrics, percentages, date ranges,
 * and formatting data across all analytics services.
 * 
 * @module shared/lib/analytics-utils
 */

// ============================================================================
// PERCENTAGE AND METRIC CALCULATIONS
// ============================================================================

/**
 * Calculates growth percentage between current and previous values
 * 
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Growth percentage (positive or negative)
 * 
 * @example
 * calculateGrowthPercentage(120, 100) // Returns 20
 * calculateGrowthPercentage(80, 100) // Returns -20
 * calculateGrowthPercentage(50, 0) // Returns 100 (handles division by zero)
 */
export function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculates efficiency percentage (completion rate)
 * 
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @param maxPercentage - Maximum percentage to return (default: 100)
 * @returns Efficiency percentage
 * 
 * @example
 * calculateEfficiency(80, 100) // Returns 80
 * calculateEfficiency(120, 100) // Returns 100 (capped at max)
 * calculateEfficiency(50, 0) // Returns 100 (handles division by zero)
 */
export function calculateEfficiency(
  completed: number, 
  total: number, 
  maxPercentage: number = 100
): number {
  if (total === 0) return completed > 0 ? maxPercentage : 0;
  return Math.min(maxPercentage, Math.round((completed / total) * 100));
}

/**
 * Rounds a number to specified decimal places
 * 
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 1)
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 1): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculates weighted score based on multiple metrics
 * Useful for ranking/sorting by multiple criteria
 * 
 * @param metrics - Object with metric values and weights
 * @returns Weighted score
 * 
 * @example
 * calculateWeightedScore({ diagnoses: { value: 10, weight: 2 }, patients: { value: 5, weight: 1 } })
 * // Returns 25 (10*2 + 5*1)
 */
export function calculateWeightedScore(
  metrics: Record<string, { value: number; weight: number }>
): number {
  return Object.values(metrics).reduce((sum, metric) => {
    return sum + (metric.value * metric.weight);
  }, 0);
}

// ============================================================================
// DATE RANGE UTILITIES
// ============================================================================

export interface DateRange {
  start: string;
  end: string;
}

export interface MonthDateRanges {
  currentMonthStart: string;
  currentMonthEnd: string;
  previousMonthStart: string;
  previousMonthEnd: string;
}

/**
 * Gets the start and end dates for the current and previous months
 * 
 * @returns Object with ISO date strings for current and previous month ranges
 */
export function getMonthDateRanges(): MonthDateRanges {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    currentMonthStart: currentMonthStart.toISOString(),
    currentMonthEnd: currentMonthEnd.toISOString(),
    previousMonthStart: previousMonthStart.toISOString(),
    previousMonthEnd: previousMonthEnd.toISOString(),
  };
}

/**
 * Gets date range for a specific number of months ago
 * 
 * @param monthsAgo - Number of months back (0 = current month)
 * @returns Start and end dates for the specified month
 */
export function getMonthDateRange(monthsAgo: number): DateRange {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  return {
    start: monthStart.toISOString(),
    end: monthEnd.toISOString(),
  };
}

/**
 * Generates date ranges for the last N months
 * 
 * @param numberOfMonths - Number of months to generate (default: 6)
 * @returns Array of date ranges, most recent first
 */
export function getLastNMonthsRanges(numberOfMonths: number = 6): DateRange[] {
  const ranges: DateRange[] = [];
  
  for (let i = 0; i < numberOfMonths; i++) {
    ranges.unshift(getMonthDateRange(i));
  }
  
  return ranges;
}

/**
 * Checks if a date falls within a date range
 * 
 * @param date - Date to check
 * @param start - Range start date
 * @param end - Range end date
 * @returns True if date is within range
 */
export function isDateInRange(date: string | Date, start: string | Date, end: string | Date): boolean {
  const checkDate = new Date(date);
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return checkDate >= startDate && checkDate <= endDate;
}

// ============================================================================
// TIME FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago")
 * 
 * @param timestamp - ISO date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Enhanced time ago formatter with more granular options
 * 
 * @param dateString - ISO date string
 * @param showDate - Whether to show actual date for old items (default: true)
 * @returns Formatted time string
 */
export function formatTimeAgo(dateString: string, showDate: boolean = true): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 10080 || !showDate) { // 7 days
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    // For older than 7 days, show the actual date
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Formats duration in hours (e.g., "2.3 hours")
 * 
 * @param hours - Number of hours
 * @returns Formatted string
 */
export function formatDuration(hours: number): string {
  if (hours === 0) return '0 hours';
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  return `${roundToDecimals(hours, 1)} hour${hours !== 1 ? 's' : ''}`;
}

// ============================================================================
// MONTH NAME UTILITIES
// ============================================================================

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Gets month name from month index (0-11)
 * 
 * @param monthIndex - Month index (0 = January)
 * @param full - Whether to return full name (default: false for abbreviated)
 * @returns Month name
 */
export function getMonthName(monthIndex: number, full: boolean = false): string {
  const names = full ? FULL_MONTH_NAMES : MONTH_NAMES;
  return names[monthIndex % 12];
}

/**
 * Gets month name from Date object
 * 
 * @param date - Date object
 * @param full - Whether to return full name (default: false)
 * @returns Month name
 */
export function getMonthNameFromDate(date: Date, full: boolean = false): string {
  return getMonthName(date.getMonth(), full);
}

// ============================================================================
// DATA FILTERING UTILITIES
// ============================================================================

/**
 * Filters array of items by date range
 * 
 * @param items - Array of items with date property
 * @param dateKey - Key of the date property
 * @param start - Start date
 * @param end - End date
 * @returns Filtered array
 */
export function filterByDateRange<T>(
  items: T[],
  dateKey: keyof T,
  start: string | Date,
  end: string | Date
): T[] {
  return items.filter(item => {
    const itemDate = item[dateKey];
    if (!itemDate) return false;
    return isDateInRange(itemDate as any, start, end);
  });
}

/**
 * Groups items by a specific property
 * 
 * @param items - Array of items to group
 * @param keyFn - Function to extract grouping key
 * @returns Map with grouped items
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  
  items.forEach(item => {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return groups;
}

// ============================================================================
// CHART DATA FORMATTERS
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesDataPoint {
  month: string;
  year: number;
  [key: string]: string | number;
}

/**
 * Formats data for simple bar/line charts
 * 
 * @param items - Array of items
 * @param labelKey - Key for label
 * @param valueKey - Key for value
 * @returns Array of chart data points
 */
export function formatChartData<T>(
  items: T[],
  labelKey: keyof T,
  valueKey: keyof T
): ChartDataPoint[] {
  return items.map(item => ({
    label: String(item[labelKey]),
    value: Number(item[valueKey]),
  }));
}

/**
 * Generates time series data for the last N months
 * 
 * @param numberOfMonths - Number of months to generate (default: 6)
 * @param dataGenerator - Function to generate data for each month
 * @returns Array of time series data points
 */
export function generateMonthlyTimeSeries<T extends Record<string, any>>(
  numberOfMonths: number = 6,
  dataGenerator: (monthDate: Date, dateRange: DateRange) => T
): (TimeSeriesDataPoint & T)[] {
  const series: (TimeSeriesDataPoint & T)[] = [];
  
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    
    const dateRange = getMonthDateRange(i);
    const monthData = dataGenerator(monthDate, dateRange);
    
    series.push({
      month: getMonthNameFromDate(monthDate),
      year: monthDate.getFullYear(),
      ...monthData,
    });
  }
  
  return series;
}

/**
 * Calculates cumulative values from time series data
 * 
 * @param data - Time series data
 * @param valueKeys - Keys of values to accumulate
 * @returns Data with cumulative values
 */
export function calculateCumulative<T extends Record<string, any>>(
  data: T[],
  valueKeys: (keyof T)[]
): T[] {
  const cumulative: T[] = [];
  const sums: Record<string, number> = {};
  
  // Initialize sums
  valueKeys.forEach(key => {
    sums[String(key)] = 0;
  });
  
  data.forEach((point, index) => {
    const newPoint = { ...point };
    
    valueKeys.forEach(key => {
      const value = Number(point[key]) || 0;
      sums[String(key)] += value;
      newPoint[key] = sums[String(key)] as any;
    });
    
    cumulative.push(newPoint);
  });
  
  return cumulative;
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sorts items by weighted score
 * 
 * @param items - Array of items
 * @param scoreCalculator - Function to calculate score for each item
 * @param descending - Sort descending (default: true)
 * @returns Sorted array
 */
export function sortByScore<T>(
  items: T[],
  scoreCalculator: (item: T) => number,
  descending: boolean = true
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = scoreCalculator(a);
    const scoreB = scoreCalculator(b);
    return descending ? scoreB - scoreA : scoreA - scoreB;
  });
}

/**
 * Gets top N items from array
 * 
 * @param items - Array of items
 * @param n - Number of items to return
 * @param scoreFn - Function to calculate score (optional)
 * @returns Top N items
 */
export function getTopN<T>(
  items: T[],
  n: number,
  scoreFn?: (item: T) => number
): T[] {
  if (scoreFn) {
    return sortByScore(items, scoreFn, true).slice(0, n);
  }
  return items.slice(0, n);
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  // Calculations
  calculateGrowthPercentage,
  calculateEfficiency,
  roundToDecimals,
  calculateWeightedScore,
  
  // Date Ranges
  getMonthDateRanges,
  getMonthDateRange,
  getLastNMonthsRanges,
  isDateInRange,
  
  // Time Formatting
  formatRelativeTime,
  formatTimeAgo,
  formatDuration,
  
  // Month Names
  getMonthName,
  getMonthNameFromDate,
  MONTH_NAMES,
  FULL_MONTH_NAMES,
  
  // Data Filtering
  filterByDateRange,
  groupBy,
  
  // Chart Formatters
  formatChartData,
  generateMonthlyTimeSeries,
  calculateCumulative,
  
  // Sorting
  sortByScore,
  getTopN,
};
