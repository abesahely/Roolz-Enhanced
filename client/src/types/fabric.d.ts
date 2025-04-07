/**
 * Type declarations for fabric.js
 */
declare module 'fabric' {
  const fabric: {
    Canvas: typeof Canvas;
    Textbox: typeof Textbox;
    Rect: typeof Rect;
    Text: typeof Text;
    Group: typeof Group;
  };
  export = fabric;
  export class Canvas {
    constructor(
      element: string | HTMLCanvasElement,
      options?: {
        width?: number;
        height?: number;
        backgroundColor?: string;
        [key: string]: any;
      }
    );
    add(...objects: any[]): Canvas;
    remove(...objects: any[]): Canvas;
    renderAll(): Canvas;
    setActiveObject(object: any): Canvas;
    getActiveObject(): any;
    getObjects(): any[];
    clear(): Canvas;
    dispose(): void;
    getWidth(): number;
    getHeight(): number;
    setWidth(value: number): Canvas;
    setHeight(value: number): Canvas;
    getZoom(): number;
    setZoom(value: number): Canvas;
    getPointer(e: Event): { x: number; y: number };
  }

  export class Textbox {
    constructor(
      text: string,
      options?: {
        left?: number;
        top?: number;
        width?: number;
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
        fontStyle?: string;
        fill?: string;
        backgroundColor?: string;
        editable?: boolean;
        borderColor?: string;
        cornerColor?: string;
        hasControls?: boolean;
        hasBorders?: boolean;
        lockScalingFlip?: boolean;
        lockUniScaling?: boolean;
        [key: string]: any;
      }
    );
    set(options: any): Textbox;
    get(property: string): any;
  }

  export class Rect {
    constructor(
      options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        opacity?: number;
        selectable?: boolean;
        checked?: boolean;
        [key: string]: any;
      }
    );
    set(options: any): Rect;
    get(property: string): any;
  }

  export class Text {
    constructor(
      text: string,
      options?: {
        left?: number;
        top?: number;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        opacity?: number;
        selectable?: boolean;
        [key: string]: any;
      }
    );
    set(options: any): Text;
    get(property: string): any;
  }

  export class Group {
    constructor(
      objects: any[],
      options?: {
        left?: number;
        top?: number;
        selectable?: boolean;
        hasControls?: boolean;
        hasBorders?: boolean;
        [key: string]: any;
      }
    );
    on(event: string, callback: (e: any) => void): Group;
    getLocalPointer(pointer: { x: number; y: number }): { x: number; y: number };
    set(options: any): Group;
    get(property: string): any;
  }
}