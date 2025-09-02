// Application constants
export const APP_CONFIG = {
  name: 'SIM Prakerin',
  subtitle: 'SMK GLOBIN',
  version: '1.0.0'
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  KAPROG: 'kaprog'
} as const;

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'id-ID',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD HH:mm:ss'
} as const;

// Prakerin status options
export const PRAKERIN_STATUS = {
  ACTIVE: 'aktif',
  COMPLETED: 'selesai',
  CANCELLED: 'dibatalkan'
} as const;

// Grade levels
export const TINGKAT_KELAS = [10, 11, 12] as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv']
} as const;

// Toast durations
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000
} as const;