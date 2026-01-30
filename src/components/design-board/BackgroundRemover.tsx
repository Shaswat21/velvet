import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { removeBackground } from "@imgly/background-removal";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Eraser,
  Brush,
  Loader2,
  Check,
  Wand2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  MousePointer2,
  Circle,
  CircleDashed,
  Pipette,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface BackgroundRemoverProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (newSrc: string) => void;
}

export const BackgroundRemover = ({
  imageSrc,
  isOpen,
  onClose,
  onApply,
}: BackgroundRemoverProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // --- TOOLS STATE ---
  const [activeTool, setActiveTool] = useState<"brush" | "magic">("brush");
  const [brushMode, setBrushMode] = useState<"erase" | "restore">("erase");

  const [brushType, setBrushType] = useState<"hard" | "soft">("hard");
  const [brushSize, setBrushSize] = useState(50);
  const [magicTolerance, setMagicTolerance] = useState(20);

  const [isCursorVisible, setIsCursorVisible] = useState(false);

  // --- ZOOM & PAN STATE ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressed = useRef(false);

  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  // Refs
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setPan({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      originalImageRef.current = img;
      initCanvas(img.width, img.height);
      resetMask();
      renderCanvas();

      if (containerEl) {
        const padding = 40;
        const availableWidth = containerEl.clientWidth - padding;
        const availableHeight = containerEl.clientHeight - padding;
        const scaleX = availableWidth / img.width;
        const scaleY = availableHeight / img.height;
        const fitZoom = Math.min(scaleX, scaleY, 1);
        setZoom(fitZoom);
      }
    };
  }, [isOpen, imageSrc, containerEl]);

  // Native Zoom Handler
  useEffect(() => {
    if (!containerEl || !isOpen) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.1), 10));
      } else {
        setPan((prev) => ({ ...prev, y: prev.y - e.deltaY }));
      }
    };

    containerEl.addEventListener("wheel", handleWheelNative, {
      passive: false,
    });
    return () => containerEl.removeEventListener("wheel", handleWheelNative);
  }, [containerEl, isOpen]);

  // Keyboard Handlers
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        isSpacePressed.current = true;
        if (containerEl) containerEl.style.cursor = "grab";
        setIsCursorVisible(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressed.current = false;
        setIsPanning(false);
        lastPanPos.current = null;
        setIsCursorVisible(true);
        if (containerEl) containerEl.style.cursor = "none";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, containerEl]);

  const initCanvas = (w: number, h: number) => {
    if (canvasRef.current) {
      canvasRef.current.width = w;
      canvasRef.current.height = h;
    }
    const mc = document.createElement("canvas");
    mc.width = w;
    mc.height = h;
    maskCanvasRef.current = mc;

    const sc = document.createElement("canvas");
    sc.width = w;
    sc.height = h;
    const sCtx = sc.getContext("2d");
    if (sCtx && originalImageRef.current) {
      sCtx.drawImage(originalImageRef.current, 0, 0, w, h);
    }
    sourceCanvasRef.current = sc;
  };

  const resetMask = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
    ctx.fillRect(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height,
    );
  };

  const handleAutoRemove = async () => {
    if (!originalImageRef.current) return;
    setIsProcessing(true);
    try {
      const blob = await removeBackground(originalImageRef.current.src);
      const url = URL.createObjectURL(blob);
      const aiImg = new Image();
      aiImg.src = url;
      aiImg.onload = () => {
        if (maskCanvasRef.current) {
          const ctx = maskCanvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              maskCanvasRef.current.width,
              maskCanvasRef.current.height,
            );
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(
              aiImg,
              0,
              0,
              maskCanvasRef.current.width,
              maskCanvasRef.current.height,
            );
            renderCanvas();
          }
        }
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("BG Removal Error:", error);
      toast.error("Failed to remove background.");
      setIsProcessing(false);
    }
  };

  const renderCanvas = () => {
    if (
      !canvasRef.current ||
      !originalImageRef.current ||
      !maskCanvasRef.current
    )
      return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    ctx.clearRect(0, 0, w, h);

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(originalImageRef.current, 0, 0, w, h);

    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvasRef.current, 0, 0, w, h);

    ctx.globalCompositeOperation = "source-over";
  };

  const handleZoom = (newZoom: number) => {
    setZoom(Math.min(Math.max(newZoom, 0.1), 5));
  };

  const getPointerPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  };

  const updateCursor = (e: React.MouseEvent) => {
    if (!cursorRef.current || isPanning || isSpacePressed.current) {
      setIsCursorVisible(false);
      if (containerEl)
        containerEl.style.cursor = isPanning
          ? "grabbing"
          : isSpacePressed.current
            ? "grab"
            : "default";
      return;
    }

    setIsCursorVisible(true);
    if (containerEl) containerEl.style.cursor = "none";

    if (activeTool === "magic") {
      // MAGIC WAND (MAP PIN) STYLE
      cursorRef.current.style.width = `auto`;
      cursorRef.current.style.height = `auto`;
      cursorRef.current.style.border = "none";
      cursorRef.current.style.borderRadius = "0";
      cursorRef.current.style.backgroundColor = "transparent";
      cursorRef.current.style.boxShadow = "none";

      // ALIGNMENT:
      // translate(-50%, -100%): Centers horizontally, Bottom aligns to Y.
      // This ensures the TIP of the pin is at the click point.
      cursorRef.current.style.transform = `translate(-50%, -100%)`;
    } else {
      // BRUSH STYLE
      cursorRef.current.style.width = `${brushSize}px`;
      cursorRef.current.style.height = `${brushSize}px`;
      cursorRef.current.style.border =
        brushType === "soft" ? "1px dashed white" : "1px solid white";
      cursorRef.current.style.borderRadius = "50%";
      cursorRef.current.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
      cursorRef.current.style.boxShadow = "0 0 2px rgba(0,0,0,0.8)";
      cursorRef.current.style.transform = `translate(-50%, -50%)`;
    }

    cursorRef.current.style.left = `${e.clientX}px`;
    cursorRef.current.style.top = `${e.clientY}px`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.button === 1 || (e.button === 0 && isSpacePressed.current)) {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0 && isCursorVisible) {
      const pos = getPointerPos(e);
      if (activeTool === "brush") {
        lastPos.current = null;
        performBrushDraw(pos.x, pos.y, true);
      } else if (activeTool === "magic") {
        performMagicErase(pos.x, pos.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (isPanning && lastPanPos.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    updateCursor(e);

    if (
      e.buttons === 1 &&
      !isSpacePressed.current &&
      activeTool === "brush" &&
      isCursorVisible
    ) {
      const pos = getPointerPos(e);
      performBrushDraw(pos.x, pos.y, false);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    lastPos.current = null;
    if (isPanning) {
      setIsPanning(false);
      lastPanPos.current = null;
      if (containerEl) containerEl.style.cursor = "none";
    }
  };

  const handleMouseLeave = () => {
    setIsCursorVisible(false);
    lastPos.current = null;
    setIsPanning(false);
    if (containerEl) containerEl.style.cursor = "default";
  };

  const performBrushDraw = (x: number, y: number, isStart = false) => {
    if (!maskCanvasRef.current || !canvasRef.current) return;
    const mCtx = maskCanvasRef.current.getContext("2d");
    if (!mCtx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = canvasRef.current.width / rect.width;
    const scaledBrushSize = brushSize * scaleFactor;

    if (brushType === "soft") {
      const radius = scaledBrushSize / 2;
      const gradient = mCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.3, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      mCtx.fillStyle = gradient;
      mCtx.strokeStyle = "transparent";
    } else {
      mCtx.fillStyle = "rgba(0,0,0,1)";
      mCtx.strokeStyle = "rgba(0,0,0,1)";
    }

    mCtx.globalCompositeOperation =
      brushMode === "erase" ? "destination-out" : "source-over";

    if (isStart || !lastPos.current) {
      mCtx.beginPath();
      mCtx.arc(x, y, scaledBrushSize / 2, 0, Math.PI * 2);
      mCtx.fill();
    } else {
      const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
      const angle = Math.atan2(y - lastPos.current.y, x - lastPos.current.x);

      if (brushType === "hard") {
        mCtx.lineWidth = scaledBrushSize;
        mCtx.lineCap = "round";
        mCtx.lineJoin = "round";
        mCtx.beginPath();
        mCtx.moveTo(lastPos.current.x, lastPos.current.y);
        mCtx.lineTo(x, y);
        mCtx.stroke();
      } else {
        const stepSize = scaledBrushSize * 0.1;
        for (let i = 0; i < dist; i += stepSize) {
          const ix = lastPos.current.x + Math.cos(angle) * i;
          const iy = lastPos.current.y + Math.sin(angle) * i;
          const radius = scaledBrushSize / 2;
          const g = mCtx.createRadialGradient(ix, iy, 0, ix, iy, radius);
          g.addColorStop(0, "rgba(0,0,0,1)");
          g.addColorStop(0.3, "rgba(0,0,0,1)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          mCtx.fillStyle = g;
          mCtx.beginPath();
          mCtx.arc(ix, iy, radius, 0, Math.PI * 2);
          mCtx.fill();
        }
      }
    }

    lastPos.current = { x, y };
    renderCanvas();
  };

  const performMagicErase = (startX: number, startY: number) => {
    if (!sourceCanvasRef.current || !maskCanvasRef.current) return;
    const w = sourceCanvasRef.current.width;
    const h = sourceCanvasRef.current.height;

    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

    const srcCtx = sourceCanvasRef.current.getContext("2d");
    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!srcCtx || !maskCtx) return;

    const srcData = srcCtx.getImageData(0, 0, w, h).data;
    const maskImgData = maskCtx.getImageData(0, 0, w, h);
    const maskData = maskImgData.data;

    const startIdx = (startY * w + startX) * 4;
    const targetR = srcData[startIdx];
    const targetG = srcData[startIdx + 1];
    const targetB = srcData[startIdx + 2];

    const tolerance = magicTolerance;
    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    const matchColor = (idx: number) => {
      const r = srcData[idx];
      const g = srcData[idx + 1];
      const b = srcData[idx + 2];
      const diff =
        Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
      return diff <= tolerance * 3;
    };

    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const idx = (cy * w + cx) * 4;
      const visitedIdx = cy * w + cx;

      if (visited[visitedIdx]) continue;
      visited[visitedIdx] = 1;

      if (matchColor(idx)) {
        if (brushMode === "erase") {
          maskData[idx] = 0;
          maskData[idx + 1] = 0;
          maskData[idx + 2] = 0;
          maskData[idx + 3] = 0;
        } else {
          maskData[idx] = 255;
          maskData[idx + 1] = 255;
          maskData[idx + 2] = 255;
          maskData[idx + 3] = 255;
        }

        if (cx > 0) stack.push([cx - 1, cy]);
        if (cx < w - 1) stack.push([cx + 1, cy]);
        if (cy > 0) stack.push([cx, cy - 1]);
        if (cy < h - 1) stack.push([cx, cy + 1]);
      }
    }

    maskCtx.putImageData(maskImgData, 0, 0);
    renderCanvas();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const newSrc = canvasRef.current.toDataURL("image/png");
    onApply(newSrc);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) onClose();
  };

  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    if (containerEl && originalImageRef.current) {
      const img = originalImageRef.current;
      const padding = 40;
      const availableWidth = containerEl.clientWidth - padding;
      const availableHeight = containerEl.clientHeight - padding;
      const scaleX = availableWidth / img.width;
      const scaleY = availableHeight / img.height;
      setZoom(Math.min(scaleX, scaleY, 1));
    } else {
      setZoom(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        // Prevent closing when clicking outside
        onPointerDownOutside={(e) => e.preventDefault()}
        className="w-[95vw]! max-w-350! h-[90vh] flex flex-col p-0 gap-0 overflow-hidden outline-none [&>button]:hidden"
      >
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>Background Editor</DialogTitle>
              <DialogDescription>
                Auto-remove or use the brush to refine
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetMask();
                  renderCanvas();
                }}
                disabled={isProcessing}
              >
                <Undo2 className="w-4 h-4 mr-2" /> Reset Mask
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* WORKSPACE */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Custom Cursor Portal */}
          {isOpen &&
            createPortal(
              <div
                ref={cursorRef}
                className="fixed pointer-events-none z-100000"
                style={{
                  display: isCursorVisible ? "flex" : "none",
                  position: "fixed",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* MAP PIN ICON: Mirrored (rotate-45) and anchored at bottom tip */}
                {activeTool === "magic" && (
                  <MapPin
                    className="w-6 h-6 text-black fill-black stroke-white stroke-[1.5px] rotate-135 origin-bottom"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                  />
                )}
              </div>,
              document.body,
            )}

          {/* LEFT SIDEBAR */}
          <div className="w-72 border-r bg-muted/20 p-5 flex flex-col gap-6 overflow-y-auto shrink-0 z-20">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5" /> AI Auto-Remove
              </span>
              <Button
                className="w-full gap-2"
                onClick={handleAutoRemove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {isProcessing ? "Processing..." : "Remove Background"}
              </Button>
            </div>
            <Separator />

            <div className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MousePointer2 className="w-3.5 h-3.5" /> Editing Tools
              </span>

              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeTool === "brush" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setActiveTool("brush")}
                >
                  <Brush className="w-3 h-3 mr-2" /> Brush
                </Button>
                <Button
                  variant={activeTool === "magic" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setActiveTool("magic")}
                >
                  <Pipette className="w-3 h-3 mr-2" /> Magic
                </Button>
              </div>

              <Tabs
                value={brushMode}
                onValueChange={(val) =>
                  setBrushMode(val as "erase" | "restore")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="erase"
                    className="flex items-center gap-2"
                  >
                    <Eraser className="w-4 h-4" /> Erase
                  </TabsTrigger>
                  <TabsTrigger
                    value="restore"
                    className="flex items-center gap-2"
                  >
                    <Brush className="w-4 h-4" /> Restore
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTool === "brush" ? (
                <>
                  <div className="flex gap-2 p-1 bg-muted rounded-lg mt-2">
                    <Button
                      variant={brushType === "hard" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setBrushType("hard")}
                    >
                      <Circle className="w-3 h-3 mr-2 fill-current" /> Hard
                    </Button>
                    <Button
                      variant={brushType === "soft" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setBrushType("soft")}
                    >
                      <CircleDashed className="w-3 h-3 mr-2" /> Soft
                    </Button>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Brush Size</span>
                      <span className="text-muted-foreground">
                        {brushSize}px
                      </span>
                    </div>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(val) => setBrushSize(val[0])}
                      min={5}
                      max={200}
                      step={5}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Tolerance</span>
                    <span className="text-muted-foreground">
                      {magicTolerance}
                    </span>
                  </div>
                  <Slider
                    value={[magicTolerance]}
                    onValueChange={(val) => setMagicTolerance(val[0])}
                    min={1}
                    max={100}
                    step={1}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Click a color on the image to remove all similar connected
                    pixels.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-auto p-3 rounded-lg border text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <Hand className="w-3 h-3" />{" "}
                <span>
                  <b>Space + Drag</b> to Pan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomIn className="w-3 h-3" />{" "}
                <span>
                  <b>Ctrl + Scroll</b> to Zoom
                </span>
              </div>
            </div>
          </div>

          {/* MAIN CANVAS CONTAINER */}
          <div
            ref={setContainerEl}
            // Block image dragging explicitly
            onDragStart={(e) => e.preventDefault()}
            className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center touch-none outline-none select-none"
            style={{ cursor: "none" }} // ALWAYS NONE
            tabIndex={-1}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            ></div>

            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center",
                transition: isPanning ? "none" : "transform 0.1s ease-out",
                cursor:
                  isPanning || isSpacePressed.current ? "grabbing" : "default",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: originalImageRef.current?.width,
                  height: originalImageRef.current?.height,
                }}
              >
                <img
                  src={imageSrc}
                  draggable={false}
                  alt="Reference"
                  className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300 ${brushMode === "restore" ? "opacity-40 grayscale-50 blur-[0.5px]" : "opacity-0"}`}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full shadow-lg border border-border/50"
                  style={{ cursor: isSpacePressed.current ? "grab" : "none" }}
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-1.5 rounded-lg shadow-lg border flex items-center gap-1 z-30">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleZoom(zoom - 0.1)}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleZoom(zoom + 0.1)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleResetView}
                title="Fit to Screen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isProcessing}
              className="min-w-25"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
