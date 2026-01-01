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
}: TextItemProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const zoomFactor = zoom / 100;

  // AUTO-RESIZE HEIGHT LOGIC
  useLayoutEffect(() => {
    if (textAreaRef.current) {
      // 1. Reset height to allow shrinking
      textAreaRef.current.style.height = "0px";

      // 2. Measure scrollHeight
      const scrollHeight = textAreaRef.current.scrollHeight;

      // 3. Set visual height
      textAreaRef.current.style.height = `${scrollHeight}px`;

      // 4. Update data model height if significantly different
      // Convert pixel height back to canvas units (divide by zoom)
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
    obj.isBold, // Don't forget bold/italic affect height
    obj.isItalic,
    obj.isUnderline,
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
          className={`
            w-full bg-transparent resize-none overflow-hidden leading-normal
            focus:outline-none outline-none border-none p-1 block
            ${isSelected ? "cursor-text" : "cursor-move"}
          `}
          style={{
            fontFamily: obj.fontFamily,
            fontSize: `${obj.fontSize * zoomFactor}px`,
            color: obj.color,
            fontWeight: obj.isBold ? "bold" : "normal",
            fontStyle: obj.isItalic ? "italic" : "normal",
            textDecoration: obj.isUnderline ? "underline" : "none",
            height: "100%",
            pointerEvents: pointerEvents === "none" ? "none" : "auto",
          }}
          readOnly={tool === "hand"}
        />
      </div>
    </TransformWrapper>
  );
};
