import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  Type,
  X,
  MoveVertical,
  SlidersHorizontal,
  ALargeSmall,
  Circle,
  Droplets,
  RotateCw,
} from "lucide-react";
import { ColorPicker } from "./ui/ColorPicker";
import { FONTS, HIGHLIGHT_COLORS } from "@/lib/constants";
import type { CanvasObject, TextObject } from "@/lib/types";
import { FancySlider } from "./ui/FancySlider";

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
  if (!selectedObject || selectedObject.isLocked) return null;

  const isText = selectedObject.type === "text";
  const textObj = isText ? (selectedObject as TextObject) : null;

  // --- Alignment & Transform Logic ---
  const currentAlign = textObj?.textAlign || "left";
  const AlignIcon = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
    justify: AlignJustify,
  }[currentAlign];

  const cycleAlignment = () => {
    const s = ["left", "center", "right", "justify"];
    updateSelected({ textAlign: s[(s.indexOf(currentAlign) + 1) % 4] as any });
  };

  const currentTransform = textObj?.textTransform || "none";
  const TransformIcon = {
    none: ALargeSmall,
    uppercase: CaseUpper,
    lowercase: CaseLower,
    capitalize: CaseSensitive,
  }[currentTransform];

  const cycleTransform = () => {
    const s = ["none", "uppercase", "lowercase", "capitalize"];
    updateSelected({
      textTransform: s[(s.indexOf(currentTransform) + 1) % 4] as any,
    });
  };

  return (
    <div
      className={`
          absolute top-18 left-[50%] translate-x-[-50%] bg-gray-50/95 backdrop-blur-sm border-b shadow-sm z-20 
          flex items-center justify-center gap-2 p-2 
          rounded-lg
          transition-all duration-300 ease-in-out
          ${
            !isClosingToolbar
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }
      `}
    >
      {/* ================= TEXT TOOLBAR ================= */}
      {isText && textObj && (
        <>
          {/* FONT FAMILY */}
          <Select
            value={textObj.fontFamily}
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

          {/* FONT SIZE */}
          <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
            <Type className="h-3 w-3 text-gray-400" />
            <input
              type="number"
              value={textObj.fontSize}
              onChange={(e) =>
                updateSelected({ fontSize: Number(e.target.value) })
              }
              className="w-8 text-xs text-center outline-none bg-transparent"
            />
          </div>

          {/* TEXT COLOR */}
          <ColorPicker
            value={textObj.color}
            onChange={(val) => updateSelected({ color: val })}
            title="Text Color"
          />

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* STYLES */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border gap-0.5">
            <Button
              size="icon"
              variant={textObj.isBold ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() => updateSelected({ isBold: !textObj.isBold })}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={textObj.isItalic ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() => updateSelected({ isItalic: !textObj.isItalic })}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={textObj.isUnderline ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() =>
                updateSelected({ isUnderline: !textObj.isUnderline })
              }
            >
              <Underline className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={textObj.isStrikethrough ? "outline" : "ghost"}
              className="h-7 w-7 rounded-sm"
              onClick={() =>
                updateSelected({ isStrikethrough: !textObj.isStrikethrough })
              }
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* ALIGN & TRANSFORM */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-sm"
            onClick={cycleAlignment}
          >
            <AlignIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-sm"
            onClick={cycleTransform}
          >
            <TransformIcon className="h-4 w-4" />
          </Button>

          {/* SPACING POPOVER (Letter Spacing & Line Height ONLY) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-sm"
                title="Spacing"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" sideOffset={5}>
              <div className="flex flex-col gap-6">
                <FancySlider
                  label="Letter Spacing"
                  value={textObj.letterSpacing}
                  min={-200}
                  max={800}
                  step={1}
                  neutralValue={0}
                  snapAt={0}
                  snapThreshold={30}
                  onChange={(val) => updateSelected({ letterSpacing: val })}
                />
                <div className="h-px bg-gray-100 w-full" />
                <FancySlider
                  label="Line Height"
                  value={textObj.lineHeight}
                  min={0.5}
                  max={3}
                  step={0.1}
                  neutralValue={1.2}
                  snapAt={1.2}
                  snapThreshold={0.15}
                  onChange={(val) => updateSelected({ lineHeight: val })}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* HIGHLIGHT POPOVER (Color Grid ONLY) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant={
                  textObj.backgroundColor !== "transparent"
                    ? "secondary"
                    : "ghost"
                }
                className="h-8 w-8 rounded-sm relative"
                title="Highlight"
              >
                <Highlighter
                  className="h-4 w-4"
                  style={{
                    color:
                      textObj.backgroundColor !== "transparent"
                        ? "black"
                        : "currentColor",
                  }}
                />
                {textObj.backgroundColor !== "transparent" && (
                  <span
                    className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/10"
                    style={{ backgroundColor: textObj.backgroundColor }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" sideOffset={5}>
              <div className="space-y-4">
                <div>
                   <div className="text-xs text-gray-500 font-medium mb-2">Color</div>
                   <div className="grid grid-cols-7 gap-1">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-7 h-7 rounded-full border transition-transform hover:scale-110 ${
                          textObj.backgroundColor === color
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        style={{
                          backgroundColor: color,
                          backgroundImage:
                            color === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                              : "none",
                          backgroundSize: "8px 8px",
                        }}
                        onClick={() =>
                          updateSelected({ backgroundColor: color })
                        }
                        title={color === "transparent" ? "No Highlight" : color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* ================= RECT (SHAPE) TOOLBAR ================= */}
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

      {/* ================= IMAGE TOOLBAR ================= */}
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

      {/* ================= COMMON DIMENSIONS ================= */}
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

      {/* ================= COMMON ROTATION & CLOSE ================= */}
      <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-1 ml-2">
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