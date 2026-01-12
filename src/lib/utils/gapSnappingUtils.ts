import type { CanvasObject } from "@/lib/types";

export interface GapGuide {
  id: string;
  x: number;
  y: number;
  width?: number; // length for horizontal gaps
  height?: number; // length for vertical gaps
  label: string; // e.g. "24"
  direction: "horizontal" | "vertical";
}

interface GapSnapResult {
  snapDx: number;
  snapDy: number;
  gapGuides: GapGuide[];
}

const GAP_THRESHOLD = 5;

// Helper: Check if intervals overlap
const hasOverlap = (a1: number, a2: number, b1: number, b2: number) => {
  return Math.max(a1, b1) < Math.min(a2, b2);
};

export const calculateGapSnapping = (
  draggedObj: CanvasObject,
  newX: number,
  newY: number,
  objects: CanvasObject[],
  selectedIds: string[]
): GapSnapResult => {
  let snapDx = 0;
  let snapDy = 0;
  let gapGuides: GapGuide[] = [];

  const dW = draggedObj.width;
  const dH = draggedObj.height;

  // Exclude self and selected items
  const targets = objects.filter(
    (o) => !selectedIds.includes(o.id) && o.id !== draggedObj.id
  );

  // --- 1. VERTICAL GAPS (Y-Axis) ---
  // Find objects that overlap horizontally with the dragged item
  const vCandidates = targets.filter((t) =>
    hasOverlap(newX, newX + dW, t.x, t.x + t.width)
  );
  vCandidates.sort((a, b) => a.y - b.y);

  // Check gaps between pairs of existing objects
  for (let i = 0; i < vCandidates.length - 1; i++) {
    const topObj = vCandidates[i];
    const botObj = vCandidates[i + 1];
    const gap = botObj.y - (topObj.y + topObj.height);

    if (gap < 0) continue; // Skip overlapping

    // A. Dragged Object is BELOW the pair ( A -> B -> [Dragged] )
    const targetY_Below = botObj.y + botObj.height + gap;
    if (Math.abs(targetY_Below - newY) < GAP_THRESHOLD) {
      snapDy = targetY_Below - newY;
      gapGuides = [
        {
          id: "v1",
          x: newX + dW / 2,
          y: topObj.y + topObj.height,
          height: gap,
          label: Math.round(gap).toString(),
          direction: "vertical",
        },
        {
          id: "v2",
          x: newX + dW / 2,
          y: botObj.y + botObj.height,
          height: gap,
          label: Math.round(gap).toString(),
          direction: "vertical",
        },
      ];
      break; // Found snap, stop
    }

    // B. Dragged Object is ABOVE the pair ( [Dragged] -> A -> B )
    const targetY_Above = topObj.y - gap - dH;
    if (Math.abs(targetY_Above - newY) < GAP_THRESHOLD) {
      snapDy = targetY_Above - newY;
      gapGuides = [
        {
          id: "v1",
          x: newX + dW / 2,
          y: targetY_Above + dH,
          height: gap,
          label: Math.round(gap).toString(),
          direction: "vertical",
        },
        {
          id: "v2",
          x: newX + dW / 2,
          y: topObj.y + topObj.height,
          height: gap,
          label: Math.round(gap).toString(),
          direction: "vertical",
        },
      ];
      break;
    }

    // C. Dragged Object is MIDDLE ( A -> [Dragged] -> B )
    // We want equal gaps: (space - dH) / 2
    const space = botObj.y - (topObj.y + topObj.height);
    if (space > dH) {
      const targetY_Mid = topObj.y + topObj.height + (space - dH) / 2;
      if (Math.abs(targetY_Mid - newY) < GAP_THRESHOLD) {
        snapDy = targetY_Mid - newY;
        const size = (space - dH) / 2;
        gapGuides = [
          {
            id: "vm1",
            x: newX + dW / 2,
            y: topObj.y + topObj.height,
            height: size,
            label: Math.round(size).toString(),
            direction: "vertical",
          },
          {
            id: "vm2",
            x: newX + dW / 2,
            y: targetY_Mid + dH,
            height: size,
            label: Math.round(size).toString(),
            direction: "vertical",
          },
        ];
        break;
      }
    }
  }

  // --- 2. HORIZONTAL GAPS (X-Axis) ---
  if (snapDy === 0) {
    // Only check X if Y didn't snap (optional priority)
    const hCandidates = targets.filter((t) =>
      hasOverlap(newY, newY + dH, t.y, t.y + t.height)
    );
    hCandidates.sort((a, b) => a.x - b.x);

    for (let i = 0; i < hCandidates.length - 1; i++) {
      const leftObj = hCandidates[i];
      const rightObj = hCandidates[i + 1];
      const gap = rightObj.x - (leftObj.x + leftObj.width);

      if (gap < 0) continue;

      // RIGHT ( A -> B -> [Dragged] )
      const targetX_Right = rightObj.x + rightObj.width + gap;
      if (Math.abs(targetX_Right - newX) < GAP_THRESHOLD) {
        snapDx = targetX_Right - newX;
        gapGuides = [
          {
            id: "h1",
            y: newY + dH / 2,
            x: leftObj.x + leftObj.width,
            width: gap,
            label: Math.round(gap).toString(),
            direction: "horizontal",
          },
          {
            id: "h2",
            y: newY + dH / 2,
            x: rightObj.x + rightObj.width,
            width: gap,
            label: Math.round(gap).toString(),
            direction: "horizontal",
          },
        ];
        break;
      }

      // LEFT ( [Dragged] -> A -> B )
      const targetX_Left = leftObj.x - gap - dW;
      if (Math.abs(targetX_Left - newX) < GAP_THRESHOLD) {
        snapDx = targetX_Left - newX;
        gapGuides = [
          {
            id: "h1",
            y: newY + dH / 2,
            x: targetX_Left + dW,
            width: gap,
            label: Math.round(gap).toString(),
            direction: "horizontal",
          },
          {
            id: "h2",
            y: newY + dH / 2,
            x: leftObj.x + leftObj.width,
            width: gap,
            label: Math.round(gap).toString(),
            direction: "horizontal",
          },
        ];
        break;
      }

      // MIDDLE ( A -> [Dragged] -> B )
      const space = rightObj.x - (leftObj.x + leftObj.width);
      if (space > dW) {
        const targetX_Mid = leftObj.x + leftObj.width + (space - dW) / 2;
        if (Math.abs(targetX_Mid - newX) < GAP_THRESHOLD) {
          snapDx = targetX_Mid - newX;
          const size = (space - dW) / 2;
          gapGuides = [
            {
              id: "hm1",
              y: newY + dH / 2,
              x: leftObj.x + leftObj.width,
              width: size,
              label: Math.round(size).toString(),
              direction: "horizontal",
            },
            {
              id: "hm2",
              y: newY + dH / 2,
              x: targetX_Mid + dW,
              width: size,
              label: Math.round(size).toString(),
              direction: "horizontal",
            },
          ];
          break;
        }
      }
    }
  }

  return { snapDx, snapDy, gapGuides };
};
