import { useRef, useState, useEffect, useLayoutEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Orientation, PaperKey } from "@/pages/Home";
import { PAPER_SIZES } from "./constants";
import type {
  ToolType,
  CanvasObject,
  TextObject,
  RectObject,
  ImageObject,
} from "./types";

// Sub-components
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Footer } from "./Footer";
import { TextItem } from "./items/TextItem";
import { RectItem } from "./items/RectItem";
import { ImageItem } from "./items/ImageItem";

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
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);
  const prevZoom = useRef<number>(40);
  const shouldCenterZoom = useRef(false);
  const drawingStartPos = useRef<{ x: number; y: number } | null>(null);
  const objRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // App State
  const [zoom, setZoom] = useState<number[]>([40]);
  const [tool, setTool] = useState<ToolType>("select");
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#ffffff");

  // Animation State
  const [isClosingToolbar, setIsClosingToolbar] = useState(false);
  const [tempRect, setTempRect] = useState<RectObject | null>(null);

  // Mouse Action Targets
  const [dragTarget, setDragTarget] = useState<{ id: string } | null>(null);
  const [resizingTarget, setResizingTarget] = useState<{
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    direction?: "x" | "xy";
  } | null>(null);
  const [rotatingTarget, setRotatingTarget] = useState<{ id: string } | null>(
    null
  );

  const selectedObject = objects.find((t) => t.id === selectedId);

  // Paper Dimensions
  const { w, h } = PAPER_SIZES[paper];
  const width = orientation === "portrait" ? w : h;
  const height = orientation === "portrait" ? h : w;

  /* --- ACTIONS --- */
  // Fix: Explicitly cast updates to match specific types when passed to children
  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    setObjects((prev) =>
      prev.map(
        (obj) => (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject
      )
    );
  };

  const updateSelected = (updates: Partial<CanvasObject>) => {
    if (selectedId) updateObject(selectedId, updates);
  };

  const handleCloseToolbar = () => {
    setIsClosingToolbar(true);
    setTimeout(() => {
      setSelectedId(null);
      setIsClosingToolbar(false);
    }, 300);
  };

  const handleAddText = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newText: TextObject = {
      id: newId,
      type: "text",
      x: width / 2 - 100,
      y: height / 2 - 20,
      text: "Click to edit",
      width: 200,
      height: 50,
      rotation: 0,
      fontSize: 24,
      fontFamily: "Inter",
      color: "#000000",
      isBold: false,
      isItalic: false,
      isUnderline: false,
    };
    setObjects([...objects, newText]);
    setSelectedId(newId);
    setTool("select");
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const newId = Math.random().toString(36).substr(2, 9);

      const img = new Image();
      img.src = src;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const initialWidth = 300;
        const initialHeight = 300 / aspectRatio;

        const newImage: ImageObject = {
          id: newId,
          type: "image",
          x: width / 2 - initialWidth / 2,
          y: height / 2 - initialHeight / 2,
          width: Math.floor(initialWidth),
          height: Math.floor(initialHeight),
          rotation: 0,
          src: src,
          borderRadius: 0,
          opacity: 1,
          strokeColor: "transparent",
          strokeWidth: 0,
          // Crop removed
        };

        setObjects((prev) => [...prev, newImage]);
        setSelectedId(newId);
        setTool("select");
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setObjects((prev) => prev.filter((t) => t.id !== selectedId));
      setSelectedId(null);
    } else {
      setObjects([]);
    }
  };

  /* --- KEYBOARD SHORTCUTS --- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedId) {
          const objToDuplicate = objects.find((o) => o.id === selectedId);
          if (objToDuplicate) {
            const newId = Math.random().toString(36).substr(2, 9);
            const newObj = {
              ...objToDuplicate,
              id: newId,
              x: objToDuplicate.x + 20,
              y: objToDuplicate.y + 20,
            };
            setObjects((prev) => [...prev, newObj]);
            setSelectedId(newId);
          }
        }
      }
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "INPUT")
      ) {
        if (selectedId) handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, objects]);

  /* --- ZOOM & CANVAS LOGIC --- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const sensitivity = 0.5;
        const delta = -e.deltaY * sensitivity;
        setZoom((prev) => [Math.min(Math.max(prev[0] + delta, 10), 300)]);
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
    const container = containerRef.current;
    if (shouldCenterZoom.current) {
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } =
        container;
      container.scrollLeft = (scrollWidth - clientWidth) / 2;
      container.scrollTop = (scrollHeight - clientHeight) / 2;
      shouldCenterZoom.current = false;
      prevZoom.current = zoom[0];
      return;
    }
    if (zoom[0] !== prevZoom.current && prevZoom.current > 0) {
      const { clientWidth, clientHeight, scrollLeft, scrollTop } = container;
      const scale = zoom[0] / prevZoom.current;
      container.scrollLeft =
        (scrollLeft + clientWidth / 2) * scale - clientWidth / 2;
      container.scrollTop =
        (scrollTop + clientHeight / 2) * scale - clientHeight / 2;
      prevZoom.current = zoom[0];
    }
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }, [width, height]);

  const handleFit = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    shouldCenterZoom.current = true;
    setZoom([
      Math.floor(
        Math.min((clientWidth - 80) / width, (clientHeight - 80) / height) * 100
      ),
    ]);
  };

  /* --- MOUSE HANDLERS --- */
  const getPointerPos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (e.clientX - rect.left) / (zoom[0] / 100);
    const y = (e.clientY - rect.top) / (zoom[0] / 100);
    return { x, y };
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    const currentZoom = zoom[0] / 100;

    // 1. Drawing Rect
    if (isDrawing.current && drawingStartPos.current) {
      const { x, y } = getPointerPos(e);
      const startX = drawingStartPos.current.x;
      const startY = drawingStartPos.current.y;
      const w = Math.abs(x - startX);
      const h = Math.abs(y - startY);
      const newX = Math.min(x, startX);
      const newY = Math.min(y, startY);
      setTempRect({
        id: "temp",
        type: "rect",
        x: newX,
        y: newY,
        width: Math.max(10, w),
        height: Math.max(10, h),
        rotation: 0,
        fillColor: "transparent",
        strokeColor: "#000000",
        strokeWidth: 2,
        borderRadius: 0,
      });
      return;
    }

    // 2. Rotating
    if (rotatingTarget) {
      e.preventDefault();
      const el = objRefs.current[rotatingTarget.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = (angleRad * 180) / Math.PI;
        angleDeg -= 90;
        updateObject(rotatingTarget.id, { rotation: angleDeg });
      }
      return;
    }

    // 3. Resizing
    if (resizingTarget) {
      e.preventDefault();
      const deltaX = (e.pageX - resizingTarget.startX) / currentZoom;
      const deltaY = (e.pageY - resizingTarget.startY) / currentZoom;
      const updates: any = {};
      if (resizingTarget.direction === "x") {
        updates.width = Math.max(10, resizingTarget.startW + deltaX);
      } else {
        updates.width = Math.max(10, resizingTarget.startW + deltaX);
        updates.height = Math.max(10, resizingTarget.startH + deltaY);
      }
      updateObject(resizingTarget.id, updates);
      return;
    }

    // 4. Dragging
    if (dragTarget) {
      e.preventDefault();
      const deltaX = e.movementX / currentZoom;
      const deltaY = e.movementY / currentZoom;
      const obj = objects.find((o) => o.id === dragTarget.id);
      if (obj)
        updateObject(dragTarget.id, { x: obj.x + deltaX, y: obj.y + deltaY });
      return;
    }

    // 5. Panning
    if (isDragging.current && containerRef.current) {
      e.preventDefault();
      const x = e.pageX - containerRef.current.offsetLeft;
      const y = e.pageY - containerRef.current.offsetTop;
      containerRef.current.scrollLeft =
        scrollLeftRef.current - (x - startX.current);
      containerRef.current.scrollTop =
        scrollTopRef.current - (y - startY.current);
    }
  };

  const handleGlobalMouseUp = () => {
    if (isDrawing.current && tempRect) {
      const newObj: RectObject = {
        ...tempRect,
        id: Math.random().toString(36).substr(2, 9),
      };
      setObjects([...objects, newObj]);
      setSelectedId(newObj.id);
      setTempRect(null);
      setTool("select");
    }
    isDragging.current = false;
    isDrawing.current = false;
    drawingStartPos.current = null;
    setDragTarget(null);
    setResizingTarget(null);
    setRotatingTarget(null);
    if (containerRef.current)
      containerRef.current.style.cursor = tool === "hand" ? "grab" : "";
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).classList.contains("bg-wrapper") ||
      (e.target as HTMLElement).tagName === "CANVAS"
    ) {
      if (tool !== "draw-rect") setSelectedId(null);
    }

    if (tool === "draw-rect") {
      isDrawing.current = true;
      drawingStartPos.current = getPointerPos(e);
      return;
    }

    if (tool === "hand" || e.button === 1) {
      if (!containerRef.current) return;
      isDragging.current = true;
      startX.current = e.pageX - containerRef.current.offsetLeft;
      startY.current = e.pageY - containerRef.current.offsetTop;
      scrollLeftRef.current = containerRef.current.scrollLeft;
      scrollTopRef.current = containerRef.current.scrollTop;
      containerRef.current.style.cursor = "grabbing";
    }
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
        selectedId={selectedId}
      />

      <Toolbar
        selectedObject={selectedObject}
        updateSelected={updateSelected}
        handleCloseToolbar={handleCloseToolbar}
        isClosingToolbar={isClosingToolbar}
      />

      {/* WORKSPACE */}
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
                className="relative shadow-xl border border-gray-200"
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

                {/* OBJECTS LAYER */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                  {objects.map((obj) => {
                    const commonProps = {
                      key: obj.id,
                      zoom: zoom[0],
                      isSelected: selectedId === obj.id,
                      tool,
                      setDragTarget,
                      setSelectedId,
                      setResizingTarget,
                      setRotatingTarget,
                      // Fixed braces for void return
                      innerRef: (el: HTMLDivElement | null) => {
                        objRefs.current[obj.id] = el;
                      },
                    };

                    if (obj.type === "text") {
                      return (
                        <TextItem
                          obj={obj}
                          {...commonProps}
                          onUpdate={updateObject as any}
                        />
                      );
                    }
                    if (obj.type === "rect") {
                      return <RectItem obj={obj} {...commonProps} />;
                    }
                    if (obj.type === "image") {
                      return <ImageItem obj={obj} {...commonProps} />;
                    }
                    return null;
                  })}
                  {/* DRAWING PREVIEW */}
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
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Add Background</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </main>

      <Footer zoom={zoom} setZoom={setZoom} handleFit={handleFit} />
    </div>
  );
}
