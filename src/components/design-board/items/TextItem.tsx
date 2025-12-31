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
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none"; // NEW PROP
}

export const TextItem = ({
  obj,
  zoom,
  isSelected,
  tool,
  onUpdate,
  setDragTarget,
  setSelectedId,
  setResizingTarget,
  setRotatingTarget,
  innerRef,
  pointerEvents, // Destructure new prop
}: TextItemProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const zoomFactor = zoom / 100;

  useLayoutEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "inherit";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [obj.text, obj.width, obj.fontSize, obj.fontFamily, zoom]);

  return (
    <TransformWrapper
      obj={obj}
      zoom={zoom}
      isSelected={isSelected}
      tool={tool}
      setResizingTarget={setResizingTarget}
      setRotatingTarget={setRotatingTarget}
      pointerEvents={pointerEvents} // Pass it down to Wrapper
      onMouseDown={(e) => {
        if (tool !== "select") return;
        e.stopPropagation();
        setSelectedId(obj.id);
        setDragTarget({
          id: obj.id,
          offsetX: e.nativeEvent.offsetX,
          offsetY: e.nativeEvent.offsetY,
        });
      }}
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
            // Important: If we are in a group (pointerEvents="none"),
            // ensure the textarea itself doesn't steal focus
            pointerEvents: pointerEvents === "none" ? "none" : "auto",
          }}
          readOnly={tool === "hand"}
        />
      </div>
    </TransformWrapper>
  );
};
