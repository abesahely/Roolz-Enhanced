/**
 * Device Detection Utilities
 * 
 * This file contains helper functions for detecting device capabilities and types.
 */
import { BREAKPOINTS } from './constants';

/**
 * Check if the current device is mobile based on screen width
 * 
 * @returns True if the device is mobile
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth < BREAKPOINTS.MOBILE;
};

/**
 * Check if the current device is a tablet based on screen width
 * 
 * @returns True if the device is a tablet
 */
export const isTabletDevice = (): boolean => {
  return window.innerWidth >= BREAKPOINTS.MOBILE && window.innerWidth < BREAKPOINTS.TABLET;
};

/**
 * Check if the current device is a desktop based on screen width
 * 
 * @returns True if the device is a desktop
 */
export const isDesktopDevice = (): boolean => {
  return window.innerWidth >= BREAKPOINTS.TABLET;
};

/**
 * Check if the device supports touch events
 * 
 * @returns True if touch is supported
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get device orientation
 * 
 * @returns 'portrait' or 'landscape'
 */
export const getDeviceOrientation = (): 'portrait' | 'landscape' => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * Check if the browser is Safari
 * 
 * @returns True if the browser is Safari
 */
export const isSafariBrowser = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Check if high-density display (Retina or similar)
 * 
 * @returns True if the display is high-density
 */
export const isHighDensityDisplay = (): boolean => {
  return window.devicePixelRatio > 1;
};

/**
 * Get device pixel ratio for canvas rendering
 * 
 * @returns The device pixel ratio or 1 if not available
 */
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};