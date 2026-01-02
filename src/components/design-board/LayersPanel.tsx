import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayerItem } from "./items/LayerItem";
import type { CanvasObject } from "@/lib/types";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface LayersPanelProps {
  objects: CanvasObject[];
  setObjects: (objs: CanvasObject[]) => void;
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LayersPanel = ({
  objects,
  setObjects,
  selectedIds,
  onSelect,
  isOpen,
  onClose,
}: LayersPanelProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reversedObjects = [...objects].reverse();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = objects.findIndex((obj) => obj.id === active.id);
      const newIndex = objects.findIndex((obj) => obj.id === over?.id);

      setObjects(arrayMove(objects, oldIndex, newIndex));
    }
  };

  return (
    <div
      className={`
        fixed top-16 bottom-14.25 right-0 w-64 bg-white shadow-xl border-l z-40 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={reversedObjects.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            {reversedObjects.map((obj) => (
              <LayerItem
                key={obj.id}
                obj={obj}
                isSelected={selectedIds.includes(obj.id)}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        </DndContext>

        {objects.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-400">
            No items on canvas
          </div>
        )}
      </div>
    </div>
  );
};
