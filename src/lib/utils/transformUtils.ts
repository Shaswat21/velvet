import type { CanvasObject } from "@/lib/types";

/**
 * Calculates the new angle after rotation.
 */
export const calculateRotation = (
  e: React.MouseEvent,
  cx: number,
  cy: number,
  startAngle: number,
  initialRotation: number
) => {
  const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
  return (initialRotation + angleDiff + 360) % 360;
};

/**
 * Helper: Rotate a point (x,y) around origin (0,0) by angle (degrees)
 */
const rotateVector = (x: number, y: number, angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
};

/**
 * Calculates new dimensions and position for resizing.
 * Handles Standard Resize, Rotation-Aware Resize, and Stationary Crop (with Scale Compensation).
 */
export const calculateResize = (
  obj: CanvasObject,
  mouseX: number,
  mouseY: number,
  resizingTarget: any,
  zoom: number
) => {
  const {
    startX,
    startY,
    startW,
    startH,
    startXPos,
    startYPos,
    direction,
    lockAspectRatio,
    startFontSize,
    isCrop,
    metaData,
    startImgX,
    startImgY,
  } = resizingTarget;

  // 1. Calculate World Delta
  const dxWorld = (mouseX - startX) / zoom;
  const dyWorld = (mouseY - startY) / zoom;

  // 2. Rotate World Delta to Local Delta
  const localDelta = rotateVector(dxWorld, dyWorld, -obj.rotation);
  let dxLocal = localDelta.x;
  let dyLocal = localDelta.y;

  // =========================================================
  // CASE A: CROP CONSTRAINTS (Prevent White Space)
  // =========================================================
  if (isCrop && obj.type === "image" && metaData) {
    const baseW = metaData.width || startW;
    const baseH = metaData.height || startH;

    const imgCenterLocalX = startImgX * baseW;
    const imgCenterLocalY = startImgY * baseH;

    const imgLeft = imgCenterLocalX - baseW / 2;
    const imgRight = imgCenterLocalX + baseW / 2;
    const imgTop = imgCenterLocalY - baseH / 2;
    const imgBottom = imgCenterLocalY + baseH / 2;

    const wrapLeft = -startW / 2;
    const wrapRight = startW / 2;
    const wrapTop = -startH / 2;
    const wrapBottom = startH / 2;

    if (direction.includes("w")) {
      if (wrapLeft + dxLocal < imgLeft) dxLocal = imgLeft - wrapLeft;
    }
    if (direction.includes("e")) {
      if (wrapRight + dxLocal > imgRight) dxLocal = imgRight - wrapRight;
    }
    if (direction.includes("n")) {
      if (wrapTop + dyLocal < imgTop) dyLocal = imgTop - wrapTop;
    }
    if (direction.includes("s")) {
      if (wrapBottom + dyLocal > imgBottom) dyLocal = imgBottom - wrapBottom;
    }
  }

  // =========================================================
  // CALCULATE NEW DIMENSIONS
  // =========================================================
  let newWidth = startW;
  let newHeight = startH;

  if (direction.includes("e")) newWidth = Math.max(10, startW + dxLocal);
  else if (direction.includes("w")) newWidth = Math.max(10, startW - dxLocal);

  if (direction.includes("s")) newHeight = Math.max(10, startH + dyLocal);
  else if (direction.includes("n")) newHeight = Math.max(10, startH - dyLocal);

  // Aspect Ratio Lock (Standard Only)
  if (lockAspectRatio && !isCrop) {
    const ratio = startW / startH;
    if (direction.length === 2) {
      if (direction.includes("w") || direction.includes("e"))
        newHeight = newWidth / ratio;
      else newWidth = newHeight * ratio;
    } else if (direction === "e" || direction === "w") {
      newHeight = newWidth / ratio;
    } else if (direction === "n" || direction === "s") {
      newWidth = newHeight * ratio;
    }
  }

  // =========================================================
  // CALCULATE CENTER SHIFT (Local -> World)
  // =========================================================
  const wDiff = newWidth - startW;
  const hDiff = newHeight - startH;

  let shiftXLocal = 0;
  let shiftYLocal = 0;

  if (direction.includes("e")) shiftXLocal = wDiff / 2;
  else if (direction.includes("w")) shiftXLocal = -wDiff / 2;
  if (direction.includes("s")) shiftYLocal = hDiff / 2;
  else if (direction.includes("n")) shiftYLocal = -hDiff / 2;

  const shiftWorld = rotateVector(shiftXLocal, shiftYLocal, obj.rotation);

  const oldCenterX = startXPos + startW / 2;
  const oldCenterY = startYPos + startH / 2;
  const newCenterX = oldCenterX + shiftWorld.x;
  const newCenterY = oldCenterY + shiftWorld.y;

  const finalX = newCenterX - newWidth / 2;
  const finalY = newCenterY - newHeight / 2;

  // =========================================================
  // CASE A: STATIONARY CROP + SCALE COMPENSATION
  // =========================================================
  if (isCrop && obj.type === "image" && metaData) {
    const startAbsW = metaData.width || startW;
    const startAbsH = metaData.height || startH;

    // 1. Maintain Position (Offset Logic)
    const startImgOffsetLocalX = startImgX * startAbsW;
    const startImgOffsetLocalY = startImgY * startAbsH;
    const startImgOffsetWorld = rotateVector(
      startImgOffsetLocalX,
      startImgOffsetLocalY,
      obj.rotation
    );

    const fixedImageWorldCx = oldCenterX + startImgOffsetWorld.x;
    const fixedImageWorldCy = oldCenterY + startImgOffsetWorld.y;

    const vectorToImageWorldX = fixedImageWorldCx - newCenterX;
    const vectorToImageWorldY = fixedImageWorldCy - newCenterY;
    const vectorToImageLocal = rotateVector(
      vectorToImageWorldX,
      vectorToImageWorldY,
      -obj.rotation
    );

    const newImgX = vectorToImageLocal.x / startAbsW;
    const newImgY = vectorToImageLocal.y / startAbsH;

    // 2. Maintain Scale (Zoom Fix)
    // We calculate what the "Cover" logic would produce for the new wrapper size
    const naturalRatio = startAbsW / startAbsH;
    const newContainerRatio = newWidth / newHeight;

    let newBaseW_Cover; // The width the image WOULD be if scale was 1

    if (newContainerRatio > naturalRatio) {
      // Container wider: Cover width = Container width
      newBaseW_Cover = newWidth;
    } else {
      // Container taller: Cover width = Container Height * Aspect
      newBaseW_Cover = newHeight * naturalRatio;
    }

    // We want the Final Width to remain 'startAbsW'
    // startAbsW = newBaseW_Cover * newScale
    // newScale = startAbsW / newBaseW_Cover
    const newScale = startAbsW / newBaseW_Cover;

    return {
      x: finalX,
      y: finalY,
      width: newWidth,
      height: newHeight,
      imageX: newImgX,
      imageY: newImgY,
      imageScale: newScale, // Compensates for CSS 'cover' resizing
    };
  }

  // =========================================================
  // CASE B: STANDARD UPDATE
  // =========================================================
  let extraUpdates = {};
  if (obj.type === "text" && direction.length === 2) {
    const scale = newWidth / startW;
    newHeight = startH * scale;
    if (startFontSize) {
      extraUpdates = { fontSize: Math.max(1, startFontSize * scale) };
    }
  }

  return {
    x: finalX,
    y: finalY,
    width: newWidth,
    height: newHeight,
    ...extraUpdates,
  };
};
