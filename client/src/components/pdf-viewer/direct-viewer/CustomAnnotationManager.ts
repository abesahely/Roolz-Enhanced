/**
 * Custom Annotation Manager
 * 
 * This file provides a direct API to handle PDF annotations without depending
 * on the PDF.js UI manager (which may not be properly initialized in our component).
 */

import { AnnotationMode, getAnnotationStyle } from '../utils/annotationConfig';
import { BRAND_COLORS } from '@/lib/constants';

/**
 * Annotation data structure
 */
export interface Annotation {
  id: string;
  type: AnnotationMode;
  pageNumber: number;
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * CustomAnnotationManager class
 * 
 * Handles creation, rendering and management of annotations directly on the canvas
 */
export class CustomAnnotationManager {
  private annotations: Annotation[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentScale: number = 1.0;
  private currentPage: number = 1;
  private onModifiedCallback: (() => void) | null = null;
  
  /**
   * Initialize the annotation manager with a canvas
   */
  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set up event listeners for canvas interactions
    if (this.canvas) {
      this.setupEventListeners();
    }
  }
  
  /**
   * Set the current scale for rendering annotations
   */
  setScale(scale: number) {
    this.currentScale = scale;
  }
  
  /**
   * Set the current page number
   */
  setPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }
  
  /**
   * Register a callback for when annotations are modified
   */
  onAnnotationsModified(callback: () => void) {
    this.onModifiedCallback = callback;
  }
  
  /**
   * Call the modification callback if registered
   */
  private notifyModified() {
    if (this.onModifiedCallback) {
      this.onModifiedCallback();
    }
  }
  
  /**
   * Add a new annotation at the specified coordinates
   */
  addAnnotation(type: AnnotationMode, x: number, y: number, text?: string) {
    if (!type) return;
    
    // Get styles based on annotation type
    const style = getAnnotationStyle(type);
    
    const annotation: Annotation = {
      id: `anno-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      pageNumber: this.currentPage,
      x,
      y,
      text: text || '',
      fontFamily: style.fontFamily,
      fontSize: style.fontSize ? parseInt(style.fontSize) : 14,
      color: style.color || BRAND_COLORS.NAVY,
      backgroundColor: style.backgroundColor || 'transparent',
      width: type === 'highlight' ? 100 : undefined,
      height: type === 'highlight' ? 20 : undefined
    };
    
    this.annotations.push(annotation);
    this.notifyModified();
    this.renderAnnotations();
    
    return annotation;
  }
  
  /**
   * Get all annotations for the current page
   */
  getAnnotationsForCurrentPage(): Annotation[] {
    return this.annotations.filter(anno => anno.pageNumber === this.currentPage);
  }
  
  /**
   * Get all annotations
   */
  getAllAnnotations(): Annotation[] {
    return [...this.annotations];
  }
  
  /**
   * Clear all annotations
   */
  clearAnnotations() {
    this.annotations = [];
    this.notifyModified();
  }
  
  /**
   * Render all annotations for the current page
   */
  renderAnnotations() {
    if (!this.canvas || !this.ctx) return;
    
    // Get a backup of the canvas to restore after drawing annotations
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Render each annotation for the current page
    const currentAnnotations = this.getAnnotationsForCurrentPage();
    
    for (const anno of currentAnnotations) {
      if (anno.type === 'text') {
        this.renderTextAnnotation(anno);
      } else if (anno.type === 'highlight') {
        this.renderHighlightAnnotation(anno);
      } else if (anno.type === 'signature') {
        this.renderSignatureAnnotation(anno);
      }
    }
    
    // Just draw directly on the canvas for now
    // In a production app, we might want to use a separate overlay
  }
  
  /**
   * Render a text annotation
   */
  private renderTextAnnotation(annotation: Annotation) {
    if (!this.ctx) return;
    
    const { x, y, text, color, backgroundColor, fontFamily, fontSize } = annotation;
    
    // Set text style
    this.ctx.font = `${fontSize}px ${fontFamily || 'Montserrat, sans-serif'}`;
    
    // Measure text to create background
    const textMetrics = this.ctx.measureText(text || '');
    const textWidth = textMetrics.width;
    const textHeight = fontSize || 14;
    
    // Draw background
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(x - 3, y - textHeight, textWidth + 6, textHeight + 6);
    }
    
    // Draw text
    this.ctx.fillStyle = color || BRAND_COLORS.NAVY;
    this.ctx.fillText(text || '', x, y);
  }
  
  /**
   * Render a highlight annotation
   */
  private renderHighlightAnnotation(annotation: Annotation) {
    if (!this.ctx) return;
    
    const { x, y, width, height, color } = annotation;
    
    // Draw highlight rectangle
    this.ctx.fillStyle = color || `${BRAND_COLORS.ORANGE}80`;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(
      x, 
      y - (height || 10) / 2, 
      width || 100, 
      height || 20
    );
    this.ctx.globalAlpha = 1.0;
  }
  
  /**
   * Render a signature annotation
   */
  private renderSignatureAnnotation(annotation: Annotation) {
    if (!this.ctx) return;
    
    const { x, y, text, color, fontFamily } = annotation;
    
    // Set signature style
    this.ctx.font = `22px ${fontFamily || 'Dancing Script, cursive'}`;
    this.ctx.fillStyle = color || BRAND_COLORS.NAVY;
    
    // Draw signature text
    this.ctx.fillText(text || '', x, y);
  }
  
  /**
   * Setup event listeners for annotation interactions
   */
  private setupEventListeners() {
    if (!this.canvas) return;
    
    // Add mouse/touch event listeners here if needed
  }
  
  /**
   * Handle interactions to add new annotations based on mode
   */
  handleInteraction(mode: AnnotationMode, event: MouseEvent | TouchEvent) {
    if (!this.canvas || !mode) return;
    
    // Calculate position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    let x, y;
    
    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      return;
    }
    
    // Based on mode, create the appropriate annotation
    if (mode === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        this.addAnnotation('text', x, y, text);
      }
    } else if (mode === 'signature') {
      const signature = prompt('Enter your signature:');
      if (signature) {
        this.addAnnotation('signature', x, y, signature);
      }
    } else if (mode === 'highlight') {
      this.addAnnotation('highlight', x, y);
    }
  }
}

// Export a singleton instance
export const annotationManager = new CustomAnnotationManager();