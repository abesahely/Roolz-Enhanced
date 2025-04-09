/**
 * Annotation Helper Utilities
 * 
 * This file contains helper functions for working with PDF annotations.
 */
import { fabric } from 'fabric';
import { Annotation } from '../context/AnnotationContext';
import { ANNOTATION, BRAND_COLORS, FONTS } from './constants';

/**
 * Create a text annotation object for fabric.js
 * 
 * @param text The text content
 * @param x X position
 * @param y Y position
 * @param fontSize Font size in pixels
 * @param fontFamily Font family name
 * @returns A fabric.js Textbox object
 */
export const createTextAnnotation = (
  text: string,
  x: number,
  y: number,
  fontSize: number = ANNOTATION.DEFAULT_FONT_SIZE,
  fontFamily: string = ANNOTATION.DEFAULT_FONT
): fabric.Textbox => {
  return new fabric.Textbox(text, {
    left: x,
    top: y,
    fontSize,
    fontFamily,
    fill: BRAND_COLORS.NAVY_BLUE,
    backgroundColor: ANNOTATION.BACKGROUND_COLOR,
    width: 200,
    padding: 10,
    borderColor: ANNOTATION.BORDER_COLOR,
    cornerColor: ANNOTATION.BORDER_COLOR,
    cornerSize: 8,
    transparentCorners: false,
    hasControls: true,
    hasBorders: true,
    lockScalingFlip: true,
    lockUniScaling: true
  });
};

/**
 * Create a signature annotation object for fabric.js
 * 
 * @param signature The signature text
 * @param x X position
 * @param y Y position
 * @returns A fabric.js Text object
 */
export const createSignatureAnnotation = (
  signature: string,
  x: number,
  y: number
): fabric.Text => {
  return new fabric.Text(signature, {
    left: x,
    top: y,
    fontSize: 32,
    fontFamily: FONTS.SIGNATURE,
    fill: BRAND_COLORS.NAVY_BLUE,
    backgroundColor: ANNOTATION.BACKGROUND_COLOR,
    padding: 10,
    borderColor: ANNOTATION.BORDER_COLOR,
    cornerColor: ANNOTATION.BORDER_COLOR,
    cornerSize: 8,
    transparentCorners: false,
    hasControls: true,
    hasBorders: true
  });
};

/**
 * Create a checkbox annotation object for fabric.js
 * 
 * @param x X position
 * @param y Y position
 * @param checked Whether the checkbox is checked
 * @returns A fabric.js Group object
 */
export const createCheckboxAnnotation = (
  x: number,
  y: number,
  checked: boolean = false
): fabric.Group => {
  // Create checkbox container (rounded rectangle)
  const boxSize = ANNOTATION.CHECKBOX_SIZE;
  const box = new fabric.Rect({
    width: boxSize,
    height: boxSize,
    fill: ANNOTATION.BACKGROUND_COLOR,
    stroke: ANNOTATION.BORDER_COLOR,
    strokeWidth: 1,
    rx: 2,
    ry: 2,
    left: -boxSize/2,
    top: -boxSize/2
  });
  
  // Create checkmark if checked
  let checkmark;
  if (checked) {
    checkmark = new fabric.Path('M-7,-2 L-3,5 L7,-7', {
      stroke: BRAND_COLORS.ORANGE,
      strokeWidth: 2,
      fill: '',
      left: -boxSize/2,
      top: -boxSize/2,
      scaleX: boxSize / 20,
      scaleY: boxSize / 20
    });
  }
  
  // Create the group
  const elements = checkmark ? [box, checkmark] : [box];
  const group = new fabric.Group(elements, {
    left: x,
    top: y,
    borderColor: ANNOTATION.BORDER_COLOR,
    cornerColor: ANNOTATION.BORDER_COLOR,
    cornerSize: 8,
    transparentCorners: false,
    hasControls: true,
    hasBorders: true,
    checked: checked // Custom property
  });
  
  return group;
};

/**
 * Toggle checkbox state in a checkbox annotation
 * 
 * @param checkbox The checkbox group object
 * @returns Updated checkbox group
 */
export const toggleCheckbox = (checkbox: fabric.Group): fabric.Group => {
  const isChecked = !((checkbox as any).checked);
  
  // Update checked state
  (checkbox as any).checked = isChecked;
  
  // Remove all objects
  checkbox.getObjects().forEach(obj => {
    checkbox.remove(obj);
  });
  
  // Add the box
  const boxSize = ANNOTATION.CHECKBOX_SIZE;
  const box = new fabric.Rect({
    width: boxSize,
    height: boxSize,
    fill: ANNOTATION.BACKGROUND_COLOR,
    stroke: ANNOTATION.BORDER_COLOR,
    strokeWidth: 1,
    rx: 2,
    ry: 2,
    left: -boxSize/2,
    top: -boxSize/2
  });
  checkbox.add(box);
  
  // Add checkmark if checked
  if (isChecked) {
    const checkmark = new fabric.Path('M-7,-2 L-3,5 L7,-7', {
      stroke: BRAND_COLORS.ORANGE,
      strokeWidth: 2,
      fill: '',
      left: -boxSize/2,
      top: -boxSize/2,
      scaleX: boxSize / 20,
      scaleY: boxSize / 20
    });
    checkbox.add(checkmark);
  }
  
  return checkbox;
};

/**
 * Convert annotation objects to fabric.js objects
 * 
 * @param annotations Array of annotation objects
 * @param page Current page number
 * @returns Array of fabric.js objects
 */
export const annotationsToFabricObjects = (
  annotations: Annotation[],
  page: number
): any[] => {
  // Filter annotations for the current page
  const pageAnnotations = annotations.filter(anno => anno.page === page);
  
  // Convert annotations to fabric.js objects
  return pageAnnotations.map(annotation => {
    const { type, position } = annotation;
    
    switch (type) {
      case 'text':
        return createTextAnnotation(
          annotation.text,
          position.x,
          position.y,
          annotation.fontSize,
          annotation.font
        );
        
      case 'signature':
        return createSignatureAnnotation(
          annotation.text,
          position.x,
          position.y
        );
        
      case 'checkbox':
        return createCheckboxAnnotation(
          position.x,
          position.y,
          annotation.checked
        );
        
      default:
        return null;
    }
  }).filter(obj => obj !== null);
};

/**
 * Scale annotation objects when PDF zoom changes
 * 
 * @param canvas The fabric.js canvas
 * @param oldScale Previous scale
 * @param newScale New scale
 */
export const scaleAnnotations = (
  canvas: fabric.Canvas,
  oldScale: number,
  newScale: number
): void => {
  if (!canvas) return;
  
  const scaleFactor = newScale / oldScale;
  
  canvas.getObjects().forEach(obj => {
    const scaleX = obj.scaleX || 1;
    const scaleY = obj.scaleY || 1;
    
    // Scale position
    obj.set({
      left: obj.left! * scaleFactor,
      top: obj.top! * scaleFactor,
      scaleX: scaleX * scaleFactor,
      scaleY: scaleY * scaleFactor
    });
  });
  
  canvas.renderAll();
};