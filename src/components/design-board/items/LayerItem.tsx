import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Type, Group } from "lucide-react";
import type { CanvasObject } from "@/lib/types";

interface LayerItemProps {
  obj: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}

export const LayerItem = ({ obj, isSelected, onSelect }: LayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: obj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const handleClick = (e: React.MouseEvent) => {
    onSelect(obj.id, e.ctrlKey || e.metaKey || e.shiftKey);
  };

  // Helper to render a tiny preview based on type
  const renderPreview = () => {
    switch (obj.type) {
      case "image":
        return (
          <div className="w-8 h-8 rounded border bg-gray-100 overflow-hidden shrink-0">
            <img
              src={obj.src}
              alt="layer"
              className="w-full h-full object-cover"
            />
          </div>
        );
      case "rect":
        return (
          <div
            className="w-8 h-8 rounded border shrink-0"
            style={{
              backgroundColor: obj.fillColor,
              borderColor: obj.strokeColor,
            }}
          />
        );
      case "text":
        return (
          <div className="w-8 h-8 rounded border bg-gray-50 flex items-center justify-center shrink-0">
            <Type className="w-4 h-4 text-gray-500" />
          </div>
        );
      case "group":
        return (
          <div className="w-8 h-8 rounded border bg-gray-50 flex items-center justify-center shrink-0 border-dashed border-gray-400">
            <Group className="w-4 h-4 text-gray-500" />
          </div>
        );
    }
  };

  const getLabel = () => {
    if (obj.type === "text") return obj.text || "Text";
    if (obj.type === "group") return `Group (${obj.objects.length} items)`;
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-2 rounded-md mb-1 border select-none bg-white
        ${
          isSelected
            ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }
      `}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Preview */}
      {renderPreview()}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">
          {getLabel()}
        </p>
        <p className="text-[10px] text-gray-400 truncate">
          {Math.round(obj.width)} x {Math.round(obj.height)}
        </p>
      </div>
    </div>
  );
};
