import { useRef, useState, useEffect, useLayoutEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { Orientation, PaperKey } from "@/pages/Home";
import { PAPER_SIZES } from "@/lib/constants";
import type {
  ToolType,
  CanvasObject,
  TextObject,
  RectObject,
  ImageObject,
  GroupObject,
} from "@/lib/types";
import { getRotatedBoundingBox, rotatePoint } from "@/lib/utils";

import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Footer } from "./Footer";
import { TextItem } from "./items/TextItem";
import { RectItem } from "./items/RectItem";
import { ImageItem } from "./items/ImageItem";
import { GroupItem } from "./items/GroupItem";
import { LayersPanel } from "./LayersPanel";

interface DesignBoardProps {
  paper: PaperKey;
  orientation: Orientation;
  onBack: () => void;
}

export default function DesignBoard({
  paper,
  orientation,
  onBack,
}: DesignBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State
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

  const objRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // App State
  const [zoom, setZoom] = useState<number[]>([40]);
  const [tool, setTool] = useState<ToolType>("select");
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isClosingToolbar, setIsClosingToolbar] = useState(false);

  const [isLayersOpen, setIsLayersOpen] = useState(false);

  // Temp visual states
  const [tempRect, setTempRect] = useState<RectObject | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Actions
  const [dragTarget, setDragTarget] = useState<{ id: string } | null>(null);
  const [resizingTarget, setResizingTarget] = useState<any>(null);
  const [rotatingTarget, setRotatingTarget] = useState<{
    id: string;
    cx: number;
    cy: number;
    startAngle: number;
    initialRotation: number;
  } | null>(null);

  const singleSelectedObject =
    selectedIds.length === 1
      ? objects.find((t) => t.id === selectedIds[0])
      : undefined;

  const { w, h } = PAPER_SIZES[paper];
  const width = orientation === "portrait" ? w : h;
  const height = orientation === "portrait" ? h : w;

  /* --- HELPERS --- */
  const getPointerPos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (e.clientX - rect.left) / (zoom[0] / 100);
    const y = (e.clientY - rect.top) / (zoom[0] / 100);
    return { x, y };
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
  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    setObjects((prev) =>
      prev.map(
        (obj) => (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject
      )
    );
  };

  const updateSelected = (updates: Partial<CanvasObject>) => {
    if (selectedIds.length === 1) updateObject(selectedIds[0], updates);
  };

  const handleCloseToolbar = () => {
    setIsClosingToolbar(true);
    setTimeout(() => {
      setSelectedIds([]);
      setIsClosingToolbar(false);
    }, 300);
  };

  const handleLayerSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleStartRotation = (e: React.MouseEvent, id: string) => {
    const obj = objects.find((o) => o.id === id);
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

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const newObjects: CanvasObject[] = [];
    const newSelectedIds: string[] = [];

    selectedIds.forEach((id) => {
      const original = objects.find((o) => o.id === id);
      if (original) {
        const cloned = cloneCanvasObject(original);
        cloned.x += 20;
        cloned.y += 20;
        newObjects.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });
    setObjects((prev) => [...prev, ...newObjects]);
    setSelectedIds(newSelectedIds);
  };

  /* --- GROUPING LOGIC (FLATTENED) --- */
  const handleGroup = () => {
    if (selectedIds.length < 2) return;

    const itemsToGroup = objects.filter((o) => selectedIds.includes(o.id));
    if (itemsToGroup.length === 0) return;

    // Helper: Recursively flatten groups into absolute world coordinates
    const flattenItem = (item: CanvasObject): CanvasObject[] => {
      if (item.type !== "group") return [item];

      const group = item as GroupObject;
      const scaleX = group.width / group.originalWidth;
      const scaleY = group.height / group.originalHeight;
      const groupCx = group.x + group.width / 2;
      const groupCy = group.y + group.height / 2;

      return group.objects.flatMap(
        (child: {
          width: number;
          height: number;
          x: number;
          y: number;
          rotation: any;
          type: string;
        }) => {
          // Calculate child's absolute world dimensions
          const newChildWidth = child.width * scaleX;
          const newChildHeight = child.height * scaleY;

          // Calculate child's absolute world position
          const childCxRelative = (child.x + child.width / 2) * scaleX;
          const childCyRelative = (child.y + child.height / 2) * scaleY;
          const dx = childCxRelative - group.width / 2;
          const dy = childCyRelative - group.height / 2;

          const rotatedOffset = rotatePoint(dx, dy, 0, 0, group.rotation);
          const newWorldCx = groupCx + rotatedOffset.x;
          const newWorldCy = groupCy + rotatedOffset.y;

          // Create flat object
          const flattenedChild: CanvasObject = {
            ...child,
            id: Math.random().toString(36).substr(2, 9),
            x: newWorldCx - newChildWidth / 2,
            y: newWorldCy - newChildHeight / 2,
            width: newChildWidth,
            height: newChildHeight,
            rotation: (child.rotation + group.rotation) % 360,
            // If child was a group, pass scaled original dims for recursion
            ...(child.type === "group"
              ? {
                  originalWidth: (child as GroupObject).originalWidth * scaleX,
                  originalHeight:
                    (child as GroupObject).originalHeight * scaleY,
                }
              : {}),
          } as CanvasObject;

          // Recurse in case of nested groups
          return flattenItem(flattenedChild);
        }
      );
    };

    // Flatten all selected items into a single layer
    const flatItemsToGroup = itemsToGroup.flatMap((item) => flattenItem(item));

    // 1. Calculate Visual Bounding Box of FLAT items
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

    // 2. Normalize children relative to new bounding box
    const groupedChildren = flatItemsToGroup.map((obj) => ({
      ...obj,
      x: obj.x - minX,
      y: obj.y - minY,
    }));

    // 3. Create Group Object
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

    // 4. Update State (Remove original selected IDs, add new Group)
    const remainingObjects = objects.filter((o) => !selectedIds.includes(o.id));
    setObjects([...remainingObjects, groupObj]);
    setSelectedIds([newGroupId]);
  };

  const handleUngroup = () => {
    if (selectedIds.length !== 1) return;
    const group = objects.find((o) => o.id === selectedIds[0]);
    if (!group || group.type !== "group") return;

    const scaleX = group.width / group.originalWidth;
    const scaleY = group.height / group.originalHeight;
    const groupCx = group.x + group.width / 2;
    const groupCy = group.y + group.height / 2;

    const restoredChildren = group.objects.map(
      (child: {
        x: number;
        width: number;
        y: number;
        height: number;
        rotation: any;
        type: string;
      }) => {
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
      }
    );

    const remaining = objects.filter((o) => o.id !== group.id);
    setObjects([...remaining, ...restoredChildren]);
    setSelectedIds(restoredChildren.map((c: { id: any }) => c.id));
  };

  /* --- ADD ITEMS --- */
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
    };
    setObjects([...objects, newText]);
    setSelectedIds([newId]);
    setTool("select");
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
        setObjects((prev) => [...prev, newImg]);
        setSelectedIds([newId]);
        setTool("select");
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      setObjects((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      setSelectedIds([]);
    } else {
      setObjects([]);
    }
  };

  /* --- KEYBOARD & ZOOM --- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) handleUngroup();
        else handleGroup();
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
      ) {
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, objects]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
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
  }, []);
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

  /* --- MOUSE EVENTS --- */
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
      } else if (tool === "draw-rect") {
        isDrawing.current = true;
        drawingStartPos.current = getPointerPos(e);
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
    const { x, y } = getPointerPos(e);

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
    if (isDrawing.current && drawingStartPos.current) {
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
    if (rotatingTarget) {
      e.preventDefault();
      const { cx, cy, startAngle, initialRotation } = rotatingTarget;
      const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      updateObject(rotatingTarget.id, {
        rotation: initialRotation + angleDiff,
      });
      return;
    }
    if (resizingTarget) {
      e.preventDefault();

      const obj = objects.find((o) => o.id === resizingTarget.id);
      if (!obj) return;

      // 1. Calculate raw mouse delta in World Space
      const mouseX = e.pageX;
      const mouseY = e.pageY;
      const dxWorld = (mouseX - resizingTarget.startX) / currentZoom;
      const dyWorld = (mouseY - resizingTarget.startY) / currentZoom;

      // 2. Convert World Delta to Local Object Delta (Unrotated)
      // We rotate the vector (dx, dy) by -rotation to align with object axes
      const angleRad = (obj.rotation * Math.PI) / 180;
      const cos = Math.cos(-angleRad);
      const sin = Math.sin(-angleRad);

      const dxLocal = dxWorld * cos - dyWorld * sin;
      const dyLocal = dxWorld * sin + dyWorld * cos;

      const { direction, startW, startH, startXPos, startYPos, startFontSize } =
        resizingTarget;

      let newWidth = startW;
      let newHeight = startH;

      // 3. Calculate New Dimensions (Local)
      // We assume handle logic: dragging 'Right' ('e') adds to width, dragging 'Left' ('w') subtracts
      if (direction.includes("e")) {
        newWidth = Math.max(10, startW + dxLocal);
      } else if (direction.includes("w")) {
        newWidth = Math.max(10, startW - dxLocal);
      }

      if (direction.includes("s")) {
        newHeight = Math.max(10, startH + dyLocal);
      } else if (direction.includes("n")) {
        newHeight = Math.max(10, startH - dyLocal);
      }

      // --- TEXT SCALING LOGIC ---
      let fontSizeUpdate = {};
      if (obj.type === "text" && direction.length === 2) {
        // Corner resize on text -> Scale Height & Font Size proportionally
        const scale = newWidth / startW;
        newHeight = startH * scale; // Keep aspect ratio
        if (startFontSize) {
          fontSizeUpdate = { fontSize: Math.max(1, startFontSize * scale) };
        }
      }

      // 4. Calculate Position Correction (Keep Opposite Corner Fixed)
      // When we resize, the center point shifts. We calculate that shift in local space,
      // rotate it back to world space, and add it to the original center.

      // Calculate how much the dimensions actually changed (clamped)
      const wDiff = newWidth - startW;
      const hDiff = newHeight - startH;

      // Determine Center Shift in Local Space based on handle
      // If we drag 'East', center moves +wDiff/2. If 'West', center moves -wDiff/2.
      let centerXShiftLocal = 0;
      let centerYShiftLocal = 0;

      if (direction.includes("e")) centerXShiftLocal = wDiff / 2;
      else if (direction.includes("w")) centerXShiftLocal = -wDiff / 2;

      if (direction.includes("s")) centerYShiftLocal = hDiff / 2;
      else if (direction.includes("n")) centerYShiftLocal = -hDiff / 2;

      // Rotate this shift back to World Space
      // (Using original positive rotation)
      const cosR = Math.cos(angleRad);
      const sinR = Math.sin(angleRad);

      const centerXShiftWorld =
        centerXShiftLocal * cosR - centerYShiftLocal * sinR;
      const centerYShiftWorld =
        centerXShiftLocal * sinR + centerYShiftLocal * cosR;

      // 5. Calculate New Top-Left Coordinates
      // Old Center
      const oldCenterX = startXPos + startW / 2;
      const oldCenterY = startYPos + startH / 2;

      // New Center
      const newCenterX = oldCenterX + centerXShiftWorld;
      const newCenterY = oldCenterY + centerYShiftWorld;

      // New Top-Left
      const newX = newCenterX - newWidth / 2;
      const newY = newCenterY - newHeight / 2;

      // 6. Apply Updates
      const updates: any = {
        x: newX,
        y: newY,
        width: newWidth,
        ...fontSizeUpdate,
      };

      if (obj.type !== "text") {
        updates.height = newHeight;
      } else {
        // For text, we usually let it auto-calculate, but setting Y correctly above
        // prevents the "drift". If corner resizing, we explicitly set height to maintain smooth visual.
        if (direction.length === 2) updates.height = newHeight;
      }

      updateObject(resizingTarget.id, updates);
      return;
    }
    if (dragTarget) {
      e.preventDefault();
      const dx = e.movementX / currentZoom;
      const dy = e.movementY / currentZoom;
      selectedIds.forEach((id) => {
        const obj = objects.find((o) => o.id === id);
        if (obj) updateObject(id, { x: obj.x + dx, y: obj.y + dy });
      });
      return;
    }
    if (isDragging.current && containerRef.current) {
      e.preventDefault();
      containerRef.current.scrollLeft =
        scrollLeftRef.current - (e.pageX - startX.current);
      containerRef.current.scrollTop =
        scrollTopRef.current - (e.pageY - startY.current);
    }
  };

  const handleGlobalMouseUp = () => {
    if (isSelecting.current && selectionBox) {
      const selected = objects
        .filter(
          (obj) =>
            obj.x < selectionBox.x + selectionBox.w &&
            obj.x + obj.width > selectionBox.x &&
            obj.y < selectionBox.y + selectionBox.h &&
            obj.y + obj.height > selectionBox.y
        )
        .map((o) => o.id);

      // Combine with existing selection if Shift/Ctrl is held
      // But for box selection, usually it replaces.
      // Logic can be tweaked: if keys held, append; else replace.
      setSelectedIds(selected);
      setSelectionBox(null);
    }
    if (isDrawing.current && tempRect) {
      const newObj: RectObject = {
        ...tempRect,
        id: Math.random().toString(36).substr(2, 9),
      };
      setObjects([...objects, newObj]);
      setSelectedIds([newObj.id]);
      setTempRect(null);
      setTool("select");
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

  return (
    <div
      className="flex flex-col h-screen w-full bg-gray-50 relative overflow-hidden"
      onMouseUp={handleGlobalMouseUp}
      onMouseMove={handleGlobalMouseMove}
    >
      <Header
        onBack={onBack}
        tool={tool}
        setTool={setTool}
        paper={paper}
        orientation={orientation}
        bgColor={bgColor}
        setBgColor={setBgColor}
        handleAddText={handleAddText}
        handleAddImage={handleAddImage}
        handleDeleteSelected={handleDeleteSelected}
        selectedId={selectedIds.length === 1 ? selectedIds[0] : null}
        handleGroup={handleGroup}
        handleUngroup={handleUngroup}
        selectedCount={selectedIds.length}
        isGroupSelected={
          selectedIds.length === 1 &&
          objects.find((o) => o.id === selectedIds[0])?.type === "group"
        }
        isLayersOpen={isLayersOpen}
        setIsLayersOpen={setIsLayersOpen}
      />

      <Toolbar
        selectedObject={singleSelectedObject}
        updateSelected={updateSelected}
        handleCloseToolbar={handleCloseToolbar}
        isClosingToolbar={isClosingToolbar}
      />

      <main
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
        className={`flex-1 relative overflow-auto bg-gray-50 no-scrollbar z-10 ${
          tool === "hand"
            ? "cursor-grab"
            : tool === "draw-rect"
            ? "cursor-crosshair"
            : "cursor-default"
        }`}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        <div
          className="flex items-center justify-center min-w-full min-h-full bg-wrapper"
          style={{
            backgroundImage:
              "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            padding: "80px",
            width: `${Math.max(100, (width * zoom[0]) / 100 + 160)}px`,
            height: `${Math.max(100, (height * zoom[0]) / 100 + 160)}px`,
          }}
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className="relative shadow-xl border border-gray-200 paper-canvas"
                onMouseDown={handleContainerMouseDown}
                style={{
                  width: `${width * (zoom[0] / 100)}px`,
                  height: `${height * (zoom[0] / 100)}px`,
                  transition: "none",
                  backgroundColor: bgColor,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                  {objects.map((obj) => {
                    const isSelected = selectedIds.includes(obj.id);
                    const commonProps = {
                      key: obj.id,
                      zoom: zoom[0],
                      isSelected,
                      tool,
                      setDragTarget,
                      setSelectedId: (id: string | null) =>
                        id ? setSelectedIds([id]) : setSelectedIds([]),
                      addSelectedId: (id: string) =>
                        setSelectedIds((prev) =>
                          prev.includes(id) ? prev : [...prev, id]
                        ),
                      setResizingTarget,
                      setRotatingTarget: handleStartRotation,
                      innerRef: (el: HTMLDivElement | null) => {
                        objRefs.current[obj.id] = el;
                      },
                    };

                    if (obj.type === "text")
                      return (
                        <TextItem
                          obj={obj}
                          {...commonProps}
                          onUpdate={updateObject as any}
                        />
                      );
                    if (obj.type === "rect")
                      return <RectItem obj={obj} {...commonProps} />;
                    if (obj.type === "image")
                      return <ImageItem obj={obj} {...commonProps} />;
                    if (obj.type === "group")
                      return <GroupItem obj={obj} {...commonProps} />;
                    return null;
                  })}
                  {tempRect && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${tempRect.x * (zoom[0] / 100)}px`,
                        top: `${tempRect.y * (zoom[0] / 100)}px`,
                        width: `${tempRect.width * (zoom[0] / 100)}px`,
                        height: `${tempRect.height * (zoom[0] / 100)}px`,
                        border: `2px dashed #000`,
                        opacity: 0.5,
                      }}
                    />
                  )}
                  {selectionBox && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${selectionBox.x * (zoom[0] / 100)}px`,
                        top: `${selectionBox.y * (zoom[0] / 100)}px`,
                        width: `${selectionBox.w * (zoom[0] / 100)}px`,
                        height: `${selectionBox.h * (zoom[0] / 100)}px`,
                        border: `1px solid #3b82f6`,
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {selectedIds.length > 0 && (
                <>
                  <ContextMenuItem onClick={handleDuplicate}>
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              {selectedIds.length > 1 && (
                <ContextMenuItem onClick={handleGroup}>Group</ContextMenuItem>
              )}
              {selectedIds.length === 1 &&
                objects.find((o) => o.id === selectedIds[0])?.type ===
                  "group" && (
                  <>
                    <ContextMenuItem onClick={handleUngroup}>
                      Ungroup
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}
              <ContextMenuItem onClick={handleDeleteSelected}>
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </main>
      {/* 4. Render Layers Panel */}
      <LayersPanel
        objects={objects}
        setObjects={setObjects} // This enables the reordering
        selectedIds={selectedIds}
        onSelect={handleLayerSelect}
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
      />
      <Footer zoom={zoom} setZoom={setZoom} handleFit={handleFit} />
    </div>
  );
}
