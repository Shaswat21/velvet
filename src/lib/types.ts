export type ToolType = "select" | "hand" | "draw-rect";

export interface BaseObject {
  id: string;
  type: "text" | "rect" | "image" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

export interface RectObject extends BaseObject {
  type: "rect";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface ImageObject extends BaseObject {
  type: "image";
  src: string;
  borderRadius: number;
  opacity: number;
  strokeColor: string;
  strokeWidth: number;
}

export interface GroupObject extends BaseObject {
  type: "group";
  objects: CanvasObject[];
  originalWidth: number;
  originalHeight: number;
}

export type CanvasObject = TextObject | RectObject | ImageObject | GroupObject;