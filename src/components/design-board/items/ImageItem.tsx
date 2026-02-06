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
    null,
  );
  const [naturalRatio, setNaturalRatio] = useState<number>(0);

  const imgX = (obj as any).imageX ?? 0;
  const imgY = (obj as any).imageY ?? 0;
  const imgScale = (obj as any).imageScale ?? 1;

  // --- HELPER: Calculate Constraints & Update Scale ---
  const updateScaleWithConstraints = (newScale: number) => {
    let currentImgW, currentImgH;

    if (!naturalRatio) {
      currentImgW = obj.width * newScale;
      currentImgH = obj.height * newScale;
    } else {
      const containerRatio = obj.width / obj.height;
      let baseW, baseH;
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

    const ratioW = obj.width / currentImgW;
    const ratioH = obj.height / currentImgH;

    const limitX = Math.max(0, (1 - ratioW) / 2);
    const limitY = Math.max(0, (1 - ratioH) / 2);

    let newX = imgX;
    let newY = imgY;

    if (newX > limitX) newX = limitX;
    if (newX < -limitX) newX = -limitX;
    if (newY > limitY) newY = limitY;
    if (newY < -limitY) newY = -limitY;

    updateObject(obj.id, {
      imageScale: newScale,
      imageX: newX,
      imageY: newY,
    } as any);
  };

  const stateRef = useRef({
    imgScale,
    updateScaleWithConstraints,
    isEditing,
  });

  useEffect(() => {
    stateRef.current = { imgScale, updateScaleWithConstraints, isEditing };
  }, [imgScale, updateScaleWithConstraints, isEditing]);

  // Exit edit mode on deselect
  useEffect(() => {
    if (!props.isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [props.isSelected, isEditing]);

  // Ctrl + Scroll to Zoom
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
        newScale = Math.min(Math.max(1, newScale), 5);

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

  // Panning Logic
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

  // Click outside to exit
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
    updateScaleWithConstraints(val[0]);
  };

  const containerRatio = obj.width / obj.height;
  const isContainerWider = containerRatio > naturalRatio;

  // --- FLIP TRANSFORM ---
  // Create the transform string for flipping
  const flipTransform = `scale(${obj.flipX ? -1 : 1}, ${obj.flipY ? -1 : 1})`;

  // Combine transforms: Position/Scale -> Flip
  // We apply the flip AFTER the translation/scale so it flips in place visually
  const imageTransform = `translate(-50%, -50%) translate(${imgX * Math.round(imgScale * 100)
    }%, ${imgY * Math.round(imgScale * 100)}%) scale(${Math.max(
      1,
      imgScale,
    )}) ${flipTransform}`;

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: isContainerWider ? "100%" : "auto",
    height: isContainerWider ? "auto" : "100%",
    maxWidth: "none",
    maxHeight: "none",
    transform: imageTransform, // Updated transform
    pointerEvents: "none",
    userSelect: "none",
    objectFit: obj.isBackground ? "cover" : "fill",
  };

  // --- CONTROLS POSITIONING LOGIC ---
  const getControlsStyle = () => {
    const angleRad = (obj.rotation * Math.PI) / 180;

    const w = obj.width * zoomFactor;
    const h = obj.height * zoomFactor;
    const aabbHeight =
      Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad));

    const spacing = 60;
    const distFromCenter = aabbHeight / 2 + spacing;

    const localX = distFromCenter * Math.sin(angleRad);
    const localY = distFromCenter * Math.cos(angleRad);

    return {
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      transform: `translate(-50%, -50%) translate(${localX}px, ${localY}px) rotate(${-obj.rotation}deg)`,
      zIndex: 60,
      width: "12rem",
      pointerEvents: "auto" as const,
    };
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
          <div className="image-edit-controls" style={getControlsStyle()}>
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
                value={[imgScale]}
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
