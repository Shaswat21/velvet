import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRESET_COLORS } from "../../../lib/constants";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  allowTransparent?: boolean;
}

export const ColorPicker = ({
  value,
  onChange,
  title,
  allowTransparent,
}: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(
    value === "transparent" ? "#ffffff" : value
  );

  useEffect(() => {
    if (value !== "transparent") setLocalValue(value);
  }, [value]);

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setLocalValue(newVal);
      const timeoutId = setTimeout(() => {
        onChange(newVal);
      }, 10);
      return () => clearTimeout(timeoutId);
    },
    [onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-8 h-8 rounded-full p-0 border shadow-sm ${
            value === "transparent" ? "bg-white" : ""
          }`}
          style={value !== "transparent" ? { backgroundColor: value } : {}}
          title={title}
        >
          {value === "transparent" && (
            <div className="w-full h-px bg-red-500 rotate-45" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESET_COLORS.filter(
            (c) => allowTransparent || c !== "transparent"
          ).map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={`w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform relative overflow-hidden ${
                c === "transparent" ? "bg-gray-100" : ""
              }`}
              style={c !== "transparent" ? { backgroundColor: c } : {}}
              title={c === "transparent" ? "No Fill" : c}
            >
              {c === "transparent" && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  <div className="w-full h-px bg-red-500 rotate-45" />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t pt-2">
          <span className="text-xs text-gray-500">Hex:</span>
          <input
            type="color"
            value={localValue}
            onChange={handleCustomChange}
            className="h-8 w-full cursor-pointer"
            disabled={value === "transparent"}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};