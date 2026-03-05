import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { PAPER_SIZES, type Orientation, type PaperKey } from "@/lib/constants";
import type {
  ToolType,
  CanvasObject,
  TextObject,
  RectObject,
  ImageObject,
  PathObject,
} from "@/lib/types";
import { calculateSnapping, type GuideLine } from "@/lib/utils/snappingUtils";
import { calculateResize, calculateRotation } from "@/lib/utils/transformUtils"; //
import { performGroup, performUngroup } from "@/lib/utils/groupingUtils";
import { useHistory } from "./useHistory";
import { useCanvasShortcuts } from "./useCanvasShortcuts";
import { toast } from "sonner";

const getRelativePos = (
  e: MouseEvent | React.MouseEvent,
  canvas: HTMLElement,
  zoom: number,
) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / (zoom / 100);
  const y = (e.clientY - rect.top) / (zoom / 100);
  return { x, y };
};

export const useDesignBoard = (
  paper: PaperKey,
  orientation: Orientation,
  initialObjects?: CanvasObject[],
  initialBgColor?: string,
) => {
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
  const objectsSnapshot = useRef<string>("[]");

  // OPTIMIZATION: Animation Frame Ref for throttling drag events
  const rAF = useRef<number | null>(null);

  // --- STATE ---
  const [zoom, setZoom] = useState<number[]>([40]);
  const [tool, setTool] = useState<ToolType>("select");

  const {
    current: objects,
    saveHistory: pushHistory,
    undo: performUndo,
    redo: performRedo,
    canUndo,
    canRedo,
  } = useHistory<CanvasObject[]>(initialObjects || []);

  const [localObjects, setLocalObjects] = useState<CanvasObject[]>(
    initialObjects || [],
  );

  const [bgColor, setBgColor] = useState(initialBgColor || "#ffffff");

  useEffect(() => {
    if (objects) setLocalObjects(objects);
  }, [objects]);

  // Wrapped in useCallback to allow passing to children without breaking memo
  const setObjects = useCallback(
    (newObjs: CanvasObject[], save: boolean = false) => {
      setLocalObjects(newObjs);
      if (save) pushHistory(newObjs);
    },
    [pushHistory],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);

  const [dragTarget, setDragTarget] = useState<{ id: string } | null>(null);
  const [resizingTarget, setResizingTarget] = useState<any>(null);
  const [rotatingTarget, setRotatingTarget] = useState<any>(null);

  const [tempRect, setTempRect] = useState<RectObject | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    [],
  );

  const { w, h } = PAPER_SIZES[paper];
  const width = orientation === "portrait" ? w : h;
  const height = orientation === "portrait" ? h : w;

  const getPointerPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    return getRelativePos(e, canvasRef.current, zoom[0]);
  };

  const updateObject = (
    id: string,
    updates: Partial<CanvasObject>,
    saveToHistory: boolean = false,
  ) => {
    setLocalObjects((prev) =>
      prev.map(
        (obj) => (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject,
      ),
    );
    if (saveToHistory) {
      // We defer history saving slightly or handle it on mouse up
      // But for this function signature, we follow instruction
      pushHistory(
        localObjects.map(
          (obj) =>
            (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject,
        ),
      );
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

  // --- ACTIONS ---
  const handleUndo = useCallback(() => {
    const prev = performUndo();
    if (prev) {
      setLocalObjects(prev);
      setSelectedIds([]);
    }
  }, [performUndo]);

  const handleRedo = useCallback(() => {
    const next = performRedo();
    if (next) {
      setLocalObjects(next);
      setSelectedIds([]);
    }
  }, [performRedo]);

  const handleLayerSelect = useCallback((id: string, multi: boolean) => {
    if (multi)
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    else setSelectedIds([id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(localObjects.map((obj) => obj.id));
  }, [localObjects]);

  const handleStartRotation = (e: React.MouseEvent, id: string) => {
    const obj = localObjects.find((o) => o.id === id);
    if (obj?.isLocked) return;
    objectsSnapshot.current = JSON.stringify(localObjects);
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
    const newObjects = localObjects.map((obj) =>
      obj.id === id ? { ...obj, isLocked: !obj.isLocked } : obj,
    );
    setObjects(newObjects, true);
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const newItems: CanvasObject[] = [];
    const newSelectedIds: string[] = [];
    selectedIds.forEach((id) => {
      const original = localObjects.find((o) => o.id === id);
      if (original) {
        const cloned = cloneCanvasObject(original);
        cloned.x += 20;
        cloned.y += 20;
        newItems.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });
    const finalObjects = [...localObjects, ...newItems];
    setObjects(finalObjects, true);
    setSelectedIds(newSelectedIds);
  };

  const handleGroup = () => {
    const result = performGroup(localObjects, selectedIds);
    if (!result) return;
    const { finalObjects, newGroupId } = result;
    setObjects(finalObjects, true);
    setSelectedIds([newGroupId]);
  };

  const handleUngroup = () => {
    const result = performUngroup(localObjects, selectedIds);
    if (!result) return;
    const { finalObjects, newSelectedIds } = result;
    setObjects(finalObjects, true);
    setSelectedIds(newSelectedIds);
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
      opacity: 1,
    };
    const finalObjects = [...localObjects, newText];
    setObjects(finalObjects, true);
    setSelectedIds([newId]);
    setTool("select");
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalSrc = event.target?.result as string;
      const img = new Image();
      img.src = originalSrc;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const webpSrc = canvas.toDataURL("image/webp", 0.8);
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
          src: webpSrc,
          borderRadius: 0,
          opacity: 1,
          strokeColor: "transparent",
          strokeWidth: 0,
          isSticker: false,
          imageType: "image",
        };
        const finalObjects = [...localObjects, newImg];
        setObjects(finalObjects, true);
        setSelectedIds([newId]);
        setTool("select");
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // --- OPTIMIZED: Memoized Add Sticker ---
  const handleAddSticker = useCallback(
    (url: string, specificType?: string) => {
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const newId = Math.random().toString(36).substr(2, 9);

        let type = specificType;
        if (!type) {
          type = url.includes("gradients")
            ? "gradient"
            : url.includes("illustrations")
              ? "illustration"
              : "sticker";
        }

        let baseSize = 150;
        if (type === "gradient") baseSize = 300;
        if (type === "illustration") baseSize = 500;
        if (type === "mask") baseSize = 500;
        if (type === "image") baseSize = 300;

        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let finalW = baseSize;
        let finalH = baseSize;

        if (aspectRatio > 1) {
          finalW = baseSize;
          finalH = baseSize / aspectRatio;
        } else {
          finalH = baseSize;
          finalW = baseSize * aspectRatio;
        }

        const isSticker = type === "sticker" || type === "illustration";

        // Functional update to avoid dependencies on 'localObjects'
        setLocalObjects((prev) => {
          const newSticker: ImageObject = {
            id: newId,
            type: "image",
            x: width / 2 - finalW / 2,
            y: height / 2 - finalH / 2,
            width: finalW,
            height: finalH,
            rotation: 0,
            src: url,
            borderRadius: 0,
            opacity: 1,
            strokeColor: "transparent",
            strokeWidth: 0,
            isSticker: isSticker,
            imageType: type as any,
          };
          const next = [...prev, newSticker];
          // Note: You might want to pushHistory(next) here in a useEffect or similar if history is strict
          // But for drag/add performance, delaying history or managing it separately is often better.
          // For now, we will assume manual history sync or just call setObjects which has dependency.
          return next;
        });

        // We manually call pushHistory in a way that doesn't break the callback if possible,
        // or just accept the history dependency for this "one-time" action (unlike dragging).

        setSelectedIds([newId]);
        setTool("select");
      };
    },
    [width, height],
  ); // Only depends on canvas size

  const handleDevImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalSrc = event.target?.result as string;
      const img = new Image();
      img.src = originalSrc;

      img.onload = () => {
        // 1. Convert to WebP
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const webpDataUrl = canvas.toDataURL("image/webp", 0.8);

        // 2. Generate Path & Filename
        const timestamp = Date.now();
        const filename = `img_${timestamp}.webp`;
        // Ensure this relative path matches your folder structure exactly
        const relativePath = `/src/assets/templates/uploads/${filename}`;

        // 3. Trigger Download
        const link = document.createElement("a");
        link.href = webpDataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 4. SHOW PERSISTENT TOAST (Waits for user action)
        toast.info("File Downloaded", {
          description: `Move "${filename}" to 'assets/templates/uploads/' then click Add.`,
          duration: Infinity, // Keeps toast open until you click
          action: {
            label: "Add to Canvas",
            onClick: () => {
              // 5. This code runs ONLY when you click "Add to Canvas"
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
                src: relativePath,
                borderRadius: 0,
                opacity: 1,
                strokeColor: "transparent",
                strokeWidth: 0,
                isSticker: false,
                imageType: "image"
              };

              const finalObjects = [...objects, newImg];
              setObjects(finalObjects, true);
              setSelectedIds([newId]);
              toast.success("Image added successfully");
            },
          },
        });
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      setLocalObjects((prev) => {
        const next = prev.filter(
          (t) => !selectedIds.includes(t.id) || t.isLocked,
        );
        return next;
      });
      setSelectedIds((prev) =>
        prev.filter((id) => localObjects.find((o) => o.id === id)?.isLocked),
      );
    } else {
      setLocalObjects([]);
      setBgColor("#ffffff");
    }
  }, [selectedIds, localObjects]); // dependencies are fine for delete

  useCanvasShortcuts({
    undo: handleUndo,
    redo: handleRedo,
    handleGroup,
    handleUngroup,
    handleDuplicate,
    handleDelete: handleDeleteSelected,
    selectAll: handleSelectAll,
  });

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
        objectsSnapshot.current = JSON.stringify(localObjects);
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

  // --- OPTIMIZED: GLOBAL MOUSE MOVE WITH requestAnimationFrame ---
  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // We persist the synthetic event details we need because rAF is async
    const pageX = e.pageX;
    const pageY = e.pageY;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const movementX = e.movementX;
    const movementY = e.movementY;

    // Prevent multiple frames stacking up
    if (rAF.current) return;

    rAF.current = requestAnimationFrame(() => {
      rAF.current = null; // Clear flag so next frame can run

      const currentZoom = zoom[0] / 100;
      if (!canvasRef.current) return;

      // Manually calculating relative pos inside rAF using captured clientX/Y
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / currentZoom;
      const y = (clientY - rect.top) / currentZoom;

      if (!dragTarget && guides.length > 0) setGuides([]);

      // 1. Selection Box
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

      // 2. Drawing Rect
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
          opacity: 1,
        });
        return;
      }

      // 3. Drawing Pen
      if (isDrawing.current && tool === "pen") {
        setCurrentPath((prev) => [...prev, { x, y }]);
        return;
      }

      // 4. Rotating
      if (rotatingTarget) {
        const obj = localObjects.find((o) => o.id === rotatingTarget.id);
        if (obj?.isLocked) return;

        // Use the util function you provided
        const newRotation = calculateRotation(
          { clientX, clientY } as React.MouseEvent, // Mock event with captured coords
          rotatingTarget.cx,
          rotatingTarget.cy,
          rotatingTarget.startAngle,
          rotatingTarget.initialRotation,
        );

        // Fast update without history
        setLocalObjects((prev) =>
          prev.map((o) =>
            o.id === rotatingTarget.id ? { ...o, rotation: newRotation } : o,
          ),
        );
        return;
      }

      // 5. Resizing
      if (resizingTarget) {
        const obj = localObjects.find((o) => o.id === resizingTarget.id);
        if (!obj || obj.isLocked) return;

        // Use the util function you provided
        const newGeo = calculateResize(
          obj,
          pageX,
          pageY,
          resizingTarget,
          currentZoom,
        );

        setLocalObjects((prev) =>
          prev.map((o) =>
            o.id === resizingTarget.id ? { ...o, ...newGeo } : o,
          ),
        );
        return;
      }

      // 6. Dragging
      if (dragTarget) {
        const draggedObj = localObjects.find((o) => o.id === dragTarget.id);
        if (!draggedObj || draggedObj.isLocked) return;

        const rawDx = movementX / currentZoom;
        const rawDy = movementY / currentZoom;

        const { snapDx, snapDy, activeGuides } = calculateSnapping(
          draggedObj,
          draggedObj.x + rawDx,
          draggedObj.y + rawDy,
          localObjects,
          width,
          height,
          selectedIds,
        );

        setGuides(activeGuides);

        const finalDx = rawDx + snapDx;
        const finalDy = rawDy + snapDy;

        // Fast update directly to state
        setLocalObjects((prev) => {
          return prev.map((o) => {
            if (selectedIds.includes(o.id)) {
              return { ...o, x: o.x + finalDx, y: o.y + finalDy };
            }
            return o;
          });
        });
        return;
      }

      // 7. Pan Canvas
      if (isDragging.current && containerRef.current) {
        containerRef.current.scrollLeft =
          scrollLeftRef.current - (pageX - startX.current);
        containerRef.current.scrollTop =
          scrollTopRef.current - (pageY - startY.current);
      }
    });
  };

  const handleGlobalMouseUp = (_e: React.MouseEvent) => {
    // Cancel any pending animation frame
    if (rAF.current) {
      cancelAnimationFrame(rAF.current);
      rAF.current = null;
    }

    setGuides([]);

    // Check if we need to save history (snapshot diff)
    const currentSnapshot = JSON.stringify(localObjects);
    if (
      (dragTarget || resizingTarget || rotatingTarget) &&
      objectsSnapshot.current !== currentSnapshot
    ) {
      // Commit to history now that drag is done
      pushHistory(localObjects);
    }

    if (dragTarget) {
      const draggedObj = localObjects.find((o) => o.id === dragTarget.id);
      if (draggedObj) {
        // ... (Keep existing bounds check logic) ...
        const objRight = draggedObj.x + draggedObj.width;
        const objBottom = draggedObj.y + draggedObj.height;
        const isOutside =
          objRight < 0 ||
          draggedObj.x > width ||
          objBottom < 0 ||
          draggedObj.y > height;

        if (isOutside) {
          const finalObjects = localObjects.filter(
            (o) => o.id !== dragTarget.id,
          );
          setLocalObjects(finalObjects); // use setLocalObjects to avoid history spam here, or handle carefully
          pushHistory(finalObjects);
          setSelectedIds((prev) => prev.filter((id) => id !== dragTarget.id));
        }
      }
      setDragTarget(null);
    }

    // ... (Rest of cleanup logic same as before)
    if (isSelecting.current && selectionBox) {
      const selected = localObjects
        .filter(
          (obj) =>
            !obj.isLocked &&
            obj.x < selectionBox.x + selectionBox.w &&
            obj.x + obj.width > selectionBox.x &&
            obj.y < selectionBox.y + selectionBox.h &&
            obj.y + obj.height > selectionBox.y,
        )
        .map((o) => o.id);
      setSelectedIds(selected);
      setSelectionBox(null);
    }

    // Handle Drawing finishes (Rect/Pen) - essentially same logic
    if (isDrawing.current && tool === "rect" && tempRect) {
      const newObj: RectObject = {
        ...tempRect,
        id: Math.random().toString(36).substr(2, 9),
      };
      const finalObjects = [...localObjects, newObj];
      setObjects(finalObjects, true); // Save history
      setSelectedIds([newObj.id]);
      setTempRect(null);
      setTool("select");
    }
    if (isDrawing.current && tool === "pen" && currentPath.length > 1) {
      // ... (Pen logic)
      const xs = currentPath.map((p) => p.x);
      const ys = currentPath.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const width = Math.max(Math.max(...xs) - minX, 1);
      const height = Math.max(Math.max(...ys) - minY, 1);
      const newPath: PathObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: "path",
        x: minX,
        y: minY,
        width,
        height,
        rotation: 0,
        points: currentPath.map((p) => ({ x: p.x - minX, y: p.y - minY })),
        strokeColor: "#000000",
        strokeWidth: 3,
        opacity: 1,
      };
      const finalObjects = [...localObjects, newPath];
      setObjects(finalObjects, true);
      setSelectedIds([newPath.id]);
      setCurrentPath([]);
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

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          setZoom((prev) => [
            Math.min(Math.max(prev[0] + -e.deltaY * 0.05, 10), 300),
          ]);
        }
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [setZoom]);

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
    localObjects,
    selectedIds,
    tool,
    width,
    height,
    zoom,
    currentPath,
  ]);

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
            (containerRef.current.clientHeight - 80) / height,
          ) * 100,
        ),
      ]);
    }
  };

  const setDragTargetWithSnapshot = (t: any) => {
    objectsSnapshot.current = JSON.stringify(localObjects);
    setDragTarget(t);
  };
  const setResizingTargetWithSnapshot = (t: any) => {
    objectsSnapshot.current = JSON.stringify(localObjects);
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
    objects: localObjects,
    setObjects: (objs: CanvasObject[]) => setObjects(objs, true),
    selectedIds,
    setSelectedIds,
    bgColor,
    setBgColor,
    guides,
    tempRect,
    selectionBox,
    singleSelectedObject:
      selectedIds.length === 1
        ? localObjects.find((t) => t.id === selectedIds[0])
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
    handleClearSelection,
    handleDeleteSelected,
    handleStartRotation,
    handleAddText,
    handleAddImage,
    handleAddSticker,
    handleDevImageUpload,
    updateObject,
    handleLayerSelect,
    handleFit,
    setDragTarget: setDragTargetWithSnapshot,
    setResizingTarget: setResizingTargetWithSnapshot,
    toggleLock,
    isDrawing: isDrawing.current,
    currentPath,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  };
};
