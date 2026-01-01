import { Move, RotateCw } from "lucide-react";
import type { CanvasObject, ToolType } from "@/lib/types";

interface TransformWrapperProps {
  children: React.ReactNode;
  obj: CanvasObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  onMouseDown: (e: React.MouseEvent) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  hideResizeHandles?: boolean;
  pointerEvents?: "auto" | "none";
}

export const TransformWrapper = ({
  children,
  obj,
  zoom,
  isSelected,
  tool,
  onMouseDown,
  setResizingTarget,
  setRotatingTarget,
  hideResizeHandles = false,
  pointerEvents,
}: TransformWrapperProps) => {
  const zoomFactor = zoom / 100;

  const effectivePointerEvents = pointerEvents
    ? pointerEvents
    : tool === "hand" || tool === "draw-rect"
    ? "none"
    : "auto";

  const getStartFontSize = () =>
    obj.type === "text" ? (obj as any).fontSize : undefined;

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizingTarget({
      id: obj.id,
      startX: e.pageX,
      startY: e.pageY,
      startW: obj.width,
      startH: obj.height,
      startXPos: obj.x,
      startYPos: obj.y,
      startFontSize: getStartFontSize(),
      direction,
    });
  };

  // Helper: Calculate visual cursor direction based on object rotation
  const getCursor = (handleAngle: number) => {
    // 1. Add object rotation to the handle's base angle
    const totalAngle = (handleAngle + obj.rotation) % 360;
    // 2. Normalize to 0-360 positive range
    const normalized = totalAngle < 0 ? totalAngle + 360 : totalAngle;

    // 3. Map result to standard CSS cursors (using 45 degree segments)
    if (normalized >= 337.5 || normalized < 22.5) return "cursor-n-resize";
    if (normalized >= 22.5 && normalized < 67.5) return "cursor-ne-resize";
    if (normalized >= 67.5 && normalized < 112.5) return "cursor-e-resize";
    if (normalized >= 112.5 && normalized < 157.5) return "cursor-se-resize";
    if (normalized >= 157.5 && normalized < 202.5) return "cursor-s-resize";
    if (normalized >= 202.5 && normalized < 247.5) return "cursor-sw-resize";
    if (normalized >= 247.5 && normalized < 292.5) return "cursor-w-resize";
    if (normalized >= 292.5 && normalized < 337.5) return "cursor-nw-resize";

    return "cursor-move"; // Fallback
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: `${obj.x * zoomFactor}px`,
        top: `${obj.y * zoomFactor}px`,
        width: `${obj.width * zoomFactor}px`,
        height: `${obj.height * zoomFactor}px`,
        transform: `rotate(${obj.rotation}deg)`,
        transformOrigin: "center center",
        pointerEvents: effectivePointerEvents,
      }}
      className="group"
    >
      {children}

      {isSelected && (
        <div className="absolute -inset-1 border-2 border-blue-500 pointer-events-none">
          {!hideResizeHandles && (
            <>
              {/* --- CORNERS --- */}
              {/* Top Left (NW - Base 315°) */}
              <div
                className={`absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  315
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "nw")}
              />
              {/* Top Right (NE - Base 45°) */}
              <div
                className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  45
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "ne")}
              />
              {/* Bottom Left (SW - Base 225°) */}
              <div
                className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  225
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "sw")}
              />
              {/* Bottom Right (SE - Base 135°) */}
              <div
                className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  135
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "se")}
              />

              {/* --- SIDES --- */}
              {/* Top (N - Base 0°) */}
              <div
                className={`absolute left-1/2 -top-1.5 -translate-x-1/2 w-4 h-2 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  0
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "n")}
              />
              {/* Bottom (S - Base 180°) */}
              <div
                className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-4 h-2 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  180
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "s")}
              />
              {/* Left (W - Base 270°) */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  270
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "w")}
              />
              {/* Right (E - Base 90°) */}
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                  90
                )}`}
                onMouseDown={(e) => handleResizeStart(e, "e")}
              />
            </>
          )}

          {/* Move Handle (Top Left External) */}
          <div className="absolute -top-5 -left-5 bg-white border border-blue-500 p-0.5 rounded-sm shadow-sm pointer-events-none scale-75">
            <Move className="w-3 h-3 text-blue-500" />
          </div>

          {/* Rotation Handle */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-blue-500 rounded-full cursor-grab pointer-events-auto shadow-sm flex items-center justify-center hover:bg-blue-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              setRotatingTarget(e, obj.id);
            }}
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
};
