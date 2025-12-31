import { TransformWrapper } from "./TransformWrapper";
import type { ImageObject, ToolType } from "../types";

interface ImageItemProps {
  obj: ImageObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
}

export const ImageItem = ({ obj, innerRef, ...props }: ImageItemProps) => {
  const zoomFactor = props.zoom / 100;

  return (
    <TransformWrapper
      obj={obj}
      {...props}
      onMouseDown={(e) => {
        if (props.tool !== "select") return;
        e.stopPropagation();
        props.setSelectedId(obj.id);
        props.setDragTarget({ id: obj.id });
      }}
    >
      <div
        ref={innerRef}
        className="w-full h-full overflow-hidden bg-gray-100/50"
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
