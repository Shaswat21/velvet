import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { ZOOM_PRESETS } from "@/lib/constants";

interface FooterProps {
  zoom: number[];
  setZoom: (z: number[]) => void;
  handleFit: () => void;
}

export const Footer = ({ zoom, setZoom, handleFit }: FooterProps) => {
  return (
    <footer className="px-4 py-3 bg-white border-t flex items-center justify-end z-50 relative">
      <div className="flex items-center gap-3 w-64">
        <Slider
          value={zoom}
          onValueChange={setZoom}
          min={10}
          max={300}
          step={1}
          className="w-32"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-20 px-2 text-xs flex font-normal"
            >
              {Math.round(zoom[0])}%
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-30">
            {ZOOM_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => setZoom([preset])}
                className="text-xs justify-between"
              >
                {preset}%{" "}
                {Math.round(zoom[0]) === preset && (
                  <Check className="h-3 w-3" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFit} className="text-xs">
              Fit to Screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  );
};
