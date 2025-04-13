/**
 * PDF.js EventBus Utility
 * 
 * This module provides a complete implementation of the PDF.js EventBus pattern
 * for communication between PDF.js components, which is critical for proper
 * annotation functionality.
 */

// Define specific types for clarity and type safety
export type EventListener = (event: any) => void;
export type EventListenerOptions = { once: boolean };
export type EventListenerEntry = [EventListener, EventListenerOptions];

/**
 * Complete EventBus class that exactly follows PDF.js's implementation pattern
 */
export class EventBus {
  /**
   * Map of event names to arrays of callbacks
   * Using Object.create(null) to match PDF.js implementation structure
   */
  private _listeners: { [eventName: string]: EventListenerEntry[] };
  
  /**
   * Flag to detect if the EventBus is being destroyed
   * to avoid callbacks during cleanup
   */
  private _isActive: boolean;

  constructor() {
    this._listeners = Object.create(null);
    this._isActive = true;
  }

  /**
   * Register an event listener
   * 
   * @param eventName Event name to listen for
   * @param listener Event handler function
   * @param options Options for the event listener (e.g., { once: true })
   */
  on(eventName: string, listener: EventListener, options: EventListenerOptions = { once: false }): void {
    if (!this._isActive) {
      console.warn('EventBus has been destroyed, ignoring event registration');
      return;
    }
    
    let eventListeners = this._listeners[eventName];
    if (!eventListeners) {
      this._listeners[eventName] = eventListeners = [];
    }
    
    // Don't register the same callback twice
    for (const entry of eventListeners) {
      if (entry[0] === listener) {
        // Update options if the callback is already registered
        entry[1] = options;
        return;
      }
    }
    
    // Add the new listener
    eventListeners.push([listener, options]);
  }

  /**
   * Remove an event listener
   * 
   * @param eventName Event name
   * @param listener Event handler function to remove
   */
  off(eventName: string, listener: EventListener): void {
    if (!this._isActive) {
      return;
    }
    
    const eventListeners = this._listeners[eventName];
    if (!eventListeners) {
      return;
    }
    
    for (let i = 0; i < eventListeners.length; i++) {
      if (eventListeners[i][0] === listener) {
        eventListeners.splice(i, 1);
        // Don't break here - remove all instances of this callback
        i--;
      }
    }
    
    // Clean up empty arrays
    if (eventListeners.length === 0) {
      delete this._listeners[eventName];
    }
  }

  /**
   * Dispatch an event to all registered listeners
   * 
   * @param eventName Event name to dispatch
   * @param data Event data payload
   */
  dispatch(eventName: string, data: any = {}): void {
    if (!this._isActive) {
      return;
    }
    
    // Ensure eventName is included in the event object
    data = {
      ...data,
      eventName
    };
    
    // Ensure source is set for event tracing
    if (typeof data === 'object' && !data.source) {
      data.source = this;
    }
    
    const eventListeners = this._listeners[eventName];
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }
    
    // Create a copy of the listeners array to avoid modification issues during iteration
    const listeners = eventListeners.slice(0);
    
    // Track which listeners need to be removed (if once: true)
    const oneTimeListeners: EventListener[] = [];
    
    // Call each listener
    for (const [listener, options] of listeners) {
      if (!this._isActive) {
        break;
      }
      
      try {
        listener(data);
      } catch (error) {
        console.error(`Error dispatching event ${eventName}:`, error);
      }
      
      // Track listeners that should only be called once
      if (options.once) {
        oneTimeListeners.push(listener);
      }
    }
    
    // Remove one-time listeners after dispatching
    if (oneTimeListeners.length > 0 && eventListeners.length > 0) {
      for (const listener of oneTimeListeners) {
        this.off(eventName, listener);
      }
    }
  }

  /**
   * Register an event listener that will be called only once
   * 
   * @param eventName Event name to listen for
   * @param listener Event handler function
   */
  once(eventName: string, listener: EventListener): void {
    this.on(eventName, listener, { once: true });
  }

  /**
   * Remove all event listeners for a specific event or all events
   * 
   * @param eventName Optional event name to remove all listeners for
   */
  removeAllListeners(eventName?: string): void {
    if (!this._isActive) {
      return;
    }
    
    if (eventName) {
      delete this._listeners[eventName];
    } else {
      this._listeners = Object.create(null);
    }
  }

  /**
   * Destroy the EventBus, removing all listeners and preventing future registrations
   */
  destroy(): void {
    this._isActive = false;
    this._listeners = Object.create(null);
  }
}

/**
 * Create a single shared event bus for PDF.js events
 * This is used by the annotation system for coordinating events
 */
export const pdfEventBus = new EventBus();

/**
 * Register event listener with the PDF.js event bus
 * 
 * @param eventName Event name to listen for
 * @param listener Event handler function
 * @param once Whether the listener should be called only once
 */
export function registerPdfEventListener(
  eventName: string, 
  listener: EventListener,
  once: boolean = false
): void {
  pdfEventBus.on(eventName, listener, { once });
}

/**
 * Remove event listener from the PDF.js event bus
 * 
 * @param eventName Event name to stop listening for
 * @param listener Event handler function to remove
 */
export function unregisterPdfEventListener(
  eventName: string, 
  listener: EventListener
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