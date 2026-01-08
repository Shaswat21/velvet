import { useEffect } from "react";

interface ShortcutHandlers {
  undo: () => void;
  redo: () => void;
  handleGroup: () => void;
  handleUngroup: () => void;
  handleDuplicate: () => void;
  handleDelete: () => void;
}

export const useCanvasShortcuts = (handlers: ShortcutHandlers) => {
  const {
    undo,
    redo,
    handleGroup,
    handleUngroup,
    handleDuplicate,
    handleDelete,
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        (isCtrlOrMeta && e.key.toLowerCase() === "y") ||
        (isCtrlOrMeta && e.key.toLowerCase() === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if (isCtrlOrMeta && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.shiftKey ? handleUngroup() : handleGroup();
        return;
      }
      if (isCtrlOrMeta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "INPUT")
      ) {
        handleDelete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleGroup, handleUngroup, handleDuplicate, handleDelete]);
};
