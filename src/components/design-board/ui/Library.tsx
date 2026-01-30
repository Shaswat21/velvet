import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ImageOff, Sticker, PaintBucket, Image } from "lucide-react";

// --- 1. LOAD ASSETS ---
// Stickers
const stickerModules = import.meta.glob("/src/assets/stickers/**/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

// Gradients (Assuming images, if CSS gradients, we can change this logic)
const gradientModules = import.meta.glob(
  "/src/assets/gradients/**/*.{svg,png,jpg,jpeg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const illustrationModules = import.meta.glob(
  "/src/assets/illustrations/**/*.{svg,png,jpg,jpeg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

interface AssetData {
  name: string;
  url: string;
  category: string;
}

interface StickerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const StickerSelector = ({
  isOpen,
  onClose,
  onSelect,
}: StickerSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("stickers");

  // --- 2. PARSE ASSETS ---
  const parseAssets = (modules: Record<string, unknown>) => {
    const processed: Record<string, AssetData[]> = {};

    Object.entries(modules).forEach(([path, module]) => {
      const parts = path.split("/");
      const filename = parts.pop();
      const category = parts.pop();

      if (!filename || !category) return;

      // Clean name: remove extension and any leading numbers/underscores if you want
      const name = filename.replace(/\.[^/.]+$/, "");
      const url = module as string;

      if (!processed[category]) {
        processed[category] = [];
      }

      processed[category].push({ name, url, category });
    });
    return processed;
  };

  const stickers = useMemo(() => parseAssets(stickerModules), []);
  const gradients = useMemo(() => parseAssets(gradientModules), []);
  const illustrations = useMemo(() => parseAssets(illustrationModules), []);

  // --- 3. HELPER: NORMALIZATION & FILTERING ---
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filterAssets = (source: Record<string, AssetData[]>) => {
    if (!searchQuery.trim()) return source;

    const normalizedQuery = normalize(searchQuery);
    const result: Record<string, AssetData[]> = {};

    Object.entries(source).forEach(([category, items]) => {
      const normalizedCategory = normalize(category);

      // If category matches, include all items
      if (normalizedCategory.includes(normalizedQuery)) {
        result[category] = items;
      } else {
        // Else check items
        const matchingItems = items.filter((item) =>
          normalize(item.name).includes(normalizedQuery),
        );
        if (matchingItems.length > 0) {
          result[category] = matchingItems;
        }
      }
    });
    return result;
  };

  const filteredStickers = useMemo(
    () => filterAssets(stickers),
    [stickers, searchQuery],
  );
  const filteredGradients = useMemo(
    () => filterAssets(gradients),
    [gradients, searchQuery],
  );
  const filteredIllustrations = useMemo(
    () => filterAssets(illustrations),
    [illustrations, searchQuery],
  );

  // --- 4. RENDERER FOR GRID ---
  const renderGrid = (
    data: Record<string, AssetData[]>,
    type: "sticker" | "gradient" | "illustration",
  ) => {
    if (Object.keys(data).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ImageOff className="h-10 w-10 opacity-20 mb-2" />
          <p>No {type}s found.</p>
        </div>
      );
    }

    return Object.entries(data).map(([category, items]) => (
      <div key={category} className="relative mb-6">
        <h3 className="text-sm font-semibold mb-3 capitalize text-gray-900 sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 border-b border-transparent">
          {category}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {items.map((item) => (
            <Button
              key={item.url}
              variant="outline"
              className={`w-full p-2 hover:bg-gray-50 hover:border-gray-400 transition-all group relative border-dashed ${
                type === "gradient" ? "h-16" : "h-24"
              }`}
              onClick={() => {
                onSelect(item.url);
                onClose();
              }}
              title={item.name}
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-sm">
                <img
                  src={item.url}
                  alt={item.name}
                  className={`object-contain pointer-events-none aspect-square transition-transform duration-200 ${
                    type === "sticker"
                      ? "max-w-full max-h-full group-hover:scale-110"
                      : "w-full h-full object-contain"
                  }`}
                  loading="lazy"
                />
              </div>
            </Button>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150 h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <DialogDescription className="sr-only">
          Select an asset to add
        </DialogDescription>

        <DialogHeader className="px-6 py-4 border-b bg-white z-20 shrink-0 space-y-4">
          <DialogTitle>Library</DialogTitle>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stickers" className="gap-2">
                <Sticker className="h-4 w-4" /> Stickers
              </TabsTrigger>
              <TabsTrigger value="gradients" className="gap-2">
                <PaintBucket className="h-4 w-4" /> Gradients
              </TabsTrigger>
              <TabsTrigger value="illustrations" className="gap-2">
                <Image className="h-4 w-4" /> Illustrations
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-white">
          <ScrollArea className="h-full">
            <div className="p-6">
              {activeTab === "stickers"
                ? renderGrid(filteredStickers, "sticker")
                : activeTab === "gradients"
                  ? renderGrid(filteredGradients, "gradient")
                  : renderGrid(filteredIllustrations, "illustration")}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
