import { useRef, useLayoutEffect } from "react";
import { TransformWrapper } from "./TransformWrapper";
import type { TextObject, ToolType } from "@/lib/types";

interface TextItemProps {
  obj: TextObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  onUpdate: (id: string, updates: Partial<TextObject>) => void;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none";
  onMouseDown?: (e: React.MouseEvent) => void;
  isGrouped?: boolean;
  isDragging?: boolean;
}

export const TextItem = ({
  obj,
  zoom,
  isSelected,
  tool,
  onUpdate,
  setDragTarget,
  setSelectedId,
  addSelectedId,
  setResizingTarget,
  setRotatingTarget,
  innerRef,
  pointerEvents,
  onMouseDown,
  isGrouped = false,
  isDragging = false,
}: TextItemProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const zoomFactor = zoom / 100;

  useLayoutEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;

      const calculatedHeight = scrollHeight / zoomFactor;
      if (Math.abs(obj.height - calculatedHeight) > 1) {
        onUpdate(obj.id, { height: calculatedHeight });
      }
    }
  }, [
    obj.text,
    obj.width,
    obj.fontSize,
    obj.fontFamily,
    obj.isBold,
    obj.isItalic,
    obj.isUnderline,
    obj.isStrikethrough,
    obj.textTransform,
    obj.letterSpacing,
    obj.lineHeight,
    zoom,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== "select") return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      addSelectedId(obj.id);
    } else {
      setSelectedId(obj.id);
    }
    setDragTarget({
      id: obj.id,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
    });
  };

  // Determine if interaction should be disabled
  const isDisabled = tool === "hand" || obj.isLocked || isGrouped || isDragging || tool === "rect" || tool === "pen";

  const decoration =
    [
      obj.isUnderline ? "underline" : "",
      obj.isStrikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ") || "none";

  return (
    <TransformWrapper
      obj={obj}
      zoom={zoom}
      isSelected={isSelected}
      tool={tool}
      setResizingTarget={setResizingTarget}
      setRotatingTarget={setRotatingTarget}
      pointerEvents={pointerEvents}
      onMouseDown={onMouseDown || handleMouseDown}
    >
      <div ref={innerRef} className="w-full h-full">
        <textarea
          ref={textAreaRef}
          value={obj.text}
          onChange={(e) => onUpdate(obj.id, { text: e.target.value })}
          readOnly={isDisabled}
          className={`
            w-full bg-transparent resize-none overflow-hidden leading-normal
            focus:outline-none outline-none border-none p-1 block rounded-[10px]
            ${
              /* Cursor Logic: Text cursor only if selected, not locked, and not grouped */ ""
            }
            ${isSelected && !isDisabled ? "cursor-text" : "cursor-inherit"}
            ${/* Selection Logic: Prevent highlight if locked or grouped */ ""}
            ${isDisabled ? "select-none pointer-events-none" : ""} 
          `}
          style={{
            fontFamily: obj.fontFamily,
            fontSize: `${obj.fontSize * zoomFactor}px`,
            color: obj.color,
            fontWeight: obj.isBold ? "bold" : "normal",
            fontStyle: obj.isItalic ? "italic" : "normal",
            textDecoration: decoration,
            textAlign: obj.textAlign,
            backgroundColor: obj.backgroundColor,
            textTransform: obj.textTransform,
            letterSpacing: `${obj.letterSpacing / 1000}em`,
            lineHeight: obj.lineHeight,
            height: "100%",
            pointerEvents: isDisabled
              ? "none"
              : pointerEvents === "none"
              ? "none"
              : "auto",
          }}
        />
      </div>
    </TransformWrapper>
  );
};
