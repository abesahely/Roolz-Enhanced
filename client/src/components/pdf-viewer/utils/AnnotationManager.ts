/**
 * Annotation Manager
 * 
 * This module provides a centralized manager for PDF.js annotations,
 * handling editor mode switching, parameter configuration, and event coordination.
 */
import { pdfEventBus } from './EventBus';
import { initializePDFJS, isPDFJSInitialized, cleanupPDFJS } from './PDFJSInitializer';
import { EditorModes, createEditorParameters } from './annotationConfig';

// Add type declaration for the window object to include the PDFViewerApplication
declare global {
  interface Window {
    PDFViewerApplication?: any;
    pdfjsLib?: any;
  }
}

/**
 * AnnotationManager - Manages PDF.js annotation functionality
 */
export class AnnotationManager {
  private _currentMode = EditorModes.NONE;
  private _isInitialized = false;
  private _editorParams: Record<string, any> = {};
  private _callbacks: Record<string, Function[]> = {
    modeChange: [],
    annotationCreated: [],
    annotationDeleted: [],
    annotationSelected: [],
  };

  constructor() {
    // Initialize the manager
    this._initialize();
  }

  /**
   * Initialize the annotation manager
   * Sets up event listeners and PDF.js environment
   */
  private _initialize(): void {
    // Only initialize once
    if (this._isInitialized) {
      return;
    }

    // First ensure PDF.js global environment is set up
    if (!isPDFJSInitialized()) {
      initializePDFJS();
    }

    // Set up listeners for annotation events
    pdfEventBus.on('annotationeditormodechanged', (event) => {
      // Update the current mode when it changes externally
      if (event && typeof event.mode === 'number') {
        this._currentMode = event.mode;
        this._notifyModeChange();
      }
    });

    pdfEventBus.on('annotationeditorparamschanged', (event) => {
      // Update our params when they change externally
      if (event && event.params) {
        this._editorParams = { ...this._editorParams, ...event.params };
      }
    });

    // Mark as initialized
    this._isInitialized = true;
  }

  /**
   * Get the current annotation editor mode
   */
  public get currentMode(): EditorModes {
    return this._currentMode;
  }

  /**
   * Set the annotation editor mode
   */
  public setMode(mode: EditorModes): void {
    if (this._currentMode === mode) {
      return; // No change needed
    }

    // Update our local state
    this._currentMode = mode;

    // Notify PDF.js about the mode change
    if (window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager) {
      try {
        // Use type assertion to bypass TypeScript checking
        (window.PDFViewerApplication.pdfViewer.annotationEditorUIManager as any).updateMode(mode);
      } catch (error) {
        console.error('Error updating annotation editor mode:', error);
      }
    } else {
      // Direct event dispatch if UI manager not available
      pdfEventBus.dispatch('annotationeditormodechanged', {
        mode,
        source: this,
      });
    }

    // Notify our listeners
    this._notifyModeChange();
  }

  /**
   * Set editor parameters
   */
  public setEditorParameters(params: Record<string, any>): void {
    // Ensure params has a fieldObjects property to prevent the "params.fieldObjects is undefined" error
    const safeParams = {
      ...params,
      fieldObjects: params.fieldObjects || {}
    };
    
    // Create a complete parameter object with all required fields
    const completeParams = createEditorParameters(safeParams);
    
    // Update our local state
    this._editorParams = { ...this._editorParams, ...completeParams };

    // Notify PDF.js about the parameter change
    if (window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager) {
      try {
        // Use type assertion to bypass TypeScript checking
        (window.PDFViewerApplication.pdfViewer.annotationEditorUIManager as any).updateParams(completeParams);
        
        // Additionally, explicitly set fieldObjects on the UI manager to ensure it's available
        if ((window.PDFViewerApplication.pdfViewer.annotationEditorUIManager as any).fieldObjects === undefined) {
          (window.PDFViewerApplication.pdfViewer.annotationEditorUIManager as any).fieldObjects = {};
        }
      } catch (error) {
        console.error('Error updating annotation editor parameters:', error);
      }
    } else {
      // Direct event dispatch if UI manager not available
      pdfEventBus.dispatch('annotationeditorparamschanged', {
        parameters: completeParams,
        source: this,
      });
    }
  }

  /**
   * Toggle the annotation editor mode
   * If already in the specified mode, turn it off (set to NONE)
   */
  public toggleMode(mode: EditorModes): void {
    if (this._currentMode === mode) {
      this.setMode(EditorModes.NONE); // Turn off
    } else {
      this.setMode(mode); // Turn on the requested mode
    }
  }

  /**
   * Register a callback for mode changes
   */
  public onModeChange(callback: (mode: EditorModes) => void): void {
    this._callbacks.modeChange.push(callback);
  }

  /**
   * Register a callback for annotation creation
   */
  public onAnnotationCreated(callback: (annotation: any) => void): void {
    this._callbacks.annotationCreated.push(callback);
  }

  /**
   * Register a callback for annotation deletion
   */
  public onAnnotationDeleted(callback: (annotation: any) => void): void {
    this._callbacks.annotationDeleted.push(callback);
  }

  /**
   * Register a callback for annotation selection
   */
  public onAnnotationSelected(callback: (annotation: any) => void): void {
    this._callbacks.annotationSelected.push(callback);
  }

  /**
   * Clear a specific callback or all callbacks of a type
   */
  public clearCallbacks(type: string, callback?: Function): void {
    if (!this._callbacks[type]) {
      return;
    }

    if (callback) {
      // Remove specific callback
      const index = this._callbacks[type].indexOf(callback);
      if (index !== -1) {
        this._callbacks[type].splice(index, 1);
      }
    } else {
      // Clear all callbacks of this type
      this._callbacks[type] = [];
    }
  }

  /**
   * Notify all mode change listeners
   */
  private _notifyModeChange(): void {
    for (const callback of this._callbacks.modeChange) {
      try {
        callback(this._currentMode);
      } catch (error) {
        console.error('Error in mode change callback:', error);
      }
    }
  }

  /**
   * Clean up the annotation manager
   */
  public cleanup(): void {
    if (!this._isInitialized) {
      return;
    }

    // Clean up PDF.js global environment
    cleanupPDFJS();

    // Clear all callbacks
    Object.keys(this._callbacks).forEach(key => {
      this._callbacks[key] = [];
    });

    // Reset state
    this._currentMode = EditorModes.NONE;
    this._isInitialized = false;
  }
}

// Create a singleton instance
export const annotationManager = new AnnotationManager();

/**
 * Exported helper functions to match the existing API surface
 * These make the AnnotationManager easier to use without having to import the class directly
 */

/**
 * Initialize the annotation system with a PDF document
 * Enhanced with detailed error logging and recovery options
 */
export function initializeAnnotationSystem(pdfDoc: any, initialPage: number = 1): boolean {
  try {
    if (!isPDFJSInitialized()) {
      console.log('PDF.js not initialized, attempting initialization');
      const success = initializePDFJS();
      if (!success) {
        console.error('Failed to initialize PDF.js environment');
        
        // Log detailed diagnostic information
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[AnnotationSystem] Initialization diagnostics:', {
            documentProvided: !!pdfDoc,
            initialPage,
            globalPDFJSAvailable: typeof window.pdfjsLib !== 'undefined',
            windowPDFViewerApplication: !!window.PDFViewerApplication,
            browserEnv: navigator.userAgent
          });
        }
        
        return false;
      }
    }
    
    // Validate the global object structure after initialization
    if (!window.PDFViewerApplication?.pdfViewer) {
      console.warn('PDF Viewer structure incomplete after initialization');
    }
    
    // If we get here, the annotation system is initialized
    return true;
  } catch (error) {
    console.error('Error initializing annotation system:', error);
    
    // Additional error information in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[AnnotationSystem] Error details:', {
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        documentProvided: !!pdfDoc,
        initialPage
      });
    }
    
    return false;
  }
}

/**
 * Update the annotation editor mode with enhanced error handling
 * This function safely converts string modes to numeric modes and applies them
 * @param mode The mode to set, can be a number (EditorMode) or a string ('text', 'highlight', etc.)
 * @returns boolean indicating if the mode was successfully set
 */
export function updateAnnotationEditorMode(mode: any): boolean {
  try {
    // Convert string modes to EditorModes numbers
    const editorMode = typeof mode === 'number' ? mode : getAnnotationModeFromString(mode);
    
    // Apply the mode with error handling
    annotationManager.setMode(editorMode);
    
    // Verify the mode was set correctly
    if (annotationManager.currentMode !== editorMode) {
      console.warn('[AnnotationManager] Mode not set correctly', { 
        requested: editorMode, 
        actual: annotationManager.currentMode 
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[AnnotationManager] Failed to update annotation mode:', error);
    
    // Log detailed information in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[AnnotationManager] Mode update diagnostics:', {
        requestedMode: mode,
        modeType: typeof mode,
        annotationManagerInitialized: isAnnotationSystemInitialized(),
        uiManagerAvailable: !!window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager
      });
    }
    
    return false;
  }
}

/**
 * Update the current annotation page
 */
export function updateAnnotationPage(pageNumber: number): void {
  if (window.PDFViewerApplication?.pdfViewer) {
    // Use type assertion to bypass TypeScript checking
    (window.PDFViewerApplication.pdfViewer as any).currentPageNumber = pageNumber;
  }
}

/**
 * Clean up the annotation system
 */
export function cleanupAnnotationSystem(): void {
  annotationManager.cleanup();
}

/**
 * Check if the annotation system is initialized
 */
export function isAnnotationSystemInitialized(): boolean {
  return isPDFJSInitialized();
}

/**
 * Helper to convert string annotation modes to numeric editor modes
 */
function getAnnotationModeFromString(mode: string | null): EditorModes {
  if (!mode) return EditorModes.NONE;
  
  switch (mode) {
    case 'text':
      return EditorModes.TEXT;
    case 'highlight':
      return EditorModes.HIGHLIGHT;
    case 'drawing':
      return EditorModes.INK;
    default:
      return EditorModes.NONE;
  }
}