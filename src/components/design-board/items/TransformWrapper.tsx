import { Move, RotateCw, LockIcon } from "lucide-react";
import type { CanvasObject, ToolType } from "@/lib/types";

export interface TransformWrapperProps {
  children: React.ReactNode;
  obj: CanvasObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  hideResizeHandles?: boolean;
  pointerEvents?: "auto" | "none";
  lockAspectRatio?: boolean;
  isEditing?: boolean;
  metaData?: any;
}

export const TransformWrapper = ({
  children,
  obj,
  zoom,
  isSelected,
  tool,
  onMouseDown,
  onDoubleClick,
  setResizingTarget,
  setRotatingTarget,
  hideResizeHandles = false,
  pointerEvents,
  lockAspectRatio = false,
  isEditing = false,
  metaData = {},
}: TransformWrapperProps) => {
  const zoomFactor = zoom / 100;

  const effectivePointerEvents = pointerEvents
    ? pointerEvents
    : tool === "select"
    ? "auto"
    : "none";

  const shouldShowHandles = (isSelected && tool === "select") || isEditing;

  const getStartFontSize = () =>
    obj.type === "text" ? (obj as any).fontSize : undefined;

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    const isCorner = direction.length === 2; // e.g. "nw", "se"

    const shouldLockRatio = obj.type === "text" && isCorner;

    let finalIsCrop = false;
    let finalLockAspectRatio = lockAspectRatio;

    if (obj.type === "image") {
      if (isEditing) {
        finalIsCrop = true;
        finalLockAspectRatio = false;
      } else {
        if (isCorner) {
          finalIsCrop = false;
          finalLockAspectRatio = true; // Enforce aspect ratio scaling
        } else {
          finalIsCrop = true; // Side handles trigger "Stationary Crop"
          finalLockAspectRatio = false;
        }
      }
    }

    setResizingTarget({
      id: obj.id,
      startX: e.pageX,
      startY: e.pageY,
      startW: obj.width,
      startH: obj.height,
      startXPos: obj.x,
      startYPos: obj.y,
      startFontSize: getStartFontSize(),
      startImgX: (obj as any).imageX ?? 0,
      startImgY: (obj as any).imageY ?? 0,
      direction,
      lockAspectRatio: !(obj.type == "text")
        ? finalLockAspectRatio
        : shouldLockRatio,
      isCrop: finalIsCrop,
      metaData,
    });
  };

  const getCursor = (handleAngle: number) => {
    const totalAngle = (handleAngle + obj.rotation) % 360;
    const normalized = totalAngle < 0 ? totalAngle + 360 : totalAngle;
    if (normalized >= 337.5 || normalized < 22.5) return "cursor-n-resize";
    if (normalized >= 22.5 && normalized < 67.5) return "cursor-ne-resize";
    if (normalized >= 67.5 && normalized < 112.5) return "cursor-e-resize";
    if (normalized >= 112.5 && normalized < 157.5) return "cursor-se-resize";
    if (normalized >= 157.5 && normalized < 202.5) return "cursor-s-resize";
    if (normalized >= 202.5 && normalized < 247.5) return "cursor-sw-resize";
    if (normalized >= 247.5 && normalized < 292.5) return "cursor-w-resize";
    if (normalized >= 292.5 && normalized < 337.5) return "cursor-nw-resize";
    return "cursor-move";
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        position: "absolute",
        left: `${obj.x * zoomFactor}px`,
        top: `${obj.y * zoomFactor}px`,
        width: `${obj.width * zoomFactor}px`,
        height: `${obj.height * zoomFactor}px`,
        transform: `rotate(${obj.rotation}deg)`,
        transformOrigin: "center center",
        pointerEvents: effectivePointerEvents,
        cursor:
          tool !== "select"
            ? "crosshair"
            : obj.isLocked || (obj.type == "image" && obj.isBackground)
            ? "default"
            : "move",
        zIndex: isEditing ? 50 : "auto",
      }}
      className="group"
    >
      {children}

      {shouldShowHandles && !hideResizeHandles && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isEditing ? "" : "border-2 border-blue-500"
          }`}
        >
          {obj.isLocked ? (
            <div className="absolute -top-3 -left-3 bg-gray-100 border border-gray-400 p-1 rounded-sm shadow-sm pointer-events-auto z-50">
              <LockIcon className="w-3 h-3 text-gray-500" />
            </div>
          ) : (
            <>
              {/* --- STANDARD RESIZE HANDLES (Blue Dots) --- */}
              {!isEditing && (
                <>
                  <div
                    className={`absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      315
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "nw")}
                  />
                  <div
                    className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      45
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "ne")}
                  />
                  <div
                    className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      225
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "sw")}
                  />
                  <div
                    className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      135
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "se")}
                  />
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      270
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "w")}
                  />
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                      90
                    )}`}
                    onMouseDown={(e) => handleResizeStart(e, "e")}
                  />
                  {!(obj.type === "text") && (
                    <>
                      <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-2 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                          0
                        )}`}
                        onMouseDown={(e) => handleResizeStart(e, "n")}
                      />
                      <div
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-2 bg-white border border-blue-500 rounded-sm pointer-events-auto shadow-sm z-50 ${getCursor(
                          180
                        )}`}
                        onMouseDown={(e) => handleResizeStart(e, "s")}
                      />
                    </>
                  )}
                </>
              )}

              {/* --- CROP HANDLES (Thick Bars) --- */}
              {!obj.isLocked && isEditing && (
                <>
                  {/* Corners */}
                  <div
                    className="absolute top-0 left-0 w-4 h-1 bg-white pointer-events-auto cursor-nw-resize z-50 border border-gray-400"
                    style={{ transform: "translate(-2px, -2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "nw")}
                  />
                  <div
                    className="absolute top-0 left-0 w-1 h-4 bg-white pointer-events-auto cursor-nw-resize z-50 border border-gray-400"
                    style={{ transform: "translate(-2px, -2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "nw")}
                  />
                  <div
                    className="absolute top-0 right-0 w-4 h-1 bg-white pointer-events-auto cursor-ne-resize z-50 border border-gray-400"
                    style={{ transform: "translate(2px, -2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "ne")}
                  />
                  <div
                    className="absolute top-0 right-0 w-1 h-4 bg-white pointer-events-auto cursor-ne-resize z-50 border border-gray-400"
                    style={{ transform: "translate(2px, -2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "ne")}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-4 h-1 bg-white pointer-events-auto cursor-sw-resize z-50 border border-gray-400"
                    style={{ transform: "translate(-2px, 2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "sw")}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-1 h-4 bg-white pointer-events-auto cursor-sw-resize z-50 border border-gray-400"
                    style={{ transform: "translate(-2px, 2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "sw")}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-4 h-1 bg-white pointer-events-auto cursor-se-resize z-50 border border-gray-400"
                    style={{ transform: "translate(2px, 2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "se")}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-1 h-4 bg-white pointer-events-auto cursor-se-resize z-50 border border-gray-400"
                    style={{ transform: "translate(2px, 2px)" }}
                    onMouseDown={(e) => handleResizeStart(e, "se")}
                  />

                  {/* Sides */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-8 bg-white border border-gray-400 rounded-sm pointer-events-auto z-50 cursor-ew-resize"
                    onMouseDown={(e) => handleResizeStart(e, "w")}
                  />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-8 bg-white border border-gray-400 rounded-sm pointer-events-auto z-50 cursor-ew-resize"
                    onMouseDown={(e) => handleResizeStart(e, "e")}
                  />
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1.5 bg-white border border-gray-400 rounded-sm pointer-events-auto z-50 cursor-ns-resize"
                    onMouseDown={(e) => handleResizeStart(e, "n")}
                  />
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-1.5 bg-white border border-gray-400 rounded-sm pointer-events-auto z-50 cursor-ns-resize"
                    onMouseDown={(e) => handleResizeStart(e, "s")}
                  />
                </>
              )}

              {/* --- MOVE & ROTATE (Hidden when Editing) --- */}
              {!isEditing && (
                <>
                  <div className="absolute -top-5 -left-5 bg-white border border-blue-500 p-0.5 rounded-sm shadow-sm pointer-events-none scale-75">
                    <Move className="w-3 h-3 text-blue-500" />
                  </div>
                  <div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-blue-500 rounded-full cursor-grab pointer-events-auto shadow-sm flex items-center justify-center hover:bg-blue-50"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setRotatingTarget(e, obj.id);
                    }}
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
