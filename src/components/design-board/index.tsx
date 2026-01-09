import { useEffect, useState } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import GIF from "gif.js";
import { parseGIF, decompressFrames } from "gifuct-js";
import CryptoJS from "crypto-js"; // Import Crypto
import type { Orientation, PaperKey } from "@/lib/constants";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Footer } from "./Footer";
import { LayersPanel } from "./LayersPanel";
import { CanvasArea } from "./CanvasArea";
import { useDesignBoard } from "@/hooks/useDesignBoard";
import { type ExportOptions } from "./ExportDialog";
import {
  type ImageObject,
  type CanvasObject,
  type RectObject,
  type PathObject,
  type TextObject,
} from "@/lib/types";
import { ENABLE_DEV_MODE, VELVET_KEY } from "@/lib/constants";
import { toast } from "sonner";

// --- GIF WORKER ---
const gifWorkerCode = `importScripts('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');`;
const workerBlob = new Blob([gifWorkerCode], {
  type: "application/javascript",
});
const workerUrl = URL.createObjectURL(workerBlob);

// --- SVG GENERATOR ---
const generateSVGString = (
  objects: CanvasObject[],
  width: number,
  height: number,
  bgColor: string
): string => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  if (bgColor && bgColor !== "transparent") {
    svg += `<rect width="100%" height="100%" fill="${bgColor}" />`;
  }

  const renderObject = (obj: CanvasObject): string => {
    const transform = `translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${
      obj.width / 2
    }, ${obj.height / 2})`;

    let content = "";

    if (obj.type === "rect") {
      const o = obj as RectObject;
      content = `<rect width="${o.width}" height="${o.height}" fill="${o.fillColor}" stroke="${o.strokeColor}" stroke-width="${o.strokeWidth}" rx="${o.borderRadius}" />`;
    } else if (obj.type === "path") {
      const o = obj as PathObject;
      const d = o.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      content = `<path d="${d}" fill="none" stroke="${o.strokeColor}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.opacity}" />`;
    } else if (obj.type === "image") {
      const o = obj as ImageObject;
      content = `<image href="${o.src}" width="${o.width}" height="${o.height}" preserveAspectRatio="none" />`;
    } else if (obj.type === "text") {
      const o = obj as TextObject;
      content = `
        <foreignObject width="${o.width}" height="${
        o.height
      }" style="overflow: visible;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="
                width: 100%; 
                height: 100%; 
                font-family: ${o.fontFamily}; 
                font-size: ${o.fontSize}px; 
                color: ${o.color}; 
                text-align: ${o.textAlign};
                font-weight: ${o.isBold ? "bold" : "normal"};
                font-style: ${o.isItalic ? "italic" : "normal"};
                text-decoration: ${o.isUnderline ? "underline" : ""} ${
        o.isStrikethrough ? "line-through" : ""
      };
                line-height: ${o.lineHeight};
                letter-spacing: ${o.letterSpacing}px;
                word-wrap: break-word;
                display: flex;
                align-items: center; 
            ">
                ${o.text}
            </div>
        </foreignObject>`;
    } else if (obj.type === "group") {
      const o = obj as any;
      if (o.objects) {
        content = o.objects.map((child: any) => renderObject(child)).join("");
      }
    }

    return `<g transform="${transform}">${content}</g>`;
  };

  svg += objects.map(renderObject).join("");
  svg += `</svg>`;
  return svg;
};

// --- GIF PARSING UTILS ---
interface Frame {
  canvas: HTMLCanvasElement;
  delay: number;
}

async function loadGifFrames(src: string): Promise<Frame[] | null> {
  try {
    const resp = await fetch(src);
    if (!resp.ok) throw new Error("Network response was not ok");
    const buffer = await resp.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    if (!frames || frames.length === 0) return [];

    const width = frames[0].dims.width;
    const height = frames[0].dims.height;
    const canvasBuffer = document.createElement("canvas");
    canvasBuffer.width = width;
    canvasBuffer.height = height;
    const ctx = canvasBuffer.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    const composedFrames: Frame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const { width: fw, height: fh, top, left } = frame.dims;
      const prevData = ctx.getImageData(0, 0, width, height);

      if (frame.patch.length > 0) {
        const patchData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          fw,
          fh
        );
        const tempCtx = document.createElement("canvas");
        tempCtx.width = fw;
        tempCtx.height = fh;
        tempCtx.getContext("2d")?.putImageData(patchData, 0, 0);
        ctx.drawImage(tempCtx, left, top);
      }

      const snapshot = document.createElement("canvas");
      snapshot.width = width;
      snapshot.height = height;
      snapshot.getContext("2d")?.drawImage(canvasBuffer, 0, 0);
      composedFrames.push({ canvas: snapshot, delay: frame.delay * 10 });

      if (frame.disposalType === 2) ctx.clearRect(left, top, fw, fh);
      else if (frame.disposalType === 3) ctx.putImageData(prevData, 0, 0);
    }
    return composedFrames;
  } catch (e) {
    console.warn("Failed to parse GIF frame data:", src, e);
    return null;
  }
}

interface DesignBoardProps {
  paper: PaperKey;
  orientation: Orientation;
  onBack: () => void;
  initialObjects?: any[];
  initialBgColor?: string;
}

interface ProcessedGif extends ImageObject {
  frames: Frame[];
  totalDuration: number;
}

export default function DesignBoard({
  paper,
  orientation,
  onBack,
  initialObjects,
  initialBgColor,
}: DesignBoardProps) {
  const board = useDesignBoard(
    paper,
    orientation,
    initialObjects,
    initialBgColor
  );
  const [isClosingToolbar, setIsClosingToolbar] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  useEffect(() => {
    // Save current state to LocalStorage whenever critical data changes
    const stateToSave = {
      paper,
      orientation,
      objects: board.objects,
      bgColor: board.bgColor,
      timestamp: Date.now(),
    };
    localStorage.setItem("velvet_autosave", JSON.stringify(stateToSave));
  }, [board.objects, board.bgColor, paper, orientation]);

  const handleCloseToolbar = () => {
    setIsClosingToolbar(true);
    setTimeout(() => {
      board.setSelectedIds([]);
      setIsClosingToolbar(false);
    }, 300);
  };

  const handleDownload = async (options: ExportOptions) => {
    const { format, transparent, compress } = options;
    const element = document.querySelector(".paper-canvas") as HTMLElement;

    // --- 1. VELVET EXPORT (ENCRYPTED) ---
    if (format === "velvet" || format === "template") {
      const data = {
        ...(format == "template" ? options.templateMeta : {}),
        objects: board.objects,
        paper,
        orientation,
        bgColor: board.bgColor,
      };
      const jsonString = JSON.stringify(data, null, 2);

      // Encrypt
      const encrypted = CryptoJS.AES.encrypt(jsonString, VELVET_KEY).toString();

      const blob = new Blob([encrypted], { type: "application/velvet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        `${options.templateMeta?.name || "design"}.velvet` || "design.velvet";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    // --- 2. JSON EXPORT (PLAIN) ---
    if (format === "json") {
      const data = {
        objects: board.objects,
        paper,
        orientation,
        bgColor: board.bgColor,
      };
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "design.json";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!element) return;

    // --- VISUAL EXPORT PREP ---
    const previousSelection = board.selectedIds;
    const previousZoom = board.zoom;
    board.setSelectedIds([]);
    board.setZoom([100]); // Force 100% zoom

    const originalBorder = element.style.border;
    const originalBoxShadow = element.style.boxShadow;
    if (transparent) {
      element.style.border = "none";
      element.style.boxShadow = "none";
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const config = {
        backgroundColor: transparent ? "transparent" : board.bgColor,
        pixelRatio: compress ? 1 : 2,
        style: { transformOrigin: "top left" },
      };

      if (format === "svg") {
        const svgString = generateSVGString(
          board.objects,
          board.width,
          board.height,
          transparent ? "transparent" : board.bgColor
        );
        const blob = new Blob([svgString], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "design.svg";
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "gif") {
        // GIF Logic (Abbreviated for clarity, same logic as before)
        const gifObjects = board.objects.filter(
          (obj): obj is ImageObject =>
            obj.type === "image" &&
            ((obj as ImageObject).src
              .toLowerCase()
              .includes("data:image/gif") ||
              (obj as ImageObject).src.toLowerCase().endsWith(".gif"))
        );

        const processedGifs = await Promise.all(
          gifObjects.map(async (obj) => {
            const frames = await loadGifFrames(obj.src);
            return {
              ...obj,
              frames,
              totalDuration: frames
                ? frames.reduce((acc, f) => acc + f.delay, 0)
                : 0,
            };
          })
        );
        const validAnimatedGifs = processedGifs.filter(
          (g): g is ProcessedGif => g.frames !== null && g.frames.length > 0
        );

        const gifConfig = {
          ...config,
          filter: (node: HTMLElement) => {
            if (node.tagName === "IMG") {
              const src = (node as HTMLImageElement).src;
              const isAnimated = validAnimatedGifs.some(
                (g) => src.includes(g.src) || g.src.includes(src)
              );
              if (isAnimated) return false;
            }
            return true;
          },
        };

        const staticBackground = await htmlToImage.toCanvas(element, gifConfig);
        const gif = new GIF({
          workers: 4,
          quality: 10,
          workerScript: workerUrl,
          width: staticBackground.width,
          height: staticBackground.height,
          transparent: transparent ? "0x000000" : null,
        });

        const FPS = 15;
        const DURATION_MS = 3000;
        const frameDelay = 1000 / FPS;
        const scale = compress ? 1 : 2;
        const composeCanvas = document.createElement("canvas");
        composeCanvas.width = staticBackground.width;
        composeCanvas.height = staticBackground.height;
        const ctx = composeCanvas.getContext("2d");

        if (ctx) {
          let currentTime = 0;
          while (currentTime < DURATION_MS) {
            ctx.clearRect(0, 0, composeCanvas.width, composeCanvas.height);
            ctx.drawImage(staticBackground, 0, 0);
            validAnimatedGifs.forEach((gifObj) => {
              const loopTime = currentTime % gifObj.totalDuration;
              let frameTime = 0;
              let currentFrame = gifObj.frames[0].canvas;
              for (const f of gifObj.frames) {
                if (frameTime + f.delay > loopTime) {
                  currentFrame = f.canvas;
                  break;
                }
                frameTime += f.delay;
              }
              ctx.save();
              const cx = (gifObj.x + gifObj.width / 2) * scale;
              const cy = (gifObj.y + gifObj.height / 2) * scale;
              ctx.translate(cx, cy);
              ctx.rotate((gifObj.rotation * Math.PI) / 180);
              ctx.drawImage(
                currentFrame,
                -(gifObj.width / 2) * scale,
                -(gifObj.height / 2) * scale,
                gifObj.width * scale,
                gifObj.height * scale
              );
              ctx.restore();
            });
            gif.addFrame(ctx, { delay: frameDelay, copy: true });
            currentTime += frameDelay;
          }
        }
        gif.on("finished", (blob: Blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "design.gif";
          link.click();
        });
        gif.render();
      } else {
        // PNG, JPG, PDF
        let dataUrl = "";
        if (format === "jpg") {
          dataUrl = await htmlToImage.toJpeg(element, {
            ...config,
            quality: compress ? 0.6 : 1.0,
          });
        } else {
          dataUrl = await htmlToImage.toPng(element, config);
        }

        if (format === "pdf") {
          const pdf = new jsPDF({
            orientation: orientation === "portrait" ? "p" : "l",
            unit: "px",
            format: [board.width, board.height],
          });
          pdf.addImage(dataUrl, "PNG", 0, 0, board.width, board.height);
          pdf.save("design.pdf");
        } else {
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `design.${format}`;
          link.click();
        }
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export design.");
    } finally {
      if (transparent) {
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
      }
      board.setZoom(previousZoom);
      board.setSelectedIds(previousSelection);
    }
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
        handleDevImageUpload={
          ENABLE_DEV_MODE ? board.handleDevImageUpload : undefined
        }
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
        updateSelected={(updates) =>
          board.selectedIds.length === 1 &&
          board.updateObject(board.selectedIds[0], updates, true)
        }
        handleCloseToolbar={handleCloseToolbar}
        isClosingToolbar={isClosingToolbar}
      />

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
        onDownload={handleDownload}
      />
    </div>
  );
}
