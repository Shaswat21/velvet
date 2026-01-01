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

  // This handler will be passed to children.
  // It ensures that clicking a child acts exactly like clicking the group itself used to.
  const handleGroupInteraction = (e: React.MouseEvent) => {
    if (props.tool !== "select") return;
    e.stopPropagation();

    // Select the GROUP, not the child
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      props.addSelectedId(obj.id);
    } else {
      props.setSelectedId(obj.id);
    }
    // Drag the GROUP
    props.setDragTarget({ id: obj.id });
  };

  return (
    <TransformWrapper
      obj={obj}
      {...props}
      hideResizeHandles={true}
      // CRITICAL: The group container itself ignores mouse events
      // so clicks in empty space fall through to the canvas (deselect).
      pointerEvents="none"
      // We don't need onMouseDown here anymore because the wrapper is pointer-events: none,
      // but we keep a dummy or pass the handler just in case something bubbles weirdly,
      // though typically the child handler stops propagation.
      onMouseDown={() => {}}
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
            // CRITICAL: Children must capture events to trigger the group selection
            pointerEvents: "auto" as const,
            // Pass the Group's interaction logic to the child
            onMouseDown: handleGroupInteraction,
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
