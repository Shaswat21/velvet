import type { CanvasObject } from "@/lib/types";
import { getRotatedBoundingBox } from "@/lib/utils";

export interface GuideLine {
  type: "horizontal" | "vertical";
  x: number;
  y: number;
  length: number;
  isCenter: boolean;
}

interface SnappingResult {
  snapDx: number;
  snapDy: number;
  activeGuides: GuideLine[];
}

export const calculateSnapping = (
  draggedObj: CanvasObject,
  newX: number,
  newY: number,
  objects: CanvasObject[],
  canvasWidth: number,
  canvasHeight: number,
  selectedIds: string[],
  snapThreshold: number = 5,
  newWidth?: number,
  newHeight?: number,
  // --- NEW PARAMETER: Active Handle (e.g., "n", "se", "w") ---
  activeHandle: string | null = null
): SnappingResult => {
  const wObj = newWidth ?? draggedObj.width;
  const hObj = newHeight ?? draggedObj.height;

  // Create temporary object to calculate geometry
  const tempObj = {
    ...draggedObj,
    x: newX,
    y: newY,
    width: wObj,
    height: hObj,
  };

  const bounds = getRotatedBoundingBox(tempObj);

  const dEdges = {
    left: bounds.minX,
    midX: newX + wObj / 2,
    right: bounds.maxX,
    top: bounds.minY,
    midY: newY + hObj / 2,
    bottom: bounds.maxY,
  };

  // --- DETERMINE ACTIVE EDGES ---
  // If activeHandle is null, we are moving -> Check ALL edges.
  // If activeHandle exists, only check edges relevant to that handle.
  const isMoving = !activeHandle;

  const checkLeft = isMoving || activeHandle?.includes("w");
  const checkRight = isMoving || activeHandle?.includes("e");
  const checkTop = isMoving || activeHandle?.includes("n");
  const checkBottom = isMoving || activeHandle?.includes("s");

  // Only check centers if moving (prevents resizing jumps)
  const checkCenterX = isMoving;
  const checkCenterY = isMoving;

  // Margins
  const MARGIN_5_PCT = Math.min(canvasWidth, canvasHeight) * 0.05;
  const MARGIN_10_PCT = Math.min(canvasWidth, canvasHeight) * 0.1;

  const activeGuides: GuideLine[] = [];
  let minSnapDistX = snapThreshold;
  let minSnapDistY = snapThreshold;
  let snapDx = 0;
  let snapDy = 0;

  const checkAlign = (
    val1: number,
    val2: number,
    _isCenter: boolean,
    guideType: "vertical" | "horizontal"
  ) => {
    const dist = Math.abs(val1 - val2);
    const minSnap = guideType === "vertical" ? minSnapDistX : minSnapDistY;

    if (dist < minSnap) {
      if (guideType === "vertical") {
        minSnapDistX = dist;
        snapDx = val2 - val1;
      } else {
        minSnapDistY = dist;
        snapDy = val2 - val1;
      }
      return true;
    } else if (dist === minSnap && dist < snapThreshold) {
      return true;
    }
    return false;
  };

  // --- 1. MARGIN SNAPS ---

  // LEFT MARGINS
  if (checkLeft) {
    if (Math.abs(dEdges.left - MARGIN_5_PCT) < snapThreshold) {
      if (checkAlign(dEdges.left, MARGIN_5_PCT, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: MARGIN_5_PCT,
          y: 0,
          length: canvasHeight,
          isCenter: false,
        });
      }
    }
    if (Math.abs(dEdges.left - MARGIN_10_PCT) < snapThreshold) {
      if (checkAlign(dEdges.left, MARGIN_10_PCT, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: MARGIN_10_PCT,
          y: 0,
          length: canvasHeight,
          isCenter: false,
        });
      }
    }
  }

  // RIGHT MARGINS
  if (checkRight) {
    if (Math.abs(dEdges.right - (canvasWidth - MARGIN_5_PCT)) < snapThreshold) {
      if (
        checkAlign(dEdges.right, canvasWidth - MARGIN_5_PCT, false, "vertical")
      ) {
        activeGuides.push({
          type: "vertical",
          x: canvasWidth - MARGIN_5_PCT,
          y: 0,
          length: canvasHeight,
          isCenter: false,
        });
      }
    }
    if (
      Math.abs(dEdges.right - (canvasWidth - MARGIN_10_PCT)) < snapThreshold
    ) {
      if (
        checkAlign(dEdges.right, canvasWidth - MARGIN_10_PCT, false, "vertical")
      ) {
        activeGuides.push({
          type: "vertical",
          x: canvasWidth - MARGIN_10_PCT,
          y: 0,
          length: canvasHeight,
          isCenter: false,
        });
      }
    }
  }

  // TOP MARGINS
  if (checkTop) {
    if (Math.abs(dEdges.top - MARGIN_5_PCT) < snapThreshold) {
      if (checkAlign(dEdges.top, MARGIN_5_PCT, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: 0,
          y: MARGIN_5_PCT,
          length: canvasWidth,
          isCenter: false,
        });
      }
    }
    if (Math.abs(dEdges.top - MARGIN_10_PCT) < snapThreshold) {
      if (checkAlign(dEdges.top, MARGIN_10_PCT, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: 0,
          y: MARGIN_10_PCT,
          length: canvasWidth,
          isCenter: false,
        });
      }
    }
  }

  // BOTTOM MARGINS
  if (checkBottom) {
    if (
      Math.abs(dEdges.bottom - (canvasHeight - MARGIN_5_PCT)) < snapThreshold
    ) {
      if (
        checkAlign(
          dEdges.bottom,
          canvasHeight - MARGIN_5_PCT,
          false,
          "horizontal"
        )
      ) {
        activeGuides.push({
          type: "horizontal",
          x: 0,
          y: canvasHeight - MARGIN_5_PCT,
          length: canvasWidth,
          isCenter: false,
        });
      }
    }
    if (
      Math.abs(dEdges.bottom - (canvasHeight - MARGIN_10_PCT)) < snapThreshold
    ) {
      if (
        checkAlign(
          dEdges.bottom,
          canvasHeight - MARGIN_10_PCT,
          false,
          "horizontal"
        )
      ) {
        activeGuides.push({
          type: "horizontal",
          x: 0,
          y: canvasHeight - MARGIN_10_PCT,
          length: canvasWidth,
          isCenter: false,
        });
      }
    }
  }

  // --- 3. CANVAS CENTER & EDGES ---
  const canvasMidX = canvasWidth / 2;
  const canvasMidY = canvasHeight / 2;

  // Vertical Targets (Left, Right, Center)
  if (checkLeft && checkAlign(dEdges.left, 0, false, "vertical")) {
    activeGuides.push({
      type: "vertical",
      x: 0,
      y: 0,
      length: canvasHeight,
      isCenter: false,
    });
  }
  if (checkRight && checkAlign(dEdges.right, canvasWidth, false, "vertical")) {
    activeGuides.push({
      type: "vertical",
      x: canvasWidth,
      y: 0,
      length: canvasHeight,
      isCenter: false,
    });
  }
  if (checkCenterX && checkAlign(dEdges.midX, canvasMidX, true, "vertical")) {
    activeGuides.push({
      type: "vertical",
      x: canvasMidX,
      y: 0,
      length: canvasHeight,
      isCenter: true,
    });
  }

  // Horizontal Targets (Top, Bottom, Center)
  if (checkTop && checkAlign(dEdges.top, 0, false, "horizontal")) {
    activeGuides.push({
      type: "horizontal",
      x: 0,
      y: 0,
      length: canvasWidth,
      isCenter: false,
    });
  }
  if (
    checkBottom &&
    checkAlign(dEdges.bottom, canvasHeight, false, "horizontal")
  ) {
    activeGuides.push({
      type: "horizontal",
      x: 0,
      y: canvasHeight,
      length: canvasWidth,
      isCenter: false,
    });
  }
  if (checkCenterY && checkAlign(dEdges.midY, canvasMidY, true, "horizontal")) {
    activeGuides.push({
      type: "horizontal",
      x: 0,
      y: canvasMidY,
      length: canvasWidth,
      isCenter: true,
    });
  }

  // --- 4. OBJECT TO OBJECT ---
  objects.forEach((other) => {
    if (selectedIds.includes(other.id)) return;

    const oBounds = getRotatedBoundingBox(other);
    const oEdges = {
      left: oBounds.minX,
      midX: other.x + other.width / 2,
      right: oBounds.maxX,
      top: oBounds.minY,
      midY: other.y + other.height / 2,
      bottom: oBounds.maxY,
    };

    // VERTICAL ALIGNMENT
    // Left
    if (checkLeft) {
      if (checkAlign(dEdges.left, oEdges.left, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: oEdges.left,
          y: Math.min(dEdges.top, oEdges.top),
          length: Math.max(dEdges.bottom, oEdges.bottom),
          isCenter: false,
        });
      }
      if (checkAlign(dEdges.left, oEdges.right, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: oEdges.right,
          y: Math.min(dEdges.top, oEdges.top),
          length: Math.max(dEdges.bottom, oEdges.bottom),
          isCenter: false,
        });
      }
    }
    // Right
    if (checkRight) {
      if (checkAlign(dEdges.right, oEdges.left, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: oEdges.left,
          y: Math.min(dEdges.top, oEdges.top),
          length: Math.max(dEdges.bottom, oEdges.bottom),
          isCenter: false,
        });
      }
      if (checkAlign(dEdges.right, oEdges.right, false, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: oEdges.right,
          y: Math.min(dEdges.top, oEdges.top),
          length: Math.max(dEdges.bottom, oEdges.bottom),
          isCenter: false,
        });
      }
    }
    // Center X
    if (checkCenterX) {
      if (checkAlign(dEdges.midX, oEdges.midX, true, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: oEdges.midX,
          y: Math.min(dEdges.top, oEdges.top),
          length: Math.max(dEdges.bottom, oEdges.bottom),
          isCenter: true,
        });
      }
    }

    // HORIZONTAL ALIGNMENT
    // Top
    if (checkTop) {
      if (checkAlign(dEdges.top, oEdges.top, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: Math.min(dEdges.left, oEdges.left),
          y: oEdges.top,
          length: Math.max(dEdges.right, oEdges.right),
          isCenter: false,
        });
      }
      if (checkAlign(dEdges.top, oEdges.bottom, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: Math.min(dEdges.left, oEdges.left),
          y: oEdges.bottom,
          length: Math.max(dEdges.right, oEdges.right),
          isCenter: false,
        });
      }
    }
    // Bottom
    if (checkBottom) {
      if (checkAlign(dEdges.bottom, oEdges.top, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: Math.min(dEdges.left, oEdges.left),
          y: oEdges.top,
          length: Math.max(dEdges.right, oEdges.right),
          isCenter: false,
        });
      }
      if (checkAlign(dEdges.bottom, oEdges.bottom, false, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: Math.min(dEdges.left, oEdges.left),
          y: oEdges.bottom,
          length: Math.max(dEdges.right, oEdges.right),
          isCenter: false,
        });
      }
    }
    // Center Y
    if (checkCenterY) {
      if (checkAlign(dEdges.midY, oEdges.midY, true, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: Math.min(dEdges.left, oEdges.left),
          y: oEdges.midY,
          length: Math.max(dEdges.right, oEdges.right),
          isCenter: true,
        });
      }
    }
  });

  return { snapDx, snapDy, activeGuides };
};
