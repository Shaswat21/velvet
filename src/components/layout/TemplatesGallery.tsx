import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, LayoutTemplate, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTemplates, type Template } from "@/lib/templates";
import { generateSVGString } from "@/lib/render";
import { PAPER_SIZES, type PaperKey } from "@/lib/constants";

interface TemplatesGalleryProps {
  onSelect: (template: Template) => void;
  onBack: () => void;
}

// --- SHIMMER COMPONENT ---
function TemplatesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2 pb-20">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          {/* Image Area */}
          <div className="w-full aspect-square rounded-lg bg-gray-200 animate-pulse border border-gray-100" />

          {/* Text Area */}
          <div className="flex flex-col gap-2 px-1">
            {/* Title Line */}
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />

            {/* Badges Line */}
            <div className="flex gap-2 items-center mt-1">
              <div className="h-5 w-12 bg-gray-100 rounded border border-gray-200" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TemplatesGallery({
  onSelect,
  onBack,
}: TemplatesGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState<string>("All");
  const [paperFilter, setPaperFilter] = useState<PaperKey | "All">("All");
  const [search, setSearch] = useState("");

  // --- FETCH ON MOUNT ---
  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Small delay to prevent flickering if load is instant (optional, usually native fetch is fast enough)
      setIsLoading(true);
      const data = await fetchTemplates();
      if (isMounted) {
        setTemplates(data);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- DYNAMIC CATEGORIES ---
  const categories = useMemo(() => {
    const uniqueCats = new Set(templates.map((t) => t.category));
    return ["All", ...Array.from(uniqueCats).sort()];
  }, [templates]);

  // --- FILTER LOGIC ---
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = category === "All" || t.category === category;
    const matchesPaper = paperFilter === "All" || t.paper === paperFilter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesPaper && matchesSearch;
  });

  const paperOptions = Object.keys(PAPER_SIZES) as PaperKey[];

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-md">
                <LayoutTemplate className="h-5 w-5 text-gray-700" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Templates Gallery
              </h1>
            </div>
          </div>

          {/* Search & Paper Filter Group */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-xl">
            {/* PAPER FILTER (Shadcn with TS fix) */}
            <div className="w-[140px]">
              <Select
                value={paperFilter}
                onValueChange={(val) => setPaperFilter(val as PaperKey | "All")}
                // @ts-ignore
                modal={false}
              >
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      <SelectValue placeholder="Size" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sizes</SelectItem>
                  {paperOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-gray-50 border-gray-200 focus-visible:ring-gray-400 text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6 overflow-hidden">
        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            value={category}
            onValueChange={setCategory}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-gray-100 p-1 h-11 inline-flex items-center justify-start rounded-lg text-gray-500 w-full sm:w-auto overflow-x-auto">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="
                    px-4 py-2 rounded-md text-sm font-medium transition-all
                    data-[state=active]:bg-white 
                    data-[state=active]:text-gray-900 
                    data-[state=active]:shadow-sm
                    hover:text-gray-900
                  "
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* CONTENT AREA */}
        <ScrollArea className="flex-1 h-full -mx-2 px-2">
          {isLoading ? (
            // --- LOADING SKELETON ---
            <TemplatesSkeleton />
          ) : (
            // --- ACTUAL GRID ---
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2 pb-20">
                {filteredTemplates.map((template) => {
                  const baseSize = PAPER_SIZES[template.paper];
                  const width =
                    template.orientation === "portrait"
                      ? baseSize.w
                      : baseSize.h;
                  const height =
                    template.orientation === "portrait"
                      ? baseSize.h
                      : baseSize.w;

                  const svgPreview = generateSVGString(
                    template.objects,
                    width,
                    height,
                    template.bgColor
                  );

                  const ratio = width / height;

                  return (
                    <div
                      key={template.id}
                      className="group relative flex flex-col gap-3 cursor-pointer"
                      onClick={() => onSelect(template)}
                    >
                      <div
                        className="relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100/50 transition-all duration-300 group-hover:shadow-md group-hover:border-gray-400 group-hover:-translate-y-1"
                        style={{ aspectRatio: "1/1" }}
                      >
                        <div className="absolute inset-4 flex items-center justify-center">
                          <div
                            className="shadow-sm relative bg-white overflow-hidden"
                            style={{
                              width: ratio > 1 ? "100%" : `${100 * ratio}%`,
                              aspectRatio: `${ratio}`,
                            }}
                          >
                            <div
                              className="w-full h-full pointer-events-none select-none"
                              dangerouslySetInnerHTML={{ __html: svgPreview }}
                            />
                          </div>
                        </div>
                        {/* Interaction Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>

                      <div className="flex flex-col gap-1 px-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors truncate">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 h-5 font-normal text-gray-500 bg-gray-100 border border-gray-200"
                          >
                            {template.paper}
                          </Badge>
                          <span className="text-xs text-gray-400 capitalize">
                            {template.orientation}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <LayoutTemplate className="h-12 w-12 mb-4 opacity-20" />
                  <p>No templates found.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setCategory("All");
                      setPaperFilter("All");
                      setSearch("");
                    }}
                    className="mt-2 text-blue-600"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
