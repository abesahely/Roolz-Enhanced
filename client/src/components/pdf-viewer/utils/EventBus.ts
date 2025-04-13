/**
 * PDF.js EventBus Utility
 * 
 * This module provides a centralized event bus for PDF.js events,
 * which is critical for proper annotation functionality.
 */

// Create a simple event bus for PDF.js events
class PdfEventBus {
  private events: Map<string, Array<(event: any) => void>> = new Map();

  /**
   * Register an event listener
   * 
   * @param eventName Event name to listen for
   * @param listener Event handler function
   */
  on(eventName: string, listener: (event: any) => void): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(listener);
  }

  /**
   * Remove an event listener
   * 
   * @param eventName Event name
   * @param listener Event handler function to remove
   */
  off(eventName: string, listener: (event: any) => void): void {
    const listeners = this.events.get(eventName);
    if (!listeners) return;
    
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch an event to all registered listeners
   * 
   * @param eventName Event name
   * @param data Event data
   */
  dispatch(eventName: string, data: any = {}): void {
    const listeners = this.events.get(eventName);
    if (!listeners) return;
    
    const event = {
      ...data,
      eventName
    };
    
    listeners.forEach(listener => listener(event));
  }
}

/**
 * Create a single shared event bus for PDF.js events
 * This is used by the annotation system for coordinating annotation events
 */
export const pdfEventBus = new PdfEventBus();

/**
 * Register event listener with the PDF.js event bus
 * 
 * @param eventName Event name to listen for
 * @param listener Event handler function
 */
export function registerPdfEventListener(
  eventName: string, 
  listener: (event: any) => void
): void {
  pdfEventBus.on(eventName, listener);
}

/**
 * Remove event listener from the PDF.js event bus
 * 
 * @param eventName Event name to stop listening for
 * @param listener Event handler function to remove
 */
export function unregisterPdfEventListener(
  eventName: string, 
  listener: (event: any) => void
): void {
  pdfEventBus.off(eventName, listener);
}

/**
 * Dispatch an event to the PDF.js event bus
 * 
 * @param eventName Event name to dispatch
 * @param data Event data payload
 */
export function dispatchPdfEvent(eventName: string, data: any = null): void {
  pdfEventBus.dispatch(eventName, {
    source: 'pdf-viewer',
    ...(data || {})
  });
}