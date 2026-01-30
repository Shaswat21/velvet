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
  const [blendMode, setBlendMode] = useState<string>("multiply");
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputBottomRef = useRef<HTMLInputElement>(null);
  const fileInputTopRef = useRef<HTMLInputElement>(null);

  // Load dimensions whenever topImg changes
  useEffect(() => {
    if (topImg) {
      const img = new Image();
      img.src = topImg;
      img.onload = () => {
        setTopImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      };
    } else {
      setTopImgDims(null);
    }
  }, [topImg]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSrc: (s: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUseSelected = (setSrc: (s: string) => void) => {
    if (selectedObject) {
      if (selectedObject.type === "image" || (selectedObject as any).src) {
        setSrc((selectedObject as unknown as ImageObject).src);
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
        // It must fill the canvas, cropping excess
        const scale = Math.max(
          canvas.width / img1.width,
          canvas.height / img1.height,
        );
        const w = img1.width * scale;
        const h = img1.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        // Draw Bottom (Cropped)
        ctx.drawImage(img1, x, y, w, h);

        // Draw Top
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
        ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);

        const resultUrl = canvas.toDataURL("image/webp");
        onSelect(resultUrl, "image");

        setIsGenerating(false);
        setBottomImg(null);
        setTopImg(null);
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
                className="w-20 h-20 bg-gray-100 border border-dashed rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors shrink-0"
                onClick={() => fileInputBottomRef.current?.click()}
              >
                {bottomImg ? (
                  <img
                    src={bottomImg}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col justify-center gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputBottomRef.current?.click()}
                  className="text-xs h-7 justify-start"
                >
                  <Upload className="w-3 h-3 mr-2" /> Upload Image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseSelected(setBottomImg)}
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
                onChange={(e) => handleFileUpload(e, setBottomImg)}
              />
            </div>
          </div>

          <div className="flex justify-center -my-2 text-gray-300">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Top Layer Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Top Layer (Blend)
            </Label>
            <div className="flex gap-2">
              <div
                className="w-20 h-20 bg-gray-100 border border-dashed rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors shrink-0"
                onClick={() => fileInputTopRef.current?.click()}
              >
                {topImg ? (
                  <img
                    src={topImg}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col justify-center gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputTopRef.current?.click()}
                  className="text-xs h-7 justify-start"
                >
                  <Upload className="w-3 h-3 mr-2" /> Upload Image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseSelected(setTopImg)}
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
                onChange={(e) => handleFileUpload(e, setTopImg)}
              />
            </div>
          </div>

          {/* Blend Mode */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Blend Mode
            </Label>
            <Select value={blendMode} onValueChange={setBlendMode}>
              <SelectTrigger>
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

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Preview
            </Label>
            {/* PREVIEW FIX: 
                1. 'aspect-video' on parent gives a reliable box size.
                2. 'flex items-center justify-center' centers the content.
                3. Inner div uses 'h-full' and 'aspect-ratio' to match Top Image shape.
                4. Images use 'w-full h-full absolute' to fill that shaped container.
             */}
            <div className="aspect-video w-full bg-gray-100 rounded-md border flex items-center justify-center overflow-hidden bg-checkered relative">
              {bottomImg && topImg && topImgDims ? (
                <div
                  className="relative shadow-sm"
                  style={{
                    // Force the inner container to match Top Image Aspect Ratio
                    // Use height: 100% to fill vertical space of preview box
                    height: "100%",
                    aspectRatio: `${topImgDims.w} / ${topImgDims.h}`,
                    // But prevent width from overflowing
                    maxWidth: "100%",
                  }}
                >
                  {/* Bottom: Object Cover to fill frame and crop excess */}
                  <img
                    src={bottomImg}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  {/* Top: Object Fill to fill frame exactly */}
                  <img
                    src={topImg}
                    className="absolute inset-0 w-full h-full object-fill z-10"
                    style={{ mixBlendMode: blendMode as any }}
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400">Select both images</p>
              )}
            </div>
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
                        "w-full p-2 h-auto aspect-square flex items-center justify-center",
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
                          type === "stickers"
                            ? "object-contain max-w-full max-h-full hover:scale-110"
                            : "object-cover w-full h-full rounded-sm",
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

type LibraryCategory = "stickers" | "gradients" | "illustrations" | "effects";

export const LibraryPanel = ({
  isOpen,
  onClose,
  onSelect,
  selectedObject,
}: LibraryPanelProps) => {
  const stickers = useMemo(() => parseAssets(stickerModules), []);
  const gradients = useMemo(() => parseAssets(gradientModules), []);
  const illustrations = useMemo(() => parseAssets(illustrationModules), []);

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
    { id: "illustrations", label: "Arts", icon: ImageIcon },
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
