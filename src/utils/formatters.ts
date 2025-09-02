import { DATE_FORMATS } from './constants';

/**
 * Format date string to Indonesian locale
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString(DATE_FORMATS.DISPLAY);
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return '-';
  
  return `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Format phone number to Indonesian format
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle Indonesian phone number formats
  if (digits.startsWith('62')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return digits.replace(/^0/, '+62');
  }
  
  return phone;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format student grade/score
 */
export function formatGrade(grade: number): string {
  if (!grade && grade !== 0) return '-';
  
  const gradeNum = Number(grade);
  if (isNaN(gradeNum)) return '-';
  
  return gradeNum.toFixed(0);
}

/**
 * Get grade status based on score
 */
export function getGradeStatus(grade: number): 'passing' | 'failing' | 'excellent' {
  if (grade >= 85) return 'excellent';
  if (grade >= 75) return 'passing';
  return 'failing';
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}