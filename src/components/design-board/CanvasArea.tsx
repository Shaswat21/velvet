import { useEffect, useRef } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { TextItem } from "./items/TextItem";
import { RectItem } from "./items/RectItem";
import { ImageItem } from "./items/ImageItem";
import { GroupItem } from "./items/GroupItem";
import { PathItem } from "./items/PathItem";
import type { CanvasObject, ToolType } from "@/lib/types";
import type { GuideLine } from "@/hooks/useDesignBoard";
import { LockIcon, Unlock } from "lucide-react";

interface CanvasAreaProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  objRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  zoom: number[];
  tool: ToolType;
  objects: CanvasObject[];
  selectedIds: string[];
  bgColor: string;
  guides: GuideLine[];
  width: number;
  height: number;
  tempRect: any;
  selectionBox: any;
  dragTarget: { id: string } | null;
  onMouseDown: (e: React.MouseEvent) => void;
  setDragTarget: (t: any) => void;
  setSelectedId: (ids: string[]) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (t: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  updateObject: (id: string, updates: any) => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  onToggleLock: (id: string) => void;
  isDrawing: boolean;
  currentPath: { x: number; y: number }[];
}

export const CanvasArea = ({
  containerRef,
  canvasRef,
  objRefs,
  zoom,
  tool,
  objects,
  selectedIds,
  bgColor,
  guides,
  width,
  height,
  tempRect,
  selectionBox,
  dragTarget,
  onMouseDown,
  setDragTarget,
  setSelectedId,
  addSelectedId,
  setResizingTarget,
  setRotatingTarget,
  updateObject,
  onDuplicate,
  onGroup,
  onUngroup,
  onDelete,
  onToggleLock,
  isDrawing,
  currentPath,
}: CanvasAreaProps) => {
  const handleAddSelect = (id: string) => addSelectedId(id);
  const handleSetSelect = (id: string | null) =>
    id ? setSelectedId([id]) : setSelectedId([]);

  const zoomScale = zoom[0] / 100;

  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ghostCanvasRef.current;
    if (!canvas || !isDrawing || currentPath.length < 2 || tool !== "pen") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = width * zoomScale * scale;
    canvas.height = height * zoomScale * scale;
    ctx.scale(scale, scale);

    ctx.clearRect(0, 0, width * zoomScale, height * zoomScale);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3 * zoomScale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(currentPath[0].x * zoomScale, currentPath[0].y * zoomScale);
    for (let i = 1; i < currentPath.length; i++) {
      ctx.lineTo(currentPath[i].x * zoomScale, currentPath[i].y * zoomScale);
    }
    ctx.stroke();
  }, [currentPath, isDrawing, tool, width, height, zoomScale]);

  return (
    <main
      ref={containerRef as React.RefObject<HTMLDivElement>}
      onMouseDown={onMouseDown}
      className={`flex-1 relative overflow-auto bg-gray-50 no-scrollbar z-10 ${
        tool === "hand"
          ? "cursor-grab"
          : tool === "rect" || tool === "pen"
          ? "cursor-crosshair"
          : "cursor-default"
      }`}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div
        className="flex items-center justify-center min-w-full min-h-full bg-wrapper"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          padding: "80px",
          width: `${Math.max(100, (width * zoom[0]) / 100 + 160)}px`,
          height: `${Math.max(100, (height * zoom[0]) / 100 + 160)}px`,
        }}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className="relative shadow-xl border border-gray-200 paper-canvas"
              onMouseDown={onMouseDown}
              style={{
                width: `${width * zoomScale}px`,
                height: `${height * zoomScale}px`,
                transition: "none",
                backgroundColor: bgColor,
              }}
            >
              <canvas
                ref={canvasRef as React.RefObject<HTMLCanvasElement>}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {/* GUIDES */}
              {guides.map((g, i) => (
                <div
                  key={i}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: `${g.x * zoomScale}px`,
                    top: `${g.y * zoomScale}px`,
                    width: g.type === "vertical" ? "1px" : `${g.length * zoomScale}px`,
                    height: g.type === "horizontal" ? "1px" : `${g.length * zoomScale}px`,
                    borderLeft: g.type === "vertical" ? (g.isCenter ? "1px solid #ef4444" : "1px dashed #ef4444") : "none",
                    borderTop: g.type === "horizontal" ? (g.isCenter ? "1px solid #ef4444" : "1px dashed #ef4444") : "none",
                    opacity: 0.8,
                  }}
                />
              ))}

              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                {objects.map((obj) => {
                  const isSelected = selectedIds.includes(obj.id);
                  const isDraggingItem = dragTarget?.id === obj.id;
                  const commonProps = {
                    key: obj.id,
                    zoom: zoom[0],
                    isSelected,
                    tool,
                    isDragging: isDraggingItem,
                    setDragTarget,
                    setSelectedId: handleSetSelect,
                    addSelectedId: handleAddSelect,
                    setResizingTarget,
                    setRotatingTarget,
                    innerRef: (el: HTMLDivElement | null) => {
                      objRefs.current[obj.id] = el;
                    },
                  };

                  if (obj.type === "text") return <TextItem obj={obj} {...commonProps} onUpdate={updateObject} />;
                  if (obj.type === "rect") return <RectItem obj={obj} {...commonProps} />;
                  if (obj.type === "image") return <ImageItem obj={obj} {...commonProps} />;
                  if (obj.type === "group") return <GroupItem obj={obj} {...commonProps} onUpdate={updateObject} />;

                  // UPDATE: PATH ITEM NOW HAS 'tool' PROP
                  if (obj.type === "path") {
                    return (
                      <PathItem
                        obj={obj}
                        zoom={zoom[0]}
                        isSelected={isSelected}
                        tool={tool} // Passed here
                        setResizingTarget={setResizingTarget}
                        setRotatingTarget={setRotatingTarget}
                        onMouseDown={(e) => {
                          if (tool !== "select") return;
                          e.stopPropagation();
                          if (e.shiftKey) {
                            handleAddSelect(obj.id);
                          } else {
                            if (!isSelected) handleSetSelect(obj.id);
                            setDragTarget({
                              id: obj.id,
                              startX: e.clientX,
                              startY: e.clientY,
                              initialX: obj.x,
                              initialY: obj.y,
                            });
                          }
                        }}
                        innerRef={(el) => {
                          objRefs.current[obj.id] = el;
                        }}
                      />
                    );
                  }

                  return null;
                })}

                {isDrawing && tool === "pen" && (
                  <canvas
                    ref={ghostCanvasRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 9999,
                    }}
                  />
                )}

                {tempRect && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${tempRect.x * zoomScale}px`,
                      top: `${tempRect.y * zoomScale}px`,
                      width: `${tempRect.width * zoomScale}px`,
                      height: `${tempRect.height * zoomScale}px`,
                      border: `2px dashed #000`,
                      opacity: 0.5,
                    }}
                  />
                )}
                {selectionBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${selectionBox.x * zoomScale}px`,
                      top: `${selectionBox.y * zoomScale}px`,
                      width: `${selectionBox.w * zoomScale}px`,
                      height: `${selectionBox.h * zoomScale}px`,
                      border: `1px solid #3b82f6`,
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {selectedIds.length > 0 && (
              <>
                <ContextMenuItem onClick={onDuplicate}>Duplicate</ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {selectedIds.length === 1 && (
              <>
                <ContextMenuItem onClick={() => onToggleLock(selectedIds[0])}>
                  {objects.find((o) => o.id === selectedIds[0])?.isLocked ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" /> Unlock
                    </>
                  ) : (
                    <>
                      <LockIcon className="w-4 h-4 mr-2" /> Lock
                    </>
                  )}
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {selectedIds.length > 1 && (
              <ContextMenuItem onClick={onGroup}>Group</ContextMenuItem>
            )}
            {selectedIds.length === 1 &&
              objects.find((o) => o.id === selectedIds[0])?.type === "group" && (
                <>
                  <ContextMenuItem onClick={onUngroup}>Ungroup</ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
            <ContextMenuItem onClick={onDelete}>Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </main>
  );
};