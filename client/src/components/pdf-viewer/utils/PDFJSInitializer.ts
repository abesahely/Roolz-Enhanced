/**
 * PDF.js Global Initializer
 * 
 * This module sets up the global PDF.js environment needed for proper annotation support.
 * It ensures the worker is properly configured and the global PDFViewerApplication object
 * is initialized with all required components.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { PDFJS_VERSION } from '../../../pdfjs-worker-setup';
import { pdfEventBus, EventListener } from './EventBus';
import { SimpleLinkService } from './LinkService';

// Track initialization state
let isInitialized = false;
let linkService: SimpleLinkService | null = null;
let annotationStorage: any = null;

// Create a debug logging function for tracing PDF.js initialization
function debugPDFJS(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[PDFJSInitializer] ${message}`, data || '');
  }
}

/**
 * Initialize the global PDF.js environment
 * This must be called before any PDF.js functionality is used
 */
export function initializePDFJS(): boolean {
  if (isInitialized) {
    debugPDFJS('PDF.js already initialized');
    return true;
  }

  try {
    debugPDFJS(`Initializing PDF.js version ${PDFJS_VERSION}`);
    
    // 1. Initialize the worker (this is normally done in pdfjs-worker-setup.ts)
    
    // 2. Use the existing global event bus from EventBus.ts
    const eventBus = pdfEventBus;
    debugPDFJS('Using global EventBus');
    
    // 3. Create the link service
    linkService = new SimpleLinkService();
    debugPDFJS('LinkService created');
    
    // 4. Create the annotation storage
    annotationStorage = createAnnotationStorage();
    debugPDFJS('AnnotationStorage created');
    
    // 5. Create the annotation editor UI manager
    const annotationEditorUIManager = createAnnotationEditorUIManager(annotationStorage);
    debugPDFJS('AnnotationEditorUIManager created');
    
    // 6. Setup the global PDFViewerApplication if it doesn't exist
    if (!window.PDFViewerApplication) {
      debugPDFJS('Creating global PDFViewerApplication');
      window.PDFViewerApplication = {
        pdfViewer: {
          currentPageNumber: 1,
          currentScale: 1,
          // Add viewer properties needed for annotations
          _pages: [],
          _currentPageNumber: 1,
          _pagesRotation: 0,
          _pagesRequests: {},
          eventBus,
          linkService,
          annotationStorage,
          annotationEditorUIManager,
        },
        pdfDocument: null,
        eventBus,
        downloadComplete: false,
        // These properties must exist for annotation stability
        l10n: {
          get: (key: string, args?: any, fallback?: string) => fallback || key
        },
        error: null,
        _boundEvents: {},
        _openURLParams: null,
      };
    } else {
      // Update the existing PDFViewerApplication with our objects
      debugPDFJS('Updating existing PDFViewerApplication');
      
      // Safely update viewer properties
      const pdfViewer = window.PDFViewerApplication.pdfViewer;
      if (pdfViewer) {
        // Use type assertion to bypass type checking
        (pdfViewer as any).eventBus = eventBus;
        (pdfViewer as any).linkService = linkService;
        (pdfViewer as any).annotationStorage = annotationStorage;
        (pdfViewer as any).annotationEditorUIManager = annotationEditorUIManager;
      }
      
      // Update application-level properties
      (window.PDFViewerApplication as any).eventBus = eventBus;
    }
    
    // Mark as initialized
    isInitialized = true;
    debugPDFJS('PDF.js global environment initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize PDF.js global environment:', error);
    return false;
  }
}

/**
 * Create a complete AnnotationStorage implementation matching PDF.js API
 */
function createAnnotationStorage() {
  return {
    // Core storage functionality
    _storage: new Map(),
    _modified: new Set(),
    
    // Required methods
    getValue(key: string) {
      return this._storage.get(key);
    },
    
    setValue(key: string, value: any) {
      this._storage.set(key, value);
      this._modified.add(key);
      return true;
    },
    
    getAll() {
      return Object.fromEntries(this._storage);
    },
    
    size() {
      return this._storage.size;
    },
    
    delete(key: string) {
      this._modified.add(key);
      return this._storage.delete(key);
    },
    
    // PDF.js 3.x required methods
    resetModified() {
      this._modified.clear();
    },
    
    getModified() {
      return this._modified.size > 0;
    },
    
    // Add fallback properties for stability
    onResetModified: null,
  };
}

/**
 * Create a proper AnnotationEditorUIManager implementation
 */
function createAnnotationEditorUIManager(annotationStorage: any) {
  return {
    // Properties
    eventBus: pdfEventBus,
    annotationStorage,
    currentPageIndex: 0,
    editorMode: 0, // 0=disabled, 1=text, 2=ink, etc.
    
    // Important parameters required by PDF.js
    fieldObjects: {}, // Critical - this empty object fixes the "params.fieldObjects is undefined" error
    l10n: null,
    accessibilityManager: null,
    
    // Required methods
    updateMode(mode: number) {
      this.editorMode = mode;
      debugPDFJS(`AnnotationEditorUIManager mode updated to ${mode}`);
      // Dispatch event for mode change
      pdfEventBus.dispatch('annotationeditormodechanged', {
        mode,
        source: this,
      });
    },
    
    updateParams(params: any) {
      debugPDFJS('AnnotationEditorUIManager params updated', params);
    },
    
    // Additional methods that might be needed
    setEditingState(isEditing: boolean) {
      // Notify that editing state changed
      pdfEventBus.dispatch('annotationeditorstatechanged', {
        isEditing,
        source: this,
      });
    },
    
    registerEditor(editor: any) {
      // For registering annotation editors
      debugPDFJS('Editor registered', editor);
    },
    
    // Safety method to prevent undefined errors
    getEditor() {
      return null;
    },
  };
}

/**
 * Clean up the PDF.js global environment
 */
export function cleanupPDFJS(): void {
  if (!isInitialized) {
    return;
  }
  
  try {
    debugPDFJS('Cleaning up PDF.js global environment');
    
    // Reset our objects
    linkService = null;
    annotationStorage = null;
    
    // Clean up global reference (don't delete it, just reset properties)
    if (window.PDFViewerApplication) {
      if (window.PDFViewerApplication.pdfViewer) {
        // Use type assertion to bypass type checking
        (window.PDFViewerApplication.pdfViewer as any).annotationEditorUIManager = undefined;
        (window.PDFViewerApplication.pdfViewer as any).annotationStorage = undefined;
      }
      // Use type assertion to bypass type checking
      (window.PDFViewerApplication as any).eventBus = undefined;
    }
    
    isInitialized = false;
    debugPDFJS('PDF.js global environment cleaned up');
  } catch (error) {
    console.error('Error cleaning up PDF.js global environment:', error);
  }
}

/**
 * Check if the PDF.js global environment is initialized
 */
export function isPDFJSInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the global event bus
 */
export function getEventBus() {
  return pdfEventBus;
}

/**
 * Get the global link service
 */
export function getLinkService(): SimpleLinkService | null {
  return linkService;
}

/**
 * Get the global annotation storage
 */
export function getAnnotationStorage(): any {
  return annotationStorage;
}

/**
 * Extend global Window interface to include PDFViewerApplication
 */
declare global {
  interface Window {
    PDFViewerApplication: any;
  }
}