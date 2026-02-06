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
  Menu,
} from "lucide-react";
import { ColorPicker } from "./ui/ColorPicker";
import type { ToolType } from "@/lib/types";
import type { PaperKey, Orientation } from "@/lib/constants";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  handleAddSticker: (url: string) => void;
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

const ToolControls = ({
  tool,
  setTool,
  onClearSelection,
  className = "",
}: {
  tool: ToolType;
  setTool: (t: ToolType) => void;
  onClearSelection: () => void;
  className?: string;
}) => (
  <Tabs
    value={tool}
    onValueChange={(v) => {
      setTool(v as ToolType);
      onClearSelection();
    }}
  >
    <TabsList className={`grid grid-cols-4 h-9 ${className}`}>
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
);

const ActionButtons = ({
  bgColor,
  setBgColor,
  onAddText,
  onAddImageClick,
  onLibraryToggle,
  isMobile = false,
}: {
  bgColor: string;
  setBgColor: (c: string) => void;
  onAddText: () => void;
  onAddImageClick: (e: React.MouseEvent) => void;
  onLibraryToggle: () => void;
  isMobile?: boolean;
}) => (
  <div
    className={`flex items-center ${isMobile ? "flex-col gap-3 items-stretch" : "gap-2"}`}
  >
    <div
      className={`flex items-center ${isMobile ? "justify-between" : "justify-center gap-2"}`}
    >
      {isMobile && <span className="text-sm font-medium">Background</span>}
      <ColorPicker
        value={bgColor}
        onChange={setBgColor}
        title="Background Color"
      />
    </div>
    {!isMobile && <div className="h-6 w-px bg-gray-200 mx-1"></div>}

    <Button
      variant="outline"
      size="sm"
      className={`h-8 gap-2 px-3 text-xs ${isMobile ? "justify-start" : ""}`}
      onClick={onAddText}
    >
      <Type className="h-3.5 w-3.5" /> Add Text
    </Button>

    <Button
      variant="outline"
      size="sm"
      className={`h-8 gap-2 px-3 text-xs ${isMobile ? "justify-start" : ""}`}
      onClick={onAddImageClick}
      onContextMenu={onAddImageClick}
    >
      <ImageIcon className="h-3.5 w-3.5" /> Add Image
    </Button>

    <Button
      variant="outline"
      size="sm"
      className={`h-8 gap-2 px-3 text-xs ${isMobile ? "justify-start" : ""}`}
      onClick={onLibraryToggle}
    >
      <LayoutGrid className="h-3.5 w-3.5" /> Library
    </Button>
  </div>
);

const SelectionActions = ({
  selectedCount,
  handleGroup,
  handleUngroup,
  isGroupSelected,
  isLayersOpen,
  onToggleLayers,
  onDelete,
  selectedId,
  isMobile = false,
}: {
  selectedCount: number;
  handleGroup?: () => void;
  handleUngroup?: () => void;
  isGroupSelected?: boolean;
  isLayersOpen: boolean;
  onToggleLayers: () => void;
  onDelete: () => void;
  selectedId: string | null;
  isMobile?: boolean;
}) => (
  <div
    className={`flex items-center ${isMobile ? "flex-col gap-3 items-stretch mt-4 pt-4 border-t" : "justify-end gap-2"}`}
  >
    {selectedCount > 1 && handleGroup && (
      <Button
        size="sm"
        variant="secondary"
        className={`h-8 text-xs px-3 ${isMobile ? "justify-start" : ""}`}
        onClick={handleGroup}
      >
        <Group className="h-3 w-3 mr-2" /> Group
      </Button>
    )}
    {selectedCount === 1 && isGroupSelected && handleUngroup && (
      <Button
        size="sm"
        variant="secondary"
        className={`h-8 text-xs px-3 ${isMobile ? "justify-start" : ""}`}
        onClick={handleUngroup}
      >
        <Ungroup className="h-3 w-3 mr-2" /> Ungroup
      </Button>
    )}

    <Button
      variant={isLayersOpen ? "secondary" : "ghost"}
      size="sm"
      className={`h-8 text-xs px-3 ${isMobile ? "justify-start" : ""}`}
      onClick={onToggleLayers}
      title="Toggle Layers"
    >
      <Layers className="h-4 w-4 mr-2" /> Layers
    </Button>

    {!isMobile && <span className="h-6 w-px bg-gray-200 mx-1"></span>}

    <Button
      size="sm"
      variant="destructive"
      className={`h-8 text-xs px-3 ${isMobile ? "justify-start" : ""}`}
      onClick={onDelete}
    >
      <Trash2 className="h-3 w-3 mr-2" />
      {selectedId || selectedCount > 0 ? "Delete" : "Clear All"}
    </Button>
  </div>
);

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

  const handleImageClick = (e: React.MouseEvent) => {
    // If right click and dev mode...
    // e.preventDefault() is handled in the component
    if (e.type === "contextmenu") {
      e.preventDefault();
      if (handleDevImageUpload) {
        devInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm z-9 h-16 relative">
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

      {/* LEFT: Back + Tool Info */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="h-6 w-px bg-gray-200 hidden md:block"></span>

        {/* Desktop Tools */}
        <div className="hidden md:block">
          <ToolControls
            tool={tool}
            setTool={setTool}
            onClearSelection={handleClearSelection}
            className="w-48"
          />
        </div>

        <div className="hidden md:flex flex-col text-xs text-gray-500 ml-2">
          <span className="font-semibold text-gray-900">{paper}</span>
          <span className="capitalize">{orientation}</span>
        </div>
      </div>

      {/* CENTER: Actions (Desktop) */}
      <div className="hidden md:flex items-center justify-center gap-2">
        <ActionButtons
          bgColor={bgColor}
          setBgColor={setBgColor}
          onAddText={handleAddText}
          onAddImageClick={handleImageClick}
          onLibraryToggle={() => setIsLibraryOpen(!isLibraryOpen)}
        />
      </div>

      {/* RIGHT: Selection Actions (Desktop) */}
      <div className="hidden md:flex items-center justify-end gap-2">
        <SelectionActions
          selectedCount={selectedCount}
          handleGroup={handleGroup}
          handleUngroup={handleUngroup}
          isGroupSelected={isGroupSelected}
          isLayersOpen={isLayersOpen}
          onToggleLayers={() => setIsLayersOpen(!isLayersOpen)}
          onDelete={handleDeleteSelected}
          selectedId={selectedId}
        />
      </div>

      {/* MOBILE MENU */}
      <div className="md:hidden flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:w-[350px] p-4 overflow-y-auto">
            <div className="flex flex-col gap-6 mt-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Tools</h3>
                <ToolControls
                  tool={tool}
                  setTool={setTool}
                  onClearSelection={handleClearSelection}
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Insert</h3>
                <ActionButtons
                  bgColor={bgColor}
                  setBgColor={setBgColor}
                  onAddText={handleAddText}
                  onAddImageClick={handleImageClick}
                  onLibraryToggle={() => setIsLibraryOpen(!isLibraryOpen)}
                  isMobile={true}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Layers & Actions</h3>
                <SelectionActions
                  selectedCount={selectedCount}
                  handleGroup={handleGroup}
                  handleUngroup={handleUngroup}
                  isGroupSelected={isGroupSelected}
                  isLayersOpen={isLayersOpen}
                  onToggleLayers={() => setIsLayersOpen(!isLayersOpen)}
                  onDelete={handleDeleteSelected}
                  selectedId={selectedId}
                  isMobile={true}
                />
              </div>

              <div className="flex flex-col text-xs text-gray-500 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Paper:</span>
                  <span className="font-semibold text-gray-900">{paper}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Orientation:</span>
                  <span className="capitalize">{orientation}</span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
