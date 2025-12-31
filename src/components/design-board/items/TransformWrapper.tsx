import { Move, RotateCw } from "lucide-react";
import type { CanvasObject, ToolType } from "../types";

interface TransformWrapperProps {
  children: React.ReactNode;
  obj: CanvasObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  onMouseDown: (e: React.MouseEvent) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void; // UPDATED SIGNATURE
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
    : (tool === "hand" || tool === "draw-rect" ? "none" : "auto");

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
              {/* Resize Handles */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize pointer-events-auto shadow-sm z-50"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingTarget({
                    id: obj.id,
                    startX: e.pageX,
                    startY: e.pageY,
                    startW: obj.width,
                    startH: obj.height,
                  });
                }}
              />
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto shadow-sm z-50"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingTarget({
                    id: obj.id,
                    startX: e.pageX,
                    startY: e.pageY,
                    startW: obj.width,
                    startH: obj.height,
                    direction: "x",
                  });
                }}
              />
            </>
          )}

          {/* Move Handle */}
          <div className="absolute -top-3 -left-3 bg-white border border-blue-500 p-0.5 rounded-sm shadow-sm pointer-events-none scale-75">
            <Move className="w-3 h-3 text-blue-500" />
          </div>
          {/* Rotation Handle */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-blue-500 rounded-full cursor-grab pointer-events-auto shadow-sm flex items-center justify-center hover:bg-blue-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              setRotatingTarget(e, obj.id); // PASS EVENT HERE
            }}
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
};