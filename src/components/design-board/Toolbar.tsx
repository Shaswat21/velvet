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
  Activity,
  BoxSelect,
  // --- NEW ICONS ---
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { ColorPicker } from "./ui/ColorPicker";
import { FONTS, HIGHLIGHT_COLORS } from "@/lib/constants";
import type { CanvasObject, TextObject } from "@/lib/types";
import { FancySlider } from "./ui/FancySlider";
import { Toggle } from "../ui/toggle";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

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
  if (
    !selectedObject ||
    selectedObject.isLocked ||
    (selectedObject.type === "image" && selectedObject.isBackground)
  )
    return null;

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

  // Helper to check if Fill/Border should be disabled
  const isRect = selectedObject.type === "rect";
  const rectObj = isRect ? (selectedObject as any) : null;
  const isEffectActive = rectObj?.isGlass || rectObj?.isLiquid;

  return (
    <div
      className={`
          absolute top-18 left-[50%] translate-x-[-50%] bg-gray-50/95 backdrop-blur-sm border-b shadow-sm z-11 
          flex items-center justify-center gap-2 p-2 
          rounded-lg
          transition-all duration-300 ease-in-out
          max-w-[95vw] overflow-x-auto scrollbar-hide
          ${!isClosingToolbar
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

          {/* SPACING POPOVER */}
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

          {/* HIGHLIGHT POPOVER */}
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
                  <div className="text-xs text-gray-500 font-medium mb-2">
                    Color
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-7 h-7 rounded-full border transition-transform hover:scale-110 ${textObj.backgroundColor === color
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
          {/* FILL COLOR - Disabled if Effect Active */}
          <div
            className={`flex items-center gap-2 mr-2 ${isEffectActive ? "opacity-40 pointer-events-none" : ""
              }`}
          >
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

          {/* BORDER - Disabled if Effect Active */}
          <div
            className={`flex items-center gap-2 mr-2 ${isEffectActive ? "opacity-40 pointer-events-none" : ""
              }`}
          >
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

          {/* BORDER RADIUS */}
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

          {/* SHADOW CONTROL */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant={selectedObject.shadow ? "secondary" : "ghost"}
                className={`h-8 w-8 rounded-sm ${selectedObject.shadow ? "bg-blue-100 text-blue-600" : ""
                  }`}
                title="Drop Shadow"
              >
                <BoxSelect className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" sideOffset={5}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-semibold">Drop Shadow</span>
                  <Toggle
                    pressed={!!selectedObject.shadow}
                    onPressedChange={(pressed) => {
                      if (pressed) {
                        // Apply presets based on active mode
                        if ((selectedObject as any).isLiquid) {
                          updateSelected({
                            shadow: {
                              color: "#00000033",
                              blur: 24,
                              x: 0,
                              y: 6,
                            },
                          });
                        } else if ((selectedObject as any).isGlass) {
                          updateSelected({
                            shadow: {
                              color: "#0000005E",
                              blur: 32,
                              x: 0,
                              y: 8,
                            },
                          });
                        } else {
                          updateSelected({
                            shadow: {
                              color: "#00000040",
                              blur: 10,
                              x: 0,
                              y: 4,
                            },
                          });
                        }
                      } else {
                        updateSelected({ shadow: null });
                      }
                    }}
                    size="sm"
                    className="h-6 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                  >
                    {selectedObject.shadow ? "On" : "Off"}
                  </Toggle>
                </div>

                {selectedObject.shadow && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Color</span>
                      <input
                        type="color"
                        value={
                          selectedObject.shadow.color.startsWith("#")
                            ? selectedObject.shadow.color.substring(0, 7)
                            : "#000000"
                        }
                        onChange={(e) =>
                          updateSelected({
                            shadow: {
                              ...selectedObject.shadow!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="w-6 h-6 p-0 border-none rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Blur</span>
                        <span>{selectedObject.shadow.blur}px</span>
                      </div>
                      <FancySlider
                        value={selectedObject.shadow.blur}
                        min={0}
                        max={100}
                        onChange={(val) =>
                          updateSelected({
                            shadow: { ...selectedObject.shadow!, blur: val },
                          })
                        }
                        label={""}
                        step={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Offset X</span>
                        <span>{selectedObject.shadow.x}px</span>
                      </div>
                      <FancySlider
                        value={selectedObject.shadow.x}
                        min={-50}
                        max={50}
                        onChange={(val) =>
                          updateSelected({
                            shadow: { ...selectedObject.shadow!, x: val },
                          })
                        }
                        label={""}
                        step={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Offset Y</span>
                        <span>{selectedObject.shadow.y}px</span>
                      </div>
                      <FancySlider
                        value={selectedObject.shadow.y}
                        min={-50}
                        max={50}
                        onChange={(val) =>
                          updateSelected({
                            shadow: { ...selectedObject.shadow!, y: val },
                          })
                        }
                        label={""}
                        step={0}
                      />
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* ================= PATH (DRAW) TOOLBAR ================= */}
      {selectedObject.type === "path" && (
        <>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              Stroke
            </span>
            <ColorPicker
              value={(selectedObject as any).strokeColor}
              onChange={(val) => updateSelected({ strokeColor: val })}
              title="Stroke Color"
            />
            <input
              type="number"
              min={1}
              max={50}
              value={(selectedObject as any).strokeWidth}
              onChange={(e) =>
                updateSelected({ strokeWidth: Number(e.target.value) })
              }
              className="w-10 h-8 text-xs text-center border rounded-md"
              title="Stroke Width"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border gap-0.5">
            <Button
              size="icon"
              variant={(selectedObject as any).flipX ? "outline" : "ghost"}
              className={`h-7 w-7 rounded-sm `}
              onClick={() =>
                updateSelected({ flipX: !(selectedObject as any).flipX })
              }
              title="Flip Horizontally"
            >
              <FlipHorizontal className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={(selectedObject as any).flipY ? "outline" : "ghost"}
              className={`h-7 w-7 rounded-sm`}
              onClick={() =>
                updateSelected({ flipY: !(selectedObject as any).flipY })
              }
              title="Flip Vertically"
            >
              <FlipVertical className="h-3.5 w-3.5" />
            </Button>
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
          </div>
          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border gap-0.5">
            <Button
              size="icon"
              variant={(selectedObject as any).flipX ? "outline" : "ghost"}
              className={`h-7 w-7 rounded-sm `}
              onClick={() =>
                updateSelected({ flipX: !(selectedObject as any).flipX })
              }
              title="Flip Horizontally"
            >
              <FlipHorizontal className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={(selectedObject as any).flipY ? "outline" : "ghost"}
              className={`h-7 w-7 rounded-sm `}
              onClick={() =>
                updateSelected({ flipY: !(selectedObject as any).flipY })
              }
              title="Flip Vertically"
            >
              <FlipVertical className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* ================= OPACITY (Common) ================= */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant={selectedObject.opacity < 1 ? "secondary" : "ghost"}
            className={`h-8 w-8 rounded-sm ${selectedObject.opacity < 1 ? "bg-blue-100 text-blue-600" : ""
              } ${rectObj?.isLiquid ? "opacity-40 pointer-events-none" : ""}`}
            title="Opacity"
          >
            <Droplets className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" sideOffset={5}>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>Opacity</span>
                <span>{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
              </div>
              <FancySlider
                value={(selectedObject.opacity ?? 1) * 100}
                min={0}
                max={100}
                step={1}
                onChange={(val) => updateSelected({ opacity: val / 100 })}
                label={""}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* ================= BLUR & GLASS EFFECTS (Common + Rect Only) ================= */}
      {(selectedObject.type === "rect" || selectedObject.type === "image") && (
        <>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant={selectedObject.blur ? "secondary" : "ghost"}
                className={`h-8 w-8 rounded-sm ${selectedObject.blur ? "bg-blue-100 text-blue-600" : ""
                  }`}
                title="Blur Effects"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" sideOffset={5}>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Blur Amount</span>
                    <span>{selectedObject.blur || 0}px</span>
                  </div>
                  <FancySlider
                    value={selectedObject.blur || 0}
                    min={0}
                    max={50}
                    step={1}
                    onChange={(val) => updateSelected({ blur: val })}
                    label={""}
                  />
                </div>

                {selectedObject.type === "rect" && (
                  <>
                    <div className="h-px w-full bg-gray-300 mx-1"></div>
                    <Tabs
                      value={
                        (selectedObject as any).isLiquid
                          ? "liquid"
                          : (selectedObject as any).isGlass
                            ? "frosted"
                            : "none"
                      }
                      onValueChange={(val) => {
                        if (val === "liquid") {
                          updateSelected({
                            isLiquid: true,
                            isGlass: false,
                            shadow: {
                              color: "#00000033",
                              blur: 24,
                              x: 0,
                              y: 6,
                            },
                            opacity: 1,
                          });
                        } else if (val === "frosted") {
                          updateSelected({
                            isGlass: true,
                            isLiquid: false,
                            shadow: {
                              color: "#0000005E",
                              blur: 32,
                              x: 0,
                              y: 8,
                            },
                            opacity: 1,
                          });
                        } else {
                          updateSelected({
                            isGlass: false,
                            isLiquid: false,
                            blur: 0,
                            shadow: null,
                            opacity: 1,
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="none" className="text-xs px-1">
                          None
                        </TabsTrigger>
                        <TabsTrigger value="frosted" className="text-xs px-1">
                          Frost
                        </TabsTrigger>
                        <TabsTrigger value="liquid" className="text-xs px-1">
                          Liquid
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {(selectedObject as any).isLiquid && (
                      <div className="space-y-4 pt-2 border-t mt-2">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Noise Freq</span>
                            <span>
                              {(
                                (selectedObject as any).liquidNoiseFreq ?? 0.008
                              ).toFixed(3)}
                            </span>
                          </div>
                          <FancySlider
                            value={
                              (selectedObject as any).liquidNoiseFreq ?? 0.008
                            }
                            min={0}
                            max={0.02}
                            step={0.001}
                            onChange={(val) =>
                              updateSelected({ liquidNoiseFreq: val })
                            }
                            label=""
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Distortion</span>
                            <span>
                              {(selectedObject as any).liquidDistortion ?? 77}
                            </span>
                          </div>
                          <FancySlider
                            value={
                              (selectedObject as any).liquidDistortion ?? 77
                            }
                            min={0}
                            max={200}
                            step={1}
                            onChange={(val) =>
                              updateSelected({ liquidDistortion: val })
                            }
                            label=""
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* ================= COMMON DIMENSIONS & ROTATION ================= */}
      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      {/* Dimensions (Rect/Image/Path Only) */}
      {(selectedObject.type === "rect" ||
        selectedObject.type === "image" ||
        selectedObject.type === "path") && (
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
                  updateSelected({ height: Math.round(Number(e.target.value)) })
                }
                className="w-12 text-xs text-center outline-none bg-transparent"
              />
            </div>
          </div>
        )}

      {/* Rotation (All Objects) */}
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

      {/* Close Button */}
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
