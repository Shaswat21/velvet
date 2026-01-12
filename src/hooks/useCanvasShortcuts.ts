import { useEffect } from "react";

interface ShortcutHandlers {
  undo: () => void;
  redo: () => void;
  handleGroup: () => void;
  handleUngroup: () => void;
  handleDuplicate: () => void;
  handleDelete: () => void;
  selectAll: () => void;
}

export const useCanvasShortcuts = (handlers: ShortcutHandlers) => {
  const {
    undo,
    redo,
    handleGroup,
    handleUngroup,
    handleDuplicate,
    handleDelete,
    selectAll,
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Check if user is actively typing in an input field
      const isTyping =
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // --- SELECT ALL (Ctrl + A) ---
      if (isCtrlOrMeta && e.key.toLowerCase() === "a") {
        if (isTyping) {
          // If typing, DO NOT prevent default.
          // Let the browser handle selecting the text inside the input.
          return;
        }

        // If NOT typing, prevent default browser select-all and select canvas objects
        e.preventDefault();
        selectAll();
        return;
      }

      // --- UNDO (Ctrl + Z) ---
      if (isCtrlOrMeta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        // Allow undo inside text inputs if needed, or block it.
        // Usually, you want browser undo for text, canvas undo for objects.
        if (isTyping) return;

        e.preventDefault();
        undo();
        return;
      }

      // --- REDO (Ctrl + Y OR Ctrl + Shift + Z) ---
      if (
        (isCtrlOrMeta && e.key.toLowerCase() === "y") ||
        (isCtrlOrMeta && e.key.toLowerCase() === "z" && e.shiftKey)
      ) {
        if (isTyping) return;

        e.preventDefault();
        redo();
        return;
      }

      // --- GROUP / UNGROUP ---
      if (isCtrlOrMeta && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.shiftKey ? handleUngroup() : handleGroup();
        return;
      }

      // --- DUPLICATE ---
      if (isCtrlOrMeta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // --- DELETE ---
      if (e.key === "Delete" || e.key === "Backspace") {
        // If typing, let Backspace delete text characters
        if (isTyping) return;

        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    handleGroup,
    handleUngroup,
    handleDuplicate,
    handleDelete,
    selectAll,
  ]);
};
