import { useEffect, useRef } from "react";
import type { PathObject, ToolType } from "@/lib/types";
import { TransformWrapper } from "./TransformWrapper";

interface PathItemProps {
  obj: PathObject;
  zoom: number;
  tool: ToolType;
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
  ...props
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
    ctx.globalAlpha = obj.opacity ?? 1;

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
      {...props}
    >
      <div
        ref={innerRef}
        style={{
          width: "100%",
          height: "100%",
          // Apply Mirroring
          transform: `scale(${obj.flipX ? -1 : 1}, ${obj.flipY ? -1 : 1})`,
          // Apply blur
          filter: obj.blur ? `blur(${obj.blur}px)` : "none",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </TransformWrapper>
  );
};
