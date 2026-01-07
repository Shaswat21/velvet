import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { PAPER_SIZES } from "@/lib/constants";
import type { Orientation, PaperKey } from "@/pages/Home";
import type {
  ToolType,
  CanvasObject,
  TextObject,
  RectObject,
  ImageObject,
  GroupObject,
  PathObject,
} from "@/lib/types";
import { getRotatedBoundingBox, rotatePoint } from "@/lib/utils";

export interface GuideLine {
  type: "horizontal" | "vertical";
  x: number;
  y: number;
  length: number;
  isCenter: boolean;
}

const getRelativePos = (
  e: MouseEvent | React.MouseEvent,
  canvas: HTMLElement,
  zoom: number
) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / (zoom / 100);
  const y = (e.clientY - rect.top) / (zoom / 100);
  return { x, y };
};

export const useDesignBoard = (paper: PaperKey, orientation: Orientation) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const objRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- INTERACTION REFS ---
  const isDragging = useRef(false);
  const isDrawing = useRef(false);
  const isSelecting = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);
  const prevZoom = useRef<number>(40);
  const shouldCenterZoom = useRef(false);
  const drawingStartPos = useRef<{ x: number; y: number } | null>(null);
  const selectionStartPos = useRef<{ x: number; y: number } | null>(null);

  // --- HISTORY STATE ---
  const [history, setHistory] = useState<CanvasObject[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Ref to store state before an interaction starts
  const objectsSnapshot = useRef<string>("[]");

  // --- STATE ---
  const [zoom, setZoom] = useState<number[]>([40]);
  const [tool, setTool] = useState<ToolType>("select");
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [guides, setGuides] = useState<GuideLine[]>([]);

  // Action Targets
  const [dragTarget, setDragTarget] = useState<{ id: string } | null>(null);
  const [resizingTarget, setResizingTarget] = useState<any>(null);
  const [rotatingTarget, setRotatingTarget] = useState<any>(null);

  // Temp Visuals
  const [tempRect, setTempRect] = useState<RectObject | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    []
  );

  const { w, h } = PAPER_SIZES[paper];
  const width = orientation === "portrait" ? w : h;
  const height = orientation === "portrait" ? h : w;

  /* --- HISTORY HELPERS --- */
  const saveHistory = (newObjects: CanvasObject[]) => {
    const currentHistoryStr = JSON.stringify(history[historyStep]);
    const newObjectsStr = JSON.stringify(newObjects);
    if (currentHistoryStr === newObjectsStr) return;

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newObjects);
    if (newHistory.length > 50) newHistory.shift();

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setObjects(history[prevStep]);
      setHistoryStep(prevStep);
      setSelectedIds([]);
    }
  }, [history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setObjects(history[nextStep]);
      setHistoryStep(nextStep);
      setSelectedIds([]);
    }
  }, [history, historyStep]);

  /* --- HELPERS --- */
  const getPointerPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    return getRelativePos(e, canvasRef.current, zoom[0]);
  };

  const updateObject = (
    id: string,
    updates: Partial<CanvasObject>,
    saveToHistory: boolean = false
  ) => {
    const newObjects = objects.map(
      (obj) => (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject
    );
    setObjects(newObjects);
    if (saveToHistory) {
      saveHistory(newObjects);
    }
  };

  const cloneCanvasObject = (obj: CanvasObject): CanvasObject => {
    const newId = Math.random().toString(36).substr(2, 9);
    if (obj.type === "group") {
      return {
        ...obj,
        id: newId,
        objects: obj.objects.map((child: any) => cloneCanvasObject(child)),
      };
    }
    return { ...obj, id: newId };
  };

  /* --- ACTIONS --- */
  const handleLayerSelect = (id: string, multi: boolean) => {
    if (multi)
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    else setSelectedIds([id]);
  };

  const handleStartRotation = (e: React.MouseEvent, id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (obj?.isLocked) return;
    objectsSnapshot.current = JSON.stringify(objects);
    const canvasEl = canvasRef.current;
    if (obj && canvasEl) {
      const canvasRect = canvasEl.getBoundingClientRect();
      const zoomFactor = zoom[0] / 100;
      const cx = canvasRect.left + (obj.x + obj.width / 2) * zoomFactor;
      const cy = canvasRect.top + (obj.y + obj.height / 2) * zoomFactor;
      const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      setRotatingTarget({
        id,
        cx,
        cy,
        startAngle,
        initialRotation: obj.rotation,
      });
    }
  };

  const toggleLock = (id: string) => {
    const newObjects = objects.map((obj) =>
      obj.id === id ? { ...obj, isLocked: !obj.isLocked } : obj
    );
    setObjects(newObjects);
    saveHistory(newObjects);
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const newItems: CanvasObject[] = [];
    const newSelectedIds: string[] = [];
    selectedIds.forEach((id) => {
      const original = objects.find((o) => o.id === id);
      if (original) {
        const cloned = cloneCanvasObject(original);
        cloned.x += 20;
        cloned.y += 20;
        newItems.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });
    const finalObjects = [...objects, ...newItems];
    setObjects(finalObjects);
    setSelectedIds(newSelectedIds);
    saveHistory(finalObjects);
  };

  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    const itemsToGroup = objects.filter((o) => selectedIds.includes(o.id));
    if (itemsToGroup.some((o) => o.isLocked)) return;
    if (itemsToGroup.length === 0) return;

    const flattenItem = (item: CanvasObject): CanvasObject[] => {
      if (item.type !== "group") return [item];
      const group = item as GroupObject;
      const scaleX = group.width / group.originalWidth;
      const scaleY = group.height / group.originalHeight;
      const groupCx = group.x + group.width / 2;
      return group.objects.flatMap((child: any) => {
        const newChildWidth = child.width * scaleX;
        const newChildHeight = child.height * scaleY;
        const childCxRelative = (child.x + child.width / 2) * scaleX;
        const childCyRelative = (child.y + child.height / 2) * scaleY;
        const dx = childCxRelative - group.width / 2;
        const dy = childCyRelative - group.height / 2;
        const rotatedOffset = rotatePoint(dx, dy, 0, 0, group.rotation);
        const newWorldCx = groupCx + rotatedOffset.x;
        const newWorldCy = group.y + group.height / 2 + rotatedOffset.y;
        const flattenedChild: CanvasObject = {
          ...child,
          id: Math.random().toString(36).substr(2, 9),
          x: newWorldCx - newChildWidth / 2,
          y: newWorldCy - newChildHeight / 2,
          width: newChildWidth,
          height: newChildHeight,
          rotation: (child.rotation + group.rotation) % 360,
          ...(child.type === "group"
            ? {
                originalWidth: (child as GroupObject).originalWidth * scaleX,
                originalHeight: (child as GroupObject).originalHeight * scaleY,
              }
            : {}),
        } as CanvasObject;
        return flattenItem(flattenedChild);
      });
    };

    const flatItemsToGroup = itemsToGroup.flatMap((item) => flattenItem(item));
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    flatItemsToGroup.forEach((obj) => {
      const bounds = getRotatedBoundingBox(obj);
      if (bounds.minX < minX) minX = bounds.minX;
      if (bounds.minY < minY) minY = bounds.minY;
      if (bounds.maxX > maxX) maxX = bounds.maxX;
      if (bounds.maxY > maxY) maxY = bounds.maxY;
    });

    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;
    const groupedChildren = flatItemsToGroup.map((obj) => ({
      ...obj,
      x: obj.x - minX,
      y: obj.y - minY,
    }));
    const newGroupId = Math.random().toString(36).substr(2, 9);
    const groupObj: GroupObject = {
      id: newGroupId,
      type: "group",
      x: minX,
      y: minY,
      width: groupWidth,
      height: groupHeight,
      originalWidth: groupWidth,
      originalHeight: groupHeight,
      rotation: 0,
      objects: groupedChildren,
    };
    const remainingObjects = objects.filter((o) => !selectedIds.includes(o.id));
    const finalObjects = [...remainingObjects, groupObj];
    setObjects(finalObjects);
    setSelectedIds([newGroupId]);
    saveHistory(finalObjects);
  };

  const handleUngroup = () => {
    if (selectedIds.length !== 1) return;
    const group = objects.find((o) => o.id === selectedIds[0]);
    if (!group || group.type !== "group" || group.isLocked) return;

    const scaleX = group.width / group.originalWidth;
    const scaleY = group.height / group.originalHeight;
    const groupCx = group.x + group.width / 2;
    const groupCy = group.y + group.height / 2;
    const restoredChildren = group.objects.map((child: any) => {
      const childCxRelative = (child.x + child.width / 2) * scaleX;
      const childCyRelative = (child.y + child.height / 2) * scaleY;
      const dx = childCxRelative - group.width / 2;
      const dy = childCyRelative - group.height / 2;
      const rotatedOffset = rotatePoint(dx, dy, 0, 0, group.rotation);
      const newWorldCx = groupCx + rotatedOffset.x;
      const newWorldCy = groupCy + rotatedOffset.y;
      const newChildWidth = child.width * scaleX;
      const newChildHeight = child.height * scaleY;
      return {
        ...child,
        id: Math.random().toString(36).substr(2, 9),
        x: newWorldCx - newChildWidth / 2,
        y: newWorldCy - newChildHeight / 2,
        width: newChildWidth,
        height: newChildHeight,
        rotation: (child.rotation + group.rotation) % 360,
        ...(child.type === "group"
          ? {
              originalWidth: (child as GroupObject).originalWidth * scaleX,
              originalHeight: (child as GroupObject).originalHeight * scaleY,
            }
          : {}),
      } as CanvasObject;
    });
    const remaining = objects.filter((o) => o.id !== group.id);
    const finalObjects = [...remaining, ...restoredChildren];
    setObjects(finalObjects);
    setSelectedIds(restoredChildren.map((c: any) => c.id));
    saveHistory(finalObjects);
  };

  const handleAddText = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newText: TextObject = {
      id: newId,
      type: "text",
      x: width / 2 - 100,
      y: height / 2 - 20,
      width: 300,
      height: 100,
      text: "Click to edit",
      rotation: 0,
      fontSize: 50,
      fontFamily: "Inter",
      color: "#000000",
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      textAlign: "left",
      backgroundColor: "transparent",
      textTransform: "none",
      letterSpacing: 0,
      lineHeight: 1.2,
    };
    const finalObjects = [...objects, newText];
    setObjects(finalObjects);
    setSelectedIds([newId]);
    setTool("select");
    saveHistory(finalObjects);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = 300;
        const h = 300 / ratio;
        const newId = Math.random().toString(36).substr(2, 9);
        const newImg: ImageObject = {
          id: newId,
          type: "image",
          x: width / 2 - w / 2,
          y: height / 2 - h / 2,
          width: w,
          height: h,
          rotation: 0,
          src,
          borderRadius: 0,
          opacity: 1,
          strokeColor: "transparent",
          strokeWidth: 0,
        };
        const finalObjects = [...objects, newImg];
        setObjects(finalObjects);
        setSelectedIds([newId]);
        setTool("select");
        saveHistory(finalObjects);
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      const finalObjects = objects.filter(
        (t) => !selectedIds.includes(t.id) || t.isLocked
      );
      setObjects(finalObjects);
      setSelectedIds((prev) =>
        prev.filter((id) => objects.find((o) => o.id === id)?.isLocked)
      );
      saveHistory(finalObjects);
    } else {
      setObjects([]);
      setBgColor("#ffffff");
      saveHistory([]);
    }
  };

  /* --- EVENT HANDLERS --- */
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).classList.contains("bg-wrapper") ||
      (e.target as HTMLElement).tagName === "CANVAS" ||
      (e.target as HTMLElement).classList.contains("paper-canvas")
    ) {
      if (tool === "select") {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedIds([]);
        isSelecting.current = true;
        selectionStartPos.current = getPointerPos(e);
        objectsSnapshot.current = JSON.stringify(objects);
      } else if (tool === "rect") {
        isDrawing.current = true;
        drawingStartPos.current = getPointerPos(e);
      } else if (tool === "pen") {
        isDrawing.current = true;
        const pos = getPointerPos(e);
        setCurrentPath([pos]);
      } else if (tool === "hand" || e.button === 1) {
        if (!containerRef.current) return;
        isDragging.current = true;
        startX.current = e.pageX - containerRef.current.offsetLeft;
        startY.current = e.pageY - containerRef.current.offsetTop;
        scrollLeftRef.current = containerRef.current.scrollLeft;
        scrollTopRef.current = containerRef.current.scrollTop;
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    const currentZoom = zoom[0] / 100;
    if (!canvasRef.current) return;
    const { x, y } = getRelativePos(e, canvasRef.current, zoom[0]);

    if (!dragTarget && guides.length > 0) setGuides([]);

    // Selecting
    if (isSelecting.current && selectionStartPos.current) {
      const sx = selectionStartPos.current.x;
      const sy = selectionStartPos.current.y;
      setSelectionBox({
        x: Math.min(sx, x),
        y: Math.min(sy, y),
        w: Math.abs(x - sx),
        h: Math.abs(y - sy),
      });
      return;
    }
    // Rect Draw
    if (isDrawing.current && tool === "rect" && drawingStartPos.current) {
      const sx = drawingStartPos.current.x;
      const sy = drawingStartPos.current.y;
      setTempRect({
        id: "temp",
        type: "rect",
        x: Math.min(x, sx),
        y: Math.min(y, sy),
        width: Math.max(10, Math.abs(x - sx)),
        height: Math.max(10, Math.abs(y - sy)),
        rotation: 0,
        fillColor: "transparent",
        strokeColor: "#000000",
        strokeWidth: 2,
        borderRadius: 0,
      });
      return;
    }
    // Pen Draw
    if (isDrawing.current && tool === "pen") {
      setCurrentPath((prev) => [...prev, { x, y }]);
      return;
    }
    // Rotate
    if (rotatingTarget) {
      e.preventDefault();
      const obj = objects.find((o) => o.id === rotatingTarget.id);
      if (obj?.isLocked) return;
      const { cx, cy, startAngle, initialRotation } = rotatingTarget;
      const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      updateObject(rotatingTarget.id, {
        rotation: initialRotation + angleDiff,
      });
      return;
    }
    // Resize
    if (resizingTarget) {
      e.preventDefault();
      const obj = objects.find((o) => o.id === resizingTarget.id);
      if (!obj || obj.isLocked) return;

      const mouseX = e.pageX;
      const mouseY = e.pageY;
      const dxWorld = (mouseX - resizingTarget.startX) / currentZoom;
      const dyWorld = (mouseY - resizingTarget.startY) / currentZoom;
      const angleRad = (obj.rotation * Math.PI) / 180;
      const cos = Math.cos(-angleRad);
      const sin = Math.sin(-angleRad);
      const dxLocal = dxWorld * cos - dyWorld * sin;
      const dyLocal = dxWorld * sin + dyWorld * cos;
      const { direction, startW, startH, startXPos, startYPos, startFontSize } =
        resizingTarget;
      let newWidth = startW;
      let newHeight = startH;
      if (direction.includes("e")) newWidth = Math.max(10, startW + dxLocal);
      else if (direction.includes("w"))
        newWidth = Math.max(10, startW - dxLocal);
      if (direction.includes("s")) newHeight = Math.max(10, startH + dyLocal);
      else if (direction.includes("n"))
        newHeight = Math.max(10, startH - dyLocal);

      let fontSizeUpdate = {};
      if (obj.type === "text" && direction.length === 2) {
        const scale = newWidth / startW;
        newHeight = startH * scale;
        if (startFontSize)
          fontSizeUpdate = { fontSize: Math.max(1, startFontSize * scale) };
      }

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
      const centerXShiftWorld =
        centerXShiftLocal * cosR - centerYShiftLocal * sinR;
      const centerYShiftWorld =
        centerXShiftLocal * sinR + centerYShiftLocal * cosR;
      const oldCenterX = startXPos + startW / 2;
      const oldCenterY = startYPos + startH / 2;
      const newCenterX = oldCenterX + centerXShiftWorld;
      const newCenterY = oldCenterY + centerYShiftWorld;
      const newX = newCenterX - newWidth / 2;
      const newY = newCenterY - newHeight / 2;

      const updates: any = {
        x: newX,
        y: newY,
        width: newWidth,
        ...fontSizeUpdate,
      };
      if (obj.type !== "text") updates.height = newHeight;
      else if (direction.length === 2) updates.height = newHeight;
      updateObject(resizingTarget.id, updates);
      return;
    }

    // --- DRAG WITH ALIGNMENT GUIDES ---
    if (dragTarget) {
      e.preventDefault();
      const draggedObj = objects.find((o) => o.id === dragTarget.id);
      if (!draggedObj || draggedObj.isLocked) return;

      const rawDx = e.movementX / currentZoom;
      const rawDy = e.movementY / currentZoom;

      const newX = draggedObj.x + rawDx;
      const newY = draggedObj.y + rawDy;
      const wObj = draggedObj.width;
      const hObj = draggedObj.height;

      const dEdges = {
        left: newX,
        midX: newX + wObj / 2,
        right: newX + wObj,
        top: newY,
        midY: newY + hObj / 2,
        bottom: newY + hObj,
      };

      const SNAP_THRESHOLD = 5;
      const activeGuides: GuideLine[] = [];

      let minSnapDistX = SNAP_THRESHOLD;
      let minSnapDistY = SNAP_THRESHOLD;
      let snapDx = 0;
      let snapDy = 0;

      // Helper to check alignment distance
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
        } else if (dist === minSnap && dist < SNAP_THRESHOLD) {
          return true;
        }
        return false;
      };

      // 1. Center of Canvas Guides
      const canvasMidX = width / 2;
      const canvasMidY = height / 2;

      if (checkAlign(dEdges.midX, canvasMidX, true, "vertical")) {
        activeGuides.push({
          type: "vertical",
          x: canvasMidX,
          y: 0,
          length: height,
          isCenter: true,
        });
      }
      if (checkAlign(dEdges.midY, canvasMidY, true, "horizontal")) {
        activeGuides.push({
          type: "horizontal",
          x: 0,
          y: canvasMidY,
          length: width,
          isCenter: true,
        });
      }

      // 2. Object-to-Object Alignment
      objects.forEach((other) => {
        if (selectedIds.includes(other.id)) return; // Don't snap to self

        const oEdges = {
          left: other.x,
          midX: other.x + other.width / 2,
          right: other.x + other.width,
          top: other.y,
          midY: other.y + other.height / 2,
          bottom: other.y + other.height,
        };

        // Vertical Comparisons (X-axis alignment)
        const xComparisons = [
          { dVal: dEdges.left, oVal: oEdges.left, isCenter: false },
          { dVal: dEdges.left, oVal: oEdges.right, isCenter: false },
          { dVal: dEdges.midX, oVal: oEdges.midX, isCenter: true },
          { dVal: dEdges.right, oVal: oEdges.left, isCenter: false },
          { dVal: dEdges.right, oVal: oEdges.right, isCenter: false },
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

        // Horizontal Comparisons (Y-axis alignment)
        const yComparisons = [
          { dVal: dEdges.top, oVal: oEdges.top, isCenter: false },
          { dVal: dEdges.top, oVal: oEdges.bottom, isCenter: false },
          { dVal: dEdges.midY, oVal: oEdges.midY, isCenter: true },
          { dVal: dEdges.bottom, oVal: oEdges.top, isCenter: false },
          { dVal: dEdges.bottom, oVal: oEdges.bottom, isCenter: false },
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

      // Filter only the best snaps
      const bestGuides = activeGuides.filter((g) => {
        // Keep all that match the snap distance (since we update snapDx/Dy in real time)
        return true;
      });

      setGuides(bestGuides);

      // Apply snap
      const finalDx = rawDx + snapDx;
      const finalDy = rawDy + snapDy;

      // Update positions
      selectedIds.forEach((id) => {
        const obj = objects.find((o) => o.id === id);
        if (obj) updateObject(id, { x: obj.x + finalDx, y: obj.y + finalDy });
      });
      return;
    }

    // Pan
    if (isDragging.current && containerRef.current) {
      e.preventDefault();
      containerRef.current.scrollLeft =
        scrollLeftRef.current - (e.pageX - startX.current);
      containerRef.current.scrollTop =
        scrollTopRef.current - (e.pageY - startY.current);
    }
  };

  const handleGlobalMouseUp = (e: React.MouseEvent) => {
    setGuides([]);

    // 1. Drop/Delete Logic
    if (dragTarget) {
      const draggedObj = objects.find((o) => o.id === dragTarget.id);
      if (draggedObj) {
        const objRight = draggedObj.x + draggedObj.width;
        const objBottom = draggedObj.y + draggedObj.height;
        const isOutside =
          objRight < 0 ||
          draggedObj.x > width ||
          objBottom < 0 ||
          draggedObj.y > height;
        if (isOutside) {
          const finalObjects = objects.filter((o) => o.id !== dragTarget.id);
          setObjects(finalObjects);
          setSelectedIds((prev) => prev.filter((id) => id !== dragTarget.id));
          saveHistory(finalObjects);
          setDragTarget(null);
          isDragging.current = false;
          return;
        }
      }

      if (objectsSnapshot.current !== JSON.stringify(objects)) {
        saveHistory(objects);
      }
    }

    if (resizingTarget || rotatingTarget) {
      if (objectsSnapshot.current !== JSON.stringify(objects)) {
        saveHistory(objects);
      }
    }

    if (isSelecting.current && selectionBox) {
      const selected = objects
        .filter(
          (obj) =>
            !obj.isLocked &&
            obj.x < selectionBox.x + selectionBox.w &&
            obj.x + obj.width > selectionBox.x &&
            obj.y < selectionBox.y + selectionBox.h &&
            obj.y + obj.height > selectionBox.y
        )
        .map((o) => o.id);
      setSelectedIds(selected);
      setSelectionBox(null);
    }

    if (isDrawing.current && tool === "rect" && tempRect) {
      const newObj: RectObject = {
        ...tempRect,
        id: Math.random().toString(36).substr(2, 9),
      };
      const finalObjects = [...objects, newObj];
      setObjects(finalObjects);
      setSelectedIds([newObj.id]);
      setTempRect(null);
      setTool("select");
      saveHistory(finalObjects);
    }

    if (isDrawing.current && tool === "pen" && currentPath.length > 1) {
      const xs = currentPath.map((p) => p.x);
      const ys = currentPath.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const width = Math.max(maxX - minX, 1);
      const height = Math.max(maxY - minY, 1);
      const relativePoints = currentPath.map((p) => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      const newPath: PathObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: "path",
        x: minX,
        y: minY,
        width,
        height,
        rotation: 0,
        points: relativePoints,
        strokeColor: "#000000",
        strokeWidth: 3,
        opacity: 1,
      };

      const finalObjects = [...objects, newPath];
      setObjects(finalObjects);
      setSelectedIds([newPath.id]);
      setCurrentPath([]);
      saveHistory(finalObjects);
    } else {
      setCurrentPath([]);
    }

    isDragging.current = false;
    isDrawing.current = false;
    isSelecting.current = false;
    drawingStartPos.current = null;
    selectionStartPos.current = null;
    setDragTarget(null);
    setResizingTarget(null);
    setRotatingTarget(null);
    if (containerRef.current)
      containerRef.current.style.cursor = tool === "hand" ? "grab" : "";
  };

  // --- Effects ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.shiftKey ? handleUngroup() : handleGroup();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
      }
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "INPUT")
      )
        handleDeleteSelected();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, objects, undo, redo, history, historyStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          setZoom((prev) => [
            Math.min(Math.max(prev[0] + -e.deltaY * 0.5, 10), 300),
          ]);
        }
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  useEffect(() => {
    const handleMouseMoveWrapper = (e: Event) =>
      handleGlobalMouseMove(e as unknown as React.MouseEvent);
    const handleMouseUpWrapper = (e: Event) =>
      handleGlobalMouseUp(e as unknown as React.MouseEvent);

    window.addEventListener("mousemove", handleMouseMoveWrapper);
    window.addEventListener("mouseup", handleMouseUpWrapper);

    return () => {
      window.removeEventListener("mousemove", handleMouseMoveWrapper);
      window.removeEventListener("mouseup", handleMouseUpWrapper);
    };
  }, [
    dragTarget,
    resizingTarget,
    rotatingTarget,
    selectionBox,
    objects,
    selectedIds,
    tool,
    width,
    height,
    zoom,
    currentPath,
  ]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = "";
  }, [tool]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (shouldCenterZoom.current) {
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } =
        containerRef.current;
      containerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
      containerRef.current.scrollTop = (scrollHeight - clientHeight) / 2;
      shouldCenterZoom.current = false;
      prevZoom.current = zoom[0];
    } else if (zoom[0] !== prevZoom.current && prevZoom.current > 0) {
      const { clientWidth, clientHeight, scrollLeft, scrollTop } =
        containerRef.current;
      const scale = zoom[0] / prevZoom.current;
      containerRef.current.scrollLeft =
        (scrollLeft + clientWidth / 2) * scale - clientWidth / 2;
      containerRef.current.scrollTop =
        (scrollTop + clientHeight / 2) * scale - clientHeight / 2;
      prevZoom.current = zoom[0];
    }
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
  }, [width, height]);

  const handleFit = () => {
    if (containerRef.current) {
      shouldCenterZoom.current = true;
      setZoom([
        Math.floor(
          Math.min(
            (containerRef.current.clientWidth - 80) / width,
            (containerRef.current.clientHeight - 80) / height
          ) * 100
        ),
      ]);
    }
  };

  const setDragTargetWithSnapshot = (t: any) => {
    objectsSnapshot.current = JSON.stringify(objects);
    setDragTarget(t);
  };
  const setResizingTargetWithSnapshot = (t: any) => {
    objectsSnapshot.current = JSON.stringify(objects);
    setResizingTarget(t);
  };

  return {
    canvasRef,
    containerRef,
    objRefs,
    zoom,
    setZoom,
    tool,
    setTool,
    objects,
    setObjects,
    selectedIds,
    setSelectedIds,
    bgColor,
    setBgColor,
    guides,
    tempRect,
    selectionBox,
    singleSelectedObject:
      selectedIds.length === 1
        ? objects.find((t) => t.id === selectedIds[0])
        : undefined,
    width,
    height,
    dragTarget,
    handleContainerMouseDown,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    handleGroup,
    handleUngroup,
    handleDuplicate,
    handleDeleteSelected,
    handleStartRotation,
    handleAddText,
    handleAddImage,
    updateObject,
    handleLayerSelect,
    handleFit,
    setDragTarget: setDragTargetWithSnapshot,
    setResizingTarget: setResizingTargetWithSnapshot,
    toggleLock,
    isDrawing: isDrawing.current,
    currentPath,
    undo,
    redo,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1,
  };
};
