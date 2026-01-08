import type { CanvasObject } from "@/lib/types";

export const calculateResize = (
  obj: CanvasObject,
  mouseX: number,
  mouseY: number,
  resizingTarget: any,
  currentZoom: number
) => {
  const dxWorld = (mouseX - resizingTarget.startX) / currentZoom;
  const dyWorld = (mouseY - resizingTarget.startY) / currentZoom;
  const angleRad = (obj.rotation * Math.PI) / 180;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);

  // Convert delta to local coordinates relative to the object's angle
  const dxLocal = dxWorld * cos - dyWorld * sin;
  const dyLocal = dxWorld * sin + dyWorld * cos;

  const { direction, startW, startH, startXPos, startYPos, startFontSize } =
    resizingTarget;

  let newWidth = startW;
  let newHeight = startH;

  if (direction.includes("e")) newWidth = Math.max(10, startW + dxLocal);
  else if (direction.includes("w")) newWidth = Math.max(10, startW - dxLocal);

  if (direction.includes("s")) newHeight = Math.max(10, startH + dyLocal);
  else if (direction.includes("n")) newHeight = Math.max(10, startH - dyLocal);

  let fontSizeUpdate = {};
  if (obj.type === "text" && direction.length === 2) {
    const scale = newWidth / startW;
    newHeight = startH * scale;
    if (startFontSize)
      fontSizeUpdate = { fontSize: Math.max(1, startFontSize * scale) };
  }

  // Calculate shift to keep opposite corner fixed
  const wDiff = newWidth - startW;
  const hDiff = newHeight - startH;
  let centerXShiftLocal = 0;
  let centerYShiftLocal = 0;

  if (direction.includes("e")) centerXShiftLocal = wDiff / 2;
  else if (direction.includes("w")) centerXShiftLocal = -wDiff / 2;
  if (direction.includes("s")) centerYShiftLocal = hDiff / 2;
  else if (direction.includes("n")) centerYShiftLocal = -hDiff / 2;

  const cosR = Math.cos(angleRad);
  const sinR = Math.sin(angleRad);
  const centerXShiftWorld = centerXShiftLocal * cosR - centerYShiftLocal * sinR;
  const centerYShiftWorld = centerXShiftLocal * sinR + centerYShiftLocal * cosR;

  const oldCenterX = startXPos + startW / 2;
  const oldCenterY = startYPos + startH / 2;
  const newCenterX = oldCenterX + centerXShiftWorld;
  const newCenterY = oldCenterY + centerYShiftWorld;

  return {
    x: newCenterX - newWidth / 2,
    y: newCenterY - newHeight / 2,
    width: newWidth,
    height:
      obj.type !== "text" || direction.length === 2 ? newHeight : obj.height,
    ...fontSizeUpdate,
  };
};

export const calculateRotation = (
  e: React.MouseEvent,
  cx: number,
  cy: number,
  startAngle: number,
  initialRotation: number
) => {
  const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
  return initialRotation + angleDiff;
};
