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
  snapThreshold: number = 5
): SnappingResult => {
  const wObj = draggedObj.width;
  const hObj = draggedObj.height;

  // Create a temporary object to calculate the NEW bounding box
  const tempObj = { ...draggedObj, x: newX, y: newY };
  const bounds = getRotatedBoundingBox(tempObj);

  const dEdges = {
    left: bounds.minX,
    midX: newX + wObj / 2,
    right: bounds.maxX,
    top: bounds.minY,
    midY: newY + hObj / 2,
    bottom: bounds.maxY,
  };

  // --- UPDATE: Change 50px fixed margin to 5% of smaller side ---
  const MARGIN_5_PCT = Math.min(canvasWidth, canvasHeight) * 0.05;

  // --- EXISTING: 10% based on the SMALLER side ---
  const MARGIN_10_PCT = Math.min(canvasWidth, canvasHeight) * 0.1;

  const activeGuides: GuideLine[] = [];
  let minSnapDistX = snapThreshold;
  let minSnapDistY = snapThreshold;
  let snapDx = 0;
  let snapDy = 0;

  const checkAlign = (
    val1: number,
    val2: number,
    isCenter: boolean,
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

  // --- 1. MARGIN SNAPS (5% of Smaller Side) ---
  const isNearMargin5Left =
    Math.abs(dEdges.left - MARGIN_5_PCT) < snapThreshold;
  const isNearMargin5Top = Math.abs(dEdges.top - MARGIN_5_PCT) < snapThreshold;
  const isNearMargin5Right =
    Math.abs(dEdges.right - (canvasWidth - MARGIN_5_PCT)) < snapThreshold;
  const isNearMargin5Bottom =
    Math.abs(dEdges.bottom - (canvasHeight - MARGIN_5_PCT)) < snapThreshold;

  if (
    isNearMargin5Left ||
    isNearMargin5Top ||
    isNearMargin5Right ||
    isNearMargin5Bottom
  ) {
    activeGuides.push(
      {
        type: "vertical",
        x: MARGIN_5_PCT,
        y: MARGIN_5_PCT,
        length: canvasHeight - MARGIN_5_PCT * 2,
        isCenter: false,
      },
      {
        type: "vertical",
        x: canvasWidth - MARGIN_5_PCT,
        y: MARGIN_5_PCT,
        length: canvasHeight - MARGIN_5_PCT * 2,
        isCenter: false,
      },
      {
        type: "horizontal",
        x: MARGIN_5_PCT,
        y: MARGIN_5_PCT,
        length: canvasWidth - MARGIN_5_PCT * 2,
        isCenter: false,
      },
      {
        type: "horizontal",
        x: MARGIN_5_PCT,
        y: canvasHeight - MARGIN_5_PCT,
        length: canvasWidth - MARGIN_5_PCT * 2,
        isCenter: false,
      }
    );
    if (isNearMargin5Left) {
      snapDx = MARGIN_5_PCT - dEdges.left;
      minSnapDistX = Math.abs(dEdges.left - MARGIN_5_PCT);
    }
    if (isNearMargin5Right) {
      snapDx = canvasWidth - MARGIN_5_PCT - dEdges.right;
      minSnapDistX = Math.abs(dEdges.right - (canvasWidth - MARGIN_5_PCT));
    }
    if (isNearMargin5Top) {
      snapDy = MARGIN_5_PCT - dEdges.top;
      minSnapDistY = Math.abs(dEdges.top - MARGIN_5_PCT);
    }
    if (isNearMargin5Bottom) {
      snapDy = canvasHeight - MARGIN_5_PCT - dEdges.bottom;
      minSnapDistY = Math.abs(dEdges.bottom - (canvasHeight - MARGIN_5_PCT));
    }
  }

  // --- 2. MARGIN SNAPS (10% of Smaller Side) ---
  const isNear10Left = Math.abs(dEdges.left - MARGIN_10_PCT) < snapThreshold;
  const isNear10Right =
    Math.abs(dEdges.right - (canvasWidth - MARGIN_10_PCT)) < snapThreshold;
  const isNear10Top = Math.abs(dEdges.top - MARGIN_10_PCT) < snapThreshold;
  const isNear10Bottom =
    Math.abs(dEdges.bottom - (canvasHeight - MARGIN_10_PCT)) < snapThreshold;

  if (isNear10Left || isNear10Right || isNear10Top || isNear10Bottom) {
    activeGuides.push(
      {
        type: "vertical",
        x: MARGIN_10_PCT,
        y: MARGIN_10_PCT,
        length: canvasHeight - MARGIN_10_PCT * 2,
        isCenter: false,
      },
      {
        type: "vertical",
        x: canvasWidth - MARGIN_10_PCT,
        y: MARGIN_10_PCT,
        length: canvasHeight - MARGIN_10_PCT * 2,
        isCenter: false,
      },
      {
        type: "horizontal",
        x: MARGIN_10_PCT,
        y: MARGIN_10_PCT,
        length: canvasWidth - MARGIN_10_PCT * 2,
        isCenter: false,
      },
      {
        type: "horizontal",
        x: MARGIN_10_PCT,
        y: canvasHeight - MARGIN_10_PCT,
        length: canvasWidth - MARGIN_10_PCT * 2,
        isCenter: false,
      }
    );

    if (isNear10Left) {
      const dist = Math.abs(dEdges.left - MARGIN_10_PCT);
      if (dist < minSnapDistX) {
        snapDx = MARGIN_10_PCT - dEdges.left;
        minSnapDistX = dist;
      }
    }
    if (isNear10Right) {
      const dist = Math.abs(dEdges.right - (canvasWidth - MARGIN_10_PCT));
      if (dist < minSnapDistX) {
        snapDx = canvasWidth - MARGIN_10_PCT - dEdges.right;
        minSnapDistX = dist;
      }
    }
    if (isNear10Top) {
      const dist = Math.abs(dEdges.top - MARGIN_10_PCT);
      if (dist < minSnapDistY) {
        snapDy = MARGIN_10_PCT - dEdges.top;
        minSnapDistY = dist;
      }
    }
    if (isNear10Bottom) {
      const dist = Math.abs(dEdges.bottom - (canvasHeight - MARGIN_10_PCT));
      if (dist < minSnapDistY) {
        snapDy = canvasHeight - MARGIN_10_PCT - dEdges.bottom;
        minSnapDistY = dist;
      }
    }
  }

  // --- 3. CANVAS CENTER & EDGES ---
  const canvasMidX = canvasWidth / 2;
  const canvasMidY = canvasHeight / 2;

  const pageVerticalTargets = [
    { val: 0, type: "left" },
    { val: canvasWidth, type: "right" },
    { val: canvasMidX, type: "center" },
  ];

  pageVerticalTargets.forEach((target) => {
    if (
      checkAlign(
        dEdges.left,
        target.val,
        target.type === "center",
        "vertical"
      ) ||
      checkAlign(
        dEdges.right,
        target.val,
        target.type === "center",
        "vertical"
      ) ||
      checkAlign(dEdges.midX, target.val, target.type === "center", "vertical")
    ) {
      activeGuides.push({
        type: "vertical",
        x: target.val,
        y: 0,
        length: canvasHeight,
        isCenter: target.type === "center",
      });
    }
  });

  const pageHorizontalTargets = [
    { val: 0, type: "top" },
    { val: canvasHeight, type: "bottom" },
    { val: canvasMidY, type: "center" },
  ];

  pageHorizontalTargets.forEach((target) => {
    if (
      checkAlign(
        dEdges.top,
        target.val,
        target.type === "center",
        "horizontal"
      ) ||
      checkAlign(
        dEdges.bottom,
        target.val,
        target.type === "center",
        "horizontal"
      ) ||
      checkAlign(
        dEdges.midY,
        target.val,
        target.type === "center",
        "horizontal"
      )
    ) {
      activeGuides.push({
        type: "horizontal",
        x: 0,
        y: target.val,
        length: canvasWidth,
        isCenter: target.type === "center",
      });
    }
  });

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

    const xComparisons = [
      { dVal: dEdges.left, oVal: oEdges.left, isCenter: false },
      { dVal: dEdges.left, oVal: oEdges.right, isCenter: false },
      { dVal: dEdges.right, oVal: oEdges.left, isCenter: false },
      { dVal: dEdges.right, oVal: oEdges.right, isCenter: false },
      { dVal: dEdges.midX, oVal: oEdges.midX, isCenter: true },
    ];

    xComparisons.forEach((comp) => {
      if (checkAlign(comp.dVal, comp.oVal, comp.isCenter, "vertical")) {
        const startYGuide = Math.min(dEdges.top, oEdges.top);
        const endYGuide = Math.max(dEdges.bottom, oEdges.bottom);
        activeGuides.push({
          type: "vertical",
          x: comp.oVal,
          y: startYGuide,
          length: endYGuide - startYGuide,
          isCenter: comp.isCenter,
        });
      }
    });

    const yComparisons = [
      { dVal: dEdges.top, oVal: oEdges.top, isCenter: false },
      { dVal: dEdges.top, oVal: oEdges.bottom, isCenter: false },
      { dVal: dEdges.bottom, oVal: oEdges.top, isCenter: false },
      { dVal: dEdges.bottom, oVal: oEdges.bottom, isCenter: false },
      { dVal: dEdges.midY, oVal: oEdges.midY, isCenter: true },
    ];

    yComparisons.forEach((comp) => {
      if (checkAlign(comp.dVal, comp.oVal, comp.isCenter, "horizontal")) {
        const startXGuide = Math.min(dEdges.left, oEdges.left);
        const endXGuide = Math.max(dEdges.right, oEdges.right);
        activeGuides.push({
          type: "horizontal",
          x: startXGuide,
          y: comp.oVal,
          length: endXGuide - startXGuide,
          isCenter: comp.isCenter,
        });
      }
    });
  });

  return { snapDx, snapDy, activeGuides };
};
