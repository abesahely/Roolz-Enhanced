/**
 * Constants for beNext.io branding
 */
export const BRAND_COLORS = {
  BLUE: '#0A1E45',
  NAVY: '#0A1E45', // Deep navy blue (same as BLUE for consistency)
  ORANGE: '#F4871F',
  WHITE: '#FFFFFF',
  GRAY: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
  }
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf'];

/**
 * PDF Editor constants
 */
export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36];
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT = 'Montserrat';
export const SIGNATURE_FONT = 'Dancing Script';
export const ANNOTATION_BACKGROUND = `${BRAND_COLORS.ORANGE}33`; // 20% opacity orange
