/**
 * Constants for the PDF Viewer module
 */

// beNext.io branding colors
export const BRAND_COLORS = {
  // Primary brand colors
  NAVY_BLUE: '#0A1E45',  // Deep navy blue for backgrounds and headers
  ORANGE: '#F4871F',     // Orange for buttons and accents
  WHITE: '#FFFFFF',      // White for text and light elements
  
  // Additional variants for UI
  NAVY_BLUE_LIGHT: '#1E3A6C',  // Lighter navy for hover states
  NAVY_BLUE_DARK: '#061530',   // Darker navy for active states
  ORANGE_LIGHT: '#F6A04C',     // Lighter orange for hover states
  ORANGE_DARK: '#DB7008',      // Darker orange for active states
  
  // Grays for UI elements
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
};

// Fonts
export const FONTS = {
  PRIMARY: 'Montserrat, sans-serif',
  SIGNATURE: 'Dancing Script, cursive',
};

// PDF Viewer settings
export const PDF_VIEWER = {
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 3.0,
  ZOOM_STEP: 0.1,
  DEFAULT_SCALE: 1.0,
  PAGE_GAP: 10, // Gap between pages in px
};

// Annotation settings
export const ANNOTATION = {
  DEFAULT_FONT_SIZE: 16,
  FONT_SIZES: [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36],
  DEFAULT_FONT: 'Montserrat',
  SIGNATURE_FONT: 'Dancing Script',
  BACKGROUND_COLOR: `${BRAND_COLORS.ORANGE}33`, // 20% opacity orange
  BORDER_COLOR: BRAND_COLORS.ORANGE,
  CHECKBOX_SIZE: 20,
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_LOAD_ERROR: 'Failed to load PDF file. Please ensure it is a valid PDF document.',
  GENERAL_ERROR: 'Something went wrong. Please try again.',
  ANNOTATION_ERROR: 'Failed to add annotation. Please try again.',
  SAVE_ERROR: 'Failed to save PDF with annotations. Please try again.',
};

// Control bar settings
export const CONTROL_BAR = {
  HEIGHT: 48, // Height in pixels
};

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 640,  // Tailwind's sm
  TABLET: 768,  // Tailwind's md
  DESKTOP: 1024, // Tailwind's lg
};