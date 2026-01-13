import { TransformWrapper } from "./TransformWrapper";
import type { RectObject, ToolType } from "@/lib/types";

interface RectItemProps {
  obj: RectObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none";
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const RectItem = ({
  obj,
  innerRef,
  pointerEvents,
  addSelectedId,
  onMouseDown,
  ...props
}: RectItemProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (props.tool !== "select") return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      addSelectedId(obj.id);
    } else {
      props.setSelectedId(obj.id);
    }
    props.setDragTarget({ id: obj.id });
  };

  const isGlass = !!obj.isGlass;
  const isLiquid = !!obj.isLiquid;

  // --- ZOOM SCALING ---
  const zoomFactor = props.zoom / 100;
  const borderRadius = obj.borderRadius * zoomFactor;

  // Scale the user's blur setting so it looks consistent at any zoom level
  const rawBlur = obj.blur || 0;
  const scaledBlur = rawBlur * zoomFactor;

  // --- LIQUID SCALING LOGIC ---
  const baseFreq = obj.liquidNoiseFreq ?? 0.008;
  const baseDistortion = obj.liquidDistortion ?? 77;

  // Frequency: Inverse scale (larger object = lower freq per pixel to maintain look)
  const adjustedFreq = baseFreq / zoomFactor;
  // Distortion: Direct scale (larger object = larger pixel displacement needed)
  const adjustedDistortion = baseDistortion * zoomFactor;

  // --- SHADOW LOGIC ---
  let boxShadow = "none";
  if (obj.shadow) {
    const sX = obj.shadow.x * zoomFactor;
    const sY = obj.shadow.y * zoomFactor;
    const sBlur = obj.shadow.blur * zoomFactor;
    boxShadow = `${sX}px ${sY}px ${sBlur}px ${obj.shadow.color}`;
  }

  // --- STYLES ---
  const filterId = `glass-distortion-${obj.id}`;

  const liquidStyle: React.CSSProperties = {
    boxShadow: boxShadow,
    backgroundColor: "transparent",
    border: "none",
  };

  // Default glass blur is 20px if not set, scaled by zoom
  const glassBlurAmount = scaledBlur || 20 * zoomFactor;

  const glassStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 100%)",
    backdropFilter: `blur(${glassBlurAmount}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${glassBlurAmount}px) saturate(180%)`,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: boxShadow,
  };

  const standardStyle: React.CSSProperties = {
    backgroundColor: obj.fillColor,
    border: `${obj.strokeWidth * zoomFactor}px solid ${obj.strokeColor}`,
    filter:
      !isGlass && !isLiquid && scaledBlur ? `blur(${scaledBlur}px)` : "none",
    boxShadow: boxShadow,
  };

  const containerStyle = isLiquid
    ? liquidStyle
    : isGlass
    ? glassStyle
    : standardStyle;

  return (
    <TransformWrapper
      obj={obj}
      pointerEvents={pointerEvents}
      {...props}
      onMouseDown={onMouseDown || handleMouseDown}
    >
      <div
        ref={innerRef}
        className="w-full h-full relative"
        style={{
          ...containerStyle,
          borderRadius: `${borderRadius}px`,
          opacity: obj.opacity ?? 1,
          isolation: "isolate",
        }}
      >
        {isLiquid && (
          <>
            {/* DYNAMIC SVG FILTER */}
            <svg
              style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
              }}
            >
              <defs>
                <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency={`${adjustedFreq} ${adjustedFreq}`}
                    numOctaves="2"
                    seed="92"
                    result="noise"
                  />
                  <feGaussianBlur
                    in="noise"
                    stdDeviation="2"
                    result="blurred"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="blurred"
                    scale={adjustedDistortion}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            </svg>

            {/* Inner Shadow / Tint Layer */}
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                borderRadius: `${borderRadius}px`,
                // Scale the inset shadow parameters
                boxShadow: `inset 0 0 ${20 * zoomFactor}px ${
                  -5 * zoomFactor
                }px rgba(255, 255, 255, 0.7)`,
                backgroundColor: "rgba(255, 255, 255, 0.4)",
              }}
            />

            {/* Distortion Layer */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                borderRadius: `${borderRadius}px`,
                // Scale the internal frost blur (Default 2px -> 2 * zoom)
                backdropFilter: `blur(${2 * zoomFactor}px)`,
                WebkitBackdropFilter: `blur(${2 * zoomFactor}px)`,
                filter: `url(#${filterId})`,
                transform: "translateZ(0)",
              }}
            />
          </>
        )}
      </div>
    </TransformWrapper>
  );
};
