"use client";

import { useImageStore } from "@/app/store/image.store";
import { ImageCrop } from "./ImageCrop";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { loadImageFromFile } from "@/app/utils/file.utils";
import { imageToCanvas } from "@/app/utils/image.utils";
import { cropCanvas } from "@/app/lib/imgmanip";
import { Download, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast, { Toaster } from "react-hot-toast";

const BATCH_SIZE = 3;

export function CropContainer() {
  const router = useRouter();
  const files = useImageStore((state) => state.imageFiles);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offset, setOffset] = useState(
    () => Number(localStorage.getItem("crop-offset")) || 0,
  );
  const [processedFiles, setProcessedFiles] = useState(0);

  useEffect(() => {
    localStorage.setItem("crop-offset", offset.toString());
  }, [offset]);

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

    try {
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (file) => {
            try {
              const img = await loadImageFromFile(file);
              const canvas = imageToCanvas(img);
              const croppedCanvas = cropCanvas(canvas, offset);
              const blob = await new Promise<Blob | null>((resolve) =>
                croppedCanvas.toBlob(resolve),
              );
              if (!blob) return;

              const extension = file.name.slice(file.name.lastIndexOf(".") + 1);
              zip.file(`${fileCount++}.${extension}`, blob);
              setProcessedFiles((prev) => prev + 1);
            } catch (err) {
              toast.error(`Failed to process ${file.name}`);
              console.error(err);
            }
          }),
        );
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "cropped_images.zip");
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
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="offset"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Offset:
                </label>
                <Input
                  id="offset"
                  type="range"
                  min={0}
                  max={128}
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className="w-48"
                />
                <span className="text-sm w-12 text-right">{offset}px</span>
              </div>

              <div className="flex-1 flex items-center">
                <Button
                  onClick={handleDownloadAll}
                  disabled={selectedFiles.length === 0 || isProcessing}
                  size="lg"
                  className="gap-2 ml-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing {processedFiles}/{selectedFiles.length}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Cropped ({selectedFiles.length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isProcessing && (
              <div className="w-full bg-muted h-2 rounded mt-2">
                <div
                  className="bg-primary h-2 rounded"
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

                    <ImageCrop
                      file={file}
                      isSelected={isSelected}
                      previewOffset={offset}
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
