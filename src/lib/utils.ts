import { type CanvasObject } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert degrees to radians
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Rotate a point (x, y) around a center (cx, cy) by an angle in degrees
export const rotatePoint = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number
) => {
  const rad = toRad(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
};

// Get the absolute bounding box of a rotated object
// This returns the minX, minY, maxX, maxY that fully encloses the rotated item
export const getRotatedBoundingBox = (obj: CanvasObject) => {
  const { x, y, width, height, rotation } = obj;

  if (rotation === 0) {
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
  }

  const cx = x + width / 2;
  const cy = y + height / 2;

  // The 4 unrotated corners
  const p1 = rotatePoint(x, y, cx, cy, rotation); // Top-Left
  const p2 = rotatePoint(x + width, y, cx, cy, rotation); // Top-Right
  const p3 = rotatePoint(x + width, y + height, cx, cy, rotation); // Bottom-Right
  const p4 = rotatePoint(x, y + height, cx, cy, rotation); // Bottom-Left

  const xs = [p1.x, p2.x, p3.x, p4.x];
  const ys = [p1.y, p2.y, p3.y, p4.y];

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};
