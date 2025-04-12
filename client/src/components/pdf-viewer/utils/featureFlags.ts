/**
 * Feature Flags for PDF Viewer
 * 
 * This file manages feature flags to enable or disable functionality
 * and facilitate A/B testing during the migration.
 */

// Feature flag configuration
interface FeatureFlags {
  // PDF Viewer implementation flags
  useDirectPDFViewer: boolean; // Use direct PDF.js implementation (preferred)
  useNewPDFViewer: boolean;    // Use React-PDF based implementation
  useIframePDFViewer: boolean; // Use iframe-based PDF.js pre-built viewer
  
  // Feature-specific flags
  useNewAnnotationTools: boolean;
  useAnnotationAutoSaving: boolean;
  usePagePreloading: boolean;
  useHighQualityRendering: boolean;
  
  // Mobile-specific features
  useOptimizedMobileView: boolean;
}

// Default feature flag values
const defaultFeatureFlags: FeatureFlags = {
  useDirectPDFViewer: true,   // Direct PDF.js implementation is now the default (most reliable)
  useNewPDFViewer: false,     // React-PDF implementation off by default
  useIframePDFViewer: false,  // Iframe-based implementation off by default now
  useNewAnnotationTools: false,
  useAnnotationAutoSaving: false,
  usePagePreloading: false,
  useHighQualityRendering: true,
  useOptimizedMobileView: true
};

// Local storage key for feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'benext_pdf_feature_flags';

/**
 * Load feature flags from local storage or use defaults
 * 
 * @returns Current feature flag settings
 */
export const getFeatureFlags = (): FeatureFlags => {
  try {
    // Check if flags are stored in local storage
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    
    if (storedFlags) {
      // Parse stored flags and merge with defaults to ensure we have all flags
      const parsedFlags = JSON.parse(storedFlags);
      return { ...defaultFeatureFlags, ...parsedFlags };
    }
  } catch (error) {
    console.error('Error loading feature flags from storage:', error);
  }
  
  // Return defaults if storage access fails or no stored flags
  return { ...defaultFeatureFlags };
};

/**
 * Save feature flags to local storage
 * 
 * @param flags Feature flag settings to save
 */
export const saveFeatureFlags = (flags: Partial<FeatureFlags>): void => {
  try {
    // Get current flags and merge with new values
    const currentFlags = getFeatureFlags();
    const updatedFlags = { ...currentFlags, ...flags };
    
    // Save to local storage
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
  } catch (error) {
    console.error('Error saving feature flags to storage:', error);
  }
};

/**
 * Check if a specific feature is enabled
 * 
 * @param flag The feature flag to check
 * @returns Boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[flag];
};

/**
 * Toggle a feature flag
 * 
 * @param flag The feature flag to toggle
 * @returns The new state of the flag (true/false)
 */
export const toggleFeature = (flag: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  const newValue = !flags[flag];
  
  // Save the updated flag
  saveFeatureFlags({ [flag]: newValue });
  
  return newValue;
};

/**
 * Enable new PDF viewer for a percentage of users
 * Used for gradual rollout
 * 
 * @param percentage Percentage of users to enable (0-100)
 * @returns Whether the feature was enabled for the current user
 */
export const enableForPercentage = (percentage: number): boolean => {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.max(0, Math.min(100, percentage));
  
  // Get or create a unique user ID for consistent targeting
  let userId = localStorage.getItem('benext_user_id');
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('benext_user_id', userId);
  }
  
  // Determine if user is in the target group
  const userValue = parseInt(userId, 36) % 100;
  const isEnabled = userValue < validPercentage;
  
  // Save the feature flag
  saveFeatureFlags({
    useDirectPDFViewer: true, // Always use the direct viewer (unless user changes manually)
    useNewPDFViewer: isEnabled,
    useNewAnnotationTools: isEnabled
  });
  
  return isEnabled;
};

/**
 * Reset all feature flags to default values
 */
export const resetFeatureFlags = (): void => {
  saveFeatureFlags(defaultFeatureFlags);
};

/**
 * PDFViewerSelector component props
 */
export interface PDFViewerSelectorProps {
  // Toggle options
  forceDirect?: boolean; // Force using direct PDF.js implementation (preferred)
  forceNew?: boolean;    // Force using React-PDF implementation
  forceIframe?: boolean; // Force using iframe implementation
  
  // Render functions
  directRenderer: () => JSX.Element; // DirectPDFViewer renderer
  legacyRenderer: () => JSX.Element; // Legacy PDFViewer renderer
  newRenderer: () => JSX.Element;    // PDFViewerContainer renderer
  iframeRenderer?: () => JSX.Element; // PDFJSViewer renderer
}