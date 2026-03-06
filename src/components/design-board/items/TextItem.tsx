import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { TransformWrapper } from "./TransformWrapper";
import type { TextObject, ToolType } from "@/lib/types";
import { useTransliteration } from "@/hooks/useTransliteration";

interface TextItemProps {
  obj: TextObject;
  zoom: number;
  isSelected: boolean;
  tool: ToolType;
  onUpdate: (id: string, updates: Partial<TextObject>) => void;
  setDragTarget: (target: any) => void;
  setSelectedId: (id: string | null) => void;
  addSelectedId: (id: string) => void;
  setResizingTarget: (target: any) => void;
  setRotatingTarget: (e: React.MouseEvent, id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  pointerEvents?: "auto" | "none";
  onMouseDown?: (e: React.MouseEvent) => void;
  isGrouped?: boolean;
  isDragging?: boolean;
}

export const TextItem = ({
  obj,
  zoom,
  isSelected,
  tool,
  onUpdate,
  setDragTarget,
  setSelectedId,
  addSelectedId,
  setResizingTarget,
  setRotatingTarget,
  innerRef,
  pointerEvents,
  onMouseDown,
  isGrouped = false,
  isDragging = false,
}: TextItemProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const zoomFactor = zoom / 100;

  const updateHeight = () => {
    if (textAreaRef.current) {
      // Use a small scaled padding to avoid clipping and allow tight wrapping
      const padding = 4 * zoomFactor;
      textAreaRef.current.style.padding = `${padding}px`;

      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;

      const calculatedHeight = scrollHeight / zoomFactor;
      if (Math.abs(obj.height - calculatedHeight) > 0.5) {
        onUpdate(obj.id, { height: calculatedHeight });
      }
    }
  };

  useLayoutEffect(() => {
    updateHeight();
  }, [
    obj.text,
    obj.width,
    obj.fontSize,
    obj.fontFamily,
    obj.isBold,
    obj.isItalic,
    obj.isUnderline,
    obj.isStrikethrough,
    obj.textTransform,
    obj.letterSpacing,
    obj.lineHeight,
    obj.textAlign,
    zoom,
  ]);

  // Recalculate height when fonts are loaded (crucial for preview)
  useEffect(() => {
    document.fonts.ready.then(() => {
      updateHeight();
    });
  }, [obj.fontFamily]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== "select") return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      addSelectedId(obj.id);
    } else {
      setSelectedId(obj.id);
    }
    setDragTarget({
      id: obj.id,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
    });
  };

  // Determine if interaction should be disabled
  const isDisabled =
    tool === "hand" ||
    obj.isLocked ||
    isGrouped ||
    isDragging ||
    tool === "rect" ||
    tool === "pen";

  const decoration =
    [
      obj.isUnderline ? "underline" : "",
      obj.isStrikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ") || "none";

  // --- Transliteration Logic ---
  const {
    suggestions,
    fetchSuggestions,
    setSuggestions, // We might need to clear it manually
    currentWord,
    setCurrentWord
  } = useTransliteration(
    !!(obj.transliterationEnabled),
    obj.transliterationLanguage
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onUpdate(obj.id, { text: val });

    if (!obj.transliterationEnabled) return;

    // Detect current word being typed
    const cursor = e.target.selectionEnd;
    const textBeforeCursor = val.slice(0, cursor);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord && /^[a-zA-Z]+$/.test(lastWord)) {
      setCurrentWord(lastWord);
      fetchSuggestions(lastWord);

      // Calculate cursor position for popup
      // Simple approximation or we could use a library like 'textarea-caret' if needed
      // For now, let's just show it below the textarea or fixed for simplicity
    } else {
      setSuggestions([]);
      setCurrentWord("");
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!currentWord) return;

    // Replace the last occurrence of currentWord with suggestion
    const cursor = textAreaRef.current?.selectionEnd || 0;
    const textBefore = obj.text.slice(0, cursor);
    const textAfter = obj.text.slice(cursor);

    const lastIndex = textBefore.lastIndexOf(currentWord);
    if (lastIndex === -1) return;

    const newTextBefore = textBefore.substring(0, lastIndex) + suggestion + " ";
    const newText = newTextBefore + textAfter;

    onUpdate(obj.id, { text: newText });
    setSuggestions([]);
    setCurrentWord("");

    // Restore focus and update cursor position (needs setTimeout or LayoutEffect)
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        const newCursorPos = newTextBefore.length;
        textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        setSuggestions([]);
      }
    }
  };

  return (
    <TransformWrapper
      obj={obj}
      zoom={zoom}
      isSelected={isSelected}
      tool={tool}
      setResizingTarget={setResizingTarget}
      setRotatingTarget={setRotatingTarget}
      pointerEvents={pointerEvents}
      onMouseDown={onMouseDown || handleMouseDown}
    >
      <div ref={innerRef} className="w-full h-full relative">
        <textarea
          ref={textAreaRef}
          value={obj.text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          readOnly={isDisabled}
          className={`
            w-full bg-transparent resize-none overflow-hidden leading-normal
            focus:outline-none outline-none border-none block
            ${
              /* Cursor Logic: Text cursor only if selected, not locked, and not grouped */ ""
            }
            ${isSelected && !isDisabled ? "cursor-text" : "cursor-inherit"}
            ${/* Selection Logic: Prevent highlight if locked or grouped */ ""}
            ${isDisabled ? "select-none pointer-events-none" : ""} 
          `}
          style={{
            filter: obj.blur ? `blur(${obj.blur}px)` : "none",
            opacity: obj.opacity ?? 1,
            fontFamily: obj.fontFamily,
            fontSize: `${obj.fontSize * zoomFactor}px`,
            color: obj.color,
            fontWeight: obj.isBold ? "bold" : "normal",
            fontStyle: obj.isItalic ? "italic" : "normal",
            textDecoration: decoration,
            textAlign: obj.textAlign,
            backgroundColor: obj.backgroundColor,
            textTransform: obj.textTransform,
            letterSpacing: `${obj.letterSpacing / 1000}em`,
            lineHeight: obj.lineHeight,
            height: "100%",
            pointerEvents: isDisabled
              ? "none"
              : pointerEvents === "none"
                ? "none"
                : "auto",
          }}
        />

        {/* Suggestion Dropdown */}
        {suggestions.length > 0 && isSelected && !isDisabled && (
          <div
            className="absolute z-50 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden min-w-[150px]"
            style={{
              top: "100%",
              left: 0 // Ideally this should follow the caret but simplifying for now
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s}
                className={`px-3 py-2 cursor-pointer text-sm ${i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                onClick={() => applySuggestion(s)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </TransformWrapper>
  );
};
