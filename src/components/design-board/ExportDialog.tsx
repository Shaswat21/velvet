import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2, Lock } from "lucide-react";

export type ExportFormat =
  | "png"
  | "jpg"
  | "pdf"
  | "svg"
  | "json"
  | "gif"
  | "velvet";

export interface ExportOptions {
  format: ExportFormat;
  transparent: boolean;
  compress: boolean;
}

interface ExportDialogProps {
  onExport: (options: ExportOptions) => Promise<void>;
  trigger: React.ReactNode;
}

function PremiumLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between w-full gap-2">
      <span>{label}</span>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-yellow-200 shadow-sm">
        <Lock className="h-3 w-3 text-amber-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
          Premium
        </span>
      </div>
    </div>
  );
}

export function ExportDialog({ onExport, trigger }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [transparent, setTransparent] = useState(true);
  const [compress, setCompress] = useState(false);
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- LOGIC: Determine availability based on format ---
  const isTransparentDisabled =
    format === "jpg" ||
    format === "pdf" ||
    format === "json" ||
    format === "velvet";

  const isCompressDisabled = format === "json" || format === "velvet";

  const handleExport = async () => {
    setIsExporting(true);

    // LOGIC: Automatically compress (minify) JSON/Velvet formats
    // For other formats, use the switch value.
    const shouldCompress =
      format === "json" || format === "velvet"
        ? true
        : isCompressDisabled
        ? false
        : compress;

    await onExport({
      format,
      transparent: isTransparentDisabled ? false : transparent,
      compress: shouldCompress,
    });
    setIsExporting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isExporting && setOpen(val)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
          <DialogDescription>
            Choose your preferred format and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Format Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select
              value={format}
              onValueChange={(val) => setFormat(val as ExportFormat)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="velvet">Project File (.velvet)</SelectItem>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="jpg">JPG Image</SelectItem>
                <SelectItem value="svg">SVG Vector</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>

                {/* Premium Options */}
                <SelectItem value="json" disabled>
                  <PremiumLabel label="JSON Data" />
                </SelectItem>
                <SelectItem value="gif" disabled>
                  <PremiumLabel label="Animated GIF" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transparent Switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transparent" className="text-right">
              Transparent
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="transparent"
                checked={isTransparentDisabled ? false : transparent}
                onCheckedChange={setTransparent}
                disabled={isTransparentDisabled}
              />
              <span className="text-xs text-muted-foreground">
                {isTransparentDisabled
                  ? "Not supported for this format"
                  : "Remove background"}
              </span>
            </div>
          </div>

          {/* Compress Switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="compress" className="text-right">
              Compress
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="compress"
                // Visual Logic: Force 'checked=false' if disabled so it looks "off"
                checked={isCompressDisabled ? false : compress}
                onCheckedChange={setCompress}
                disabled={isCompressDisabled}
              />
              <span className="text-xs text-muted-foreground">
                {isCompressDisabled
                  ? "Auto-compressed" // Friendly indicator that it happens automatically
                  : "Reduce file size"}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Processing..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
