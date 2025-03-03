/**
 * Formats a date into a readable string format
 * @param date The date to format
 * @returns A formatted date string (e.g., "Jan 15, 2023")
 */
export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats a date into a short date string
 * @param date The date to format
 * @returns A short formatted date string (e.g., "01/15/2023")
 */
export function formatShortDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Calculates the difference between two dates in days
 * @param date1 The first date
 * @param date2 The second date
 * @returns The number of days between the two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return 0;
  }
  
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  
  return diffDays;
}

/**
 * Checks if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past, false otherwise
 */
export function isPastDate(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Checks if a date is in the future
 * @param date The date to check
 * @returns True if the date is in the future, false otherwise
 */
export function isFutureDate(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date > today;
}

/**
 * Checks if a date is today
 * @param date The date to check
 * @returns True if the date is today, false otherwise
 */
export function isToday(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
} 