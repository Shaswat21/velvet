import { TransformWrapper } from "./TransformWrapper";
import type { ImageObject, ToolType } from "@/lib/types";

interface ImageItemProps {
  obj: ImageObject;
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

export const ImageItem = ({
  obj,
  innerRef,
  pointerEvents,
  addSelectedId,
  onMouseDown, // Destructure
  ...props
}: ImageItemProps) => {
  const zoomFactor = props.zoom / 100;

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
        className="w-full h-full overflow-hidden"
        style={{
          borderRadius: `${obj.borderRadius * zoomFactor}px`,
          opacity: obj.opacity,
          border: `${obj.strokeWidth * zoomFactor}px solid ${obj.strokeColor}`,
        }}
      >
        <img
          src={obj.src}
          alt="img"
          draggable={false}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    </TransformWrapper>
  );
};
