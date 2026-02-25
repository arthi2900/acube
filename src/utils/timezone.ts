/**
 * Timezone utilities for Indian Standard Time (IST)
 */

// IST is UTC+5:30
export const IST_OFFSET_HOURS = 5;
export const IST_OFFSET_MINUTES = 30;
export const IST_OFFSET_MS = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000;
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current time in IST
 */
export function getCurrentISTTime(): Date {
  // Get current UTC time and add IST offset
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

/**
 * Convert UTC time to IST
 */
export function convertToIST(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // Add IST offset to UTC time
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Convert IST time to UTC
 */
export function convertToUTC(istDate: Date): Date {
  // Subtract IST offset from IST time
  return new Date(istDate.getTime() - IST_OFFSET_MS);
}

/**
 * Get difference in seconds between two times
 */
export function getTimeDifferenceInSeconds(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

/**
 * Format seconds to time format (HH:MM:SS)
 */
export function formatSecondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date and time in IST
 */
export function formatISTDateTime(date: string | Date): string {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  // Format using IST timezone
  return utcDate.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date in DD-MM-YYYY format with time on separate line
 */
export function formatISTDateTimeSeparate(date: string | Date): { date: string; time: string } {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  
  // Format date as DD-MM-YYYY
  const dateStr = utcDate.toLocaleDateString('en-GB', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Format time with "at" prefix
  const timeStr = utcDate.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return { date: dateStr, time: `at ${timeStr}` };
}

/**
 * Check if exam has started
 */
export function hasExamStarted(startTime: string | Date): boolean {
  const now = new Date(); // Current UTC time
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  return now >= start;
}

/**
 * Check if exam has ended
 */
export function hasExamEnded(endTime: string | Date): boolean {
  const now = new Date(); // Current UTC time
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  return now >= end;
}

/**
 * Get remaining time for exam in seconds
 */
export function getExamRemainingTime(
  startedAt: string | Date,
  durationMinutes: number
): number {
  const now = new Date(); // Current UTC time
  const started = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  const elapsedSeconds = getTimeDifferenceInSeconds(started, now);
  const totalSeconds = durationMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  
  // Debug logging
  console.log('getExamRemainingTime calculation:');
  console.log('  now (UTC):', now.toISOString());
  console.log('  started (UTC):', started.toISOString());
  console.log('  elapsedSeconds:', elapsedSeconds);
  console.log('  totalSeconds:', totalSeconds);
  console.log('  remaining:', remaining);
  
  return remaining;
}

/**
 * Convert IST date/time input to UTC ISO string
 * Used when teacher enters exam date/time in IST
 * 
 * Example: If teacher enters "2025-12-25" and "10:00" (meaning 10:00 AM IST)
 * This should return "2025-12-25T04:30:00.000Z" (10:00 AM IST = 4:30 AM UTC)
 */
export function convertISTInputToUTC(dateStr: string, timeStr: string): string {
  // Parse the date and time components
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a UTC timestamp with these components (treating them as IST)
  // Month is 0-indexed in Date.UTC
  const istTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  
  // The above created a UTC timestamp, but we want to treat the input as IST
  // So we need to subtract the IST offset to get the actual UTC time
  // IST is UTC+5:30, so when it's 10:00 in IST, it's 04:30 in UTC
  const utcTimestamp = istTimestamp - IST_OFFSET_MS;
  
  return new Date(utcTimestamp).toISOString();
}
