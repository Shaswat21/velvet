import React from "react";

interface FancySliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  snapAt?: number;
  neutralValue?: number;
  snapThreshold?: number;
  onChange: (val: number) => void;
}

export const FancySlider = ({
  label,
  value,
  min,
  max,
  step,
  snapAt,
  neutralValue,
  snapThreshold = 0.1,
  onChange,
}: FancySliderProps) => {
  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;
  const [localValue, setLocalValue] = React.useState(value);
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const startVal = neutralValue ?? min;
  const startPct = getPercent(startVal);

  // Use localValue for the visual bars to ensure 60fps smoothness
  const currentPct = getPercent(localValue);
  const barLeft = Math.min(startPct, currentPct);
  const barWidth = Math.abs(currentPct - startPct);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = Number(e.target.value);

    // Snapping Logic
    if (snapAt !== undefined) {
      if (Math.abs(newVal - snapAt) < snapThreshold) {
        newVal = snapAt;
      }
    }
    if (neutralValue !== undefined && neutralValue !== snapAt) {
      if (Math.abs(newVal - neutralValue) < snapThreshold) {
        newVal = neutralValue;
      }
    }

    // 1. Update local visual state INSTANTLY
    setLocalValue(newVal);

    // 2. Propagate to parent (actual object update)
    onChange(newVal);
  };

  return (
    <div className="space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div className="flex items-center bg-gray-50 border rounded-md px-1.5 h-6 w-16 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
          <input
            type="number"
            className="w-full bg-transparent text-xs text-right outline-none font-mono"
            value={Math.round(localValue * 100) / 100}
            step={step}
            onChange={handleInput}
          />
        </div>
      </div>

      <div className="relative h-4 flex items-center group">
        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          {/* Smooth Progress Bar */}
          <div
            className="absolute h-full bg-blue-500 will-change-[left,width]"
            style={{
              left: `${barLeft}%`,
              width: `${barWidth}%`,
              // Remove transition during drag for instant response
              transition: "none",
            }}
          />
        </div>

        {/* Snap Marker */}
        {snapAt !== undefined && (
          <div
            className="absolute w-0.5 h-2.5 bg-gray-400 z-0 pointer-events-none transition-opacity duration-200"
            style={{
              left: `${getPercent(snapAt)}%`,
              opacity: Math.abs(localValue - snapAt) < snapThreshold ? 1 : 0.3,
            }}
          />
        )}

        {/* Neutral Marker */}
        {neutralValue !== undefined && neutralValue !== snapAt && (
          <div
            className="absolute w-0.5 h-2.5 bg-gray-400 z-0 pointer-events-none opacity-30"
            style={{ left: `${getPercent(neutralValue)}%` }}
          />
        )}

        {/* Native Input (Invisible Driver) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleInput}
          className="w-full h-full opacity-0 cursor-pointer absolute z-20"
        />

        {/* Custom Thumb */}
        <div
          className="absolute h-3.5 w-3.5 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none z-10 will-change-left"
          style={{
            left: `calc(${currentPct}% - 7px)`,
            transition: "none", // Remove transition for instant follow
          }}
        />
      </div>

    </div>
  );
};
