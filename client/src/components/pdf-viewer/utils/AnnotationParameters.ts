/**
 * Annotation Parameters Utility
 * 
 * This module provides utilities for building properly structured parameters
 * for PDF.js annotation components, ensuring all required fields are present.
 */
import { DEFAULT_ANNOTATION_STYLES, EditorModes } from './annotationConfig';

// Types of parameters that can be configured
type ParameterType = 'text' | 'highlight' | 'ink' | 'signature' | 'editor';

// Interface for common annotation parameters
interface AnnotationParametersInterface {
  [key: string]: any;
}

/**
 * Class for building annotation parameters with proper structure
 */
export class AnnotationParameters {
  /**
   * Base annotation parameters that all types share
   */
  private static baseParameters = {
    // Required fields to prevent PDF.js errors
    fieldObjects: {},
    accessibilityManager: null,
    l10n: null,
    
    // Editing state
    isEditing: false,
  };
  
  /**
   * Get parameters for text annotations
   */
  static getTextParameters(customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
    const textDefaults = {
      ...this.baseParameters,
      // Text specific parameters
      fontSize: DEFAULT_ANNOTATION_STYLES.text.fontSize,
      fontFamily: DEFAULT_ANNOTATION_STYLES.text.fontFamily,
      textColor: DEFAULT_ANNOTATION_STYLES.text.color,
      backgroundColor: DEFAULT_ANNOTATION_STYLES.text.backgroundColor,
      strokeColor: DEFAULT_ANNOTATION_STYLES.text.borderColor,
      borderWidth: DEFAULT_ANNOTATION_STYLES.text.borderWidth,
      borderRadius: DEFAULT_ANNOTATION_STYLES.text.borderRadius,
      padding: 5,
      editorType: EditorModes.TEXT,
    };
    
    return {
      ...textDefaults,
      ...customParams,
      // Make absolutely sure fieldObjects exists regardless of custom params
      fieldObjects: customParams.fieldObjects || {},
    };
  }
  
  /**
   * Get parameters for highlight annotations
   */
  static getHighlightParameters(customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
    const highlightDefaults = {
      ...this.baseParameters,
      // Highlight specific parameters
      highlightColor: DEFAULT_ANNOTATION_STYLES.highlight.color,
      opacity: 0.5,
      editorType: EditorModes.HIGHLIGHT,
    };
    
    return {
      ...highlightDefaults,
      ...customParams,
      // Make absolutely sure fieldObjects exists regardless of custom params
      fieldObjects: customParams.fieldObjects || {},
    };
  }
  
  /**
   * Get parameters for ink/drawing annotations
   */
  static getInkParameters(customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
    const inkDefaults = {
      ...this.baseParameters,
      // Ink specific parameters
      inkColor: DEFAULT_ANNOTATION_STYLES.ink.color,
      inkThickness: DEFAULT_ANNOTATION_STYLES.ink.thickness,
      inkOpacity: DEFAULT_ANNOTATION_STYLES.ink.opacity,
      editorType: EditorModes.INK,
    };
    
    return {
      ...inkDefaults,
      ...customParams,
      // Make absolutely sure fieldObjects exists regardless of custom params
      fieldObjects: customParams.fieldObjects || {},
    };
  }
  
  /**
   * Get parameters for signature annotations
   */
  static getSignatureParameters(customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
    const signatureDefaults = {
      ...this.baseParameters,
      // Signature specific parameters
      fontFamily: DEFAULT_ANNOTATION_STYLES.signature.fontFamily,
      fontSize: DEFAULT_ANNOTATION_STYLES.signature.fontSize,
      textColor: DEFAULT_ANNOTATION_STYLES.signature.color,
      backgroundColor: DEFAULT_ANNOTATION_STYLES.signature.backgroundColor,
      borderWidth: 1,
      borderColor: '#888888',
      editorType: EditorModes.TEXT, // Signatures use text editor with special font
    };
    
    return {
      ...signatureDefaults,
      ...customParams,
      // Make absolutely sure fieldObjects exists regardless of custom params
      fieldObjects: customParams.fieldObjects || {},
    };
  }
  
  /**
   * Get parameters for editor mode
   */
  static getEditorModeParameters(mode: EditorModes, customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
    // Get parameters based on the editor mode
    switch (mode) {
      case EditorModes.TEXT:
        return this.getTextParameters(customParams);
      case EditorModes.HIGHLIGHT:
        return this.getHighlightParameters(customParams);
      case EditorModes.INK:
        return this.getInkParameters(customParams);
      case EditorModes.NONE:
      default:
        // Default parameters
        return {
          ...this.baseParameters,
          ...customParams,
          editorType: EditorModes.NONE,
          // Make absolutely sure fieldObjects exists regardless of custom params
          fieldObjects: customParams.fieldObjects || {},
        };
    }
  }
}

/**
 * Helper to create complete annotation parameters for a specific type
 */
export function createParametersForType(type: ParameterType, customParams: AnnotationParametersInterface = {}): AnnotationParametersInterface {
  switch (type) {
    case 'text':
      return AnnotationParameters.getTextParameters(customParams);
    case 'highlight':
      return AnnotationParameters.getHighlightParameters(customParams);
    case 'ink':
      return AnnotationParameters.getInkParameters(customParams);
    case 'signature':
      return AnnotationParameters.getSignatureParameters(customParams);
    case 'editor':
    default:
      return AnnotationParameters.getEditorModeParameters(
        (customParams.editorType as EditorModes) || EditorModes.NONE,
        customParams
      );
  }
}