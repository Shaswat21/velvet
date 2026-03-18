import type {
  CanvasObject,
  RectObject,
  PathObject,
  ImageObject,
  TextObject,
} from "@/lib/types";

export const generateSVGString = (
  objects: CanvasObject[],
  width: number,
  height: number,
  bgColor: string
): string => {
  // 1. Added xmlns:xlink for better image compatibility
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;

  // Background
  if (bgColor && bgColor !== "transparent") {
    svg += `<rect width="100%" height="100%" fill="${bgColor}" />`;
  }

  const renderObject = (obj: CanvasObject): string => {
    // Transform: Translate to position -> Rotate around center
    const transform = `translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${
      obj.width / 2
    }, ${obj.height / 2})`;

    let content = "";

    let styleStr = "";
    if (obj.blur && obj.type !== "rect") {
      styleStr += `filter: blur(${obj.blur}px); `;
    }
    const styleAttr = styleStr ? ` style="${styleStr.trim()}"` : "";

    if (obj.type === "rect") {
      const o = obj as RectObject;
      const isGlass = !!o.isGlass;
      const isLiquid = !!o.isLiquid;
      
      let boxShadow = "none";
      if (o.shadow) {
        boxShadow = `${o.shadow.x}px ${o.shadow.y}px ${o.shadow.blur}px ${o.shadow.color}`;
      }

      if (!isGlass && !isLiquid) {
        // Standard shape, just use SVG rect with shadow
        const rectShadowAttr = o.shadow ? ` filter="drop-shadow(${o.shadow.x}px ${o.shadow.y}px ${o.shadow.blur}px ${o.shadow.color})"` : (o.blur ? ` filter="blur(${o.blur}px)"` : ``);
        content = `<rect width="${o.width}" height="${o.height}" fill="${o.fillColor}" stroke="${o.strokeColor}" stroke-width="${o.strokeWidth}" rx="${o.borderRadius}"${rectShadowAttr} />`;
      } else if (isGlass) {
        // Glass effect
        const glassBlurAmount = o.blur || 20;
        const buffer = 100;
        content = `
          <foreignObject x="-${buffer}" y="-${buffer}" width="${o.width + buffer * 2}" height="${o.height + buffer * 2}" style="overflow: visible;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; position: relative; margin: 0; padding: 0; overflow: visible;">
              <div style="
                position: absolute; top: ${buffer}px; left: ${buffer}px; width: ${o.width}px; height: ${o.height}px; 
                border-radius: ${o.borderRadius}px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 100%);
                backdrop-filter: blur(${glassBlurAmount}px) saturate(180%);
                -webkit-backdrop-filter: blur(${glassBlurAmount}px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: ${boxShadow};
                box-sizing: border-box;
              "></div>
            </div>
          </foreignObject>`;
      } else if (isLiquid) {
        // Liquid effect
        const filterId = `glass-distortion-${obj.id}`;
        const baseFreq = o.liquidNoiseFreq ?? 0.008;
        const baseDistortion = o.liquidDistortion ?? 77;
        const buffer = 100;
        
        content = `
          <foreignObject x="-${buffer}" y="-${buffer}" width="${o.width + buffer * 2}" height="${o.height + buffer * 2}" style="overflow: visible;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; position: relative; margin: 0; padding: 0; overflow: visible;">
              <div style="
                position: absolute; top: ${buffer}px; left: ${buffer}px; width: ${o.width}px; height: ${o.height}px;
                border-radius: ${o.borderRadius}px;
                box-shadow: ${boxShadow};
                box-sizing: border-box;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" style="position: absolute; width: 0; height: 0; overflow: hidden;">
                  <defs>
                    <filter id="${filterId}" x="0%" y="0%" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="${baseFreq} ${baseFreq}" numOctaves="2" seed="92" result="noise" />
                      <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                      <feDisplacementMap in="SourceGraphic" in2="blurred" scale="${baseDistortion}" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                  </defs>
                </svg>
                <div style="
                  margin: 0; padding: 0; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                  border-radius: ${o.borderRadius}px;
                  box-shadow: inset 0 0 20px -5px rgba(255, 255, 255, 0.7);
                  background-color: rgba(255, 255, 255, 0.4);
                  pointer-events: none;
                "></div>
                <div style="
                  margin: 0; padding: 0; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                  border-radius: ${o.borderRadius}px;
                  backdrop-filter: blur(2px);
                  -webkit-backdrop-filter: blur(2px);
                  filter: url(#${filterId});
                  transform: translateZ(0);
                  pointer-events: none;
                "></div>
              </div>
            </div>
          </foreignObject>`;
      }
    } else if (obj.type === "path") {
      const o = obj as PathObject;
      const d = o.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      content = `<path d="${d}" fill="none" stroke="${o.strokeColor}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
    } else if (obj.type === "image") {
      const o = obj as ImageObject;
      
      let imgStyle = "";
      if (o.isBackground) {
        // Simple background mapping without the pan controls mapping to avoid ratio mismatch issues
        imgStyle = `position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover;`;
      } else {
        const imgX = o.imageX ?? 0;
        const imgY = o.imageY ?? 0;
        const imgScale = o.imageScale ?? 1;
        const flipX = o.flipX ? -1 : 1;
        const flipY = o.flipY ? -1 : 1;
        
        // Use min-width and min-height exclusively to emulate object-fit: cover behaviour but mathematically match DOM translation correctly.
        imgStyle = `position: absolute; left: 50%; top: 50%; 
          min-width: 100%; min-height: 100%; max-width: none; max-height: none;
          transform: translate(-50%, -50%) translate(${imgX * Math.round(imgScale * 100)}%, ${imgY * Math.round(imgScale * 100)}%) scale(${Math.max(1, imgScale)}) scale(${flipX}, ${flipY});`;
      }
      
      content = `
        <foreignObject width="${o.width}" height="${o.height}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            width: 100%;
            height: 100%;
            border-radius: ${o.borderRadius}px;
            border: ${o.strokeWidth}px solid ${o.strokeColor};
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
          ">
            <img src="${o.src}" style="${imgStyle}" />
          </div>
        </foreignObject>`;
    } else if (obj.type === "text") {
      const o = obj as TextObject;
      const padding = o.transliterationEnabled ? 12 : 4;
      
      const safeText = o.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const decoration = [o.isUnderline ? "underline" : "", o.isStrikethrough ? "line-through" : ""].filter(Boolean).join(" ") || "none";
      
      // Buffer to defeat foreignObject hard-clipping behavior on cursive swashes
      const buffer = Math.max(200, o.fontSize);
      
      content = `
        <foreignObject x="-${buffer}" y="-${buffer}" width="${o.width + buffer * 2}" height="${o.height + buffer * 2}" style="overflow: visible;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; position: relative; margin: 0; padding: 0; overflow: visible;">
              <div style="
                  position: absolute;
                  top: ${buffer}px;
                  left: ${buffer}px;
                  width: ${o.width}px; 
                  height: ${o.height}px; 
                  margin: 0;
                  box-sizing: border-box;
                  padding: ${padding}px;
                  font-family: '${o.fontFamily}', sans-serif; 
                  font-size: ${o.fontSize}px; 
                  color: ${o.color}; 
                  text-align: ${o.textAlign};
                  font-weight: ${o.isBold ? "bold" : "normal"};
                  font-style: ${o.isItalic ? "italic" : "normal"};
                  text-decoration: ${decoration};
                  line-height: ${o.lineHeight};
                  letter-spacing: ${o.letterSpacing / 1000}em;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  background-color: ${o.backgroundColor || 'transparent'};
                  text-transform: ${o.textTransform || 'none'};
                  border: none;
                  outline: none;
                  overflow: visible;
              ">${safeText}</div>
            </div>
        </foreignObject>`;
    } else if (obj.type === "group") {
      const o = obj as any;
      if (o.objects) {
        content = o.objects.map((child: any) => renderObject(child)).join("");
      }
    }

    return `<g transform="${transform}" opacity="${obj.opacity ?? 1}"${styleAttr}>${content}</g>`;
  };

  svg += objects.map(renderObject).join("");
  svg += `</svg>`;
  return svg;
};
