import { useState, useEffect, useRef } from "react";
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

  // --- HELPER: Calculate Constraints & Update Scale ---
  // This function ensures that whenever we zoom, we also check if the
  // current pan position (imgX/imgY) is still valid. If zooming out
  // makes the image smaller than the offset, we pull it back (clamp).
  const updateScaleWithConstraints = (newScale: number) => {
    // 1. Calculate Expected Dimensions at New Scale
    let currentImgW, currentImgH;

    if (!naturalRatio) {
      currentImgW = obj.width * newScale;
      currentImgH = obj.height * newScale;
    } else {
      const containerRatio = obj.width / obj.height;
      let baseW, baseH;
      // Logic matches "cover" or "contain" base calculation
      if (containerRatio > naturalRatio) {
        baseW = obj.width;
        baseH = obj.width / naturalRatio;
      } else {
        baseH = obj.height;
        baseW = obj.height * naturalRatio;
      }
      currentImgW = baseW * newScale;
      currentImgH = baseH * newScale;
    }

    // 2. Calculate Limits based on new dimensions
    const ratioW = obj.width / currentImgW;
    const ratioH = obj.height / currentImgH;

    // The maximum % shift allowed in any direction
    const limitX = Math.max(0, (1 - ratioW) / 2);
    const limitY = Math.max(0, (1 - ratioH) / 2);

    // 3. Clamp current imgX/imgY to new limits
    let newX = imgX;
    let newY = imgY;

    if (newX > limitX) newX = limitX;
    if (newX < -limitX) newX = -limitX;
    if (newY > limitY) newY = limitY;
    if (newY < -limitY) newY = -limitY;

    // 4. Update Everything
    updateObject(obj.id, {
      imageScale: newScale,
      imageX: newX,
      imageY: newY,
    } as any);
  };

  // --- REFS FOR STABLE EVENT HANDLERS ---
  // We pass the fresh update function to the ref so the wheel listener
  // (which is bound once) can always call the latest logic with correct closures.
  const stateRef = useRef({
    imgScale,
    updateScaleWithConstraints,
    isEditing,
  });

  useEffect(() => {
    stateRef.current = { imgScale, updateScaleWithConstraints, isEditing };
  }, [imgScale, updateScaleWithConstraints, isEditing]);

  // --- EXIT EDIT MODE ON DESELECT ---
  useEffect(() => {
    if (!props.isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [props.isSelected, isEditing]);

  // --- CTRL + SCROLL TO ZOOM ---
  useEffect(() => {
    if (!isEditing) return;

    const handleWheel = (e: WheelEvent) => {
      const { imgScale: currentScale, updateScaleWithConstraints: updater } =
        stateRef.current;

      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        const sensitivity = 0.002;
        const delta = -e.deltaY;

        let newScale = currentScale + delta * sensitivity;
        newScale = Math.min(Math.max(1, newScale), 5); // Max zoom 5x

        // Use the constrained updater
        updater(newScale);
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    return () => {
      window.removeEventListener("wheel", handleWheel, {
        capture: true,
      } as any);
    };
  }, [isEditing]);

  // Calculate pixel size for rendering
  const getRenderedDimensions = () => {
    if (!naturalRatio) return { width: obj.width, height: obj.height };
    const containerRatio = obj.width / obj.height;
    let baseW, baseH;
    if (containerRatio > naturalRatio) {
      baseW = obj.width;
      baseH = obj.width / naturalRatio;
    } else {
      baseH = obj.height;
      baseW = obj.height * naturalRatio;
    }
    return { width: baseW * imgScale, height: baseH * imgScale };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!props.isSelected) return;
    e.stopPropagation();

    if (!obj.isLocked) {
      setIsEditing(true);
      props.setDragTarget(null);
    } else {
      setIsEditing(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > 0) setNaturalRatio(naturalWidth / naturalHeight);
  };

  const handleInternalMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) {
      onMouseDown?.(e);
      if (props.tool !== "select") return;
      e.stopPropagation();

      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        addSelectedId(obj.id);
      } else {
        props.setSelectedId(obj.id);
      }

      if (!obj.isBackground && !obj.isLocked) {
        props.setDragTarget({ id: obj.id });
      }
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // --- PANNING LOGIC ---
  useEffect(() => {
    if (!isEditing || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { width: currentImgW, height: currentImgH } =
        getRenderedDimensions();

      const rawDx = (e.clientX - dragStart.x) / zoomFactor;
      const rawDy = (e.clientY - dragStart.y) / zoomFactor;

      const angleRad = (obj.rotation * Math.PI) / 180;
      const cos = Math.cos(-angleRad);
      const sin = Math.sin(-angleRad);

      const dxLocal = rawDx * cos - rawDy * sin;
      const dyLocal = rawDx * sin + rawDy * cos;

      const percentDx = dxLocal / currentImgW;
      const percentDy = dyLocal / currentImgH;

      let newX = imgX + percentDx;
      let newY = imgY + percentDy;

      const ratioW = obj.width / currentImgW;
      const ratioH = obj.height / currentImgH;
      const limitX = Math.max(0, (1 - ratioW) / 2);
      const limitY = Math.max(0, (1 - ratioH) / 2);

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
    obj.rotation,
    imgX,
    imgY,
    imgScale,
    naturalRatio,
  ]);

  // Click outside exit
  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".image-edit-controls")) return;
      setIsEditing(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  // --- SLIDER HANDLER ---
  const handleScaleChange = (val: number[]) => {
    // Use the constrained updater here too
    updateScaleWithConstraints(val[0]);
  };

  const containerRatio = obj.width / obj.height;
  const isContainerWider = containerRatio > naturalRatio;

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: isContainerWider ? "100%" : "auto",
    height: isContainerWider ? "auto" : "100%",
    maxWidth: "none",
    maxHeight: "none",
    transform: `translate(-50%, -50%) translate(${
      imgX * Math.round(imgScale * 100)
    }%, ${imgY * Math.round(imgScale * 100)}%) scale(${Math.max(1, imgScale)})`,
    pointerEvents: "none",
    userSelect: "none",
    objectFit: obj.isBackground ? "cover" : "fill",
  };

  return (
    <TransformWrapper
      obj={obj}
      pointerEvents={pointerEvents}
      {...props}
      onMouseDown={handleInternalMouseDown}
      onDoubleClick={handleDoubleClick}
      hideResizeHandles={obj.isBackground}
      isEditing={isEditing}
      lockAspectRatio={!isEditing}
      metaData={getRenderedDimensions()}
    >
      <div
        ref={innerRef}
        className="w-full h-full relative group"
        style={{
          borderRadius: `${obj.borderRadius * zoomFactor}px`,
          opacity: obj.opacity,
          overflow: isEditing ? "visible" : "hidden",
          zIndex: isEditing ? 50 : "auto",
          filter: obj.blur ? `blur(${obj.blur}px)` : "none",
        }}
      >
        {isEditing && (
          <img
            src={obj.src}
            alt=""
            style={{ ...imageStyle, opacity: 0.4, filter: "grayscale(100%)" }}
          />
        )}

        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: `${obj.borderRadius * zoomFactor}px`,
            border: isEditing
              ? `2px solid #8b5cf6`
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
                max={5}
                step={0.01}
                value={[imgScale]} // Controlled component
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
