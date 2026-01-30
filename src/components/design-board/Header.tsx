import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Hand,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Trash2,
  Square,
  PenTool,
  Group,
  Ungroup,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { ColorPicker } from "./ui/ColorPicker";
import type { ToolType } from "@/lib/types";
import type { PaperKey, Orientation } from "@/lib/constants";

interface HeaderProps {
  onBack: () => void;
  tool: ToolType;
  setTool: (t: ToolType) => void;
  paper: PaperKey;
  orientation: Orientation;
  bgColor: string;
  setBgColor: (c: string) => void;
  handleAddText: () => void;
  handleAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDevImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddSticker: (url: string) => void; // New Prop
  handleClearSelection: () => void;
  handleDeleteSelected: () => void;
  selectedId: string | null;
  handleGroup?: () => void;
  handleUngroup?: () => void;
  selectedCount?: number;
  isGroupSelected?: boolean;
  isLayersOpen: boolean;
  setIsLayersOpen: (v: boolean) => void;
  isLibraryOpen: boolean;
  setIsLibraryOpen: (v: boolean) => void;
}

export const Header = ({
  onBack,
  tool,
  setTool,
  paper,
  orientation,
  bgColor,
  setBgColor,
  handleAddText,
  handleAddImage,
  handleDevImageUpload,
  handleClearSelection,
  handleDeleteSelected,
  selectedId,
  handleGroup,
  handleUngroup,
  selectedCount = 0,
  isGroupSelected = false,
  isLayersOpen,
  setIsLayersOpen,
  isLibraryOpen,
  setIsLibraryOpen,
}: HeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const devInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="grid grid-cols-3 items-center px-4 py-3 bg-white border-b shadow-sm z-9 h-16 relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAddImage}
        accept="image/*"
        className="hidden"
      />

      <input
        type="file"
        ref={devInputRef}
        onChange={handleDevImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="h-6 w-px bg-gray-200"></span>
        <Tabs
          value={tool}
          onValueChange={(v) => {
            setTool(v as ToolType);
            handleClearSelection();
          }}
        >
          <TabsList className="grid w-48 grid-cols-4 h-9">
            <TabsTrigger value="select" className="h-7 p-0" title="Select">
              <MousePointer2 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="hand" className="h-7 p-0" title="Pan Tool">
              <Hand className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="rect" className="h-7 p-0" title="Rectangle">
              <Square className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="pen" className="h-7 p-0" title="Pen">
              <PenTool className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="h-6 w-px bg-gray-200"></span>
        <div className="flex flex-col text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{paper}</span>
          <span className="capitalize">{orientation}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <ColorPicker
          value={bgColor}
          onChange={setBgColor}
          title="Background Color"
        />
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-3 text-xs"
          onClick={handleAddText}
        >
          <Type className="h-3.5 w-3.5" /> Add Text
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-3 text-xs"
          onClick={() => fileInputRef.current?.click()}
          onContextMenu={(e) => {
            e.preventDefault();
            if (handleDevImageUpload) {
              devInputRef.current?.click();
            }
          }}
        >
          <ImageIcon className="h-3.5 w-3.5" /> Add Image
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-3 text-xs"
          onClick={() => setIsLibraryOpen(!isLibraryOpen)}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Library
        </Button>
      </div>
      <div className="flex items-center justify-end gap-2">
        {selectedCount > 1 && handleGroup && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs px-3"
            onClick={handleGroup}
          >
            <Group className="h-3 w-3 mr-2" /> Group
          </Button>
        )}
        {selectedCount === 1 && isGroupSelected && handleUngroup && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs px-3"
            onClick={handleUngroup}
          >
            <Ungroup className="h-3 w-3 mr-2" /> Ungroup
          </Button>
        )}

        <Button
          variant={isLayersOpen ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs px-3"
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          title="Toggle Layers"
        >
          <Layers className="h-4 w-4 mr-2" /> Layers
        </Button>

        <span className="h-6 w-px bg-gray-200 mx-1"></span>

        <Button
          size="sm"
          variant="destructive"
          className="h-8 text-xs px-3"
          onClick={handleDeleteSelected}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          {selectedId || selectedCount > 0 ? "Delete" : "Clear All"}
        </Button>
      </div>
    </header>
  );
};
