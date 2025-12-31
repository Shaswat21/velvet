import { TransformWrapper } from "./TransformWrapper";
import type { RectObject, ToolType } from "@/lib/types";

interface RectItemProps {
  obj: RectObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: React.Ref<HTMLDivElement>;
}

export const RectItem = ({ obj, innerRef, ...props }: RectItemProps) => {
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
