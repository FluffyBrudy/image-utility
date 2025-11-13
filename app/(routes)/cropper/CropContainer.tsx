"use client";
import { useImageStore } from "@/app/store/image.store";
import { ImageCrop } from "./ImageCrop";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loadImageFromFile } from "@/app/utils/file.utils";
import { imageToCanvas } from "@/app/utils/image.utils";
import { cropCanvas } from "@/app/lib/imgmanip";
import { Download, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const BATCH_SIZE = 3;

export default function CropContainer() {
  const router = useRouter();
  const files = useImageStore((state) => state.imageFiles);
  const [selectedFiles, setSelectedFile] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectedFile = (file: File) => {
    if (selectedFiles.includes(file))
      setSelectedFile((states) => states.filter((state) => state !== file));
    else setSelectedFile((states) => [file, ...states]);
  };

  const handleDownloadAll = async () => {
    setIsProcessing(true);
    try {
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (file) => {
            try {
              const img = await loadImageFromFile(file);
              const canvas = imageToCanvas(img);
              const croppedCanvas = cropCanvas(canvas);
              const blob = await new Promise<Blob | null>((resolve) =>
                croppedCanvas.toBlob(resolve),
              );
              if (!blob) return;
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(a.href);
            } catch (err) {
              console.error("Failed to process file:", file.name, err);
            }
          }),
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected = selectedFiles.length === files.size && files.size > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Crop Images
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Select images to crop and remove transparent pixels
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        {files.size === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No images loaded</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Array.from(files).map((file) => {
                const isSelected = selectedFiles.includes(file);
                return (
                  <div
                    key={file.name}
                    onClick={() => handleSelectedFile(file)}
                    className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <ImageCrop pathOrFile={file} isSelected={isSelected} />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 pt-8 border-t border-border">
              <button
                onClick={() => setSelectedFile([])}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Deselect All
              </button>

              <button
                onClick={() =>
                  setSelectedFile(
                    selectedFiles.length === files.size
                      ? []
                      : Array.from(files),
                  )
                }
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isAllSelected ? "Deselect" : "Select"} All
              </button>

              <Button
                onClick={handleDownloadAll}
                disabled={selectedFiles.length === 0 || isProcessing}
                size="lg"
                className="gap-2 ml-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Cropped ({selectedFiles.length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
