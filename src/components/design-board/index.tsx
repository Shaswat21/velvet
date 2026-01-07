import { useState } from "react";
import type { Orientation, PaperKey } from "@/pages/Home";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Footer } from "./Footer";
import { LayersPanel } from "./LayersPanel";
import { CanvasArea } from "./CanvasArea";
import { useDesignBoard } from "@/hooks/useDesignBoard";

interface DesignBoardProps {
  paper: PaperKey;
  orientation: Orientation;
  onBack: () => void;
}

export default function DesignBoard({
  paper,
  orientation,
  onBack,
}: DesignBoardProps) {
  // Use the Custom Hook
  const board = useDesignBoard(paper, orientation);

  // Local UI state
  const [isClosingToolbar, setIsClosingToolbar] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const handleCloseToolbar = () => {
    setIsClosingToolbar(true);
    setTimeout(() => {
      board.setSelectedIds([]);
      setIsClosingToolbar(false);
    }, 300);
  };

  return (
    <div
      className="flex flex-col h-screen w-full bg-gray-50 relative overflow-hidden"
      onMouseUp={board.handleGlobalMouseUp}
      onMouseMove={board.handleGlobalMouseMove}
    >
      <Header
        onBack={onBack}
        tool={board.tool}
        setTool={board.setTool}
        paper={paper}
        orientation={orientation}
        bgColor={board.bgColor}
        setBgColor={board.setBgColor}
        handleAddText={board.handleAddText}
        handleAddImage={board.handleAddImage}
        handleDeleteSelected={board.handleDeleteSelected}
        selectedId={
          board.selectedIds.length === 1 ? board.selectedIds[0] : null
        }
        handleGroup={board.handleGroup}
        handleUngroup={board.handleUngroup}
        selectedCount={board.selectedIds.length}
        isGroupSelected={
          board.selectedIds.length === 1 &&
          board.objects.find((o) => o.id === board.selectedIds[0])?.type ===
            "group"
        }
        isLayersOpen={isLayersOpen}
        setIsLayersOpen={setIsLayersOpen}
      />

      <Toolbar
        selectedObject={board.singleSelectedObject}
        // UPDATE: Pass 'true' to save property changes to history stack
        updateSelected={(updates) =>
          board.selectedIds.length === 1 &&
          board.updateObject(board.selectedIds[0], updates, true)
        }
        handleCloseToolbar={handleCloseToolbar}
        isClosingToolbar={isClosingToolbar}
      />

      {/* Render the Canvas Area with Explicit Prop Mapping */}
      <CanvasArea
        containerRef={board.containerRef}
        canvasRef={board.canvasRef}
        objRefs={board.objRefs}
        zoom={board.zoom}
        tool={board.tool}
        objects={board.objects}
        selectedIds={board.selectedIds}
        bgColor={board.bgColor}
        guides={board.guides}
        width={board.width}
        height={board.height}
        tempRect={board.tempRect}
        selectionBox={board.selectionBox}
        dragTarget={board.dragTarget}
        setDragTarget={board.setDragTarget}
        setResizingTarget={board.setResizingTarget}
        updateObject={board.updateObject}
        onMouseDown={board.handleContainerMouseDown}
        setSelectedId={board.setSelectedIds}
        setRotatingTarget={board.handleStartRotation}
        onDuplicate={board.handleDuplicate}
        onGroup={board.handleGroup}
        onUngroup={board.handleUngroup}
        onDelete={board.handleDeleteSelected}
        onToggleLock={board.toggleLock}
        addSelectedId={(id) =>
          board.setSelectedIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          )
        }
        // Drawing State
        isDrawing={board.isDrawing}
        currentPath={board.currentPath}
      />

      <LayersPanel
        objects={board.objects}
        setObjects={board.setObjects}
        selectedIds={board.selectedIds}
        onSelect={board.handleLayerSelect}
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
      />

      <Footer
        zoom={board.zoom}
        setZoom={board.setZoom}
        handleFit={board.handleFit}
      />
    </div>
  );
}
