import { useEffect, useRef } from "react";
import type { PathObject, ToolType } from "@/lib/types";
import { TransformWrapper } from "./TransformWrapper"; // Import the existing wrapper

interface PathItemProps {
  obj: PathObject;
  zoom: number;
  tool: ToolType; // Added tool prop
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  innerRef: (el: HTMLDivElement | null) => void;
  setResizingTarget: (t: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
}

export const PathItem = ({
  obj,
  zoom,
  tool,
  isSelected,
  onMouseDown,
  innerRef,
  setResizingTarget,
  setRotatingTarget,
}: PathItemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomScale = zoom / 100;

  // Draw the path on the local canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High DPI
    const scale = window.devicePixelRatio || 1;
    
    // Set logical dimensions matches object size * zoom
    canvas.width = obj.width * zoomScale * scale;
    canvas.height = obj.height * zoomScale * scale;
    
    ctx.scale(scale, scale);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style
    ctx.strokeStyle = obj.strokeColor;
    ctx.lineWidth = obj.strokeWidth * zoomScale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = obj.opacity;

    // Draw
    if (obj.points.length > 1) {
      ctx.beginPath();
      // Points are relative to object x,y
      ctx.moveTo(obj.points[0].x * zoomScale, obj.points[0].y * zoomScale);
      for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(obj.points[i].x * zoomScale, obj.points[i].y * zoomScale);
      }
      ctx.stroke();
    }
  }, [obj, zoomScale]);

  return (
    <TransformWrapper
      obj={obj}
      zoom={zoom}
      isSelected={isSelected}
      tool={tool}
      onMouseDown={onMouseDown}
      setResizingTarget={setResizingTarget}
      setRotatingTarget={setRotatingTarget}
      // Note: If TransformWrapper doesn't support innerRef in your version, 
      // you might need to wrap this in a fragment or check the wrapper definition.
      // Assuming standard implementation:
      // pointerEvents="auto"
    >
      {/* We need to attach the innerRef to something solid if TransformWrapper doesn't forward it. 
          However, usually the wrapper IS the element. 
          For now, we pass the canvas as the child. */}
      <div 
        ref={innerRef} 
        style={{ width: "100%", height: "100%" }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </TransformWrapper>
  );
};