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
}: CanvasAreaProps) => {
  const handleAddSelect = (id: string) => addSelectedId(id);
  const handleSetSelect = (id: string | null) =>
    id ? setSelectedId([id]) : setSelectedId([]);

  return (
    <main
      // This is compatible with RefObject<HTMLDivElement | null>
      ref={containerRef as React.RefObject<HTMLDivElement>}
      onMouseDown={onMouseDown}
      className={`flex-1 relative overflow-auto bg-gray-50 no-scrollbar z-10 ${
        tool === "hand"
          ? "cursor-grab"
          : tool === "draw-rect"
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
                width: `${width * (zoom[0] / 100)}px`,
                height: `${height * (zoom[0] / 100)}px`,
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
                    left: `${g.x * (zoom[0] / 100)}px`,
                    top: `${g.y * (zoom[0] / 100)}px`,
                    width:
                      g.type === "vertical"
                        ? "1px"
                        : `${g.length * (zoom[0] / 100)}px`,
                    height:
                      g.type === "horizontal"
                        ? "1px"
                        : `${g.length * (zoom[0] / 100)}px`,
                    // Style Logic:
                    borderLeft:
                      g.type === "vertical"
                        ? g.isCenter
                          ? "1px solid #ef4444"
                          : "1px dashed #ef4444"
                        : "none",
                    borderTop:
                      g.type === "horizontal"
                        ? g.isCenter
                          ? "1px solid #ef4444"
                          : "1px dashed #ef4444"
                        : "none",
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

                  if (obj.type === "text")
                    return (
                      <TextItem
                        obj={obj}
                        {...commonProps}
                        onUpdate={updateObject}
                      />
                    );

                  if (obj.type === "rect")
                    return <RectItem obj={obj} {...commonProps} />;
                  if (obj.type === "image")
                    return <ImageItem obj={obj} {...commonProps} />;

                  // FIX: Pass onUpdate here
                  if (obj.type === "group")
                    return (
                      <GroupItem
                        obj={obj}
                        {...commonProps}
                        onUpdate={updateObject}
                      />
                    );

                  return null;
                })}
                {tempRect && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${tempRect.x * (zoom[0] / 100)}px`,
                      top: `${tempRect.y * (zoom[0] / 100)}px`,
                      width: `${tempRect.width * (zoom[0] / 100)}px`,
                      height: `${tempRect.height * (zoom[0] / 100)}px`,
                      border: `2px dashed #000`,
                      opacity: 0.5,
                    }}
                  />
                )}
                {selectionBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${selectionBox.x * (zoom[0] / 100)}px`,
                      top: `${selectionBox.y * (zoom[0] / 100)}px`,
                      width: `${selectionBox.w * (zoom[0] / 100)}px`,
                      height: `${selectionBox.h * (zoom[0] / 100)}px`,
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
                <ContextMenuItem onClick={onDuplicate}>
                  Duplicate
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {/* NEW: Lock/Unlock */}
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
              objects.find((o) => o.id === selectedIds[0])?.type ===
                "group" && (
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
