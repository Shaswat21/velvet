import { useState, useEffect } from "react";
import { TransformWrapper } from "./TransformWrapper";
import type { ImageObject, ToolType } from "@/lib/types";
import { Slider } from "@/components/ui/slider";

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
  updateObject: (id: string, updates: Partial<ImageObject>) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none";
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const ImageItem = ({
  obj,
  innerRef,
  pointerEvents,
  addSelectedId,
  onMouseDown,
  updateObject,
  ...props
}: ImageItemProps) => {
  const zoomFactor = props.zoom / 100;
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [naturalRatio, setNaturalRatio] = useState<number>(0);

  const imgX = (obj as any).imageX ?? 0;
  const imgY = (obj as any).imageY ?? 0;
  const imgScale = (obj as any).imageScale ?? 1;

  // --- 1. CALCULATE RENDERED SIZE ---
  // Calculates the actual pixel size of the image inside the box
  // factoring in "Cover" logic and the User's Zoom (imgScale)
  const getRenderedDimensions = () => {
    // If natural ratio isn't loaded yet, assume it matches the box
    if (!naturalRatio) return { width: obj.width, height: obj.height };

    const containerRatio = obj.width / obj.height;
    let baseW, baseH;

    // "Cover" Logic: Fit the image so it covers the box fully
    if (containerRatio > naturalRatio) {
      // Container is wider than image -> Match Width
      baseW = obj.width;
      baseH = obj.width / naturalRatio;
    } else {
      // Container is taller than image -> Match Height
      baseH = obj.height;
      baseW = obj.height * naturalRatio;
    }

    // Apply User Scale
    return {
      width: baseW * imgScale,
      height: baseH * imgScale,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!props.isSelected) return;
    e.stopPropagation();
    !obj.isLocked ? setIsEditing(true) : setIsEditing(false);
    props.setDragTarget(null); // Disable parent drag
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > 0) setNaturalRatio(naturalWidth / naturalHeight);
  };

  const handleInternalMouseDown = (e: React.MouseEvent) => {
    // Normal Selection Mode
    if (!isEditing) {
      onMouseDown?.(e);
      if (props.tool !== "select") return;
      e.stopPropagation();
      if (e.shiftKey || e.ctrlKey || e.metaKey) addSelectedId(obj.id);
      else props.setSelectedId(obj.id);
      props.setDragTarget({ id: obj.id });
      return;
    }

    // Edit Mode: Start Panning
    e.stopPropagation();
    e.preventDefault();
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // --- PAN DRAG LOGIC (Inside Edit Mode) ---
  useEffect(() => {
    if (!isEditing || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { width: currentImgW, height: currentImgH } =
        getRenderedDimensions();

      const dx = (e.clientX - dragStart.x) / zoomFactor;
      const dy = (e.clientY - dragStart.y) / zoomFactor;

      // Convert pixel delta to % of the IMAGE size
      const percentDx = dx / currentImgW;
      const percentDy = dy / currentImgH;

      let newX = imgX + percentDx;
      let newY = imgY + percentDy;

      // --- NO EMPTY SPACE CONSTRAINTS ---
      // Limit offsets so the image edge never crosses the container edge.
      // Range: +/- (1 - Ratio) / 2
      const ratioW = obj.width / currentImgW;
      const ratioH = obj.height / currentImgH;

      const limitX = (1 - ratioW) / 2;
      const limitY = (1 - ratioH) / 2;

      // Clamp
      if (newX > limitX) newX = limitX;
      if (newX < -limitX) newX = -limitX;
      if (newY > limitY) newY = limitY;
      if (newY < -limitY) newY = -limitY;

      updateObject(obj.id, { imageX: newX, imageY: newY } as any);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setDragStart(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isEditing,
    dragStart,
    zoomFactor,
    obj.width,
    obj.height,
    imgX,
    imgY,
    imgScale,
    naturalRatio,
  ]);

  // Click Outside to Exit Edit Mode
  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".image-edit-controls")) return;
      setIsEditing(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  const handleScaleChange = (val: number[]) => {
    updateObject(obj.id, { imageScale: val[0] } as any);
  };

  // --- STYLES ---
  const containerRatio = obj.width / obj.height;
  const isContainerWider = containerRatio > naturalRatio;

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    // Force CSS to stretch to cover manually so we can use transforms
    width: isContainerWider ? "100%" : "auto",
    height: isContainerWider ? "auto" : "100%",
    maxWidth: "none",
    maxHeight: "none",
    // Transform: Center -> Pan -> Zoom
    transform: `translate(-50%, -50%) translate(${
      imgX * Math.round(imgScale * 100)
    }%, ${imgY * Math.round(imgScale * 100)}%) scale(${Math.max(1, imgScale)})`,
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <TransformWrapper
      obj={obj}
      pointerEvents={pointerEvents}
      {...props}
      onMouseDown={handleInternalMouseDown}
      onDoubleClick={handleDoubleClick}
      hideResizeHandles={false}
      isEditing={isEditing}
      lockAspectRatio={!isEditing} // Lock only when NOT cropping
      metaData={getRenderedDimensions()} // Pass dimensions to Hook for physics
    >
      <div
        ref={innerRef}
        className="w-full h-full relative group"
        style={{
          borderRadius: `${obj.borderRadius * zoomFactor}px`,
          opacity: obj.opacity,
          overflow: isEditing ? "visible" : "hidden",
          zIndex: isEditing ? 50 : "auto",
        }}
      >
        {/* 1. Ghost Image (Edit Mode Background) */}
        {isEditing && (
          <img
            src={obj.src}
            alt=""
            style={{ ...imageStyle, opacity: 0.4, filter: "grayscale(100%)" }}
          />
        )}

        {/* 2. Main Image (Inside Mask) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: `${obj.borderRadius * zoomFactor}px`,
            border: isEditing
              ? `2px solid #8b5cf6` // Purple active border
              : `${obj.strokeWidth * zoomFactor}px solid ${obj.strokeColor}`,
            boxShadow: isEditing ? "0 0 0 1px rgba(255,255,255,0.5)" : "none",
          }}
        >
          <img
            src={obj.src}
            alt="img"
            onLoad={handleImageLoad}
            style={{ ...imageStyle, opacity: 1 }}
          />
        </div>

        {/* 3. Slider Controls */}
        {!obj.isLocked && isEditing && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-60 w-48 image-edit-controls">
            <div
              className="bg-white rounded-md shadow-xl border p-3"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-wider">
                <span>Zoom</span>
                <span>{Math.round(imgScale * 100)}%</span>
              </div>
              <Slider
                defaultValue={[imgScale]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={handleScaleChange}
                className="cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </TransformWrapper>
  );
};
