import { TransformWrapper } from "./TransformWrapper";
import { TextItem } from "./TextItem";
import { RectItem } from "./RectItem";
import { ImageItem } from "./ImageItem";
import type { GroupObject, ToolType } from "@/lib/types";

interface GroupItemProps {
  obj: GroupObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
}

export const GroupItem = ({ obj, innerRef, ...props }: GroupItemProps) => {
  const scaleX = obj.width / obj.originalWidth;
  const scaleY = obj.height / obj.originalHeight;

  return (
    <TransformWrapper
      obj={obj}
      {...props}
      hideResizeHandles={true}
      onMouseDown={(e) => {
        if (props.tool !== "select") return;
        e.stopPropagation();
        // Check for multiple selection keys
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          props.addSelectedId(obj.id);
        } else {
          props.setSelectedId(obj.id);
        }
        props.setDragTarget({ id: obj.id });
      }}
    >
      <div
        ref={innerRef}
        className="w-full h-full relative"
        style={{
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: "top left",
          width: obj.originalWidth,
          height: obj.originalHeight,
        }}
      >
        {obj.objects.map((child) => {
          const commonProps = {
            key: child.id,
            zoom: props.zoom,
            isSelected: false,
            tool: props.tool,
            setDragTarget: () => {},
            setSelectedId: () => {},
            addSelectedId: () => {},
            setResizingTarget: () => {},
            setRotatingTarget: () => {},
            onUpdate: () => {},
            pointerEvents: "none" as const,
          };

          if (child.type === "text")
            return <TextItem obj={child} {...commonProps} />;
          if (child.type === "rect")
            return <RectItem obj={child} {...commonProps} />;
          if (child.type === "image")
            return <ImageItem obj={child} {...commonProps} />;
          return null;
        })}
      </div>
    </TransformWrapper>
  );
};
