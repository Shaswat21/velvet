import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Download } from "lucide-react";
import { ZOOM_PRESETS } from "@/lib/constants";
import { ExportDialog, type ExportOptions } from "./ExportDialog";

interface FooterProps {
  zoom: number[];
  setZoom: (z: number[]) => void;
  handleFit: () => void;
  onDownload?: (options: ExportOptions) => Promise<void>;
}

export const Footer = ({
  zoom,
  setZoom,
  handleFit,
  onDownload,
}: FooterProps) => {
  // CHANGED: Make this handler async to pass the Promise up to ExportDialog
  const handleExport = async (options: ExportOptions) => {
    if (onDownload) {
      await onDownload(options);
    } else {
      console.log("Export options:", options);
    }
  };

  return (
    <footer className="px-4 py-3 bg-white border-t flex items-center justify-between md:justify-end z-40 relative">
      <div className="flex items-center gap-3">
        {/* Zoom Slider - Hidden on Mobile */}
        <div className="hidden md:block">
          <Slider
            value={zoom}
            onValueChange={setZoom}
            min={10}
            max={300}
            step={1}
            className="w-32"
          />
        </div>

        {/* Zoom Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-16 md:w-20 px-2 text-xs flex font-normal"
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

        {/* Divider */}
        <div className="h-4 w-px bg-gray-300" />

        {/* Export Button with Dialog */}
        <ExportDialog
          onExport={handleExport}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          }
        />
      </div>
    </footer>
  );
};
