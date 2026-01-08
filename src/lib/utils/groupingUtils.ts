import type { CanvasObject, GroupObject } from "@/lib/types";
import { getRotatedBoundingBox, rotatePoint } from "@/lib/utils/utils";

// Helper to flatten items (handle nested groups)
const flattenItem = (item: CanvasObject): CanvasObject[] => {
  if (item.type !== "group") return [item];

  const group = item as GroupObject;
  const scaleX = group.width / group.originalWidth;
  const scaleY = group.height / group.originalHeight;
  const groupCx = group.x + group.width / 2;

  return group.objects.flatMap((child: any) => {
    const newChildWidth = child.width * scaleX;
    const newChildHeight = child.height * scaleY;
    const childCxRelative = (child.x + child.width / 2) * scaleX;
    const childCyRelative = (child.y + child.height / 2) * scaleY;

    // Calculate distance from group center
    const dx = childCxRelative - group.width / 2;
    const dy = childCyRelative - group.height / 2;

    // Rotate that distance by the group's rotation
    const rotatedOffset = rotatePoint(dx, dy, 0, 0, group.rotation);

    const newWorldCx = groupCx + rotatedOffset.x;
    const newWorldCy = group.y + group.height / 2 + rotatedOffset.y;

    const flattenedChild: CanvasObject = {
      ...child,
      id: Math.random().toString(36).substr(2, 9),
      x: newWorldCx - newChildWidth / 2,
      y: newWorldCy - newChildHeight / 2,
      width: newChildWidth,
      height: newChildHeight,
      rotation: (child.rotation + group.rotation) % 360,
      ...(child.type === "group"
        ? {
            originalWidth: (child as GroupObject).originalWidth * scaleX,
            originalHeight: (child as GroupObject).originalHeight * scaleY,
          }
        : {}),
    } as CanvasObject;

    return flattenItem(flattenedChild);
  });
};

export const performGroup = (
  objects: CanvasObject[],
  selectedIds: string[]
) => {
  const itemsToGroup = objects.filter((o) => selectedIds.includes(o.id));

  if (itemsToGroup.length < 2) return null;
  if (itemsToGroup.some((o) => o.isLocked)) return null;

  const flatItemsToGroup = itemsToGroup.flatMap((item) => flattenItem(item));

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  flatItemsToGroup.forEach((obj) => {
    const bounds = getRotatedBoundingBox(obj);
    if (bounds.minX < minX) minX = bounds.minX;
    if (bounds.minY < minY) minY = bounds.minY;
    if (bounds.maxX > maxX) maxX = bounds.maxX;
    if (bounds.maxY > maxY) maxY = bounds.maxY;
  });

  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;

  const groupedChildren = flatItemsToGroup.map((obj) => ({
    ...obj,
    x: obj.x - minX,
    y: obj.y - minY,
  }));

  const newGroupId = Math.random().toString(36).substr(2, 9);

  const groupObj: GroupObject = {
    id: newGroupId,
    type: "group",
    x: minX,
    y: minY,
    width: groupWidth,
    height: groupHeight,
    originalWidth: groupWidth,
    originalHeight: groupHeight,
    rotation: 0,
    objects: groupedChildren,
  };

  const remainingObjects = objects.filter((o) => !selectedIds.includes(o.id));
  const finalObjects = [...remainingObjects, groupObj];

  return { finalObjects, newGroupId };
};

export const performUngroup = (
  objects: CanvasObject[],
  selectedIds: string[]
) => {
  if (selectedIds.length !== 1) return null;

  const group = objects.find((o) => o.id === selectedIds[0]);
  if (!group || group.type !== "group" || group.isLocked) return null;

  const scaleX = group.width / group.originalWidth;
  const scaleY = group.height / group.originalHeight;
  const groupCx = group.x + group.width / 2;
  const groupCy = group.y + group.height / 2;

  const restoredChildren = (group as GroupObject).objects.map((child: any) => {
    const childCxRelative = (child.x + child.width / 2) * scaleX;
    const childCyRelative = (child.y + child.height / 2) * scaleY;

    const dx = childCxRelative - group.width / 2;
    const dy = childCyRelative - group.height / 2;

    const rotatedOffset = rotatePoint(dx, dy, 0, 0, group.rotation);

    const newWorldCx = groupCx + rotatedOffset.x;
    const newWorldCy = groupCy + rotatedOffset.y;

    const newChildWidth = child.width * scaleX;
    const newChildHeight = child.height * scaleY;

    return {
      ...child,
      id: Math.random().toString(36).substr(2, 9),
      x: newWorldCx - newChildWidth / 2,
      y: newWorldCy - newChildHeight / 2,
      width: newChildWidth,
      height: newChildHeight,
      rotation: (child.rotation + group.rotation) % 360,
      ...(child.type === "group"
        ? {
            originalWidth: (child as GroupObject).originalWidth * scaleX,
            originalHeight: (child as GroupObject).originalHeight * scaleY,
          }
        : {}),
    } as CanvasObject;
  });

  const remaining = objects.filter((o) => o.id !== group.id);
  const finalObjects = [...remaining, ...restoredChildren];
  const newSelectedIds = restoredChildren.map((c: any) => c.id);

  return { finalObjects, newSelectedIds };
};
