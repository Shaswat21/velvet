import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  Type,
  X,
  Circle,
  MoveVertical,
  Droplets,
  RotateCw, // Ensure this is imported
} from "lucide-react";
import { ColorPicker } from "./ui/ColorPicker";
import { FONTS } from "@/lib/constants";
import type { CanvasObject } from "@/lib/types";

interface ToolbarProps {
  selectedObject: CanvasObject | undefined;
  updateSelected: (updates: Partial<CanvasObject>) => void;
  handleCloseToolbar: () => void;
  isClosingToolbar: boolean;
}

export const Toolbar = ({
  selectedObject,
  updateSelected,
  handleCloseToolbar,
  isClosingToolbar,
}: ToolbarProps) => {
  if (!selectedObject) return null;

  return (
    <div
      className={`
          absolute top-18 left-[50%] translate-x-[-50%] bg-gray-50/95 backdrop-blur-sm border-b shadow-sm z-20 
          flex items-center justify-center gap-2 p-2 
          rounded-lg
          transition-all duration-300 ease-in-out
          ${
            selectedObject && !isClosingToolbar
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }
      `}
    >
      {/* --- TEXT TOOLBAR --- */}
      {selectedObject.type === "text" && (
        <>
          <Select
            value={selectedObject.fontFamily}
            onValueChange={(val) => updateSelected({ fontFamily: val })}
          >
            <SelectTrigger className="w-27.5 h-8 text-xs border-dashed bg-white">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
            <Type className="h-3 w-3 text-gray-400" />
            <input
              type="number"
              value={selectedObject.fontSize}
              onChange={(e) =>
                updateSelected({ fontSize: Number(e.target.value) })
              }
              className="w-8 text-xs text-center outline-none bg-transparent"
            />
          </div>
          <ColorPicker
            value={selectedObject.color}
            onChange={(val) => updateSelected({ color: val })}
            title="Text Color"
          />
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border gap-0.5">
            <Button
              size="icon"
              variant={selectedObject.isBold ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() => updateSelected({ isBold: !selectedObject.isBold })}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={selectedObject.isItalic ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() =>
                updateSelected({ isItalic: !selectedObject.isItalic })
              }
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={selectedObject.isUnderline ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() =>
                updateSelected({ isUnderline: !selectedObject.isUnderline })
              }
            >
              <Underline className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* --- RECT TOOLBAR --- */}
      {selectedObject.type === "rect" && (
        <>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              Fill
            </span>
            <ColorPicker
              value={selectedObject.fillColor}
              onChange={(val) => updateSelected({ fillColor: val })}
              title="Fill Color"
              allowTransparent
            />
          </div>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              Border
            </span>
            <ColorPicker
              value={selectedObject.strokeColor}
              onChange={(val) => updateSelected({ strokeColor: val })}
              title="Stroke Color"
              allowTransparent
            />
            <input
              type="number"
              min={0}
              value={selectedObject.strokeWidth}
              onChange={(e) =>
                updateSelected({ strokeWidth: Number(e.target.value) })
              }
              className="w-8 h-8 text-xs text-center border rounded-md"
              title="Stroke Width"
            />
          </div>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-2">
            <Circle className="h-3.5 w-3.5 text-gray-500" />
            <input
              type="number"
              min={0}
              value={selectedObject.borderRadius}
              onChange={(e) =>
                updateSelected({ borderRadius: Number(e.target.value) })
              }
              className="w-10 h-8 text-xs text-center border rounded-md"
              title="Border Radius"
            />
          </div>
        </>
      )}

      {/* --- IMAGE TOOLBAR --- */}
      {selectedObject.type === "image" && (
        <>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              Border
            </span>
            <ColorPicker
              value={selectedObject.strokeColor}
              onChange={(val) => updateSelected({ strokeColor: val })}
              title="Border Color"
              allowTransparent
            />
            <input
              type="number"
              min={0}
              value={selectedObject.strokeWidth}
              onChange={(e) =>
                updateSelected({ strokeWidth: Number(e.target.value) })
              }
              className="w-8 h-8 text-xs text-center border rounded-md"
              title="Border Width"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <div className="flex items-center gap-2">
            <Circle className="h-3.5 w-3.5 text-gray-500" />
            <input
              type="number"
              min={0}
              value={selectedObject.borderRadius}
              onChange={(e) =>
                updateSelected({ borderRadius: Number(e.target.value) })
              }
              className="w-10 h-8 text-xs text-center border rounded-md"
              title="Border Radius"
            />
            <Droplets className="h-3.5 w-3.5 text-gray-500 ml-1" />
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={selectedObject.opacity}
              onChange={(e) =>
                updateSelected({ opacity: Number(e.target.value) })
              }
              className="w-10 h-8 text-xs text-center border rounded-md"
              title="Opacity (0-1)"
            />
          </div>
        </>
      )}

      {/* --- COMMON: DIMENSIONS (Rect/Image) --- */}
      {(selectedObject.type === "rect" || selectedObject.type === "image") && (
        <>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
              <MoveVertical className="h-3 w-3 text-gray-400" />
              <input
                type="number"
                value={selectedObject.width}
                onChange={(e) =>
                  updateSelected({ width: Math.round(Number(e.target.value)) })
                }
                className="w-12 text-xs text-center outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
              <MoveVertical className="h-3 w-3 text-gray-400 rotate-90" />
              <input
                type="number"
                value={selectedObject.height}
                onChange={(e) =>
                  updateSelected({
                    height: Math.round(Number(e.target.value)),
                  })
                }
                className="w-12 text-xs text-center outline-none bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* --- COMMON: ROTATION (FOR ALL) --- */}
      <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-1">
        <RotateCw className="h-3 w-3 text-gray-400" />
        <input
          type="number"
          value={Math.round(selectedObject.rotation)}
          onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
          className="w-10 text-xs text-center outline-none bg-transparent"
          title="Rotation Angle"
        />
        <span className="text-[10px] text-gray-400">°</span>
      </div>
      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-2 text-gray-500 hover:text-red-500 hover:bg-red-50"
        onClick={handleCloseToolbar}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
