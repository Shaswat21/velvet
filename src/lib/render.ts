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
      // 2. Added xlink:href alongside href
      content = `<image xlink:href="${o.src}" href="${o.src}" width="${o.width}" height="${o.height}" preserveAspectRatio="none" />`;
    } else if (obj.type === "text") {
      const o = obj as TextObject;
      content = `
        <foreignObject width="${o.width}" height="${
        o.height
      }" style="overflow: visible;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="
                width: 100%; 
                height: 100%; 
                font-family: ${o.fontFamily}, sans-serif; 
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
                justify-content: ${
                  o.textAlign === "center"
                    ? "center"
                    : o.textAlign === "right"
                    ? "flex-end"
                    : "flex-start"
                };
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
