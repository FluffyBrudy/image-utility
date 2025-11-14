"use client";

import { useImageStore } from "@/app/store/image.store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loadImageFromFile } from "@/app/utils/file.utils";
import { imageToCanvas } from "@/app/utils/image.utils";
import { resizeImage } from "@/app/lib/imgmanip";
import { Download, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast, { Toaster } from "react-hot-toast";
import { ResizePreview } from "./ResizePreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BATCH_SIZE = 3;

const PRESET_SIZES = [
  { label: "Thumbnail (128x128)", width: 128, height: 128 },
  { label: "Small (256x256)", width: 256, height: 256 },
  { label: "Medium (512x512)", width: 512, height: 512 },
  { label: "Large (1024x1024)", width: 1024, height: 1024 },
  { label: "Custom", width: 0, height: 0 },
];

export function ResizeContainer() {
  const router = useRouter();
  const files = useImageStore((state) => state.imageFiles);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [preset, setPreset] = useState("medium");
  const [customWidth, setCustomWidth] = useState(512);
  const [customHeight, setCustomHeight] = useState(512);

  const getResizeSize = () => {
    if (preset === "custom") return [customWidth, customHeight] as const;
    const selected = PRESET_SIZES.find((p) => p.label.toLowerCase() === preset);
    return [selected?.width || 512, selected?.height || 512] as const;
  };

  const handleSelectedFile = (file: File, shiftKey = false) => {
    if (shiftKey && selectedFiles.length) {
      const filesArray = Array.from(files);
      const lastSelectedIndex = filesArray.findIndex(
        (f) => f === selectedFiles[selectedFiles.length - 1],
      );
      const currentIndex = filesArray.findIndex((f) => f === file);
      const [start, end] =
        lastSelectedIndex < currentIndex
          ? [lastSelectedIndex, currentIndex]
          : [currentIndex, lastSelectedIndex];
      const range = filesArray.slice(start, end + 1);
      setSelectedFiles((prev) => Array.from(new Set([...prev, ...range])));
    } else if (selectedFiles.includes(file)) {
      setSelectedFiles((prev) => prev.filter((f) => f !== file));
    } else {
      setSelectedFiles((prev) => [file, ...prev]);
    }
  };

  const handleDownloadAll = async () => {
    if (!selectedFiles.length) return;

    setIsProcessing(true);
    setProcessedFiles(0);
    const zip = new JSZip();
    let fileCount = 0;
    const [targetW, targetH] = getResizeSize();

    try {
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (file) => {
            try {
              const img = await loadImageFromFile(file);
              const canvas = imageToCanvas(img);
              const resizedCanvas = resizeImage(canvas, [targetW, targetH]);
              const blob = await new Promise<Blob | null>((resolve) =>
                resizedCanvas.toBlob(resolve),
              );
              if (!blob) return;

              const extension = file.name.slice(file.name.lastIndexOf(".") + 1);
              zip.file(
                `${fileCount++}_${targetW}x${targetH}.${extension}`,
                blob,
              );
              setProcessedFiles((prev) => prev + 1);
            } catch (err) {
              toast.error(`Failed to process ${file.name}`);
              console.error(err);
            }
          }),
        );
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `resized_${targetW}x${targetH}.zip`);
      toast.success("Download ready!");
    } finally {
      setIsProcessing(false);
      setProcessedFiles(0);
    }
  };

  const isAllSelected = selectedFiles.length === files.size && files.size > 0;

  return (
    <div className="min-h-screen bg-background relative">
      <Toaster
        toastOptions={{
          style: {
            borderRadius: "8px",
            background: "#333",
            color: "#fff",
            padding: "12px 16px",
            fontWeight: 500,
          },
          duration: 3000,
        }}
      />
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Resize Images
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Resize images to your desired dimensions
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {selectedFiles.length} of {files.size} selected
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-between border-t border-border pt-6 max-w-7xl mx-auto px-4">
        <button
          onClick={() => setSelectedFiles([])}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Deselect All
        </button>
        <button
          onClick={() =>
            setSelectedFiles(isAllSelected ? [] : Array.from(files))
          }
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAllSelected ? "Deselect" : "Select"} All
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {files.size === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No images loaded</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-lg border border-border bg-card">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Resize Preset
                </label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_SIZES.map((size) => (
                      <SelectItem
                        key={size.label}
                        value={size.label.toLowerCase()}
                      >
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {preset === "custom" && (
                <div className="flex gap-4 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Width (px)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="4096"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Height (px)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="4096"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1" />
              <Button
                onClick={handleDownloadAll}
                disabled={selectedFiles.length === 0 || isProcessing}
                size="lg"
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing {processedFiles}/{selectedFiles.length}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Resized ({selectedFiles.length})
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="w-full bg-muted h-2 rounded mt-2">
                <div
                  className="bg-primary h-2 rounded transition-all"
                  style={{
                    width: `${(processedFiles / selectedFiles.length) * 100}%`,
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from(files).map((file) => {
                const isSelected = selectedFiles.includes(file);

                return (
                  <div
                    key={file.name}
                    onClick={(e) => handleSelectedFile(file, e.shiftKey)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-selected={isSelected}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1 text-white z-10">
                        ✓
                      </div>
                    )}

                    <ResizePreview
                      file={file}
                      isSelected={isSelected}
                      targetSize={getResizeSize()}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
