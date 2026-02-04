import { useState, useMemo, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  ImageOff,
  X,
  Sticker,
  PaintBucket,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Upload,
  Layers,
  ArrowDown,
  Lock,
  LockOpen,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import type { CanvasObject, ImageObject } from "@/lib/types";

// --- 1. ASSET LOADING ---
const stickerModules = import.meta.glob("/src/assets/stickers/**/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const gradientModules = import.meta.glob(
  "/src/assets/gradients/**/*.{svg,png,jpg,jpeg}",
  { eager: true, query: "?url", import: "default" },
);
const illustrationModules = import.meta.glob(
  "/src/assets/illustrations/**/*.{svg,png,jpg,jpeg}",
  { eager: true, query: "?url", import: "default" },
);
const maskModules = import.meta.glob(
  "/src/assets/masks/**/*.{svg,png,jpg,jpeg,webp}",
  { eager: true, query: "?url", import: "default" },
);

interface AssetData {
  name: string;
  url: string;
  category: string;
}

// --- 2. DATA HELPER ---
const parseAssets = (modules: Record<string, unknown>) => {
  const processed: Record<string, AssetData[]> = {};
  Object.entries(modules).forEach(([path, module]) => {
    const parts = path.split("/");
    const filename = parts.pop();
    const category = parts.pop();
    if (!filename || !category) return;

    const name = filename.replace(/\.[^/.]+$/, "");
    const url = module as string;

    if (!processed[category]) processed[category] = [];
    processed[category].push({ name, url, category });
  });
  return processed;
};

// --- Helper: Crop Image to Content (Remove White/Transparent Background) ---
const cropImageToContent = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      // Scan for non-white pixels
      // We consider "white" as r > 240 && g > 240 && b > 240
      // Also skip transparent pixels if any (shouldn't be for jpgs but good to check)
      let found = false;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // If pixel is NOT white (and not fully transparent)
          // Threshold 230 allows removing light gray/compression artifacts
          if (a > 0 && (r < 230 || g < 230 || b < 230)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (!found) {
        resolve(src); // Return original if empty (all white)
        return;
      }

      // Add a small padding (optional, maybe 0)
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;

      // Create new canvas for cropped image
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = w;
      croppedCanvas.height = h;
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) {
        resolve(src);
        return;
      }
      croppedCtx.drawImage(img, minX, minY, w, h, 0, 0, w, h);
      resolve(croppedCanvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

// --- 3. BLEND GENERATOR COMPONENT ---
const BlendGenerator = ({
  onSelect,
  selectedObject,
}: {
  onSelect: (url: string, type: string) => void;
  selectedObject?: CanvasObject | null;
}) => {
  const [bottomImg, setBottomImg] = useState<string | null>(null);
  const [topImg, setTopImg] = useState<string | null>(null);
  const [topImgDims, setTopImgDims] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [bottomImgDims, setBottomImgDims] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [blendMode, setBlendMode] = useState<string>("lighten");
  const [isGenerating, setIsGenerating] = useState(false);

  // Transform State
  const [activeLayer, setActiveLayer] = useState<"bottom" | "top">("bottom");
  const [bottomTra, setBottomTra] = useState({ x: 0, y: 0, scale: 1 });
  const [topTra, setTopTra] = useState({ x: 0, y: 0, scale: 1 });
  const [bottomLocked, setBottomLocked] = useState(true);
  const [topLocked, setTopLocked] = useState(false);

  const fileInputBottomRef = useRef<HTMLInputElement>(null);
  const fileInputTopRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  // Helper: Calculate clamped transform to ensure "cover"
  const getClampedTransform = (
    current: { x: number; y: number; scale: number },
    imgDims: { w: number; h: number } | null,
    containerDims: { w: number; h: number } | null,
    isDelta: boolean = false, // If true, current values are DELTAS to add
    baseTransform?: { x: number; y: number; scale: number },
    constrain: boolean = true,
  ) => {
    // If we don't have dimensions, just allow it or return current.
    // However, since we use w-full h-full, we conceptually know dimensions match container.
    // But we keep null checks for safety.
    if (!imgDims || !containerDims) return current;

    // With w-full h-full elements:
    // Scale 1 = Element matches container size exactly.
    // minScale should be 1 if we want to ensure "Cover".
    const minScale = 1;

    let newScale = isDelta
      ? (baseTransform?.scale || 1) + current.scale
      : current.scale;

    // Constrain scale
    if (constrain) {
      newScale = Math.max(minScale, Math.min(5, newScale));
    } else {
      newScale = Math.max(0.1, Math.min(10, newScale));
    }

    // Calculate bounds for X/Y
    // Since element size = container size * scale:
    // limit = 0.5 * (scale - 1)
    const limitX = Math.max(0, 0.5 * (newScale - 1));
    const limitY = Math.max(0, 0.5 * (newScale - 1));

    let newX = isDelta ? (baseTransform?.x || 0) + current.x : current.x;
    let newY = isDelta ? (baseTransform?.y || 0) + current.y : current.y;

    // Clamp
    if (constrain) {
      newX = Math.max(-limitX, Math.min(limitX, newX));
      newY = Math.max(-limitY, Math.min(limitY, newY));
    }

    return { x: newX, y: newY, scale: newScale };
  };

  // Load dimensions whenever topImg changes
  useEffect(() => {
    if (topImg) {
      const img = new Image();
      img.src = topImg;
      img.onload = () => {
        const tDims = { w: img.naturalWidth, h: img.naturalHeight };
        setTopImgDims(tDims);
        // Reset top to cover (scale 1 usually works if top defines container, but calc just in case)
        const initTra = getClampedTransform(
          { x: 0, y: 0, scale: 1 },
          tDims,
          tDims,
        );
        setTopTra(initTra);
      };
    } else {
      setTopImgDims(null);
    }
  }, [topImg]);

  // Load dimensions & Reset bottom transform when image changes
  useEffect(() => {
    if (bottomImg) {
      const img = new Image();
      img.src = bottomImg;
      img.onload = () => {
        setBottomImgDims({ w: img.naturalWidth, h: img.naturalHeight });
        // NOTE: We can't set transform here because topImgDims might not be ready
        // We do it in a separate effect dependent on both.
      };
    } else {
      setBottomImgDims(null);
    }
  }, [bottomImg]);

  // Sync Bottom Transform Init
  useEffect(() => {
    if (bottomImgDims && topImgDims) {
      const initTra = getClampedTransform(
        { x: 0, y: 0, scale: 0 }, // Scale 0 forces calculation of minScale
        bottomImgDims,
        topImgDims,
      );
      setBottomTra(initTra);
    }
  }, [bottomImgDims, topImgDims]);

  // --- INTERACTION HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!bottomImg || !topImg) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !previewRef.current) return;

      const rect = previewRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      dragRef.current = { startX: e.clientX, startY: e.clientY };

      const dPctX = dx / rect.width;
      const dPctY = dy / rect.height;

      if (activeLayer === "bottom") {
        setBottomTra((prev) =>
          getClampedTransform(
            { x: dPctX, y: dPctY, scale: 0 },
            bottomImgDims,
            topImgDims,
            true,
            prev,
            bottomLocked, // Use state
          ),
        );
      } else {
        setTopTra((prev) =>
          getClampedTransform(
            { x: dPctX, y: dPctY, scale: 0 },
            topImgDims,
            topImgDims,
            true,
            prev,
            topLocked, // Use state
          ),
        );
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    activeLayer,
    bottomImg,
    topImg,
    bottomImgDims,
    topImgDims,
    bottomLocked,
    topLocked,
  ]);

  // Fix: Use non-passive listener to prevent sidebar scroll
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!bottomImg || !topImg) return;
      e.preventDefault();
      e.stopPropagation();

      const sensitivity = 0.001;
      const delta = -e.deltaY * sensitivity;

      if (activeLayer === "bottom") {
        setBottomTra((prev) =>
          getClampedTransform(
            { x: 0, y: 0, scale: delta },
            bottomImgDims,
            topImgDims,
            true,
            prev,
            bottomLocked, // Use state
          ),
        );
      } else {
        setTopTra((prev) =>
          getClampedTransform(
            { x: 0, y: 0, scale: delta },
            topImgDims,
            topImgDims,
            true,
            prev,
            topLocked, // Use state
          ),
        );
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [
    activeLayer,
    bottomImg,
    topImg,
    bottomImgDims,
    topImgDims,
    bottomLocked,
    topLocked,
  ]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSrc: (s: string) => void,
    isTopLayer: boolean = false,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        if (isTopLayer) {
          const cropped = await cropImageToContent(result);
          setSrc(cropped);
        } else {
          setSrc(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

// --- Helper: Flatten Image Edits (Flip, Crop, Zoom, etc.) ---
const flattenImageEdits = async (obj: ImageObject): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // The canvas size matches the object's container frame
      canvas.width = obj.width;
      canvas.height = obj.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(obj.src);
        return;
      }

      // 1. Calculate Rendered Dimensions (Simulate object-fit: cover logic)
      const containerRatio = obj.width / obj.height;
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      
      let renderW, renderH;
      if (containerRatio > naturalRatio) {
        renderW = obj.width;
        renderH = obj.width / naturalRatio;
      } else {
        renderH = obj.height;
        renderW = obj.height * naturalRatio;
      }

      // 2. Prepare Context
      ctx.save();
      
      // Move to Center of Canvas
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // 3. Apply Edits
      const imgX = (obj as any).imageX ?? 0;
      const imgY = (obj as any).imageY ?? 0;
      const imgScale = (obj as any).imageScale ?? 1;

      // Panning (based on ImageItem logic: translate(imgX * imgScale * 100 %))
      // The % is relative to the *rendered image size* (the element size).
      const translateX = imgX * imgScale * renderW;
      const translateY = imgY * imgScale * renderH;
      ctx.translate(translateX, translateY);

      // Zoom
      ctx.scale(imgScale, imgScale);

      // Flip
      const scaleX = obj.flipX ? -1 : 1;
      const scaleY = obj.flipY ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      // 4. Draw Image Centered
      ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

      ctx.restore();
      
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(obj.src);
    img.src = obj.src;
  });
};

  const handleUseSelected = async (
    setSrc: (s: string) => void,
    isTopLayer: boolean = false,
  ) => {
    if (selectedObject) {
      if (selectedObject.type === "image" || (selectedObject as any).src) {
        const imgObj = selectedObject as unknown as ImageObject;
        // Flatten edits (Flip/Size) before using
        let src = await flattenImageEdits(imgObj);
        
        if (isTopLayer) {
          src = await cropImageToContent(src);
        }
        setSrc(src);
      }
    }
  };

  const handleGenerate = () => {
    if (!bottomImg || !topImg) return;
    setIsGenerating(true);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img1 = new Image();
    const img2 = new Image();

    img1.crossOrigin = "anonymous";
    img2.crossOrigin = "anonymous";

    img2.src = topImg;
    img2.onload = () => {
      // 1. Set Canvas to Match Top Image (The Frame)
      canvas.width = img2.width;
      canvas.height = img2.height;

      img1.src = bottomImg;
      img1.onload = () => {
        if (!ctx) return;

        // 2. Calculate "Cover" Scale for Bottom Image
        const scale = Math.max(
          canvas.width / img1.width,
          canvas.height / img1.height,
        );
        const w = img1.width * scale;
        const h = img1.height * scale;

        // --- DRAW BOTTOM LAYER ---
        ctx.save();
        ctx.translate(
          canvas.width / 2 + bottomTra.x * canvas.width,
          canvas.height / 2 + bottomTra.y * canvas.height,
        );
        ctx.scale(bottomTra.scale, bottomTra.scale);
        ctx.drawImage(img1, -w / 2, -h / 2, w, h);
        ctx.restore();

        // --- DRAW TOP LAYER ---
        ctx.save();
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
        ctx.translate(
          canvas.width / 2 + topTra.x * canvas.width,
          canvas.height / 2 + topTra.y * canvas.height,
        );
        ctx.scale(topTra.scale, topTra.scale);
        ctx.drawImage(
          img2,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height,
        );
        ctx.restore();

        const resultUrl = canvas.toDataURL("image/webp");
        onSelect(resultUrl, "image");

        setIsGenerating(false);
        // setBottomImg(null); // Keep images for further editing
        // setTopImg(null);
      };
    };
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 h-full">
        <div className="p-4 flex flex-col gap-6">
          {/* Bottom Layer Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Bottom Layer
            </Label>
            <div className="flex gap-2">
              <div
                className={cn(
                  "w-20 h-20 border border-dashed rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:bg-accent transition-colors shrink-0",
                  activeLayer === "bottom"
                    ? "bg-accent border-primary"
                    : "bg-muted",
                )}
                onClick={() => {
                  setActiveLayer("bottom");
                  fileInputBottomRef.current?.click();
                }}
              >
                {bottomImg ? (
                  <img
                    src={bottomImg}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col justify-center gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveLayer("bottom");
                    fileInputBottomRef.current?.click();
                  }}
                  className="text-xs h-7 justify-start"
                >
                  <Upload className="w-3 h-3 mr-2" /> Upload Image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveLayer("bottom");
                    handleUseSelected(setBottomImg);
                  }}
                  disabled={!selectedObject || selectedObject.type !== "image"}
                  className="text-xs h-7 justify-start"
                >
                  <Layers className="w-3 h-3 mr-2" /> Use Selected
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputBottomRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setBottomImg, false)}
              />
            </div>
          </div>

          <div className="flex justify-center -my-2 text-muted-foreground/30">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Top Layer Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Top Layer (Blend/Mask)
            </Label>
            <div className="flex gap-2">
              <div
                className={cn(
                  "w-20 h-20 border border-dashed rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:bg-accent transition-colors shrink-0",
                  activeLayer === "top"
                    ? "bg-accent border-primary"
                    : "bg-muted",
                )}
                onClick={() => {
                  setActiveLayer("top");
                  fileInputTopRef.current?.click();
                }}
              >
                {topImg ? (
                  <img
                    src={topImg}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col justify-center gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveLayer("top");
                    fileInputTopRef.current?.click();
                  }}
                  className="text-xs h-7 justify-start"
                >
                  <Upload className="w-3 h-3 mr-2" /> Upload Image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveLayer("top");
                    handleUseSelected(setTopImg, true);
                  }}
                  disabled={!selectedObject || selectedObject.type !== "image"}
                  className="text-xs h-7 justify-start"
                >
                  <Layers className="w-3 h-3 mr-2" /> Use Selected
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputTopRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setTopImg, true)}
              />
            </div>
          </div>

          {/* Blend Mode */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Blend Mode
            </Label>
            <Select value={blendMode} onValueChange={setBlendMode}>
              <SelectTrigger className="capitalize w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "multiply",
                  "screen",
                  "overlay",
                  "darken",
                  "lighten",
                  "color-dodge",
                  "difference",
                ].map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layer Selection & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Preview & Adjust
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (activeLayer === "bottom")
                      setBottomLocked(!bottomLocked);
                    else setTopLocked(!topLocked);
                  }}
                  title={
                    (activeLayer === "bottom" ? bottomLocked : topLocked)
                      ? "Unlock Layer"
                      : "Lock Layer"
                  }
                >
                  {(activeLayer === "bottom" ? bottomLocked : topLocked) ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <LockOpen className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="flex bg-muted rounded-md p-0.5">
                <button
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase font-bold rounded-sm transition-all",
                    activeLayer === "bottom"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setActiveLayer("bottom")}
                >
                  Bottom
                </button>
                <button
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase font-bold rounded-sm transition-all",
                    activeLayer === "top"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setActiveLayer("top")}
                >
                  Top
                </button>
              </div>
            </div>

            <div
              ref={previewRef}
              className="aspect-video w-full bg-muted rounded-md border flex items-center justify-center overflow-hidden bg-checkered relative cursor-move touch-none"
              onMouseDown={handleMouseDown}
            >
              {bottomImg && topImg && topImgDims ? (
                <div
                  className="relative shadow-sm"
                  style={{
                    height: "100%",
                    aspectRatio: `${topImgDims.w} / ${topImgDims.h}`,
                    maxWidth: "100%",
                  }}
                >
                  {/* Bottom Image */}
                  <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                    <img
                      src={bottomImg}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${bottomTra.x * 100}%, ${bottomTra.y * 100}%) scale(${bottomTra.scale})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>

                  {/* Top Image */}
                  <div 
                    className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none"
                    style={{ mixBlendMode: blendMode as any }}
                  >
                    <img
                      src={topImg}
                      className="w-full h-full object-fill"
                      style={{
                        transform: `translate(${topTra.x * 100}%, ${topTra.y * 100}%) scale(${topTra.scale})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Select both images</p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Drag to pan • Scroll to zoom selected layer
            </p>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!bottomImg || !topImg || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? "Generating..." : "Insert Blended Image"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
};

// --- 4. ASSET GRID COMPONENT (Unchanged) ---
const LibraryAssetGrid = ({
  data,
  type,
  onSelect,
}: {
  data: Record<string, AssetData[]>;
  type: string;
  onSelect: (url: string, type: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
    const result: Record<string, AssetData[]> = {};

    Object.entries(data).forEach(([category, items]) => {
      const c = category.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (c.includes(q)) {
        result[category] = items;
      } else {
        const matching = items.filter((item) =>
          item.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(q),
        );
        if (matching.length > 0) result[category] = matching;
      }
    });
    return result;
  }, [data, searchQuery]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pb-4 sticky top-0 bg-white z-20 pt-2 border-b border-transparent">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 h-full">
        <div className="px-4 pb-20 pt-2 flex flex-col gap-6">
          {Object.keys(filteredData).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageOff className="h-10 w-10 opacity-20 mb-2" />
              <p className="text-sm">No items found.</p>
            </div>
          ) : (
            Object.entries(filteredData).map(([category, items]) => (
              <div key={category} className="relative">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 border-b border-transparent">
                  {category}
                </h3>
                <div
                  className={cn(
                    "grid gap-2",
                    type === "gradients" ? "grid-cols-2" : "grid-cols-3",
                  )}
                >
                  {items.map((item) => (
                    <Button
                      key={item.url}
                      variant="outline"
                      className={cn(
                        "w-full p-2 h-auto aspect-square flex items-center justify-center text-xs overflow-hidden",
                        type === "masks" && "bg-[#202020]",
                        type === "gradients" && "aspect-video",
                      )}
                      onClick={() => onSelect(item.url, type.slice(0, -1))}
                      title={item.name}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className={cn(
                          "pointer-events-none transition-transform duration-200",
                          type === "gradients"
                            ? "object-cover w-full h-full rounded-sm"
                            : "object-contain max-w-full max-h-full hover:scale-110",
                        )}
                        loading="lazy"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// --- 5. MAIN LIBRARY PANEL ---
interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, type: string) => void;
  selectedObject?: CanvasObject | null;
}

type LibraryCategory = "stickers" | "gradients" | "illustrations" | "masks" | "effects";

export const LibraryPanel = ({
  isOpen,
  onClose,
  onSelect,
  selectedObject,
}: LibraryPanelProps) => {
  const stickers = useMemo(() => parseAssets(stickerModules), []);
  const gradients = useMemo(() => parseAssets(gradientModules), []);
  const illustrations = useMemo(() => parseAssets(illustrationModules), []);
  const masks = useMemo(() => parseAssets(maskModules), []);

  const [activeCategory, setActiveCategory] =
    useState<LibraryCategory>("stickers");
  const [view, setView] = useState<"menu" | "content">("menu");

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("menu");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const categories = [
    { id: "stickers", label: "Stickers", icon: Sticker },
    { id: "gradients", label: "Gradients", icon: PaintBucket },
    { id: "illustrations", label: "Illustrations", icon: ImageIcon },
    { id: "masks", label: "Masks", icon: Scissors },
    { id: "effects", label: "Effects", icon: Wand2 },
  ] as const;

  const handleCategoryClick = (id: LibraryCategory) => {
    setActiveCategory(id);
    setView("content");
  };

  return (
    <div
      className={cn(
        "fixed top-16 bottom-14 left-0 w-80 bg-white shadow-xl border-r z-40 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div
        className="flex h-full w-[200%] transition-transform duration-300 ease-in-out"
        style={{
          transform: view === "menu" ? "translateX(0)" : "translateX(-50%)",
        }}
      >
        <div className="w-1/2 h-full flex flex-col border-r border-gray-100 bg-white min-h-0">
          <div className="p-4 flex justify-between items-center bg-white shrink-0 border-b">
            <h3 className="font-semibold text-sm text-foreground">Library</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 flex flex-col gap-3">
              {categories.map((cat) => (
                <Item
                  key={cat.id}
                  variant="outline"
                  className="cursor-pointer transition-all hover:bg-accent group w-full text-left"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <ItemMedia>
                    <cat.icon className="size-5 text-muted-foreground group-hover:text-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-sm font-medium text-foreground">
                      {cat.label}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
                  </ItemActions>
                </Item>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="w-1/2 h-full flex flex-col bg-white min-h-0">
          <div className="p-4 flex items-center gap-2 bg-white shrink-0 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("menu")}
              className="h-6 w-6 -ml-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-sm text-foreground capitalize">
              {activeCategory}
            </h3>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {activeCategory === "stickers" && (
              <LibraryAssetGrid
                data={stickers}
                type="stickers"
                onSelect={onSelect}
              />
            )}
            {activeCategory === "gradients" && (
              <LibraryAssetGrid
                data={gradients}
                type="gradients"
                onSelect={onSelect}
              />
            )}
            {activeCategory === "illustrations" && (
              <LibraryAssetGrid
                data={illustrations}
                type="illustrations"
                onSelect={onSelect}
              />
            )}
            {activeCategory === "masks" && (
              <LibraryAssetGrid
                data={masks}
                type="masks"
                onSelect={onSelect}
              />
            )}
            {activeCategory === "effects" && (
              <BlendGenerator
                onSelect={onSelect}
                selectedObject={selectedObject}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
