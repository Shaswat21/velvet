export type ToolType = "select" | "hand" | "draw-rect";

export interface BaseObject {
  id: string;
  type: "text" | "rect" | "image" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isLocked?: boolean;
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
  isStrikethrough: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  backgroundColor: string;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing: number;
  lineHeight: number;
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
