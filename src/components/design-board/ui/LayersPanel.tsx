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
import { X, Lock } from "lucide-react"; // Import Lock icon
import { Button } from "@/components/ui/button";
import { LayerItem } from "../items/LayerItem";
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

  // 1. Separate Background from Draggable items
  const backgroundObj = objects.find((o) => (o as any).isBackground);
  const draggableObjects = objects.filter((o) => !(o as any).isBackground);

  // 2. Reverse draggable objects for UI (Top layer appears at top of list)
  const reversedDraggable = [...draggableObjects].reverse();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Find indices within the *draggable* subset
      const oldIndex = draggableObjects.findIndex(
        (obj) => obj.id === active.id
      );
      const newIndex = draggableObjects.findIndex((obj) => obj.id === over?.id);

      // Reorder the draggable subset
      const newDraggableOrder = arrayMove(draggableObjects, oldIndex, newIndex);

      // 3. Reconstruct full list: [Background, ...NewDraggableOrder]
      // Background must always be at index 0 (bottom of stack)
      if (backgroundObj) {
        setObjects([backgroundObj, ...newDraggableOrder]);
      } else {
        setObjects(newDraggableOrder);
      }
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

      <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          {/* Draggable Items List */}
          <SortableContext
            items={reversedDraggable.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            {reversedDraggable.map((obj) => (
              <LayerItem
                key={obj.id}
                obj={obj}
                isSelected={selectedIds.includes(obj.id)}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Pinned Background Item (Not Sortable) */}
        {backgroundObj && (
          <div className="mt-1 pt-1 border-t border-gray-200 opacity-90">
            <div className="relative">
              {/* Overlay to disable dragging interaction if LayerItem has listeners */}
              <div
                className="absolute inset-0 z-10"
                onClick={(e) => {
                  // Allow click selection, but prevent drag start
                  e.stopPropagation();
                  onSelect(backgroundObj.id, false);
                }}
              />
              <div className="opacity-70 pointer-events-none grayscale">
                <LayerItem
                  obj={backgroundObj}
                  isSelected={selectedIds.includes(backgroundObj.id)}
                  onSelect={onSelect}
                />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-gray-400">
                <Lock className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}

        {objects.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-400">
            No items on canvas
          </div>
        )}
      </div>
    </div>
  );
};
