import { TransformWrapper } from "./TransformWrapper";
import type { RectObject, ToolType } from "@/lib/types";

interface RectItemProps {
  obj: RectObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none";
  onMouseDown?: (e: React.MouseEvent) => void; // ADD THIS
}

export const RectItem = ({
  obj,
  innerRef,
  pointerEvents,
  addSelectedId,
  onMouseDown, // Destructure
  ...props
}: RectItemProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (props.tool !== "select") return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      addSelectedId(obj.id);
    } else {
      props.setSelectedId(obj.id);
    }
    props.setDragTarget({ id: obj.id });
  };

  return (
    <TransformWrapper
      obj={obj}
      pointerEvents={pointerEvents}
      {...props}
      onMouseDown={onMouseDown || handleMouseDown}
    >
      <div
        ref={innerRef}
        className="w-full h-full"
        style={{
          backgroundColor: obj.fillColor,
          border: `${obj.strokeWidth * (props.zoom / 100)}px solid ${
            obj.strokeColor
          }`,
          borderRadius: `${obj.borderRadius * (props.zoom / 100)}px`,
        }}
      />
    </TransformWrapper>
  );
};
