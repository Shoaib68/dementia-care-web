import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format database timestamp (UTC with timezone) to user-friendly display
 * Handles formats like: '2025-09-26 16:46:03.654798+00'
 */
export function formatDatabaseDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    // Handle different timestamp formats from database
    let date: Date;
    
    if (typeof dateString === 'string') {
      // Convert PostgreSQL timestamp format to proper ISO string if needed
      let isoString = dateString;
      
      // Handle PostgreSQL format: '2025-09-26 16:46:03.654798+00'
      if (dateString.includes(' ') && (dateString.includes('+') || dateString.includes('-', 10))) {
        // Replace space with 'T' to make it ISO compliant
        isoString = dateString.replace(' ', 'T');
        
        // Ensure timezone format is correct (add colon if missing)
        if (isoString.match(/[+-]\d{2}$/)) {
          isoString = isoString + ':00';
        } else if (isoString.match(/[+-]\d{4}$/)) {
          const lastTwo = isoString.slice(-2);
          const beforeLast = isoString.slice(0, -2);
          isoString = beforeLast + ':' + lastTwo;
        }
      }
      
      date = new Date(isoString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return 'Invalid date';
  }
}

/**
 * Format database timestamp to date-only display
 */
export function formatDatabaseDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    let date: Date;
    
    if (typeof dateString === 'string') {
      let isoString = dateString;
      
      // Handle PostgreSQL format
      if (dateString.includes(' ') && (dateString.includes('+') || dateString.includes('-', 10))) {
        isoString = dateString.replace(' ', 'T');
        
        if (isoString.match(/[+-]\d{2}$/)) {
          isoString = isoString + ':00';
        } else if (isoString.match(/[+-]\d{4}$/)) {
          const lastTwo = isoString.slice(-2);
          const beforeLast = isoString.slice(0, -2);
          isoString = beforeLast + ':' + lastTwo;
        }
      }
      
      date = new Date(isoString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return 'Invalid date';
  }
}

/**
 * Get patient full name from a patient object.
 * Falls back to the email username if first/last name are not set.
 */
export function getPatientFullName(patient: {
  first_name?: string | null;
  last_name?: string | null;
  users: { email: string };
}): string {
  if (patient.first_name && patient.last_name) {
    return `${patient.first_name} ${patient.last_name}`;
  }
  return patient.users.email.split('@')[0];
}

/**
 * Get today's date in YYYY-MM-DD format.
 * Useful for setting the `min` attribute on date inputs.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate age from database date string
 */
export function calculateAgeFromDatabase(dateOfBirth: string | null | undefined): number | string {
  if (!dateOfBirth) return 'N/A';
  
  try {
    let birthDate: Date;
    
    if (typeof dateOfBirth === 'string') {
      let isoString = dateOfBirth;
      
      // Handle PostgreSQL format
      if (dateOfBirth.includes(' ') && (dateOfBirth.includes('+') || dateOfBirth.includes('-', 10))) {
        isoString = dateOfBirth.replace(' ', 'T');
        
        if (isoString.match(/[+-]\d{2}$/)) {
          isoString = isoString + ':00';
        } else if (isoString.match(/[+-]\d{4}$/)) {
          const lastTwo = isoString.slice(-2);
          const beforeLast = isoString.slice(0, -2);
          isoString = beforeLast + ':' + lastTwo;
        }
      }
      
      birthDate = new Date(isoString);
    } else {
      birthDate = new Date(dateOfBirth);
    }
    
    if (isNaN(birthDate.getTime())) {
      return 'N/A';
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error, 'Input:', dateOfBirth);
    return 'N/A';
  }
}
